import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSummary } from "./format-summary.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";

// -- Test fixtures --

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

function makeScoring(overrides: Partial<ScoringResult> = {}): ScoringResult {
  return {
    l3Name: "Test Opportunity",
    l2Name: "L2 Domain",
    l1Name: "L1 Area",
    archetype: "DETERMINISTIC",
    archetypeSource: "export",
    lenses: {
      technical: makeLens("technical", [
        makeSub("data_readiness", 2),
        makeSub("platform_fit", 3),
        makeSub("archetype_confidence", 2),
      ]),
      adoption: makeLens("adoption", [
        makeSub("decision_density", 2),
        makeSub("financial_gravity", 3),
        makeSub("impact_proximity", 2),
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

function makeTriage(overrides: Partial<TriageResult> = {}): TriageResult {
  return {
    l3Name: "Test Opportunity",
    l2Name: "L2 Domain",
    l1Name: "L1 Area",
    tier: 1,
    redFlags: [],
    action: "process",
    combinedMaxValue: 10_000_000,
    quickWin: true,
    leadArchetype: "DETERMINISTIC",
    l4Count: 5,
    ...overrides,
  };
}

function makeSimResults(
  overrides: Partial<SimulationPipelineResult> = {},
): SimulationPipelineResult {
  return {
    results: [],
    totalSimulated: 0,
    totalFailed: 0,
    totalConfirmed: 0,
    totalInferred: 0,
    ...overrides,
  };
}

const FIXED_DATE = "2026-01-15";

describe("formatSummary", () => {
  it("returns markdown heading with company name", () => {
    const md = formatSummary([], [], makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("# Executive Summary: Ford"));
  });

  it("shows generated date", () => {
    const md = formatSummary([], [], makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("2026-01-15"));
  });

  it("shows total evaluated count from scored array", () => {
    const scored = [makeScoring(), makeScoring({ l3Name: "Second" })];
    const triaged = [makeTriage(), makeTriage({ l3Name: "Second" })];
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("2"), "should show total evaluated count");
  });

  it("shows promoted and simulated counts", () => {
    const scored = [
      makeScoring({ promotedToSimulation: true }),
      makeScoring({ l3Name: "NotPromoted", promotedToSimulation: false }),
    ];
    const triaged = [makeTriage(), makeTriage({ l3Name: "NotPromoted" })];
    const simResults = makeSimResults({
      results: [{ l3Name: "Test Opportunity", slug: "test-opportunity", artifacts: {} as any, validationSummary: { confirmedCount: 3, inferredCount: 1, mermaidValid: true } }],
      totalSimulated: 1,
    });
    const md = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE);
    assert.ok(md.includes("1"), "should show promoted count");
  });

  it("produces top 10 table sorted by composite DESC", () => {
    const scored = Array.from({ length: 12 }, (_, i) =>
      makeScoring({ l3Name: `Opp ${i}`, composite: i * 0.08 }),
    );
    const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name }));
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE);
    // Top entry should be highest composite (Opp 11 = 0.88)
    // Extract lines between "Top Opportunities" and "Tier Distribution"
    const allLines = md.split("\n");
    const topStart = allLines.findIndex(l => l.includes("Top Opportunities"));
    const tierStart = allLines.findIndex(l => l.includes("Tier Distribution"));
    const topSection = allLines.slice(topStart, tierStart);
    const dataRows = topSection.filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Rank"));
    assert.equal(dataRows.length, 10);
    assert.ok(dataRows[0].includes("Opp 11"));
  });

  it("handles fewer than 10 scored opportunities", () => {
    const scored = [makeScoring({ l3Name: "Only One" })];
    const triaged = [makeTriage({ l3Name: "Only One" })];
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE);
    const allLines = md.split("\n");
    const topStart = allLines.findIndex(l => l.includes("Top Opportunities"));
    const tierStart = allLines.findIndex(l => l.includes("Tier Distribution"));
    const topSection = allLines.slice(topStart, tierStart);
    const dataRows = topSection.filter(l => l.startsWith("|") && !l.includes("---") && !l.includes("Rank"));
    assert.equal(dataRows.length, 1);
  });

  it("handles empty scored array gracefully", () => {
    const md = formatSummary([], [], makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("No opportunities"));
  });

  it("shows simulated Yes/No based on simulation results", () => {
    const scored = [
      makeScoring({ l3Name: "Simulated One", composite: 0.9 }),
      makeScoring({ l3Name: "Not Simulated", composite: 0.8 }),
    ];
    const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name }));
    const simResults = makeSimResults({
      results: [{ l3Name: "Simulated One", slug: "simulated-one", artifacts: {} as any, validationSummary: { confirmedCount: 3, inferredCount: 1, mermaidValid: true } }],
      totalSimulated: 1,
    });
    const md = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE);
    const lines = md.split("\n");
    const simLine = lines.find(l => l.includes("Simulated One"));
    assert.ok(simLine?.includes("Yes"));
    const notSimLine = lines.find(l => l.includes("Not Simulated"));
    assert.ok(notSimLine?.includes("No"));
  });

  it("includes tier distribution summary", () => {
    const triaged = [
      makeTriage({ l3Name: "T1", tier: 1 }),
      makeTriage({ l3Name: "T2a", tier: 2 }),
      makeTriage({ l3Name: "T2b", tier: 2 }),
      makeTriage({ l3Name: "T3", tier: 3 }),
    ];
    const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name }));
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("Tier Distribution"));
    assert.ok(md.includes("Tier 1"));
    assert.ok(md.includes("Tier 2"));
    assert.ok(md.includes("Tier 3"));
  });

  it("includes archetype breakdown", () => {
    const scored = [
      makeScoring({ l3Name: "Det1", archetype: "DETERMINISTIC" }),
      makeScoring({ l3Name: "Agent1", archetype: "AGENTIC" }),
    ];
    const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name }));
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.includes("Archetype"));
    assert.ok(md.includes("DETERMINISTIC"));
    assert.ok(md.includes("AGENTIC"));
  });

  it("ends with newline", () => {
    const md = formatSummary([], [], makeSimResults(), "Ford", FIXED_DATE);
    assert.ok(md.endsWith("\n"));
  });

  // -- skipSim awareness tests --

  it("shows skip note when simSkipped=true", () => {
    const scored = [makeScoring()];
    const triaged = [makeTriage()];
    const md = formatSummary(scored, triaged, makeSimResults(), "Ford", FIXED_DATE, true);
    assert.ok(md.includes("**Simulation: skipped (--skip-sim)**"), "should show skip note");
    assert.ok(!md.includes("**Simulations Completed:**"), "should NOT show simulations completed line");
  });

  it("shows simulations completed when simSkipped=false", () => {
    const scored = [makeScoring()];
    const triaged = [makeTriage()];
    const simResults = makeSimResults({ totalSimulated: 3 });
    const md = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE, false);
    assert.ok(md.includes("**Simulations Completed:** 3"), "should show simulations completed");
    assert.ok(!md.includes("skipped (--skip-sim)"), "should NOT show skip note");
  });

  it("defaults to showing simulations completed when simSkipped not provided", () => {
    const scored = [makeScoring()];
    const triaged = [makeTriage()];
    const simResults = makeSimResults({ totalSimulated: 2 });
    const md = formatSummary(scored, triaged, simResults, "Ford", FIXED_DATE);
    assert.ok(md.includes("**Simulations Completed:** 2"), "backward compat");
  });
});
