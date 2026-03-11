import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
// We'll import the module under test
import { callWithResilience } from "./retry-policy.js";
const ScoreSchema = z.object({ score: z.number() });
describe("callWithResilience", () => {
    it("returns primary result with resolvedVia='primary' when primaryCall succeeds", async () => {
        const primaryCall = async () => JSON.stringify({ score: 42 });
        const result = await callWithResilience({
            primaryCall,
            schema: ScoreSchema,
            label: "test-primary",
            maxRetries: 1,
        });
        assert.equal(result.resolvedVia, "primary");
        assert.equal(result.result.success, true);
        if (result.result.success) {
            assert.deepStrictEqual(result.result.data, { score: 42 });
        }
    });
    it("falls back to fallbackCall with resolvedVia='fallback' when primary exhausts retries", async () => {
        const primaryCall = async () => {
            throw new Error("primary failed");
        };
        const fallbackCall = async () => JSON.stringify({ score: 99 });
        const result = await callWithResilience({
            primaryCall,
            fallbackCall,
            schema: ScoreSchema,
            label: "test-fallback",
            maxRetries: 1,
        });
        assert.equal(result.resolvedVia, "fallback");
        assert.equal(result.result.success, true);
        if (result.result.success) {
            assert.deepStrictEqual(result.result.data, { score: 99 });
        }
    });
    it("returns resolvedVia='skipped' with success=false when both primary and fallback fail", async () => {
        const primaryCall = async () => {
            throw new Error("primary failed");
        };
        const fallbackCall = async () => {
            throw new Error("fallback failed");
        };
        const result = await callWithResilience({
            primaryCall,
            fallbackCall,
            schema: ScoreSchema,
            label: "test-skip",
            maxRetries: 1,
        });
        assert.equal(result.resolvedVia, "skipped");
        assert.equal(result.result.success, false);
    });
    it("returns resolvedVia='skipped' when primary fails and no fallbackCall provided", async () => {
        const primaryCall = async () => {
            throw new Error("primary failed");
        };
        const result = await callWithResilience({
            primaryCall,
            schema: ScoreSchema,
            label: "test-no-fallback",
            maxRetries: 1,
        });
        assert.equal(result.resolvedVia, "skipped");
        assert.equal(result.result.success, false);
    });
    it("passes maxRetries through to scoreWithRetry", async () => {
        let callCount = 0;
        const primaryCall = async () => {
            callCount++;
            if (callCount < 3)
                throw new Error("not yet");
            return JSON.stringify({ score: 7 });
        };
        const result = await callWithResilience({
            primaryCall,
            schema: ScoreSchema,
            label: "test-retries",
            maxRetries: 3,
        });
        assert.equal(callCount, 3);
        assert.equal(result.resolvedVia, "primary");
        assert.equal(result.result.success, true);
    });
    it("skipReason contains the original error message from primary failure", async () => {
        const primaryCall = async () => {
            throw new Error("LLM timeout after 120s");
        };
        const result = await callWithResilience({
            primaryCall,
            schema: ScoreSchema,
            label: "test-skip-reason",
            maxRetries: 1,
        });
        assert.equal(result.resolvedVia, "skipped");
        assert.ok(result.skipReason);
        assert.ok(result.skipReason.includes("LLM timeout after 120s"), `Expected skipReason to contain 'LLM timeout after 120s', got: ${result.skipReason}`);
    });
});
