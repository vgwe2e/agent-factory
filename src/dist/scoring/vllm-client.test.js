/**
 * Tests for vLLM client adapter.
 *
 * Uses mock fetch to verify request structure, response handling,
 * and error cases without requiring a real vLLM server.
 */
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createVllmChatFn, VLLM_TIMEOUT_MS, VLLM_TEMPERATURE } from "./vllm-client.js";
describe("createVllmChatFn", () => {
    let originalFetch;
    let fetchCalls;
    beforeEach(() => {
        originalFetch = globalThis.fetch;
        fetchCalls = [];
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });
    function mockFetch(status = 200, responseBody = {
        choices: [{ message: { content: '{"score": 5}' } }],
        usage: { total_tokens: 100 },
    }, statusText = "OK") {
        globalThis.fetch = (async (input, init) => {
            const url = typeof input === "string"
                ? input
                : input instanceof URL
                    ? input.toString()
                    : input.url;
            const body = init?.body
                ? JSON.parse(init.body)
                : {};
            fetchCalls.push({ url, body, headers: init?.headers, signal: init?.signal });
            return new Response(JSON.stringify(responseBody), { status, statusText });
        });
    }
    function mockFetchError(errorMessage) {
        globalThis.fetch = (async () => {
            throw new Error(errorMessage);
        });
    }
    // -- Function signature --
    it("returns a function (ChatFn-compatible)", () => {
        mockFetch();
        const chatFn = createVllmChatFn("http://localhost:8000", "qwen3:30b");
        assert.equal(typeof chatFn, "function");
    });
    // -- Successful response --
    it("extracts content from choices[0].message.content on 200", async () => {
        mockFetch(200, {
            choices: [{ message: { content: '{"result": "ok"}' } }],
        });
        const chatFn = createVllmChatFn("http://localhost:8000", "qwen3:30b");
        const result = await chatFn([{ role: "user", content: "test" }], { type: "object", properties: {} });
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.content, '{"result": "ok"}');
            assert.equal(typeof result.durationMs, "number");
            assert.ok(result.durationMs >= 0);
        }
    });
    // -- Request structure --
    it("POSTs to {baseUrl}/v1/chat/completions", async () => {
        mockFetch();
        const chatFn = createVllmChatFn("http://gpu-server:8000", "qwen3:30b");
        await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(fetchCalls.length, 1);
        assert.equal(fetchCalls[0].url, "http://gpu-server:8000/v1/chat/completions");
    });
    it("normalizes OpenAI-compatible base URLs that already end with /v1", async () => {
        mockFetch();
        const chatFn = createVllmChatFn("https://api.runpod.ai/v2/ep-test/openai/v1", "Qwen/Qwen2.5-32B-Instruct");
        await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(fetchCalls[0].url, "https://api.runpod.ai/v2/ep-test/openai/v1/chat/completions");
    });
    it("includes model, messages, temperature, and response_format in body", async () => {
        mockFetch();
        const chatFn = createVllmChatFn("http://localhost:8000", "my-model");
        await chatFn([{ role: "system", content: "be helpful" }, { role: "user", content: "score this" }], { type: "object", properties: { x: { type: "number" } } });
        const body = fetchCalls[0].body;
        assert.equal(body.model, "my-model");
        assert.deepStrictEqual(body.messages, [
            { role: "system", content: "be helpful" },
            { role: "user", content: "score this" },
        ]);
        assert.equal(body.temperature, 0);
        // response_format should be the translated vLLM format
        const rf = body.response_format;
        assert.equal(rf.type, "json_schema");
        assert.ok("json_schema" in rf);
    });
    it("adds Authorization header when apiKey is provided", async () => {
        mockFetch();
        const chatFn = createVllmChatFn("http://localhost:8000", "my-model", "runpod-key");
        await chatFn([{ role: "user", content: "score this" }], { type: "object" });
        const headers = new Headers(fetchCalls[0].headers);
        assert.equal(headers.get("Authorization"), "Bearer runpod-key");
    });
    it("applies translateToResponseFormat to the format parameter", async () => {
        mockFetch();
        const chatFn = createVllmChatFn("http://localhost:8000", "model");
        const schema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: { val: { type: "string" } },
            additionalProperties: false,
        };
        await chatFn([{ role: "user", content: "test" }], schema);
        const rf = fetchCalls[0].body.response_format;
        // $schema should be stripped
        assert.equal("$schema" in rf.json_schema.schema, false);
        // additionalProperties should be stripped
        assert.equal("additionalProperties" in rf.json_schema.schema, false);
        // Should have the vLLM envelope
        assert.equal(rf.type, "json_schema");
        assert.equal(rf.json_schema.name, "response");
        assert.equal(rf.json_schema.strict, true);
    });
    // -- HTTP error handling --
    it("returns ChatResult error on non-200 HTTP status", async () => {
        mockFetch(503, { error: "overloaded" }, "Service Unavailable");
        const chatFn = createVllmChatFn("http://localhost:8000", "model");
        const result = await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.includes("503"));
            assert.ok(result.error.includes("Service Unavailable"));
        }
    });
    it("returns ChatResult error on 400 Bad Request", async () => {
        mockFetch(400, { error: "bad schema" }, "Bad Request");
        const chatFn = createVllmChatFn("http://localhost:8000", "model");
        const result = await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.includes("400"));
        }
    });
    // -- Network error handling --
    it("returns ChatResult error on network failure", async () => {
        mockFetchError("ECONNREFUSED");
        const chatFn = createVllmChatFn("http://localhost:8000", "model");
        const result = await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.includes("ECONNREFUSED"));
            assert.ok(result.error.includes("vLLM chat failed"));
        }
    });
    it("never throws -- all errors channeled through ChatResult", async () => {
        mockFetchError("catastrophic failure");
        const chatFn = createVllmChatFn("http://localhost:8000", "model");
        // Should NOT throw
        const result = await chatFn([{ role: "user", content: "test" }], { type: "object" });
        assert.equal(result.success, false);
    });
    // -- Constants --
    it("exports VLLM_TIMEOUT_MS as 300000 (5 minutes)", () => {
        assert.equal(VLLM_TIMEOUT_MS, 300_000);
    });
    it("exports VLLM_TEMPERATURE as 0", () => {
        assert.equal(VLLM_TEMPERATURE, 0);
    });
});
