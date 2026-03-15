import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { formatImplementationShortlistTsv } from "./format-implementation-shortlist-tsv.js";
import type { ScoringResult, LensScore, SubDimensionScore } from "../types/scoring.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";

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
    l3Name: "Test Opp",
    l2Name: "L2",
    l1Name: "L1",
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Test L4",
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
        l3Name: "Advance Opp",
        slug: "advance-opp",
        artifacts: {} as any,
        assessment: {
          verdict: "ADVANCE",
          groundednessScore: 80,
          integrationConfidenceScore: 90,
          ambiguityRiskScore: 15,
          implementationReadinessScore: 88,
          reasons: ["Ready"],
        },
        validationSummary: {
          confirmedCount: 4,
          inferredCount: 1,
          mermaidValid: true,
        },
      },
      {
        l3Name: "Review Opp",
        slug: "review-opp",
        artifacts: {} as any,
        assessment: {
          verdict: "REVIEW",
          groundednessScore: 55,
          integrationConfidenceScore: 45,
          ambiguityRiskScore: 50,
          implementationReadinessScore: 60,
          reasons: ["Needs review"],
        },
        validationSummary: {
          confirmedCount: 2,
          inferredCount: 2,
          mermaidValid: true,
        },
      },
    ],
    totalSimulated: 2,
    totalFailed: 0,
    totalConfirmed: 6,
    totalInferred: 3,
  };
}

describe("formatImplementationShortlistTsv", () => {
  it("renders only ADVANCE rows for the default shortlist", () => {
    const tsv = formatImplementationShortlistTsv(
      [
        makeScoring({ l3Name: "Advance Opp", composite: 0.9 }),
        makeScoring({ l3Name: "Review Opp", composite: 0.7 }),
      ],
      makeSimResults(),
      ["ADVANCE"],
    );

    const lines = tsv.trim().split("\n");
    assert.equal(lines.length, 2);
    assert.ok(lines[1].startsWith("Advance Opp\t"));
    assert.ok(!tsv.includes("Review Opp"));
  });

  it("renders review and hold rows for manual review queues", () => {
    const tsv = formatImplementationShortlistTsv(
      [
        makeScoring({ l3Name: "Advance Opp", composite: 0.9 }),
        makeScoring({ l3Name: "Review Opp", composite: 0.7 }),
      ],
      makeSimResults(),
      ["REVIEW", "HOLD"],
    );

    assert.ok(tsv.includes("Review Opp"));
    assert.ok(!tsv.includes("Advance Opp\tADVANCE"));
  });

  it("matches two-pass simulation rows by scored l4Name", () => {
    const tsv = formatImplementationShortlistTsv(
      [
        makeScoring({
          l3Name: "Parent Opp",
          l4Name: "Two-Pass Subject",
          composite: 0.91,
        }),
      ],
      {
        results: [
          {
            l3Name: "Two-Pass Subject",
            slug: "two-pass-subject",
            artifacts: {} as any,
            assessment: {
              verdict: "ADVANCE",
              groundednessScore: 82,
              integrationConfidenceScore: 78,
              ambiguityRiskScore: 21,
              implementationReadinessScore: 80,
              reasons: ["Ready"],
            },
            validationSummary: {
              confirmedCount: 4,
              inferredCount: 1,
              mermaidValid: true,
            },
          },
        ],
        totalSimulated: 1,
        totalFailed: 0,
        totalConfirmed: 4,
        totalInferred: 1,
      },
      ["ADVANCE"],
    );

    assert.ok(tsv.includes("Two-Pass Subject"));
    assert.ok(tsv.includes("0.91"));
  });

  it("uses skill_name and l4_name headers in two-pass mode", () => {
    const tsv = formatImplementationShortlistTsv(
      [makeScoring({ skillId: "cf-test", l1Name: "Cross-Functional", l4Name: "Advance Opp", l3Name: "Parent Opp" })],
      makeSimResults(),
      ["ADVANCE"],
      "two-pass",
    );

    const [header, row] = tsv.trim().split("\n");
    assert.deepEqual(header.split("\t").slice(0, 3), ["skill_id", "skill_name", "l4_name"]);
    assert.equal(row.split("\t").at(-1), "Y");
  });
});
