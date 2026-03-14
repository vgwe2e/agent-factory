/**
 * VAL-03: Formatter structural parity tests.
 *
 * Verifies all 10+ report formatters produce structurally correct output
 * from v1.3-shaped ScoringResult objects (with sanityVerdict, preScore,
 * and synthesized LensScores). Tests compare structure -- columns, sections,
 * formatting -- against v1.2 evaluation-vllm/ baseline, NOT numeric values.
 *
 * Permanent regression test: runs on every `npm test` invocation.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { ScoringResult, LensScore, ConfidenceLevel, SanityVerdict } from "../types/scoring.js";
import type { TriageResult, RedFlag, Tier } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { SimulationResult, SimulationFilterVerdict, SimulationAssessment } from "../types/simulation.js";

import { formatScoresTsv } from "./format-scores-tsv.js";
import { formatTriageTsv } from "./format-triage-tsv.js";
import { formatSimulationFilterTsv } from "./format-simulation-filter-tsv.js";
import { formatImplementationShortlistTsv } from "./format-implementation-shortlist-tsv.js";
import { formatSummary } from "./format-summary.js";
import { formatDeadZones } from "./format-dead-zones.js";
import { formatMetaReflection } from "./format-meta-reflection.js";
import { formatTier1Report } from "./format-tier1-report.js";
import { formatAdoptionRisk } from "./format-adoption-risk.js";

// ---------------------------------------------------------------------------
// Shared fixture factories
// ---------------------------------------------------------------------------

function makeLensScore(
  lens: "technical" | "adoption" | "value",
  overrides?: Partial<LensScore>,
): LensScore {
  const configs = {
    technical: {
      subDimensions: [
        { name: "data_readiness", score: 2, reason: "Good data availability" },
        { name: "aera_platform_fit", score: 3, reason: "Strong platform alignment" },
        { name: "archetype_confidence", score: 2, reason: "Moderate archetype match" },
      ],
      total: 7,
      maxPossible: 9,
      normalized: 7 / 9,
    },
    adoption: {
      subDimensions: [
        { name: "decision_density", score: 3, reason: "High decision volume" },
        { name: "financial_gravity", score: 2, reason: "Moderate financial impact" },
        { name: "impact_proximity", score: 2, reason: "Direct impact" },
        { name: "confidence_signal", score: 1, reason: "Low signal confidence" },
      ],
      total: 8,
      maxPossible: 12,
      normalized: 8 / 12,
    },
    value: {
      subDimensions: [
        { name: "value_density", score: 2, reason: "Moderate value concentration" },
        { name: "simulation_viability", score: 3, reason: "High viability for simulation" },
      ],
      total: 5,
      maxPossible: 6,
      normalized: 5 / 6,
    },
  };

  const base = configs[lens];
  return {
    lens,
    subDimensions: base.subDimensions,
    total: base.total,
    maxPossible: base.maxPossible,
    normalized: base.normalized,
    confidence: "HIGH" as ConfidenceLevel,
    ...overrides,
  };
}

let fixtureCounter = 0;

function makeV13ScoringResult(overrides?: Partial<ScoringResult>): ScoringResult {
  fixtureCounter++;
  return {
    skillId: `skill-${fixtureCounter}`,
    skillName: `Test Skill ${fixtureCounter}`,
    l4Name: `Test L4 Activity ${fixtureCounter}`,
    l3Name: `Test L3 Opportunity ${fixtureCounter}`,
    l2Name: "Test L2 Area",
    l1Name: "Test L1 Domain",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: makeLensScore("technical"),
      adoption: makeLensScore("adoption"),
      value: makeLensScore("value"),
    },
    composite: 0.75,
    overallConfidence: "HIGH",
    promotedToSimulation: true,
    scoringDurationMs: 1234,
    // v1.3 optional fields
    sanityVerdict: "AGREE" as SanityVerdict,
    sanityJustification: "Synthetic v1.3 result for compatibility testing",
    preScore: 0.72,
    ...overrides,
  };
}

function makeV13TriageResult(overrides?: Partial<TriageResult>): TriageResult {
  fixtureCounter++;
  return {
    l3Name: `Test L3 Opportunity ${fixtureCounter}`,
    l2Name: "Test L2 Area",
    l1Name: "Test L1 Domain",
    tier: 2 as Tier,
    redFlags: [],
    action: "process",
    combinedMaxValue: 5_000_000,
    quickWin: false,
    leadArchetype: "DETERMINISTIC",
    l4Count: 4,
    ...overrides,
  };
}

function makeMinimalSimResult(): SimulationPipelineResult {
  const assessment: SimulationAssessment = {
    groundednessScore: 0.8,
    integrationConfidenceScore: 0.7,
    ambiguityRiskScore: 0.3,
    implementationReadinessScore: 0.75,
    verdict: "ADVANCE" as SimulationFilterVerdict,
    reasons: ["Good grounding", "Strong integration"],
  };

  const simResult: SimulationResult = {
    l3Name: "Test L3 Opportunity 1",
    slug: "test-l3-opportunity-1",
    artifacts: {
      decisionFlow: "graph TD\nA-->B",
      componentMap: {
        streams: [{ name: "test-stream", confidence: "confirmed" }],
        cortex: [],
        process_builder: [],
        agent_teams: [],
        ui: [],
      },
      mockTest: {
        decision: "Test decision",
        input: { financial_context: {}, trigger: "test" },
        expected_output: { action: "approve", outcome: "success" },
        rationale: "Test rationale",
      },
      integrationSurface: {
        source_systems: [],
        aera_ingestion: [],
        processing: [],
        ui_surface: [],
      },
    },
    assessment,
    validationSummary: { confirmedCount: 1, inferredCount: 0, mermaidValid: true },
  };

  return {
    results: [simResult],
    totalSimulated: 1,
    totalFailed: 0,
    totalConfirmed: 1,
    totalInferred: 0,
  };
}

// ---------------------------------------------------------------------------
// Structural assertion helpers
// ---------------------------------------------------------------------------

function extractTsvColumns(tsv: string): string[] {
  return tsv.split("\n")[0].split("\t");
}

function countTsvRows(tsv: string): number {
  return tsv.split("\n").filter(l => l.trim()).length - 1; // minus header
}

function assertColumnsPresent(tsv: string, requiredCols: string[]): void {
  const cols = extractTsvColumns(tsv);
  for (const req of requiredCols) {
    assert.ok(cols.includes(req), `Missing column: ${req}. Actual columns: ${JSON.stringify(cols)}`);
  }
}

function assertConsistentColumnCount(tsv: string): void {
  const lines = tsv.split("\n").filter(l => l.trim());
  const headerCount = lines[0].split("\t").length;
  for (let i = 1; i < lines.length; i++) {
    assert.strictEqual(
      lines[i].split("\t").length,
      headerCount,
      `Row ${i} has ${lines[i].split("\t").length} columns, expected ${headerCount}`,
    );
  }
}

function extractSections(md: string): string[] {
  return md.split("\n")
    .filter(line => /^#{1,3} /.test(line))
    .map(line => line.trim());
}

function extractTableHeaders(md: string): string[][] {
  const lines = md.split("\n");
  const tables: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("|") && lines[i + 1]?.includes("---")) {
      const headers = lines[i].split("|").map(h => h.trim()).filter(h => h);
      tables.push(headers);
    }
  }
  return tables;
}

/**
 * Compare structural sections between actual output and v1.2 baseline.
 *
 * H1/H2 headers define the report structure. H3 headers are data-driven
 * (domain names, opportunity names) and vary with input data -- so we
 * compare only H1/H2 for structural parity.
 *
 * For H1 headers containing a company name, we normalize out the company
 * name before comparison (e.g., "# Tier 1 Deep Analysis: Ford Motor Company"
 * and "# Tier 1 Deep Analysis: Ford" both become "# Tier 1 Deep Analysis:").
 */
function normalizeH1(header: string): string {
  // Strip everything after the last colon+space in H1 headers
  // e.g., "# Executive Summary: Ford Motor Company" -> "# Executive Summary:"
  return header.replace(/(# [^:]+:).*/, "$1");
}

function assertSectionsMatch(
  actual: string,
  baseline: string,
  allowedAdditions: string[] = [],
): void {
  // Only compare H1 and H2 headers for structural parity
  // Filter to H1/H2 only, and exclude data-driven numbered headers
  // like "## 1. Warehouse & Inventory Management" (tier1 report)
  const filterH1H2 = (sections: string[]) =>
    sections.filter(s => /^#{1,2} /.test(s) && !/^### /.test(s))
      .filter(s => !/^## \d+\. /.test(s));

  const actualH1H2 = filterH1H2(extractSections(actual)).map(normalizeH1);
  const baselineH1H2 = filterH1H2(extractSections(baseline)).map(normalizeH1);

  // Every baseline H1/H2 section must appear in actual
  for (const section of baselineH1H2) {
    assert.ok(
      actualH1H2.includes(section),
      `Missing section: "${section}". Actual sections: ${JSON.stringify(actualH1H2)}`,
    );
  }
  // Any extra H1/H2 section in actual must be in allowedAdditions
  for (const section of actualH1H2) {
    if (!baselineH1H2.includes(section)) {
      assert.ok(
        allowedAdditions.some(a => section.includes(a)),
        `Unexpected section: "${section}"`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// TSV formatter structural parity tests
// ---------------------------------------------------------------------------

describe("VAL-03: TSV formatter structural parity", () => {
  // Reset counter for deterministic test data
  fixtureCounter = 0;

  const SCORING_SUB_DIMENSION_COLS = [
    "data_readiness", "platform_fit", "archetype_conf", "tech_total",
    "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
    "value_density", "simulation_viability", "value_total",
  ];

  const SCORING_AGGREGATE_COLS = ["composite", "confidence", "promotes_to_sim"];

  it("formatScoresTsv: sub-dimension columns present", () => {
    const results = [
      makeV13ScoringResult({ archetype: "DETERMINISTIC", composite: 0.85 }),
      makeV13ScoringResult({ archetype: "AGENTIC", composite: 0.70 }),
      makeV13ScoringResult({ archetype: "GENERATIVE", composite: 0.60 }),
    ];

    const tsv = formatScoresTsv(results);
    assertColumnsPresent(tsv, SCORING_SUB_DIMENSION_COLS);
  });

  it("formatScoresTsv: aggregate columns present", () => {
    const results = [
      makeV13ScoringResult(),
      makeV13ScoringResult(),
      makeV13ScoringResult(),
    ];

    const tsv = formatScoresTsv(results);
    assertColumnsPresent(tsv, SCORING_AGGREGATE_COLS);
  });

  it("formatScoresTsv: consistent column count across all rows", () => {
    const results = [
      makeV13ScoringResult({ archetype: "DETERMINISTIC" }),
      makeV13ScoringResult({ archetype: "AGENTIC" }),
      makeV13ScoringResult({ archetype: "GENERATIVE" }),
    ];

    const tsv = formatScoresTsv(results);
    assertConsistentColumnCount(tsv);
  });

  it("formatScoresTsv: row count matches input count", () => {
    const results = [
      makeV13ScoringResult(),
      makeV13ScoringResult(),
      makeV13ScoringResult(),
    ];

    const tsv = formatScoresTsv(results);
    assert.strictEqual(countTsvRows(tsv), 3, "Expected 3 data rows");
  });

  it("formatTriageTsv: valid TSV with consistent column count", () => {
    const triaged = [
      makeV13TriageResult({ tier: 1 as Tier, quickWin: true }),
      makeV13TriageResult({ tier: 2 as Tier }),
    ];

    const tsv = formatTriageTsv(triaged);
    assertConsistentColumnCount(tsv);
    assert.strictEqual(countTsvRows(tsv), 2, "Expected 2 data rows");
  });

  it("formatTriageTsv: has tier-related columns", () => {
    const triaged = [makeV13TriageResult()];
    const tsv = formatTriageTsv(triaged);
    assertColumnsPresent(tsv, ["tier", "flag_count", "flags"]);
  });

  it("formatSimulationFilterTsv: valid TSV structure", () => {
    const simResults = makeMinimalSimResult();
    const tsv = formatSimulationFilterTsv(simResults);
    assertConsistentColumnCount(tsv);
    assertColumnsPresent(tsv, ["verdict", "l3_name"]);
  });

  it("formatImplementationShortlistTsv: valid TSV structure", () => {
    const scored = [makeV13ScoringResult({ l3Name: "Test L3 Opportunity 1" })];
    const simResults = makeMinimalSimResult();
    const tsv = formatImplementationShortlistTsv(scored, simResults, ["ADVANCE"]);
    assertConsistentColumnCount(tsv);
    assertColumnsPresent(tsv, ["l3_name", "composite", "verdict"]);
  });
});

// ---------------------------------------------------------------------------
// Markdown formatter structural parity tests
// ---------------------------------------------------------------------------

const BASELINE_DIR = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  "../evaluation-vllm/evaluation",
);
const hasBaseline = existsSync(BASELINE_DIR);

describe("VAL-03: Markdown formatter structural parity", () => {
  if (!hasBaseline) {
    it("v1.2 baseline files not found -- skipping markdown parity tests", () => {
      // Skip gracefully
    });
    return;
  }

  // Fixed date to prevent structural mismatch from date differences
  const FIXED_DATE = "2026-01-15";

  it("formatSummary: section headers match v1.2 baseline", () => {
    fixtureCounter = 100;
    const scored = [
      makeV13ScoringResult({ composite: 0.90 }),
      makeV13ScoringResult({ composite: 0.80 }),
      makeV13ScoringResult({ composite: 0.70 }),
    ];
    const triaged = [
      makeV13TriageResult({ tier: 1 as Tier }),
      makeV13TriageResult({ tier: 2 as Tier }),
      makeV13TriageResult({ tier: 3 as Tier }),
    ];
    const simResults = makeMinimalSimResult();

    const actual = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "summary.md"), "utf-8");

    assertSectionsMatch(actual, baseline, ["Scoring Mode"]);
  });

  it("formatSummary: table columns match v1.2 baseline", () => {
    fixtureCounter = 200;
    const scored = [makeV13ScoringResult(), makeV13ScoringResult()];
    const triaged = [makeV13TriageResult(), makeV13TriageResult()];
    const simResults = makeMinimalSimResult();

    const actual = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "summary.md"), "utf-8");

    const actualTables = extractTableHeaders(actual);
    const baselineTables = extractTableHeaders(baseline);

    // Each baseline table's columns should exist in actual
    for (let t = 0; t < baselineTables.length; t++) {
      assert.ok(
        t < actualTables.length,
        `Missing table ${t + 1} in actual output. Baseline has ${baselineTables.length} tables, actual has ${actualTables.length}`,
      );
      for (const col of baselineTables[t]) {
        assert.ok(
          actualTables[t].includes(col),
          `Table ${t + 1} missing column "${col}". Actual: ${JSON.stringify(actualTables[t])}`,
        );
      }
    }
  });

  it("formatDeadZones: section headers match v1.2 baseline", () => {
    fixtureCounter = 300;
    const triaged = [
      makeV13TriageResult({
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
        action: "skip",
      }),
      makeV13TriageResult({
        redFlags: [{ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true }],
        action: "demote",
      }),
    ];
    const scored = [makeV13ScoringResult()];

    const actual = formatDeadZones(triaged, scored, FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "dead-zones.md"), "utf-8");

    assertSectionsMatch(actual, baseline, ["Scoring Mode"]);
  });

  it("formatMetaReflection: section headers match v1.2 baseline", () => {
    fixtureCounter = 400;
    const scored = [makeV13ScoringResult(), makeV13ScoringResult()];
    const triaged = [
      makeV13TriageResult({
        redFlags: [{ type: "CONFIDENCE_GAP", lowConfidencePct: 0.6 }],
      }),
      makeV13TriageResult(),
    ];
    const simResults = makeMinimalSimResult();

    const actual = formatMetaReflection(triaged, scored, simResults, FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "meta-reflection.md"), "utf-8");

    assertSectionsMatch(actual, baseline, ["Scoring Mode"]);
  });

  it("formatMetaReflection: table columns match v1.2 baseline", () => {
    fixtureCounter = 410;
    const scored = [makeV13ScoringResult(), makeV13ScoringResult()];
    const triaged = [
      makeV13TriageResult({
        redFlags: [{ type: "CONFIDENCE_GAP", lowConfidencePct: 0.6 }],
      }),
      makeV13TriageResult(),
    ];
    const simResults = makeMinimalSimResult();

    const actual = formatMetaReflection(triaged, scored, simResults, FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "meta-reflection.md"), "utf-8");

    const actualTables = extractTableHeaders(actual);
    const baselineTables = extractTableHeaders(baseline);

    for (let t = 0; t < baselineTables.length; t++) {
      assert.ok(
        t < actualTables.length,
        `Missing table ${t + 1} in meta-reflection. Baseline has ${baselineTables.length} tables, actual has ${actualTables.length}`,
      );
      for (const col of baselineTables[t]) {
        assert.ok(
          actualTables[t].includes(col),
          `Meta-reflection table ${t + 1} missing column "${col}". Actual: ${JSON.stringify(actualTables[t])}`,
        );
      }
    }
  });

  it("formatTier1Report: section headers match v1.2 baseline", () => {
    fixtureCounter = 500;
    const l3Name = "Test L3 Opportunity 501";
    const scored = [
      makeV13ScoringResult({ l3Name, composite: 0.90 }),
      makeV13ScoringResult({ composite: 0.50, promotedToSimulation: false }),
    ];
    const tier1Names = new Set([l3Name]);

    const actual = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "tier1-report.md"), "utf-8");

    assertSectionsMatch(actual, baseline, ["Scoring Mode"]);
  });

  it("formatTier1Report: per-opportunity sub-sections present", () => {
    fixtureCounter = 510;
    const l3Name = "Test L3 Opportunity 511";
    const scored = [makeV13ScoringResult({ l3Name, composite: 0.90 })];
    const tier1Names = new Set([l3Name]);

    const actual = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);

    // Each tier1 opportunity must have Technical Feasibility, Adoption Realism,
    // Value & Efficiency, and Assessment sub-sections
    const allSections = extractSections(actual);
    const h3Sections = allSections.filter(s => /^### /.test(s)).map(s => s.replace(/^### /, "").replace(/ \(.*\)$/, ""));
    for (const required of ["Technical Feasibility", "Adoption Realism", "Value & Efficiency", "Assessment"]) {
      assert.ok(
        h3Sections.some(s => s.startsWith(required)),
        `Tier1 report missing sub-section: "${required}". Found: ${JSON.stringify(h3Sections)}`,
      );
    }
  });

  it("formatAdoptionRisk: section headers match v1.2 baseline", () => {
    fixtureCounter = 600;
    const triaged = [
      makeV13TriageResult({
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
        action: "skip",
      }),
      makeV13TriageResult({
        redFlags: [{ type: "CONFIDENCE_GAP", lowConfidencePct: 0.7 }],
        action: "process",
      }),
      makeV13TriageResult(),
    ];

    const actual = formatAdoptionRisk(triaged, FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "adoption-risk.md"), "utf-8");

    assertSectionsMatch(actual, baseline, ["Scoring Mode"]);
  });

  it("formatAdoptionRisk: table columns match v1.2 baseline", () => {
    fixtureCounter = 620;
    const triaged = [
      makeV13TriageResult({
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
        action: "skip",
      }),
    ];

    const actual = formatAdoptionRisk(triaged, FIXED_DATE);
    const baseline = readFileSync(path.join(BASELINE_DIR, "adoption-risk.md"), "utf-8");

    const actualTables = extractTableHeaders(actual);
    const baselineTables = extractTableHeaders(baseline);

    // At least one table should be present in both
    assert.ok(baselineTables.length > 0, "Baseline adoption-risk.md has no tables");
    assert.ok(actualTables.length > 0, "Actual adoption-risk output has no tables");

    // First table columns should match
    for (const col of baselineTables[0]) {
      assert.ok(
        actualTables[0].includes(col),
        `Adoption-risk table missing column "${col}". Actual: ${JSON.stringify(actualTables[0])}`,
      );
    }
  });
});
