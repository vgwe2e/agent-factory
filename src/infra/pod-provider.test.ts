/**
 * Tests for RunPod dedicated pod provisioner.
 *
 * All HTTP interactions are mocked.
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createPodProvider,
  type ProvisionedPod,
} from "./pod-provider.js";

const RUNPOD_REST_BASE = "https://rest.runpod.io/v1";
const MODEL = "Qwen/Qwen2.5-32B-Instruct";
const POD_ID = "pod-provider-123";
const POD_BASE_URL = `https://${POD_ID}-8000.proxy.runpod.net/v1`;

type MockFetchFn = (
  url: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("PodProvider", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("provision() throws when apiKey is empty", async () => {
    const provider = createPodProvider({ apiKey: "" });
    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        assert.match(err.message, /RUNPOD_API_KEY/i);
        return true;
      },
    );
  });

  it("provision() creates a pod from the raw vLLM image with explicit dockerStartCmd", async () => {
    let createBody: Record<string, unknown> | undefined;
    let modelsAuthHeader = "";

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const method = init?.method ?? "GET";

      if (u === `${RUNPOD_REST_BASE}/pods` && method === "POST") {
        createBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return jsonResponse({ id: POD_ID });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "GET") {
        return jsonResponse({ id: POD_ID, machineId: "machine-123" });
      }

      if (u === `${POD_BASE_URL}/models`) {
        modelsAuthHeader = new Headers(init?.headers).get("Authorization") ?? "";
        return jsonResponse({ data: [{ id: MODEL }] });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    const provider = createPodProvider({
      apiKey: "runpod-test-key",
      model: MODEL,
      networkVolumeId: "vol_test_123",
      hfToken: "hf_test_secret",
    });

    const pod = await provider.provision();

    assert.equal(pod.podId, POD_ID);
    assert.equal(pod.baseUrl, POD_BASE_URL);
    assert.match(pod.vllmApiKey, /^vllm-/);
    assert.ok(createBody, "pod create body should be captured");

    const env = createBody?.env as Record<string, string>;
    const dockerStartCmd = createBody?.dockerStartCmd as string[];

    assert.equal(createBody?.imageName, "vllm/vllm-openai:latest");
    assert.equal(createBody?.templateId, undefined);
    assert.equal(createBody?.networkVolumeId, "vol_test_123");
    assert.equal(env.HF_HOME, "/workspace/hf_home");
    assert.equal(env.HF_TOKEN, "hf_test_secret");
    assert.equal(env.MAX_MODEL_LEN, "16384");
    assert.equal(env.VLLM_API_KEY, pod.vllmApiKey);
    assert.deepStrictEqual(
      dockerStartCmd,
      [
        "--model",
        MODEL,
        "--max-model-len",
        "16384",
        "--dtype",
        "auto",
        "--api-key",
        pod.vllmApiKey,
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
      ],
    );
    assert.equal(modelsAuthHeader, `Bearer ${pod.vllmApiKey}`);
  });

  it("healthCheck() returns true only when the requested model is present", async () => {
    let capturedAuthHeader = "";

    globalThis.fetch = (async (_url, init) => {
      capturedAuthHeader = new Headers(init?.headers).get("Authorization") ?? "";
      return jsonResponse({ data: [{ id: MODEL }] });
    }) as typeof globalThis.fetch;

    const provider = createPodProvider({
      apiKey: "runpod-test-key",
      model: MODEL,
    });
    const pod: ProvisionedPod = {
      podId: POD_ID,
      baseUrl: POD_BASE_URL,
      vllmApiKey: "vllm-inline-key",
      provisionedAt: new Date(),
    };

    const ready = await provider.healthCheck(pod);
    assert.equal(ready, true);
    assert.equal(capturedAuthHeader, "Bearer vllm-inline-key");
  });

  it("provision() tears the pod down when container startup never reaches uptime", async () => {
    const cleanupCalls: string[] = [];

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const method = init?.method ?? "GET";

      if (u === `${RUNPOD_REST_BASE}/pods` && method === "POST") {
        return jsonResponse({ id: POD_ID });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "GET") {
        return jsonResponse({ id: POD_ID, uptimeSeconds: 0 });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}/stop` && method === "POST") {
        cleanupCalls.push("stop");
        return jsonResponse({});
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "DELETE") {
        cleanupCalls.push("delete");
        return jsonResponse({});
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    const provider = createPodProvider({
      apiKey: "runpod-test-key",
      maxProvisionTimeoutMs: 0,
    });

    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        assert.match(err.message, /did not finish container startup/i);
        assert.match(err.message, /--vllm-url/);
        return true;
      },
    );

    assert.deepStrictEqual(cleanupCalls, ["stop", "delete"]);
  });
});
