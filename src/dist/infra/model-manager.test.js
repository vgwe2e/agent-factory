import { describe, it } from "node:test";
import assert from "node:assert/strict";
function createMockFetch() {
    const calls = [];
    const fn = (async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const body = init?.body ? JSON.parse(init.body) : {};
        calls.push({ url, body });
        return new Response(JSON.stringify({ message: { content: "" }, done: true }), { status: 200 });
    });
    return { fn, calls };
}
describe("ModelManager", () => {
    it("switchTo sends unload then load fetch calls with correct keep_alive values", async () => {
        const { ModelManager } = await import("./model-manager.js");
        const { createLogger } = await import("./logger.js");
        const mock = createMockFetch();
        const logger = createLogger("silent");
        const mm = new ModelManager({ triageModel: "qwen2.5:7b", scoringModel: "qwen2.5:32b", timeoutMs: 5000 }, logger, mock.fn, 0);
        // First switchTo loads without unload (no current model)
        await mm.switchTo("qwen2.5:7b");
        assert.equal(mock.calls.length, 1);
        assert.equal(mock.calls[0].body.model, "qwen2.5:7b");
        assert.equal(mock.calls[0].body.keep_alive, "30m");
        // Second switchTo unloads old, then loads new
        await mm.switchTo("qwen2.5:32b");
        assert.equal(mock.calls.length, 3); // +1 unload, +1 load
        assert.equal(mock.calls[1].body.model, "qwen2.5:7b");
        assert.equal(mock.calls[1].body.keep_alive, 0);
        assert.equal(mock.calls[2].body.model, "qwen2.5:32b");
        assert.equal(mock.calls[2].body.keep_alive, "30m");
    });
    it("switchTo same model is a no-op (zero fetch calls)", async () => {
        const { ModelManager } = await import("./model-manager.js");
        const { createLogger } = await import("./logger.js");
        const mock = createMockFetch();
        const logger = createLogger("silent");
        const mm = new ModelManager({ triageModel: "qwen2.5:7b", scoringModel: "qwen2.5:32b", timeoutMs: 5000 }, logger, mock.fn, 0);
        await mm.switchTo("qwen2.5:7b");
        const callsBefore = mock.calls.length;
        await mm.switchTo("qwen2.5:7b"); // same model
        assert.equal(mock.calls.length, callsBefore); // no additional calls
    });
    it("unloadAll sends keep_alive=0 and resets currentModel", async () => {
        const { ModelManager } = await import("./model-manager.js");
        const { createLogger } = await import("./logger.js");
        const mock = createMockFetch();
        const logger = createLogger("silent");
        const mm = new ModelManager({ triageModel: "qwen2.5:7b", scoringModel: "qwen2.5:32b", timeoutMs: 5000 }, logger, mock.fn, 0);
        await mm.switchTo("qwen2.5:7b");
        mock.calls.length = 0; // reset tracking
        await mm.unloadAll();
        assert.equal(mock.calls.length, 1);
        assert.equal(mock.calls[0].body.keep_alive, 0);
        assert.equal(mock.calls[0].body.model, "qwen2.5:7b");
        // After unload, switchTo should not try to unload again
        mock.calls.length = 0;
        await mm.switchTo("qwen2.5:32b");
        assert.equal(mock.calls.length, 1); // only load, no unload
        assert.equal(mock.calls[0].body.keep_alive, "30m");
    });
    it("ensureTriageModel delegates to switchTo with triageModel", async () => {
        const { ModelManager } = await import("./model-manager.js");
        const { createLogger } = await import("./logger.js");
        const mock = createMockFetch();
        const logger = createLogger("silent");
        const mm = new ModelManager({ triageModel: "qwen2.5:7b", scoringModel: "qwen2.5:32b", timeoutMs: 5000 }, logger, mock.fn, 0);
        await mm.ensureTriageModel();
        assert.equal(mock.calls.length, 1);
        assert.equal(mock.calls[0].body.model, "qwen2.5:7b");
    });
    it("ensureScoringModel delegates to switchTo with scoringModel", async () => {
        const { ModelManager } = await import("./model-manager.js");
        const { createLogger } = await import("./logger.js");
        const mock = createMockFetch();
        const logger = createLogger("silent");
        const mm = new ModelManager({ triageModel: "qwen2.5:7b", scoringModel: "qwen2.5:32b", timeoutMs: 5000 }, logger, mock.fn, 0);
        await mm.ensureScoringModel();
        assert.equal(mock.calls.length, 1);
        assert.equal(mock.calls[0].body.model, "qwen2.5:32b");
    });
});
