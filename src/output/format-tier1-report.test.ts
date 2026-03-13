import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTier1Report } from "./format-tier1-report.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

function makeSub(name: string, score: number, reason?: string): SubDimensionScore {
  return { name, score, reason: reason ?? `Reason for ${name}` };
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
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Test L4",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: makeLens("technical", [
        makeSub("data_readiness", 2, "Good data availability across systems"),
        makeSub("aera_platform_fit", 3, "Strong alignment with Aera platform capabilities"),
        makeSub("archetype_confidence", 2, "Clear deterministic pattern identified"),
      ]),
      adoption: makeLens("adoption", [
        makeSub("decision_density", 2, "Moderate decision points across activities"),
        makeSub("financial_gravity", 3, "High financial impact with direct cost savings"),
        makeSub("impact_proximity", 2, "Second-order impacts measurable within 6 months"),
        makeSub("confidence_signal", 2, "Medium confidence signals from L4 data"),
      ]),
      value: makeLens("value", [
        makeSub("value_density", 2, "Solid value concentration across activities"),
        makeSub("simulation_viability", 3, "Strong candidate for simulation modeling"),
      ]),
    },
    composite: 0.72,
    overallConfidence: "HIGH",
    promotedToSimulation: true,
    scoringDurationMs: 150,
    ...overrides,
  };
}

const FIXED_DATE = "2026-03-11";

describe("formatTier1Report", () => {
  it("produces header with 0 count for empty inputs", () => {
    const result = formatTier1Report([], new Set(), "Ford", FIXED_DATE);
    assert.ok(result.includes("# Tier 1 Deep Analysis: Ford"));
    assert.ok(result.includes("Generated:**"));
    assert.ok(result.includes("Opportunities in Tier 1:** 0"));
  });

  it("filters to only tier 1 opportunities by l3Name set", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "Tier1 Opp", composite: 0.85 }),
      makeScoring({ l3Name: "Not Tier1", composite: 0.50 }),
    ];
    const tier1Names = new Set(["Tier1 Opp"]);
    const result = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);
    assert.ok(result.includes("Tier1 Opp"), "Should include tier 1 opp");
    assert.ok(!result.includes("Not Tier1"), "Should exclude non-tier1 opp");
    assert.ok(result.includes("Opportunities in Tier 1:** 1"));
  });

  it("sorts opportunities by composite DESC", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "Low Score", composite: 0.60 }),
      makeScoring({ l3Name: "High Score", composite: 0.90 }),
      makeScoring({ l3Name: "Mid Score", composite: 0.75 }),
    ];
    const tier1Names = new Set(["Low Score", "High Score", "Mid Score"]);
    const result = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);
    const highIdx = result.indexOf("High Score");
    const midIdx = result.indexOf("Mid Score");
    const lowIdx = result.indexOf("Low Score");
    assert.ok(highIdx < midIdx, "High score should come before mid");
    assert.ok(midIdx < lowIdx, "Mid score should come before low");
  });

  it("includes numbered ## sections for each opportunity", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "First Opp", skillName: "First Opp", composite: 0.90 }),
      makeScoring({ l3Name: "Second Opp", skillName: "Second Opp", composite: 0.70 }),
    ];
    const tier1Names = new Set(["First Opp", "Second Opp"]);
    const result = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);
    assert.ok(result.includes("## 1. First Opp"));
    assert.ok(result.includes("## 2. Second Opp"));
  });

  it("shows domain path l1 > l2 > l3", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "Opp A", l1Name: "Finance", l2Name: "AP" }),
    ];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    assert.ok(result.includes("Finance > AP > Opp A"));
  });

  it("shows archetype and composite score", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "Opp A", archetype: "AGENTIC", composite: 0.85 }),
    ];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    assert.ok(result.includes("AGENTIC"));
    assert.ok(result.includes("0.85"));
  });

  it("shows Technical Feasibility with total and 3 sub-dimensions", () => {
    const scored: ScoringResult[] = [makeScoring({ l3Name: "Opp A" })];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    // Technical total is 2+3+2 = 7
    assert.ok(result.includes("### Technical Feasibility (7/9)"));
    assert.ok(result.includes("Data Readiness"));
    assert.ok(result.includes("Platform Fit"));
    assert.ok(result.includes("Archetype Confidence"));
    // Reason strings must appear as narrative
    assert.ok(result.includes("Good data availability across systems"));
    assert.ok(result.includes("Strong alignment with Aera platform capabilities"));
  });

  it("shows Adoption Realism with total and 4 sub-dimensions", () => {
    const scored: ScoringResult[] = [makeScoring({ l3Name: "Opp A" })];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    // Adoption total is 2+3+2+2 = 9
    assert.ok(result.includes("### Adoption Realism (9/12)"));
    assert.ok(result.includes("Decision Density"));
    assert.ok(result.includes("Financial Gravity"));
    assert.ok(result.includes("Impact Proximity"));
    assert.ok(result.includes("Confidence Signal"));
    assert.ok(result.includes("High financial impact with direct cost savings"));
  });

  it("shows Value & Efficiency with total and 2 sub-dimensions", () => {
    const scored: ScoringResult[] = [makeScoring({ l3Name: "Opp A" })];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    // Value total is 2+3 = 5
    assert.ok(result.includes("### Value & Efficiency (5/6)"));
    assert.ok(result.includes("Value Density"));
    assert.ok(result.includes("Simulation Viability"));
    assert.ok(result.includes("Strong candidate for simulation modeling"));
  });

  it("includes Assessment section with synthesis", () => {
    const scored: ScoringResult[] = [
      makeScoring({
        l3Name: "Opp A",
        composite: 0.85,
        overallConfidence: "HIGH",
        promotedToSimulation: true,
      }),
    ];
    const result = formatTier1Report(scored, new Set(["Opp A"]), "Ford", FIXED_DATE);
    assert.ok(result.includes("### Assessment"), "Should have Assessment section");
    // Should mention simulation promotion
    assert.ok(
      result.includes("simulation") || result.includes("Simulation"),
      "Assessment should mention simulation",
    );
  });

  it("separates opportunities with horizontal rules", () => {
    const scored: ScoringResult[] = [
      makeScoring({ l3Name: "First", composite: 0.90 }),
      makeScoring({ l3Name: "Second", composite: 0.70 }),
    ];
    const tier1Names = new Set(["First", "Second"]);
    const result = formatTier1Report(scored, tier1Names, "Ford", FIXED_DATE);
    assert.ok(result.includes("---"), "Should have horizontal rule separator");
  });

  it("ends with trailing newline", () => {
    const result = formatTier1Report([], new Set(), "Ford", FIXED_DATE);
    assert.ok(result.endsWith("\n"), "should end with trailing newline");
  });

  it("includes tier criteria description", () => {
    const result = formatTier1Report([], new Set(), "Ford", FIXED_DATE);
    assert.ok(
      result.includes("quick_win") && result.includes("$5M"),
      "Should include tier 1 criteria",
    );
  });
});
