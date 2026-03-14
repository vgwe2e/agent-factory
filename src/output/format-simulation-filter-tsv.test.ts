import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { formatSimulationFilterTsv } from "./format-simulation-filter-tsv.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";

function makeSub(name: string, score: number): SubDimensionScore {
  return { name, score, reason: `Reason for ${name}` };
}

function makeLens(
  lens: "technical" | "adoption" | "value",
  subs: SubDimensionScore[],
): LensScore {
  const total = subs.reduce((sum, sub) => sum + sub.score, 0);
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
    l3Name: "Parent L3",
    l2Name: "L2",
    l1Name: "L1",
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Advance Opp",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: makeLens("technical", [makeSub("data_readiness", 2), makeSub("platform_fit", 2), makeSub("archetype_confidence", 2)]),
      adoption: makeLens("adoption", [makeSub("decision_density", 2), makeSub("financial_gravity", 2), makeSub("impact_proximity", 2), makeSub("confidence_signal", 2)]),
      value: makeLens("value", [makeSub("value_density", 2), makeSub("simulation_viability", 2)]),
    },
    composite: 0.8,
    overallConfidence: "HIGH",
    promotedToSimulation: true,
    scoringDurationMs: 100,
    ...overrides,
  };
}

function makeSimResults(): SimulationPipelineResult {
  return {
    results: [
      {
        l3Name: "Hold Opp",
        slug: "hold-opp",
        artifacts: {} as any,
        assessment: {
          verdict: "HOLD",
          groundednessScore: 10,
          integrationConfidenceScore: 20,
          ambiguityRiskScore: 90,
          implementationReadinessScore: 15,
          reasons: ["Needs work"],
        },
        validationSummary: {
          confirmedCount: 0,
          inferredCount: 3,
          mermaidValid: false,
        },
      },
      {
        l3Name: "Advance Opp",
        slug: "advance-opp",
        artifacts: {} as any,
        assessment: {
          verdict: "ADVANCE",
          groundednessScore: 85,
          integrationConfidenceScore: 80,
          ambiguityRiskScore: 10,
          implementationReadinessScore: 82,
          reasons: ["Ready"],
        },
        validationSummary: {
          confirmedCount: 5,
          inferredCount: 1,
          mermaidValid: true,
        },
      },
    ],
    totalSimulated: 2,
    totalFailed: 0,
    totalConfirmed: 5,
    totalInferred: 4,
  };
}

describe("formatSimulationFilterTsv", () => {
  it("renders a header and one row per assessed simulation", () => {
    const tsv = formatSimulationFilterTsv([], makeSimResults());
    const lines = tsv.trim().split("\n");
    assert.equal(lines.length, 3);
    assert.ok(lines[0].includes("implementation_readiness_score"));
  });

  it("sorts ADVANCE before HOLD", () => {
    const tsv = formatSimulationFilterTsv([], makeSimResults());
    const lines = tsv.trim().split("\n");
    assert.ok(lines[1].startsWith("Advance Opp\tADVANCE"));
    assert.ok(lines[2].startsWith("Hold Opp\tHOLD"));
  });

  it("uses skill_name and l4_name headers in two-pass mode", () => {
    const tsv = formatSimulationFilterTsv(
      [makeScoring({ l4Name: "Advance Opp", skillName: "Forward Opportunity Name" })],
      makeSimResults(),
      "two-pass",
    );
    const [header] = tsv.trim().split("\n");
    assert.deepEqual(header.split("\t").slice(0, 3), ["skill_id", "skill_name", "l4_name"]);
    assert.ok(tsv.includes("Forward Opportunity Name\tAdvance Opp"));
  });
});
