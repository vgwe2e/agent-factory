/**
 * Integration tests for writeEvaluation orchestrator.
 *
 * Verifies that writeEvaluation creates the evaluation/ directory
 * and writes all 4 output files with correct content.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { writeEvaluation } from "./write-evaluation.js";
import { formatTriageTsv } from "./format-triage-tsv.js";
import { formatScoresTsv } from "./format-scores-tsv.js";
import { formatAdoptionRisk } from "./format-adoption-risk.js";
import { formatTier1Report } from "./format-tier1-report.js";
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

// -- Fixtures --

function makeSub(name: string, score: number): SubDimensionScore {
  return { name, score, reason: `Reason for ${name}` };
}

function makeLens(
  lens: "technical" | "adoption" | "value",
  subs: SubDimensionScore[],
): LensScore {
  const total = subs.reduce((s, d) => s + d.score, 0);
  const maxPossible = lens === "technical" ? 9 : lens === "adoption" ? 12 : 6;
  return {
    lens,
    subDimensions: subs,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: "HIGH",
  };
}

function makeTriage(overrides: Partial<TriageResult> = {}): TriageResult {
  return {
    l3Name: "Test Opp",
    l2Name: "L2 Domain",
    l1Name: "L1 Area",
    tier: 2,
    redFlags: [],
    action: "process",
    combinedMaxValue: 5_000_000,
    quickWin: false,
    leadArchetype: "DETERMINISTIC",
    l4Count: 4,
    ...overrides,
  };
}

function makeScoring(overrides: Partial<ScoringResult> = {}): ScoringResult {
  return {
    l3Name: "Test Opp",
    l2Name: "L2 Domain",
    l1Name: "L1 Area",
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Test L4",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: makeLens("technical", [
        makeSub("data_readiness", 2),
        makeSub("platform_fit", 3),
        makeSub("archetype_confidence", 1),
      ]),
      adoption: makeLens("adoption", [
        makeSub("decision_density", 2),
        makeSub("financial_gravity", 3),
        makeSub("impact_proximity", 1),
        makeSub("confidence_signal", 2),
      ]),
      value: makeLens("value", [
        makeSub("value_density", 2),
        makeSub("simulation_viability", 3),
      ]),
    },
    composite: 0.72,
    overallConfidence: "HIGH",
    promotedToSimulation: true,
    scoringDurationMs: 150,
    ...overrides,
  };
}

// -- Test suite --

let tmpDir: string | null = null;

afterEach(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

async function makeTmpDir(): Promise<string> {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "write-eval-"));
  return tmpDir;
}

describe("writeEvaluation", () => {
  const DATE = "2026-01-15";

  it("creates evaluation/ directory and writes exactly 4 files", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    const result = await writeEvaluation(dir, scored, triaged, "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.files.length, 4);

    const evalDir = path.join(dir, "evaluation");
    const entries = await fs.readdir(evalDir);
    assert.equal(entries.length, 4);
    assert.ok(entries.includes("triage.tsv"));
    assert.ok(entries.includes("feasibility-scores.tsv"));
    assert.ok(entries.includes("adoption-risk.md"));
    assert.ok(entries.includes("tier1-report.md"));
  });

  it("file contents match formatter outputs exactly", async () => {
    const dir = await makeTmpDir();
    const triaged = [
      makeTriage({ l3Name: "Opp A", tier: 1, quickWin: true, combinedMaxValue: 10_000_000 }),
      makeTriage({ l3Name: "Opp B", tier: 2, redFlags: [{ type: "ORPHAN", l4Count: 1 }] }),
    ];
    const scored = [
      makeScoring({ l3Name: "Opp A", composite: 0.85 }),
      makeScoring({ l3Name: "Opp B", composite: 0.55, promotedToSimulation: false }),
    ];

    const result = await writeEvaluation(dir, scored, triaged, "TestCorp", DATE);
    assert.equal(result.success, true);
    if (!result.success) return;

    const evalDir = path.join(dir, "evaluation");

    // Verify triage.tsv matches formatter
    const triageTsv = await fs.readFile(path.join(evalDir, "triage.tsv"), "utf-8");
    assert.equal(triageTsv, formatTriageTsv(triaged));

    // Verify feasibility-scores.tsv matches formatter
    const scoresTsv = await fs.readFile(path.join(evalDir, "feasibility-scores.tsv"), "utf-8");
    assert.equal(scoresTsv, formatScoresTsv(scored));

    // Verify adoption-risk.md matches formatter
    const riskMd = await fs.readFile(path.join(evalDir, "adoption-risk.md"), "utf-8");
    assert.equal(riskMd, formatAdoptionRisk(triaged, { date: DATE, scored }));

    // Verify tier1-report.md matches formatter
    const tier1Names = new Set(triaged.filter(o => o.tier === 1).map(o => o.l3Name));
    const reportMd = await fs.readFile(path.join(evalDir, "tier1-report.md"), "utf-8");
    assert.equal(reportMd, formatTier1Report(scored, tier1Names, "TestCorp", DATE));
  });

  it("writes slimmer feasibility outputs in two-pass mode", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage({ l3Name: "Opp A", tier: 1, quickWin: true, combinedMaxValue: 10_000_000 })];
    const scored = [
      makeScoring({
        l3Name: "Opp A",
        lenses: {
          technical: makeLens("technical", [makeSub("platform_fit", 3)]),
          adoption: makeLens("adoption", [
            makeSub("decision_density", 3),
            makeSub("financial_signal", 2),
            makeSub("impact_order", 1),
            makeSub("rating_confidence", 2),
          ]),
          value: makeLens("value", [
            makeSub("value_density", 2),
            makeSub("simulation_viability", 3),
          ]),
        },
      }),
    ];

    const result = await writeEvaluation(dir, scored, triaged, "TestCorp", DATE, "two-pass");
    assert.equal(result.success, true);
    if (!result.success) return;

    const scoresTsv = await fs.readFile(path.join(dir, "evaluation", "feasibility-scores.tsv"), "utf-8");
    const reportMd = await fs.readFile(path.join(dir, "evaluation", "tier1-report.md"), "utf-8");

    assert.ok(!scoresTsv.split("\n")[0].includes("data_readiness"));
    assert.ok(!scoresTsv.split("\n")[0].includes("archetype_conf"));
    assert.ok(!reportMd.includes("Data Readiness"));
    assert.ok(!reportMd.includes("Archetype Confidence"));
  });

  it("returns absolute file paths on success", async () => {
    const dir = await makeTmpDir();
    const result = await writeEvaluation(dir, [makeScoring()], [makeTriage()], "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    for (const filePath of result.files) {
      assert.ok(path.isAbsolute(filePath), `Expected absolute path: ${filePath}`);
      // Verify each path actually exists
      await fs.access(filePath);
    }
  });

  it("works with empty arrays -- still creates all 4 files", async () => {
    const dir = await makeTmpDir();
    const result = await writeEvaluation(dir, [], [], "EmptyCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.files.length, 4);

    const evalDir = path.join(dir, "evaluation");
    const entries = await fs.readdir(evalDir);
    assert.equal(entries.length, 4);

    // Files should still have content (headers at minimum)
    const triageTsv = await fs.readFile(path.join(evalDir, "triage.tsv"), "utf-8");
    assert.ok(triageTsv.length > 0, "triage.tsv should not be empty");

    const scoresTsv = await fs.readFile(path.join(evalDir, "feasibility-scores.tsv"), "utf-8");
    assert.ok(scoresTsv.length > 0, "feasibility-scores.tsv should not be empty");
  });

  it("derives tier1Names from triage data", async () => {
    const dir = await makeTmpDir();
    const triaged = [
      makeTriage({ l3Name: "Tier1Item", tier: 1, quickWin: true, combinedMaxValue: 10_000_000 }),
      makeTriage({ l3Name: "Tier2Item", tier: 2 }),
      makeTriage({ l3Name: "Tier3Item", tier: 3 }),
    ];
    const scored = [
      makeScoring({ l3Name: "Tier1Item", composite: 0.80 }),
      makeScoring({ l3Name: "Tier2Item", composite: 0.60 }),
      makeScoring({ l3Name: "Tier3Item", composite: 0.40 }),
    ];

    const result = await writeEvaluation(dir, scored, triaged, "TestCorp", DATE);
    assert.equal(result.success, true);
    if (!result.success) return;

    const reportMd = await fs.readFile(
      path.join(dir, "evaluation", "tier1-report.md"),
      "utf-8",
    );

    // Should include Tier1Item but not others
    assert.ok(reportMd.includes("Tier1Item"), "tier1 report should include Tier1Item");
    assert.ok(!reportMd.includes("## ") || !reportMd.includes("Tier2Item"),
      "tier1 report should not have Tier2Item as a section");
  });

  it("derives tier1Names from skillId before l3Name", async () => {
    const dir = await makeTmpDir();
    const triaged = [
      makeTriage({
        l3Name: "Shared L3",
        skillId: "skill-tier-1",
        skillName: "Tier 1 Skill",
        tier: 1,
        quickWin: true,
        combinedMaxValue: 10_000_000,
      }),
      makeTriage({
        l3Name: "Shared L3",
        skillId: "skill-tier-2",
        skillName: "Tier 2 Skill",
        tier: 2,
      }),
    ];
    const scored = [
      makeScoring({
        l3Name: "Shared L3",
        skillId: "skill-tier-1",
        skillName: "Tier 1 Skill",
        l4Name: "Tier 1 L4",
        composite: 0.85,
      }),
      makeScoring({
        l3Name: "Shared L3",
        skillId: "skill-tier-2",
        skillName: "Tier 2 Skill",
        l4Name: "Tier 2 L4",
        composite: 0.70,
      }),
    ];

    const result = await writeEvaluation(dir, scored, triaged, "TestCorp", DATE);
    assert.equal(result.success, true);
    if (!result.success) return;

    const reportMd = await fs.readFile(
      path.join(dir, "evaluation", "tier1-report.md"),
      "utf-8",
    );

    assert.ok(reportMd.includes("Tier 1 Skill"));
    assert.ok(!reportMd.includes("Tier 2 Skill"));
  });

  it("returns error result if directory creation fails", async () => {
    // Use an invalid path that can't be created
    const result = await writeEvaluation(
      "/dev/null/impossible-path",
      [makeScoring()],
      [makeTriage()],
      "TestCorp",
      DATE,
    );

    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.length > 0, "error message should be non-empty");
  });

  it("creates parent directories recursively", async () => {
    const dir = await makeTmpDir();
    const nestedDir = path.join(dir, "deep", "nested", "output");

    const result = await writeEvaluation(nestedDir, [makeScoring()], [makeTriage()], "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    const evalDir = path.join(nestedDir, "evaluation");
    const entries = await fs.readdir(evalDir);
    assert.equal(entries.length, 4);
  });
});
