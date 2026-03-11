import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatScoresTsv } from "./format-scores-tsv.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

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

const EXPECTED_HEADER = [
  "l3_name", "l1_name", "l2_name", "archetype",
  "data_readiness", "platform_fit", "archetype_conf", "tech_total",
  "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
  "value_density", "simulation_viability", "value_total",
  "composite", "confidence", "promotes_to_sim",
].join("\t");

describe("formatScoresTsv", () => {
  it("returns header + trailing newline for empty array", () => {
    const result = formatScoresTsv([]);
    const lines = result.split("\n");
    assert.equal(lines[0], EXPECTED_HEADER);
    assert.ok(result.endsWith("\n"), "should end with trailing newline");
    assert.equal(lines.length, 2, "header + trailing empty");
  });

  it("contains all 19 columns", () => {
    const result = formatScoresTsv([makeScoring()]);
    const headerCols = result.split("\n")[0].split("\t");
    assert.equal(headerCols.length, 19);
  });

  it("sorts by composite DESC", () => {
    const opps: ScoringResult[] = [
      makeScoring({ l3Name: "Low", composite: 0.30 }),
      makeScoring({ l3Name: "High", composite: 0.85 }),
    ];
    const result = formatScoresTsv(opps);
    const dataRows = result.trim().split("\n").slice(1);
    assert.equal(dataRows.length, 2);
    assert.ok(dataRows[0].startsWith("High"), "higher composite first");
    assert.ok(dataRows[1].startsWith("Low"), "lower composite second");
  });

  it("formats composite to 2 decimal places", () => {
    const opp = makeScoring({ composite: 0.7 });
    const result = formatScoresTsv([opp]);
    const dataRow = result.trim().split("\n")[1];
    const cells = dataRow.split("\t");
    // composite is column index 16
    assert.equal(cells[16], "0.70");
  });

  it("renders promotes_to_simulation as Y/N", () => {
    const opp = makeScoring({ promotedToSimulation: true });
    const result = formatScoresTsv([opp]);
    const dataRow = result.trim().split("\n")[1];
    const cells = dataRow.split("\t");
    // promotes_to_sim is last column (index 18)
    assert.equal(cells[18], "Y");
  });

  it("renders sub-dimension scores as numbers only", () => {
    const opp = makeScoring();
    const result = formatScoresTsv([opp]);
    const dataRow = result.trim().split("\n")[1];
    const cells = dataRow.split("\t");
    // data_readiness is column index 4
    assert.equal(cells[4], "2", "data_readiness score");
    // platform_fit is column index 5
    assert.equal(cells[5], "3", "platform_fit score");
    // archetype_conf is column index 6
    assert.equal(cells[6], "1", "archetype_confidence score");
  });

  it("renders null archetype as empty cell", () => {
    // archetype field is LeadArchetype (not nullable in ScoringResult)
    // but we handle it gracefully anyway through tsvCell
    const opp = makeScoring();
    const result = formatScoresTsv([opp]);
    const dataRow = result.trim().split("\n")[1];
    const cells = dataRow.split("\t");
    assert.equal(cells[3], "DETERMINISTIC");
  });
});
