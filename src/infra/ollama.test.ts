import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

// We need to mock fetch before importing the module under test.
// Using node:test mock on globalThis.fetch.

describe("checkOllama", () => {
  let originalFetch: typeof globalThis.fetch;
  const fetchCalls: string[] = [];

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchCalls.length = 0;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      fetchCalls.push(url);
      return handler(url, init);
    }) as typeof globalThis.fetch;
  }

  it("returns success with model list when Ollama responds", async () => {
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          models: [
            { name: "qwen3:8b", size: 4_700_000_000, modified_at: "2026-01-01T00:00:00Z" },
            { name: "qwen3:30b", size: 18_000_000_000, modified_at: "2026-01-01T00:00:00Z" },
          ],
        }),
        { status: 200 },
      ),
    );

    const { checkOllama } = await import("./ollama.js");
    const status = await checkOllama();

    assert.equal(status.connected, true);
    assert.equal(status.models.length, 2);
    assert.equal(status.missingModels.length, 0);
    assert.equal(status.error, undefined);
  });

  it("returns error when Ollama is not running (connection refused)", async () => {
    mockFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const { checkOllama } = await import("./ollama.js");
    const status = await checkOllama();

    assert.equal(status.connected, false);
    assert.equal(status.models.length, 0);
    assert.ok(status.error?.includes("Ollama is not running"));
  });

  it("identifies missing models when Ollama is running but models not available", async () => {
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          models: [
            { name: "qwen3:8b", size: 4_700_000_000, modified_at: "2026-01-01T00:00:00Z" },
          ],
        }),
        { status: 200 },
      ),
    );

    const { checkOllama } = await import("./ollama.js");
    const status = await checkOllama(["qwen3:8b", "qwen3:30b"]);

    assert.equal(status.connected, true);
    assert.equal(status.missingModels.length, 1);
    assert.ok(status.missingModels.includes("qwen3:30b"));
  });

  it("never calls any non-localhost URL", async () => {
    mockFetch(async () =>
      new Response(
        JSON.stringify({ models: [] }),
        { status: 200 },
      ),
    );

    const { checkOllama } = await import("./ollama.js");
    await checkOllama();

    for (const url of fetchCalls) {
      assert.ok(
        url.includes("localhost") || url.includes("127.0.0.1"),
        `Non-localhost URL called: ${url}`,
      );
    }
  });

  it("includes model names and sizes when available", async () => {
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          models: [
            { name: "qwen3:8b", size: 4_700_000_000, modified_at: "2026-01-15T10:30:00Z" },
          ],
        }),
        { status: 200 },
      ),
    );

    const { checkOllama } = await import("./ollama.js");
    const status = await checkOllama(["qwen3:8b"]);

    assert.equal(status.models[0].name, "qwen3:8b");
    assert.equal(status.models[0].size, 4_700_000_000);
    assert.equal(status.models[0].modified_at, "2026-01-15T10:30:00Z");
  });
});

describe("formatOllamaStatus", () => {
  it("shows NOT CONNECTED when not connected", async () => {
    const { formatOllamaStatus } = await import("./ollama.js");
    const output = formatOllamaStatus({
      connected: false,
      models: [],
      missingModels: ["qwen3:8b"],
      error: "Ollama is not running. Start it with: ollama serve",
    });

    assert.ok(output.includes("NOT CONNECTED"));
    assert.ok(output.includes("Ollama is not running"));
  });

  it("shows Connected with model count when all models present", async () => {
    const { formatOllamaStatus } = await import("./ollama.js");
    const output = formatOllamaStatus({
      connected: true,
      models: [
        { name: "qwen3:8b", size: 4_700_000_000, modified_at: "2026-01-01T00:00:00Z" },
        { name: "qwen3:30b", size: 18_000_000_000, modified_at: "2026-01-01T00:00:00Z" },
      ],
      missingModels: [],
    });

    assert.ok(output.includes("Connected"));
    assert.ok(output.includes("2 models"));
  });

  it("shows missing models with pull instructions when some are missing", async () => {
    const { formatOllamaStatus } = await import("./ollama.js");
    const output = formatOllamaStatus({
      connected: true,
      models: [
        { name: "qwen3:8b", size: 4_700_000_000, modified_at: "2026-01-01T00:00:00Z" },
      ],
      missingModels: ["qwen3:30b"],
    });

    assert.ok(output.includes("missing"));
    assert.ok(output.includes("ollama pull qwen3:30b"));
  });
});
