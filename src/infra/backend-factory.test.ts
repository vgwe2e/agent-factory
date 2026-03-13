/**
 * Tests for backend factory module.
 *
 * Covers local/user-managed vLLM usage and auto-provisioned RunPod pod usage.
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { createBackend } from "./backend-factory.js";
import { ollamaChat } from "../scoring/ollama-client.js";

const RUNPOD_REST_BASE = "https://rest.runpod.io/v1";
const DEFAULT_MODEL = "Qwen/Qwen2.5-32B-Instruct";
const POD_ID = "pod-test-123";
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

describe("backend-factory", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("createBackend('ollama') returns ollamaChat as chatFn with backend 'ollama'", async () => {
    const config = await createBackend("ollama");

    assert.equal(config.backend, "ollama");
    assert.equal(config.chatFn, ollamaChat, "chatFn should be the ollamaChat function");
    assert.deepStrictEqual(config.simulationConfig, {
      backend: "ollama",
      baseUrl: "http://localhost:11434",
      model: "qwen3:30b",
    });
  });

  it("createBackend('vllm') returns backend 'vllm' when url provided", async () => {
    const config = await createBackend("vllm", { vllmUrl: "http://gpu:8000" });

    assert.equal(config.backend, "vllm");
    assert.equal(typeof config.chatFn, "function", "chatFn is a function");
    assert.notEqual(config.chatFn, ollamaChat, "chatFn should not be ollamaChat");
    assert.deepStrictEqual(config.simulationConfig, {
      backend: "vllm",
      baseUrl: "http://gpu:8000",
      model: DEFAULT_MODEL,
      apiKey: undefined,
    });
  });

  it("createBackend('vllm') uses default model (Qwen/Qwen2.5-32B-Instruct)", async () => {
    const config = await createBackend("vllm", { vllmUrl: "http://gpu:8000" });
    assert.equal(config.backend, "vllm");
    assert.equal(typeof config.chatFn, "function");
  });

  it("createBackend('vllm') accepts custom model", async () => {
    const config = await createBackend("vllm", {
      vllmUrl: "http://gpu:8000",
      vllmModel: "meta-llama/Llama-3-70B",
    });
    assert.equal(config.backend, "vllm");
    assert.equal(typeof config.chatFn, "function");
  });

  it("createBackend('vllm') with user-managed URL returns no cleanup or costTracker", async () => {
    const config = await createBackend("vllm", { vllmUrl: "http://gpu:8000" });
    assert.equal(config.cleanup, undefined, "no cleanup for user-managed vLLM");
    assert.equal(config.costTracker, undefined, "no costTracker for user-managed vLLM");
    assert.equal(config.podId, undefined, "no pod ID for user-managed vLLM");
  });

  it("createBackend('vllm') with user-managed URL does not forward RUNPOD auth by default", async () => {
    let capturedAuthHeader = "";

    const mockFetch: MockFetchFn = async (_url, init) => {
      capturedAuthHeader = new Headers(init?.headers).get("Authorization") ?? "";
      return jsonResponse({
        choices: [{ message: { content: "{\"score\": 5}" } }],
      });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    const config = await createBackend("vllm", {
      vllmUrl: "http://gpu:8000",
      runpodApiKey: "runpod-control-plane-key",
    });

    const result = await config.chatFn(
      [{ role: "user", content: "test" }],
      { type: "object", properties: {} },
    );

    assert.equal(result.success, true);
    assert.equal(capturedAuthHeader, "", "RUNPOD_API_KEY should not be forwarded to a user-managed pod");
  });

  it("createBackend('vllm') with user-managed URL forwards VLLM_API_KEY when provided", async () => {
    let capturedAuthHeader = "";

    const mockFetch: MockFetchFn = async (_url, init) => {
      capturedAuthHeader = new Headers(init?.headers).get("Authorization") ?? "";
      return jsonResponse({
        choices: [{ message: { content: "{\"score\": 5}" } }],
      });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    const config = await createBackend("vllm", {
      vllmUrl: "http://gpu:8000",
      vllmApiKey: "pod-vllm-key",
      runpodApiKey: "runpod-control-plane-key",
    });

    const result = await config.chatFn(
      [{ role: "user", content: "test" }],
      { type: "object", properties: {} },
    );

    assert.equal(result.success, true);
    assert.equal(capturedAuthHeader, "Bearer pod-vllm-key");
  });

  it("createBackend('vllm') throws when neither vllmUrl nor runpodApiKey provided", async () => {
    await assert.rejects(
      () => createBackend("vllm"),
      (err: Error) => {
        assert.ok(
          err.message.includes("--vllm-url") && err.message.includes("RUNPOD_API_KEY"),
          `Error mentions both options: ${err.message}`,
        );
        return true;
      },
    );
  });

  it("createBackend('vllm') throws when vllmUrl is empty and no runpodApiKey", async () => {
    await assert.rejects(
      () => createBackend("vllm", { vllmUrl: "" }),
      (err: Error) => {
        assert.ok(
          err.message.includes("--vllm-url") || err.message.includes("RUNPOD_API_KEY"),
          `Error mentions options: ${err.message}`,
        );
        return true;
      },
    );
  });

  it("createBackend throws for invalid backend string", async () => {
    await assert.rejects(
      () => (createBackend as Function)("invalid-backend"),
      (err: Error) => {
        assert.ok(err.message.includes("invalid-backend"), `Error mentions invalid backend: ${err.message}`);
        return true;
      },
    );
  });

  it("createBackend('vllm') with runpodApiKey provisions a dedicated pod with explicit image and start command", async () => {
    let createBody: Record<string, unknown> | undefined;
    let modelsAuthHeader = "";
    const cleanupCalls: string[] = [];

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const method = init?.method ?? "GET";

      if (u === `${RUNPOD_REST_BASE}/pods` && method === "POST") {
        createBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return jsonResponse({ id: POD_ID });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "GET") {
        return jsonResponse({ id: POD_ID, uptimeSeconds: 12 });
      }

      if (u === `${POD_BASE_URL}/models`) {
        modelsAuthHeader = new Headers(init?.headers).get("Authorization") ?? "";
        return jsonResponse({ data: [{ id: DEFAULT_MODEL }] });
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
    const config = await createBackend("vllm", {
      runpodApiKey: "test-key",
      networkVolumeId: "vol_test123",
      hfToken: "hf_secret_token",
    });

    assert.equal(config.backend, "vllm");
    assert.equal(config.podId, POD_ID);
    assert.ok(config.cleanup, "cleanup should be available for auto-provisioned pods");
    assert.ok(config.costTracker, "cost tracker should be available for auto-provisioned pods");
    assert.ok(createBody, "pod create body should be captured");

    const env = createBody?.env as Record<string, string>;
    const dockerStartCmd = createBody?.dockerStartCmd as string[];
    const vllmApiKey = env.VLLM_API_KEY;

    assert.equal(createBody?.imageName, "vllm/vllm-openai:latest");
    assert.equal(createBody?.templateId, undefined, "default provisioning should avoid template baked defaults");
    assert.deepStrictEqual(createBody?.gpuTypeIds, ["NVIDIA H100 NVL"]);
    assert.equal(createBody?.networkVolumeId, "vol_test123");
    assert.equal(env.HF_TOKEN, "hf_secret_token");
    assert.equal(env.HF_HOME, "/workspace/hf_home");
    assert.match(vllmApiKey, /^vllm-/);
    assert.deepStrictEqual(config.simulationConfig, {
      backend: "vllm",
      baseUrl: POD_BASE_URL,
      model: DEFAULT_MODEL,
      apiKey: vllmApiKey,
    });
    assert.deepStrictEqual(
      dockerStartCmd.slice(0, 8),
      ["--model", DEFAULT_MODEL, "--max-model-len", "16384", "--dtype", "auto", "--api-key", vllmApiKey],
    );
    assert.equal(modelsAuthHeader, `Bearer ${vllmApiKey}`);

    await config.cleanup?.();
    assert.deepStrictEqual(cleanupCalls, ["stop", "delete"]);
  });

  it("createBackend('vllm') auto-provision path uses the pod URL and pod-scoped vLLM auth for chat", async () => {
    let generatedVllmApiKey = "";
    let capturedChatUrl = "";
    let capturedChatAuth = "";

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const method = init?.method ?? "GET";

      if (u === `${RUNPOD_REST_BASE}/pods` && method === "POST") {
        const body = JSON.parse(String(init?.body ?? "{}")) as { env?: Record<string, string> };
        generatedVllmApiKey = body.env?.VLLM_API_KEY ?? "";
        return jsonResponse({ id: POD_ID });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "GET") {
        return jsonResponse({ id: POD_ID, uptimeSeconds: 8 });
      }

      if (u === `${POD_BASE_URL}/models`) {
        return jsonResponse({ data: [{ id: DEFAULT_MODEL }] });
      }

      if (u === `${POD_BASE_URL}/chat/completions`) {
        capturedChatUrl = u;
        capturedChatAuth = new Headers(init?.headers).get("Authorization") ?? "";
        return jsonResponse({
          choices: [{ message: { content: "{\"score\": 5}" } }],
        });
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}/stop` && method === "POST") {
        return jsonResponse({});
      }

      if (u === `${RUNPOD_REST_BASE}/pods/${POD_ID}` && method === "DELETE") {
        return jsonResponse({});
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    const config = await createBackend("vllm", {
      runpodApiKey: "runpod-control-plane-key",
    });

    const result = await config.chatFn(
      [{ role: "user", content: "test" }],
      { type: "object", properties: {} },
    );

    assert.equal(result.success, true);
    assert.equal(capturedChatUrl, `${POD_BASE_URL}/chat/completions`);
    assert.equal(capturedChatAuth, `Bearer ${generatedVllmApiKey}`);
    assert.notEqual(capturedChatAuth, "Bearer runpod-control-plane-key");

    await config.cleanup?.();
  });
});
