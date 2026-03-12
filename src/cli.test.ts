import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { runWithRetries, type LifecycleOptions, type LifecycleResult, resolveOutputDir } from "./cli.js";
import type { PipelineResult } from "./pipeline/pipeline-runner.js";

function makePipelineResult(overrides: Partial<PipelineResult> = {}): PipelineResult {
  return {
    triageCount: 10,
    scoredCount: 10,
    promotedCount: 5,
    skippedCount: 2,
    errorCount: 0,
    resumedCount: 0,
    simulatedCount: 3,
    simErrorCount: 0,
    totalDurationMs: 5000,
    concurrency: 4,
    avgPerOppMs: 500,
    errors: [],
    ...overrides,
  };
}

describe("resolveOutputDir", () => {
  it("returns evaluation-ollama when no explicit dir and backend is ollama", () => {
    assert.equal(resolveOutputDir(undefined, "ollama"), "./evaluation-ollama");
  });

  it("returns evaluation-vllm when no explicit dir and backend is vllm", () => {
    assert.equal(resolveOutputDir(undefined, "vllm"), "./evaluation-vllm");
  });

  it("returns explicit dir unchanged when backend is vllm", () => {
    assert.equal(resolveOutputDir("./custom-dir", "vllm"), "./custom-dir");
  });

  it("returns explicit dir unchanged when backend is ollama", () => {
    assert.equal(resolveOutputDir("./custom-dir", "ollama"), "./custom-dir");
  });

  it("default ollama dir differs from default vllm dir (non-clobber guarantee)", () => {
    const ollamaDir = resolveOutputDir(undefined, "ollama");
    const vllmDir = resolveOutputDir(undefined, "vllm");
    assert.notEqual(ollamaDir, vllmDir);
  });
});

describe("runWithRetries", () => {
  describe("teardown control", () => {
    it("calls cleanup when teardown is true on normal completion", async () => {
      const cleanupFn = mock.fn(async () => {});
      const pipelineFn = mock.fn(async () => makePipelineResult());
      const clearFn = mock.fn(() => 0);

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: clearFn,
        cleanupFn,
        teardown: true,
        maxRetries: 0,
        outputDir: "./test-output",
      });

      assert.equal(cleanupFn.mock.callCount(), 1, "cleanup should be called once");
      assert.equal(result.exitCode, 0);
    });

    it("does NOT call cleanup when teardown is false on normal completion", async () => {
      const cleanupFn = mock.fn(async () => {});
      const pipelineFn = mock.fn(async () => makePipelineResult());
      const clearFn = mock.fn(() => 0);

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: clearFn,
        cleanupFn,
        teardown: false,
        maxRetries: 0,
        outputDir: "./test-output",
      });

      assert.equal(cleanupFn.mock.callCount(), 0, "cleanup should NOT be called");
      assert.equal(result.exitCode, 0);
    });

    it("ALWAYS calls cleanup on fatal error regardless of teardown flag", async () => {
      const cleanupFn = mock.fn(async () => {});
      const pipelineFn = mock.fn(async () => { throw new Error("infra down"); });
      const clearFn = mock.fn(() => 0);

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: clearFn,
        cleanupFn,
        teardown: false,  // flag is false, but cleanup should still happen
        maxRetries: 0,
        outputDir: "./test-output",
      });

      assert.equal(cleanupFn.mock.callCount(), 1, "cleanup must be called on fatal error");
      assert.equal(result.exitCode, 2);
    });
  });

  describe("exit codes", () => {
    it("returns exit code 0 when errorCount is 0", async () => {
      const pipelineFn = mock.fn(async () => makePipelineResult({ errorCount: 0 }));

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: mock.fn(() => 0),
        cleanupFn: mock.fn(async () => {}),
        teardown: false,
        maxRetries: 0,
        outputDir: "./test-output",
      });

      assert.equal(result.exitCode, 0);
    });

    it("returns exit code 1 when errors remain after retries", async () => {
      const pipelineFn = mock.fn(async () => makePipelineResult({ errorCount: 3 }));

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: mock.fn(() => 3),
        cleanupFn: mock.fn(async () => {}),
        teardown: false,
        maxRetries: 2,
        outputDir: "./test-output",
      });

      assert.equal(result.exitCode, 1);
      assert.ok(result.lastResult);
      assert.equal(result.lastResult.errorCount, 3);
    });

    it("returns exit code 2 on thrown error (fatal failure)", async () => {
      const pipelineFn = mock.fn(async () => { throw new Error("parse error"); });

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: mock.fn(() => 0),
        cleanupFn: mock.fn(async () => {}),
        teardown: false,
        maxRetries: 0,
        outputDir: "./test-output",
      });

      assert.equal(result.exitCode, 2);
      assert.ok(result.fatalError);
      assert.match(result.fatalError, /parse error/);
    });
  });

  describe("retry loop", () => {
    it("calls clearCheckpointErrors and re-runs pipeline for each retry", async () => {
      let callCount = 0;
      const pipelineFn = mock.fn(async () => {
        callCount++;
        // First two calls have errors, third succeeds
        if (callCount <= 2) return makePipelineResult({ errorCount: 2 });
        return makePipelineResult({ errorCount: 0 });
      });
      const clearFn = mock.fn(() => 2);

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: clearFn,
        cleanupFn: mock.fn(async () => {}),
        teardown: false,
        maxRetries: 3,
        outputDir: "./test-output",
      });

      // Initial run + 2 retries (stops at 3rd because errorCount=0)
      assert.equal(pipelineFn.mock.callCount(), 3, "pipeline should be called 3 times (initial + 2 retries)");
      assert.equal(clearFn.mock.callCount(), 2, "clearCheckpointErrors should be called before each retry");
      assert.equal(result.exitCode, 0);
    });

    it("stops retrying early when errorCount reaches 0", async () => {
      let callCount = 0;
      const pipelineFn = mock.fn(async () => {
        callCount++;
        if (callCount === 1) return makePipelineResult({ errorCount: 1 });
        return makePipelineResult({ errorCount: 0 });
      });
      const clearFn = mock.fn(() => 1);

      const result = await runWithRetries({
        pipelineFn,
        clearCheckpointErrorsFn: clearFn,
        cleanupFn: mock.fn(async () => {}),
        teardown: false,
        maxRetries: 5,
        outputDir: "./test-output",
      });

      assert.equal(pipelineFn.mock.callCount(), 2, "should stop after first successful retry");
      assert.equal(clearFn.mock.callCount(), 1);
      assert.equal(result.exitCode, 0);
    });
  });
});
