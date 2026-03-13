/**
 * Tests for loadArchivedScores helper.
 *
 * Verifies loading, deduplication, and error handling of archived
 * checkpoint-*.json files containing ScoringResult objects.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { loadArchivedScores } from "./load-archived-scores.js";
import type { ScoringResult } from "../types/scoring.js";

// -- Helpers --

function makeScoringResult(l3Name: string, composite: number = 0.65): ScoringResult {
  return {
    l3Name,
    l2Name: `L2-${l3Name}`,
    l1Name: `L1-${l3Name}`,
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Test L4",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: {
        lens: "technical",
        subDimensions: [
          { name: "data_readiness", score: 2, reason: "Good" },
          { name: "aera_platform_fit", score: 2, reason: "Good" },
          { name: "archetype_confidence", score: 2, reason: "Good" },
        ],
        total: 6,
        maxPossible: 9,
        normalized: 0.67,
        confidence: "MEDIUM",
      },
      adoption: {
        lens: "adoption",
        subDimensions: [
          { name: "decision_density", score: 2, reason: "Good" },
          { name: "financial_gravity", score: 2, reason: "Good" },
          { name: "impact_proximity", score: 2, reason: "Good" },
          { name: "confidence_signal", score: 2, reason: "Good" },
        ],
        total: 8,
        maxPossible: 12,
        normalized: 0.67,
        confidence: "MEDIUM",
      },
      value: {
        lens: "value",
        subDimensions: [
          { name: "value_density", score: 2, reason: "Good" },
          { name: "simulation_viability", score: 2, reason: "Good" },
        ],
        total: 4,
        maxPossible: 6,
        normalized: 0.67,
        confidence: "MEDIUM",
      },
    },
    composite,
    overallConfidence: "MEDIUM",
    promotedToSimulation: composite >= 0.60,
    scoringDurationMs: 5000,
  } as ScoringResult;
}

function writeArchive(dir: string, filename: string, data: Record<string, ScoringResult>): void {
  const pipelineDir = path.join(dir, ".pipeline");
  fs.mkdirSync(pipelineDir, { recursive: true });
  fs.writeFileSync(path.join(pipelineDir, filename), JSON.stringify(data, null, 2), "utf-8");
}

// -- Tests --

describe("loadArchivedScores", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "load-archived-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty array when .pipeline/ directory does not exist", async () => {
    const results = await loadArchivedScores(tmpDir);
    assert.deepStrictEqual(results, []);
  });

  it("returns empty array when .pipeline/ has no checkpoint-*.json files", async () => {
    const pipelineDir = path.join(tmpDir, ".pipeline");
    fs.mkdirSync(pipelineDir, { recursive: true });
    // Write a non-checkpoint file
    fs.writeFileSync(path.join(pipelineDir, "other-file.json"), "{}", "utf-8");

    const results = await loadArchivedScores(tmpDir);
    assert.deepStrictEqual(results, []);
  });

  it("loads and deduplicates ScoringResult objects from multiple checkpoint files (later wins)", async () => {
    const sr1 = makeScoringResult("Opp-A", 0.50);
    const sr2 = makeScoringResult("Opp-B", 0.70);
    const sr3 = makeScoringResult("Opp-A", 0.80); // duplicate -- should override sr1

    writeArchive(tmpDir, "checkpoint-1000.json", { "Opp-A": sr1, "Opp-B": sr2 });
    writeArchive(tmpDir, "checkpoint-2000.json", { "Opp-A": sr3 });

    const results = await loadArchivedScores(tmpDir);
    assert.equal(results.length, 2, "2 unique results after dedup");

    const oppA = results.find((r) => r.l3Name === "Opp-A");
    assert.ok(oppA, "Opp-A present");
    assert.equal(oppA!.composite, 0.80, "Opp-A uses later score (0.80 not 0.50)");

    const oppB = results.find((r) => r.l3Name === "Opp-B");
    assert.ok(oppB, "Opp-B present");
    assert.equal(oppB!.composite, 0.70, "Opp-B unchanged");
  });

  it("ignores malformed JSON files gracefully (returns results from valid files only)", async () => {
    const sr1 = makeScoringResult("Opp-A", 0.65);
    writeArchive(tmpDir, "checkpoint-1000.json", { "Opp-A": sr1 });

    // Write a corrupt file
    const pipelineDir = path.join(tmpDir, ".pipeline");
    fs.writeFileSync(path.join(pipelineDir, "checkpoint-2000.json"), "NOT VALID JSON{{{", "utf-8");

    const results = await loadArchivedScores(tmpDir);
    assert.equal(results.length, 1, "1 result from valid file");
    assert.equal(results[0].l3Name, "Opp-A");
  });

  it("returns all scored results from archive files regardless of checkpoint metadata", async () => {
    // Archive files contain full ScoringResult objects -- loadArchivedScores
    // does not filter by checkpoint entry status. It loads everything from
    // the archive files (which only contain scored results by design, since
    // archiveAndReset only writes results from ctx.results Map, which only
    // contains successfully scored opportunities via addResult).
    const sr1 = makeScoringResult("Opp-A", 0.65);
    const sr2 = makeScoringResult("Opp-B", 0.70);
    const sr3 = makeScoringResult("Opp-C", 0.55);

    writeArchive(tmpDir, "checkpoint-1000.json", { "Opp-A": sr1, "Opp-B": sr2 });
    writeArchive(tmpDir, "checkpoint-2000.json", { "Opp-C": sr3 });

    const results = await loadArchivedScores(tmpDir);
    assert.equal(results.length, 3, "all 3 scored results loaded");
    const names = results.map((r) => r.l3Name).sort();
    assert.deepStrictEqual(names, ["Opp-A", "Opp-B", "Opp-C"]);
  });
});
