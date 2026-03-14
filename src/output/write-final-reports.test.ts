/**
 * Integration tests for writeFinalReports orchestrator.
 *
 * Verifies that writeFinalReports creates the evaluation/ directory
 * and writes summary.md, dead-zones.md, meta-reflection.md, and
 * simulation subdirectories with artifact files.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { writeFinalReports } from "./write-final-reports.js";
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { SimulationResult } from "../types/simulation.js";

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

function makeSimResult(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    l3Name: "Test Opp",
    slug: "test-opp",
    artifacts: {
      decisionFlow: "graph TD\n  A-->B",
      componentMap: {
        streams: [{ name: "test-stream", confidence: "confirmed" as const }],
        cortex: [],
        process_builder: [],
        agent_teams: [],
        ui: [],
      },
      mockTest: {
        decision: "Approve budget",
        input: { financial_context: { amount: 1000 }, trigger: "quarterly_review" },
        expected_output: { action: "approve", outcome: "Budget allocated" },
        rationale: "Standard approval flow",
      },
      integrationSurface: {
        source_systems: [{ name: "SAP", status: "identified" as const }],
        aera_ingestion: [],
        processing: [],
        ui_surface: [],
      },
    },
    assessment: {
      groundednessScore: 80,
      integrationConfidenceScore: 75,
      ambiguityRiskScore: 20,
      implementationReadinessScore: 78,
      verdict: "ADVANCE",
      reasons: ["Scenario is grounded, integration-aware, and implementation-ready."],
    },
    validationSummary: {
      confirmedCount: 1,
      inferredCount: 0,
      mermaidValid: true,
    },
    ...overrides,
  };
}

function makeSimPipelineResult(
  results: SimulationResult[] = [makeSimResult()],
): SimulationPipelineResult {
  return {
    results,
    totalSimulated: results.length,
    totalFailed: 0,
    totalConfirmed: results.reduce((s, r) => s + r.validationSummary.confirmedCount, 0),
    totalInferred: results.reduce((s, r) => s + r.validationSummary.inferredCount, 0),
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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "write-final-"));
  return tmpDir;
}

const DATE = "2026-01-15";

describe("writeFinalReports", () => {
  it("creates evaluation/ directory and writes 3 markdown files", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring()];
    const simResults = makeSimPipelineResult();

    const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    const evalDir = path.join(dir, "evaluation");
    const entries = await fs.readdir(evalDir);
    assert.ok(entries.includes("summary.md"));
    assert.ok(entries.includes("dead-zones.md"));
    assert.ok(entries.includes("meta-reflection.md"));
    assert.ok(entries.includes("simulation-filter.tsv"));
    assert.ok(entries.includes("implementation-shortlist.tsv"));
    assert.ok(entries.includes("manual-review-queue.tsv"));
  });

  it("writes summary.md with formatSummary content", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring()];
    const simResults = makeSimPipelineResult();

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    const content = await fs.readFile(path.join(dir, "evaluation", "summary.md"), "utf-8");
    assert.ok(content.includes("Executive Summary: TestCorp"));
    assert.ok(content.includes("2026-01-15"));
    assert.ok(content.length > 0);
  });

  it("writes dead-zones.md with formatDeadZones content", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring()];
    const simResults = makeSimPipelineResult();

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    const content = await fs.readFile(path.join(dir, "evaluation", "dead-zones.md"), "utf-8");
    assert.ok(content.includes("Dead Zones Report"));
    assert.ok(content.length > 0);
  });

  it("writes meta-reflection.md with formatMetaReflection content", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring()];
    const simResults = makeSimPipelineResult();

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    const content = await fs.readFile(path.join(dir, "evaluation", "meta-reflection.md"), "utf-8");
    assert.ok(content.includes("Meta-Reflection"));
    assert.ok(content.length > 0);
  });

  it("writes skill_name and l4_name headers for two-pass TSV reports", async () => {
    const dir = await makeTmpDir();
    const triaged = [makeTriage()];
    const scored = [makeScoring({ l3Name: "Parent L3", skillId: "skill-two-pass", skillName: "Two-Pass Opportunity", l4Name: "Two-Pass Subject", preScore: 0.66 })];
    const simResults = makeSimPipelineResult([makeSimResult({ l3Name: "Two-Pass Subject" })]);

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE, false, "two-pass");

    const simulationFilter = await fs.readFile(path.join(dir, "evaluation", "simulation-filter.tsv"), "utf-8");
    const shortlist = await fs.readFile(path.join(dir, "evaluation", "implementation-shortlist.tsv"), "utf-8");
    const reviewQueue = await fs.readFile(path.join(dir, "evaluation", "manual-review-queue.tsv"), "utf-8");

    assert.deepEqual(simulationFilter.split("\n")[0].split("\t").slice(0, 3), ["skill_id", "skill_name", "l4_name"]);
    assert.deepEqual(shortlist.split("\n")[0].split("\t").slice(0, 3), ["skill_id", "skill_name", "l4_name"]);
    assert.deepEqual(reviewQueue.split("\n")[0].split("\t").slice(0, 3), ["skill_id", "skill_name", "l4_name"]);
  });

  it("creates simulations/ directory with per-slug subdirectories", async () => {
    const dir = await makeTmpDir();
    const simResult1 = makeSimResult({ l3Name: "Opp Alpha", slug: "opp-alpha" });
    const simResult2 = makeSimResult({ l3Name: "Opp Beta", slug: "opp-beta" });
    const simResults = makeSimPipelineResult([simResult1, simResult2]);
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    const simDir = path.join(dir, "evaluation", "simulations");
    const entries = await fs.readdir(simDir);
    assert.ok(entries.includes("opp-alpha"));
    assert.ok(entries.includes("opp-beta"));
  });

  it("writes 4 artifact files per simulation slug", async () => {
    const dir = await makeTmpDir();
    const simResults = makeSimPipelineResult([makeSimResult()]);
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    const slugDir = path.join(dir, "evaluation", "simulations", "test-opp");
    const entries = await fs.readdir(slugDir);
    assert.ok(entries.includes("decision-flow.mmd"));
    assert.ok(entries.includes("component-map.yaml"));
    assert.ok(entries.includes("mock-test.yaml"));
    assert.ok(entries.includes("integration-surface.yaml"));
    assert.ok(entries.includes("simulation-assessment.yaml"));

    // Verify content is non-empty
    const mmd = await fs.readFile(path.join(slugDir, "decision-flow.mmd"), "utf-8");
    assert.ok(mmd.includes("graph TD"));

    const cmYaml = await fs.readFile(path.join(slugDir, "component-map.yaml"), "utf-8");
    assert.ok(cmYaml.includes("test-stream"));

    const mtYaml = await fs.readFile(path.join(slugDir, "mock-test.yaml"), "utf-8");
    assert.ok(mtYaml.includes("Approve budget"));

    const isYaml = await fs.readFile(path.join(slugDir, "integration-surface.yaml"), "utf-8");
    assert.ok(isYaml.includes("SAP"));

    const assessmentYaml = await fs.readFile(path.join(slugDir, "simulation-assessment.yaml"), "utf-8");
    assert.ok(assessmentYaml.includes("ADVANCE"));
  });

  it("returns success with all written file paths", async () => {
    const dir = await makeTmpDir();
    const simResults = makeSimPipelineResult([makeSimResult()]);
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    // 3 markdown files + 3 TSVs + 5 simulation artifact files = 11
    assert.equal(result.files.length, 11);

    for (const filePath of result.files) {
      assert.ok(path.isAbsolute(filePath), `Expected absolute path: ${filePath}`);
      await fs.access(filePath);
    }
  });

  it("handles empty simResults.results -- creates simulations/ dir but no subdirs", async () => {
    const dir = await makeTmpDir();
    const simResults = makeSimPipelineResult([]);
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    // 3 markdown files + 3 TSVs
    assert.equal(result.files.length, 6);

    const simDir = path.join(dir, "evaluation", "simulations");
    const entries = await fs.readdir(simDir);
    assert.equal(entries.length, 0);
  });

  it("returns error result if directory creation fails", async () => {
    const result = await writeFinalReports(
      "/dev/null/impossible-path",
      [makeScoring()],
      [makeTriage()],
      makeSimPipelineResult(),
      "TestCorp",
      DATE,
    );

    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.length > 0);
  });

  it("creates parent directories recursively", async () => {
    const dir = await makeTmpDir();
    const nestedDir = path.join(dir, "deep", "nested", "output");
    const simResults = makeSimPipelineResult([]);
    const triaged = [makeTriage()];
    const scored = [makeScoring()];

    const result = await writeFinalReports(nestedDir, scored, triaged, simResults, "TestCorp", DATE);

    assert.equal(result.success, true);
    if (!result.success) return;

    const evalDir = path.join(nestedDir, "evaluation");
    const entries = await fs.readdir(evalDir);
    assert.ok(entries.includes("summary.md"));
  });
});
