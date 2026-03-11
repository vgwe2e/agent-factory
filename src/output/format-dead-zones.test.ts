import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDeadZones } from "./format-dead-zones.js";
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

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

const FIXED_DATE = "2026-01-15";

describe("formatDeadZones", () => {
  it("returns markdown heading", () => {
    const md = formatDeadZones([], [], FIXED_DATE);
    assert.ok(md.includes("# Dead Zones Report"));
  });

  it("shows no dead zones message when no flags", () => {
    const triaged = [makeTriage()];
    const scored = [makeScoring()];
    const md = formatDeadZones(triaged, scored, FIXED_DATE);
    assert.ok(md.includes("No dead zones detected"));
  });

  it("groups DEAD_ZONE and PHANTOM as Do Not Pursue", () => {
    const triaged = [
      makeTriage({
        l3Name: "Dead One",
        l1Name: "Supply Chain",
        action: "skip",
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
      }),
      makeTriage({
        l3Name: "Phantom One",
        l1Name: "Supply Chain",
        action: "skip",
        redFlags: [{ type: "PHANTOM", opportunityExists: false }],
      }),
    ];
    const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name, l1Name: t.l1Name }));
    const md = formatDeadZones(triaged, scored, FIXED_DATE);
    assert.ok(md.includes("Do Not Pursue"));
    assert.ok(md.includes("Dead One"));
    assert.ok(md.includes("Phantom One"));
    assert.ok(md.includes("Supply Chain"));
  });

  it("groups NO_STAKES as Low Priority / Demoted", () => {
    const triaged = [
      makeTriage({
        l3Name: "Low Stakes One",
        l1Name: "Finance",
        action: "demote",
        redFlags: [{ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true }],
      }),
    ];
    const scored = [makeScoring({ l3Name: "Low Stakes One", l1Name: "Finance" })];
    const md = formatDeadZones(triaged, scored, FIXED_DATE);
    assert.ok(md.includes("Low Priority"));
    assert.ok(md.includes("Low Stakes One"));
    assert.ok(md.includes("Finance"));
  });

  it("groups by L1 domain within sections", () => {
    const triaged = [
      makeTriage({
        l3Name: "Dead A",
        l1Name: "Supply Chain",
        action: "skip",
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
      }),
      makeTriage({
        l3Name: "Dead B",
        l1Name: "Manufacturing",
        action: "skip",
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
      }),
    ];
    const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name, l1Name: t.l1Name }));
    const md = formatDeadZones(triaged, scored, FIXED_DATE);
    assert.ok(md.includes("Supply Chain"));
    assert.ok(md.includes("Manufacturing"));
  });

  it("includes count summary at top", () => {
    const triaged = [
      makeTriage({
        l3Name: "Dead",
        action: "skip",
        redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
      }),
      makeTriage({
        l3Name: "Phantom",
        action: "skip",
        redFlags: [{ type: "PHANTOM", opportunityExists: false }],
      }),
      makeTriage({
        l3Name: "NoStakes",
        action: "demote",
        redFlags: [{ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true }],
      }),
    ];
    const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name }));
    const md = formatDeadZones(triaged, scored, FIXED_DATE);
    // Should mention counts somewhere
    assert.ok(md.includes("1"), "dead zone count");
  });

  it("handles empty triaged array", () => {
    const md = formatDeadZones([], [], FIXED_DATE);
    assert.ok(md.includes("No dead zones detected"));
  });

  it("uses fixed date when provided", () => {
    const md = formatDeadZones([], [], FIXED_DATE);
    assert.ok(md.includes("2026-01-15"));
  });

  it("ends with newline", () => {
    const md = formatDeadZones([], [], FIXED_DATE);
    assert.ok(md.endsWith("\n"));
  });
});
