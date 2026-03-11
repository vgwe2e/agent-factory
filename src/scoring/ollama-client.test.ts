import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

interface FetchCall {
  url: string;
  body: Record<string, unknown>;
}

describe("ollamaChat", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchCalls: FetchCall[];

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchCalls = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(responseBody: Record<string, unknown> = {
    message: { role: "assistant", content: '{"score": 5}' },
    done: true,
    total_duration: 1_000_000_000,
  }): void {
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const body = init?.body ? JSON.parse(init.body as string) as Record<string, unknown> : {};
      fetchCalls.push({ url, body });
      return new Response(JSON.stringify(responseBody), { status: 200 });
    }) as typeof globalThis.fetch;
  }

  it("includes model in request body", async () => {
    mockFetch();
    const { ollamaChat } = await import("./ollama-client.js");

    await ollamaChat(
      [{ role: "user", content: "test" }],
      { type: "object" },
    );

    assert.equal(fetchCalls.length, 1);
    assert.ok("model" in fetchCalls[0].body);
  });

  it("uses SCORING_MODEL as default when no model param provided", async () => {
    mockFetch();
    const { ollamaChat, SCORING_MODEL } = await import("./ollama-client.js");

    await ollamaChat(
      [{ role: "user", content: "test" }],
      { type: "object" },
    );

    assert.equal(fetchCalls[0].body.model, SCORING_MODEL);
  });

  it("uses explicit model parameter when provided", async () => {
    mockFetch();
    const { ollamaChat } = await import("./ollama-client.js");

    await ollamaChat(
      [{ role: "user", content: "test" }],
      { type: "object" },
      "qwen3:8b",
    );

    assert.equal(fetchCalls[0].body.model, "qwen3:8b");
  });
});

describe("scoreWithRetry", () => {
  it("logs via logger instead of console.error when logger provided", async () => {
    const { scoreWithRetry } = await import("./ollama-client.js");
    const { z } = await import("zod");
    const { createLogger } = await import("../infra/logger.js");

    const logger = createLogger("silent");
    const loggedMessages: string[] = [];

    // Create a child logger that captures error calls
    const testLogger = {
      ...logger,
      error: (...args: unknown[]) => {
        loggedMessages.push(String(args[0]));
      },
    };

    const schema = z.object({ value: z.number() });

    // callFn that always returns invalid JSON to trigger retries
    let callCount = 0;
    const callFn = async () => {
      callCount++;
      return "not valid json";
    };

    const result = await scoreWithRetry(schema, callFn, 2, testLogger as never);

    assert.equal(result.success, false);
    assert.ok(callCount >= 2);
    assert.ok(loggedMessages.length > 0, "Logger should have been called with error messages");
  });

  it("falls back to console.error when no logger provided", async () => {
    const { scoreWithRetry } = await import("./ollama-client.js");
    const { z } = await import("zod");

    const schema = z.object({ value: z.number() });

    // This should not throw even without a logger
    const result = await scoreWithRetry(schema, async () => "bad json", 1);
    assert.equal(result.success, false);
  });
});
