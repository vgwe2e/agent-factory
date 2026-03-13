import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import {
  generateSimulationText,
  resolveSimulationLlmConfig,
} from "./llm-client.js";

describe("simulation llm client", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("normalizes legacy Ollama chat URLs to a base URL", () => {
    const config = resolveSimulationLlmConfig("http://localhost:11434/api/chat");

    assert.deepStrictEqual(config, {
      backend: "ollama",
      baseUrl: "http://localhost:11434",
      model: "qwen3:30b",
    });
  });

  it("calls a vLLM server via /v1/chat/completions with auth", async () => {
    let capturedUrl = "";
    let capturedAuth = "";

    globalThis.fetch = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedAuth = new Headers(init?.headers).get("Authorization") ?? "";
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "yaml: true" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof globalThis.fetch;

    const result = await generateSimulationText(
      [{ role: "user", content: "Return YAML" }],
      {
        backend: "vllm",
        baseUrl: "https://pod-id-8000.proxy.runpod.net/v1",
        model: "Qwen/Qwen2.5-32B-Instruct",
        apiKey: "pod-key",
      },
      { timeoutMs: 1000 },
    );

    assert.equal(result.success, true);
    assert.equal(capturedUrl, "https://pod-id-8000.proxy.runpod.net/v1/chat/completions");
    assert.equal(capturedAuth, "Bearer pod-key");
  });

  it("calls Ollama via /api/chat when passed a legacy base URL string", async () => {
    let capturedUrl = "";

    globalThis.fetch = mock.fn(async (url: string | URL | Request) => {
      capturedUrl = String(url);
      return new Response(
        JSON.stringify({
          message: { content: "flowchart TD\nA-->B" },
          done: true,
          total_duration: 1_000_000,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof globalThis.fetch;

    const result = await generateSimulationText(
      [{ role: "user", content: "Return Mermaid" }],
      "http://localhost:11434",
      { timeoutMs: 1000 },
    );

    assert.equal(result.success, true);
    assert.equal(capturedUrl, "http://localhost:11434/api/chat");
  });
});
