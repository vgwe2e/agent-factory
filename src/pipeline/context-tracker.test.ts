/**
 * Context tracker unit tests.
 *
 * Validates per-skill evaluation state tracking,
 * archive/reset to disk, and stats reporting.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import {
  createContext,
  addResult,
  addError,
  setStage,
  archiveAndReset,
  getStats,
} from "./context-tracker.js";

import type { ScoringResult } from "../types/scoring.js";

/** Minimal ScoringResult factory for tests. */
function makeScoringResult(skillId: string, l3Name: string = "L3-Test"): ScoringResult {
  const lens = {
    lens: "technical" as const,
    subDimensions: [],
    total: 6,
    maxPossible: 9,
    normalized: 0.67,
    confidence: "MEDIUM" as const,
  };
  return {
    skillId,
    skillName: `Skill ${skillId}`,
    l4Name: "Test L4",
    l3Name,
    l2Name: "L2-Test",
    l1Name: "L1-Test",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: { ...lens, lens: "technical" },
      adoption: { ...lens, lens: "adoption", maxPossible: 12 },
      value: { ...lens, lens: "value", maxPossible: 6 },
    },
    composite: 0.65,
    overallConfidence: "MEDIUM",
    promotedToSimulation: true,
    scoringDurationMs: 100,
  };
}

/** Create a unique tmp directory for file I/O tests. */
function makeTmpDir(): string {
  const dir = path.join(os.tmpdir(), `ctx-test-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let tmpDirs: string[] = [];

afterEach(() => {
  for (const d of tmpDirs) {
    fs.rmSync(d, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("createContext", () => {
  it("returns empty context with stage triage", () => {
    const ctx = createContext();
    assert.equal(ctx.currentStage, "triage");
    assert.equal(ctx.processed.size, 0);
    assert.equal(ctx.results.size, 0);
    assert.equal(ctx.errors.length, 0);
  });
});

describe("addResult", () => {
  it("adds result to results Map keyed by skillId and skillId to processed Set", () => {
    const ctx = createContext();
    const result = makeScoringResult("skill-A");
    addResult(ctx, result);
    assert.equal(ctx.results.size, 1);
    assert.equal(ctx.results.get("skill-A"), result);
    assert.ok(ctx.processed.has("skill-A"));
  });
});

describe("addError", () => {
  it("appends error to errors array", () => {
    const ctx = createContext();
    addError(ctx, "skill-X", "scoring", "Model timeout");
    assert.equal(ctx.errors.length, 1);
    assert.deepEqual(ctx.errors[0], {
      oppId: "skill-X",
      stage: "scoring",
      error: "Model timeout",
    });
  });
});

describe("setStage", () => {
  it("updates currentStage", () => {
    const ctx = createContext();
    setStage(ctx, "scoring");
    assert.equal(ctx.currentStage, "scoring");
  });
});

describe("archiveAndReset", () => {
  it("writes checkpoint JSON and clears results Map", async () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);

    const ctx = createContext();
    addResult(ctx, makeScoringResult("skill-1"));
    addResult(ctx, makeScoringResult("skill-2"));

    const count = await archiveAndReset(ctx, tmpDir);
    assert.equal(count, 2);
    assert.equal(ctx.results.size, 0);

    // Checkpoint file written
    const pipelineDir = path.join(tmpDir, ".pipeline");
    assert.ok(fs.existsSync(pipelineDir));
    const files = fs.readdirSync(pipelineDir);
    assert.equal(files.length, 1);
    assert.ok(files[0].startsWith("checkpoint-"));
    assert.ok(files[0].endsWith(".json"));

    // Contents are valid JSON with 2 results keyed by skillId
    const data = JSON.parse(
      fs.readFileSync(path.join(pipelineDir, files[0]), "utf-8"),
    );
    assert.equal(Object.keys(data).length, 2);
    assert.ok("skill-1" in data);
    assert.ok("skill-2" in data);
  });

  it("keeps processed Set intact after reset", async () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);

    const ctx = createContext();
    addResult(ctx, makeScoringResult("skill-A"));
    await archiveAndReset(ctx, tmpDir);

    assert.ok(ctx.processed.has("skill-A"));
    assert.equal(ctx.results.size, 0);
  });

  it("creates .pipeline subdirectory if it does not exist", async () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);

    const ctx = createContext();
    addResult(ctx, makeScoringResult("skill-Z"));

    const pipelineDir = path.join(tmpDir, ".pipeline");
    assert.ok(!fs.existsSync(pipelineDir));

    await archiveAndReset(ctx, tmpDir);
    assert.ok(fs.existsSync(pipelineDir));
  });

  it("is a no-op returning 0 when results Map is empty", async () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);

    const ctx = createContext();
    const count = await archiveAndReset(ctx, tmpDir);
    assert.equal(count, 0);

    const pipelineDir = path.join(tmpDir, ".pipeline");
    assert.ok(!fs.existsSync(pipelineDir));
  });
});

describe("getStats", () => {
  it("returns correct counts", () => {
    const ctx = createContext();
    addResult(ctx, makeScoringResult("skill-1"));
    addResult(ctx, makeScoringResult("skill-2"));
    addError(ctx, "skill-3", "scoring", "fail");

    const stats = getStats(ctx);
    assert.equal(stats.processed, 2);
    assert.equal(stats.pending, 2);
    assert.equal(stats.errors, 1);
  });

  it("pending reflects only current results (not archived)", async () => {
    const tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);

    const ctx = createContext();
    addResult(ctx, makeScoringResult("skill-1"));
    await archiveAndReset(ctx, tmpDir);
    addResult(ctx, makeScoringResult("skill-2"));

    const stats = getStats(ctx);
    assert.equal(stats.processed, 2);
    assert.equal(stats.pending, 1); // only skill-2 in current results
  });
});
