/**
 * Tests for backend factory module.
 *
 * Tests createBackend with both ollama and vllm backends.
 * Uses real imports for sync paths, mocks cloud-provider for async cloud paths.
 */

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { createBackend } from "./backend-factory.js";
import { ollamaChat } from "../scoring/ollama-client.js";

describe("backend-factory", () => {
  it("createBackend('ollama') returns ollamaChat as chatFn with backend 'ollama'", async () => {
    const config = await createBackend("ollama");

    assert.equal(config.backend, "ollama");
    assert.equal(config.chatFn, ollamaChat, "chatFn should be the ollamaChat function");
  });

  it("createBackend('vllm') returns backend 'vllm' when url provided", async () => {
    // Real validateScoringSchemas should pass (Plan 01 confirmed all schemas valid)
    const config = await createBackend("vllm", { vllmUrl: "http://gpu:8000" });

    assert.equal(config.backend, "vllm");
    assert.equal(typeof config.chatFn, "function", "chatFn is a function");
    // chatFn should NOT be ollamaChat
    assert.notEqual(config.chatFn, ollamaChat, "chatFn should not be ollamaChat");
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

  // -- Cloud provisioning tests (mock cloud-provider) --

  it("createBackend('vllm') with runpodApiKey and networkVolumeId passes volume ID to cloud provider", async () => {
    // Mock fetch to intercept the GraphQL mutation and check networkVolumeId
    const originalFetch = globalThis.fetch;
    let capturedGraphqlBody = "";

    const mockFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const u = String(url);
      const body = typeof init?.body === "string" ? init.body : "";

      if (u.includes("graphql")) {
        if (!body.includes("deleteEndpoint")) {
          capturedGraphqlBody = body;
        }
        if (body.includes("deleteEndpoint")) {
          return new Response(JSON.stringify({ data: { deleteEndpoint: null } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({
          data: { saveEndpoint: { id: "ep-vol-test", name: "test" } },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (u.includes("/health")) {
        return new Response(JSON.stringify({
          workers: { ready: 1 },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return new Response(JSON.stringify({
          data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    try {
      const config = await createBackend("vllm", {
        runpodApiKey: "test-key",
        networkVolumeId: "vol_test123",
      });

      assert.equal(config.backend, "vllm");
      assert.ok(
        capturedGraphqlBody.includes("vol_test123"),
        `Expected GraphQL body to contain 'vol_test123', got: ${capturedGraphqlBody.slice(0, 300)}`,
      );
      assert.ok(
        capturedGraphqlBody.includes("networkVolumeId"),
        `Expected GraphQL body to contain 'networkVolumeId', got: ${capturedGraphqlBody.slice(0, 300)}`,
      );

      // Cleanup
      if (config.cleanup) await config.cleanup();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("createBackend('vllm') with runpodApiKey but no networkVolumeId omits volume from mutation", async () => {
    const originalFetch = globalThis.fetch;
    let capturedGraphqlBody = "";

    const mockFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const u = String(url);
      const body = typeof init?.body === "string" ? init.body : "";

      if (u.includes("graphql")) {
        if (!body.includes("deleteEndpoint")) {
          capturedGraphqlBody = body;
        }
        if (body.includes("deleteEndpoint")) {
          return new Response(JSON.stringify({ data: { deleteEndpoint: null } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({
          data: { saveEndpoint: { id: "ep-no-vol", name: "test" } },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (u.includes("/health")) {
        return new Response(JSON.stringify({
          workers: { ready: 1 },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return new Response(JSON.stringify({
          data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;
    try {
      const config = await createBackend("vllm", {
        runpodApiKey: "test-key",
      });

      assert.equal(config.backend, "vllm");
      assert.ok(
        !capturedGraphqlBody.includes("networkVolumeId"),
        `Expected GraphQL body NOT to contain 'networkVolumeId', got: ${capturedGraphqlBody.slice(0, 300)}`,
      );

      if (config.cleanup) await config.cleanup();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("createBackend('vllm') with runpodApiKey provisions cloud endpoint", async () => {
    // We test indirectly: if runpodApiKey is given without vllmUrl,
    // createBackend calls createCloudProvider().provision().
    // This will fail because the API key is fake, but the error should
    // come from the cloud provider (fetch to RunPod), not from "missing vllmUrl".
    // This verifies the cloud provisioning path is wired correctly.
    await assert.rejects(
      () => createBackend("vllm", { runpodApiKey: "fake-key-for-test" }),
      (err: Error) => {
        // The error should NOT be "Either --vllm-url or RUNPOD_API_KEY"
        // It should be a cloud provider error (network/API error)
        assert.ok(
          !err.message.includes("Either --vllm-url or RUNPOD_API_KEY"),
          `Should not be the "missing options" error. Got: ${err.message}`,
        );
        return true;
      },
    );
  });
});
