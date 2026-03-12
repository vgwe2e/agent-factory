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

    const mockFetch: MockFetchFn = async (url) => {
      const u = String(url);

      // Endpoint creation via GraphQL
      if (u.includes("graphql")) {
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
      endpoint.baseUrl.startsWith("https://api.runpod.io/v2/"),
      `Expected RunPod proxy URL, got: ${endpoint.baseUrl}`,
    );
    assert.ok(endpoint.provisionedAt instanceof Date);
  });

  // ---- provision: timeout -------------------------------------------------

  it("provision() throws when endpoint creation timeout exceeded", async () => {
    // Mock that always returns "initializing" workers (never ready)
    const mockFetch: MockFetchFn = async (url) => {
      const u = String(url);

      if (u.includes("graphql")) {
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
        return true;
      },
    );
  });

  // ---- healthCheck -------------------------------------------------------

  it("healthCheck() returns true on 200", async () => {
    globalThis.fetch = (async () =>
      jsonResponse({ data: [{ id: "model" }] })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.io/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    const ok = await provider.healthCheck(endpoint);
    assert.equal(ok, true);
  });

  it("healthCheck() returns false on error", async () => {
    globalThis.fetch = (async () =>
      new Response("Service Unavailable", { status: 503 })) as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const endpoint: ProvisionedEndpoint = {
      endpointId: "ep-1",
      baseUrl: "https://api.runpod.io/v2/ep-1/openai/v1",
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
      baseUrl: "https://api.runpod.io/v2/ep-1/openai/v1",
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
      baseUrl: "https://api.runpod.io/v2/ep-1/openai/v1",
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
      baseUrl: "https://api.runpod.io/v2/ep-1/openai/v1",
      provisionedAt: new Date(),
    };

    await provider.teardown(endpoint);
    await provider.teardown(endpoint); // should not throw
  });

  // ---- provision: health timeout throws -----------------------------------

  it("provision() throws when vLLM health check times out", async () => {
    const endpointId = "ep-health-timeout";

    const mockFetch: MockFetchFn = async (url) => {
      const u = String(url);

      // Endpoint creation succeeds
      if (u.includes("graphql")) {
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
        return true;
      },
    );
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
        return jsonResponse({ data: [{ id: "model" }] });
      }
      return new Response("Not found", { status: 404 });
    };

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const provider = createCloudProvider({ apiKey: "test-key" });
    const result = await provider.provision();

    const expected = `https://api.runpod.io/v2/${endpointId}/openai/v1`;
    assert.equal(result.baseUrl, expected);
  });
});
