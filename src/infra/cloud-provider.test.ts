/**
 * Tests for RunPod serverless cloud provider.
 *
 * All HTTP/API interactions are mocked -- no real RunPod calls.
 */

import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  createCloudProvider,
  type CloudProvider,
  type CloudProviderConfig,
  type ProvisionedEndpoint,
} from "./cloud-provider.js";

// ---------------------------------------------------------------------------
// Helpers -- mock fetch globally
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CloudProvider", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ---- provision: missing API key ----------------------------------------

  it("provision() throws when apiKey is empty", async () => {
    const provider = createCloudProvider({ apiKey: "" });
    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        assert.match(err.message, /RUNPOD_API_KEY/i);
        return true;
      },
    );
  });

  // ---- provision: happy path ---------------------------------------------

  it("provision() returns endpointId and baseUrl on success", async () => {
    const endpointId = "ep-test-123";
    let capturedGraphqlBody = "";

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);

      // Endpoint creation via GraphQL
      if (u.includes("graphql")) {
        capturedGraphqlBody = typeof init?.body === "string" ? init.body : "";
        return jsonResponse({
          data: {
            saveEndpoint: {
              id: endpointId,
              name: "aera-eval-test",
            },
          },
        });
      }

      // Health polling -- return healthy immediately
      if (u.includes("/health")) {
        return jsonResponse({
          workers: { ready: 1, idle: 0, initializing: 0, running: 0, throttled: 0 },
          jobs: { completed: 0, failed: 0, inProgress: 0, inQueue: 0, retried: 0 },
        });
      }

      // vLLM /v1/models health check
      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return jsonResponse({ data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }] });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint = await provider.provision();

    assert.equal(endpoint.endpointId, endpointId);
    assert.ok(endpoint.baseUrl.includes(endpointId));
    assert.ok(
      endpoint.baseUrl.startsWith("https://api.runpod.ai/v2/"),
      `Expected RunPod proxy URL with runpod.ai, got: ${endpoint.baseUrl}`,
    );
    assert.ok(endpoint.provisionedAt instanceof Date);

    // PROV-01: GraphQL mutation must use dockerArgs, not env/MODEL_NAME
    assert.ok(
      capturedGraphqlBody.includes("dockerArgs"),
      `Expected GraphQL body to contain 'dockerArgs', got: ${capturedGraphqlBody.slice(0, 200)}`,
    );
    assert.ok(
      capturedGraphqlBody.includes("--model"),
      `Expected GraphQL body to contain '--model', got: ${capturedGraphqlBody.slice(0, 200)}`,
    );
    assert.ok(
      !capturedGraphqlBody.includes("MODEL_NAME"),
      `Expected GraphQL body NOT to contain 'MODEL_NAME', got: ${capturedGraphqlBody.slice(0, 200)}`,
    );
  });

  // ---- PROV-02: healthCheck model validation (match) ---------------------

  it("healthCheck() returns true when /v1/models contains requested model (case-insensitive)", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }] })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key", model: "Qwen/Qwen2.5-32B-Instruct" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, true);
  });

  // ---- PROV-02: healthCheck model validation (mismatch) ------------------

  it("healthCheck() returns false when /v1/models has wrong model", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ data: [{ id: "meta-llama/Llama-3-8B" }] })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key", model: "Qwen/Qwen2.5-32B-Instruct" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, false);
  });

  // ---- PROV-02: healthCheck model validation (empty) ---------------------

  it("healthCheck() returns false when /v1/models returns empty data", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ data: [] })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key", model: "Qwen/Qwen2.5-32B-Instruct" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, false);
  });

  // ---- PROV-02: model mismatch during provision throws with loaded IDs ---

  it("provision() throws with loaded model IDs on model mismatch", async () => {
    const endpointId = "ep-mismatch";
    let teardownCalled = false;

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const body = typeof init?.body === "string" ? init.body : "";

      if (u.includes("graphql")) {
        if (body.includes("deleteEndpoint")) {
          teardownCalled = true;
          return jsonResponse({ data: { deleteEndpoint: null } });
        }
        return jsonResponse({
          data: { saveEndpoint: { id: endpointId, name: "test" } },
        });
      }

      if (u.includes("/health")) {
        return jsonResponse({
          workers: { ready: 1, idle: 0, initializing: 0, running: 0, throttled: 0 },
          jobs: { completed: 0, failed: 0, inProgress: 0, inQueue: 0, retried: 0 },
        });
      }

      // vLLM returns wrong model
      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return jsonResponse({ data: [{ id: "meta-llama/Llama-3-8B" }] });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({
      apiKey: "test-key",
      model: "Qwen/Qwen2.5-32B-Instruct",
      maxHealthTimeoutMs: 100,
      pollIntervalMs: 10,
    });

    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        // Should mention the actual loaded model
        assert.match(err.message, /meta-llama\/Llama-3-8B/i);
        // PROV-04: Should suggest --vllm-url fallback
        assert.match(err.message, /--vllm-url/);
        return true;
      },
    );

    // PROV-03: Auto-teardown on failure
    assert.ok(teardownCalled, "Expected teardown to be called on model mismatch failure");
  });

  // ---- provision: timeout -------------------------------------------------

  it("provision() throws when endpoint creation timeout exceeded", async () => {
    let teardownCalled = false;

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const body = typeof init?.body === "string" ? init.body : "";

      if (u.includes("graphql")) {
        if (body.includes("deleteEndpoint")) {
          teardownCalled = true;
          return jsonResponse({ data: { deleteEndpoint: null } });
        }
        return jsonResponse({
          data: { saveEndpoint: { id: "ep-slow", name: "aera-eval-slow" } },
        });
      }

      if (u.includes("/health")) {
        return jsonResponse({
          workers: { ready: 0, idle: 0, initializing: 1, running: 0, throttled: 0 },
          jobs: { completed: 0, failed: 0, inProgress: 0, inQueue: 0, retried: 0 },
        });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({
      apiKey: "test-key",
      maxProvisionTimeoutMs: 100, // very short timeout
      pollIntervalMs: 10,
    });

    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        assert.match(err.message, /timeout|timed out/i);
        // PROV-03: Enriched error with endpoint ID
        assert.match(err.message, /ep-slow/);
        // PROV-04: --vllm-url suggestion
        assert.match(err.message, /--vllm-url/);
        return true;
      },
    );

    // PROV-03: Auto-teardown on timeout
    assert.ok(teardownCalled, "Expected teardown to be called on provision timeout");
  });

  // ---- PROV-03: vLLM health timeout with enriched error ------------------

  it("provision() throws when vLLM health check times out with enriched error", async () => {
    const endpointId = "ep-health-timeout";
    let teardownCalled = false;

    const mockFetch: MockFetchFn = async (url, init) => {
      const u = String(url);
      const body = typeof init?.body === "string" ? init.body : "";

      // Endpoint creation succeeds
      if (u.includes("graphql")) {
        if (body.includes("deleteEndpoint")) {
          teardownCalled = true;
          return jsonResponse({ data: { deleteEndpoint: null } });
        }
        return jsonResponse({
          data: { saveEndpoint: { id: endpointId, name: "test" } },
        });
      }

      // Worker health reports ready (provision succeeds)
      if (u.includes("/health")) {
        return jsonResponse({
          workers: { ready: 1, idle: 0, initializing: 0, running: 0, throttled: 0 },
          jobs: { completed: 0, failed: 0, inProgress: 0, inQueue: 0, retried: 0 },
        });
      }

      // vLLM model health -- always return 503 (model never loads)
      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return new Response("Service Unavailable", { status: 503 });
      }

      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({
      apiKey: "test-key",
      maxHealthTimeoutMs: 100, // very short timeout
      pollIntervalMs: 10,
    });

    await assert.rejects(
      () => provider.provision(),
      (err: Error) => {
        assert.match(err.message, /health/i);
        assert.match(err.message, /timed out/i);
        // PROV-03: Enriched error with endpoint ID
        assert.match(err.message, /ep-health-timeout/);
        // PROV-04: --vllm-url suggestion
        assert.match(err.message, /--vllm-url/);
        return true;
      },
    );

    // PROV-03: Auto-teardown on health timeout
    assert.ok(teardownCalled, "Expected teardown to be called on health timeout");
  });

  // ---- healthCheck: returns false on HTTP error --------------------------

  it("healthCheck() returns false on error", async () => {
    globalThis.fetch = (async () =>
      new Response("Service Unavailable", { status: 503 })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, false);
  });

  it("healthCheck() returns false on network error", async () => {
    globalThis.fetch = (async () => {
      throw new Error("Network error");
    }) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, false);
  });

  // ---- teardown -----------------------------------------------------------

  it("teardown() succeeds", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ data: { deleteEndpoint: null } })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    // Should not throw
    await provider.teardown(endpoint);
  });

  it("teardown() is idempotent -- calling twice does not throw", async () => {
    let callCount = 0;
    globalThis.fetch = (async () => {
      callCount++;
      if (callCount > 1) {
        // Second call -- endpoint already gone
        return jsonResponse(
          { errors: [{ message: "Endpoint not found" }] },
          200,
        );
      }
      return jsonResponse({ data: { deleteEndpoint: null } });
    }) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.ai/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    await provider.teardown(endpoint);
    await provider.teardown(endpoint); // should not throw
  });

  // ---- baseUrl pattern ---------------------------------------------------

  it("baseUrl follows expected RunPod pattern", async () => {
    const endpointId = "ep-pattern-test";

    const mockFetch: MockFetchFn = async (url) => {
      const u = String(url);
      if (u.includes("graphql")) {
        return jsonResponse({
          data: { saveEndpoint: { id: endpointId, name: "test" } },
        });
      }
      if (u.includes("/health")) {
        return jsonResponse({
          workers: { ready: 1, idle: 0, initializing: 0, running: 0, throttled: 0 },
          jobs: { completed: 0, failed: 0, inProgress: 0, inQueue: 0, retried: 0 },
        });
      }
      if (u.includes("/v1/models") || u.includes("/openai/v1/models")) {
        return jsonResponse({ data: [{ id: "Qwen/Qwen2.5-32B-Instruct" }] });
      }
      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const result = await provider.provision();

    const expected = `https://api.runpod.ai/v2/${endpointId}/openai/v1`;
    assert.equal(result.baseUrl, expected);
  });
});
