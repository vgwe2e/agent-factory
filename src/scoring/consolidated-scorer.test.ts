/**
 * Tests for consolidated scorer (v1.3).
 *
 * Covers: computeTwoPassComposite, scaleTo03, LensScore builders,
 * and scoreConsolidated integration with mock chatFn.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTwoPassComposite,
  scaleTo03,
  DISAGREE_PENALTY,
  PARTIAL_PENALTY,
  PRE_SCORE_WEIGHT,
  LLM_WEIGHT,
  buildTechnicalLensFromLLM,
  buildAdoptionLensFromDeterministic,
  buildValueLensFromDeterministic,
} from "./consolidated-scorer.js";
import { PROMOTION_THRESHOLD } from "../types/scoring.js";
import type { ConsolidatedLensOutput } from "./schemas.js";
import type { PreScoreResult } from "../types/scoring.js";

// -- Helpers --

function makePreScore(overrides: Partial<PreScoreResult> = {}): PreScoreResult {
  return {
    l4Id: "L4-001",
    l4Name: "Test Activity",
    l3Name: "Test Category",
    l2Name: "Test Domain",
    l1Name: "Test Area",
    dimensions: {
      financial_signal: 0.8,
      ai_suitability: 0.6,
      decision_density: 0.7,
      impact_order: 1.0,
      rating_confidence: 0.6,
      archetype_completeness: 0.5,
    },
    composite: 0.7,
    survived: true,
    eliminationReason: null,
    redFlags: [],
    skillCount: 3,
    aggregatedMaxValue: 500000,
    ...overrides,
  };
}

// -- Constants --

describe("constants", () => {
  it("exports correct penalty values", () => {
    assert.equal(DISAGREE_PENALTY, 0.15);
    assert.equal(PARTIAL_PENALTY, 0.075);
  });

  it("exports correct weight values", () => {
    assert.equal(PRE_SCORE_WEIGHT, 0.50);
    assert.equal(LLM_WEIGHT, 0.50);
  });

  it("weights sum to 1.0", () => {
    assert.equal(PRE_SCORE_WEIGHT + LLM_WEIGHT, 1.0);
  });
});

// -- scaleTo03 --

describe("scaleTo03", () => {
  it("maps 0.0 to 0", () => {
    assert.equal(scaleTo03(0.0), 0);
  });

  it("maps 0.24 to 0", () => {
    assert.equal(scaleTo03(0.24), 0);
  });

  it("maps 0.25 to 1", () => {
    assert.equal(scaleTo03(0.25), 1);
  });

  it("maps 0.49 to 1", () => {
    assert.equal(scaleTo03(0.49), 1);
  });

  it("maps 0.50 to 2", () => {
    assert.equal(scaleTo03(0.50), 2);
  });

  it("maps 0.74 to 2", () => {
    assert.equal(scaleTo03(0.74), 2);
  });

  it("maps 0.75 to 3", () => {
    assert.equal(scaleTo03(0.75), 3);
  });

  it("maps 1.0 to 3", () => {
    assert.equal(scaleTo03(1.0), 3);
  });
});

// -- computeTwoPassComposite --

describe("computeTwoPassComposite", () => {
  it("blends 50/50 with AGREE (no penalty)", () => {
    const result = computeTwoPassComposite(0.8, 0.67, "AGREE");
    // 0.8 * 0.5 + 0.67 * 0.5 = 0.4 + 0.335 = 0.735
    assert.ok(Math.abs(result.composite - 0.735) < 0.001);
    assert.equal(result.promotedToSimulation, true);
  });

  it("applies DISAGREE penalty", () => {
    const result = computeTwoPassComposite(0.7, 0.67, "DISAGREE");
    // 0.7 * 0.5 + 0.67 * 0.5 = 0.35 + 0.335 = 0.685 - 0.15 = 0.535
    assert.ok(Math.abs(result.composite - 0.535) < 0.001);
    assert.equal(result.promotedToSimulation, false);
  });

  it("applies PARTIAL penalty", () => {
    const result = computeTwoPassComposite(0.7, 0.67, "PARTIAL");
    // 0.685 - 0.075 = 0.610
    assert.ok(Math.abs(result.composite - 0.610) < 0.001);
    assert.equal(result.promotedToSimulation, true);
  });

  it("clamps to 0 (not negative)", () => {
    const result = computeTwoPassComposite(0.1, 0.0, "DISAGREE");
    // 0.1 * 0.5 + 0.0 * 0.5 = 0.05 - 0.15 = -0.10 -> clamped to 0
    assert.equal(result.composite, 0);
    assert.equal(result.promotedToSimulation, false);
  });

  it("clamps to 1 (not above)", () => {
    const result = computeTwoPassComposite(1.0, 1.0, "AGREE");
    // 1.0 * 0.5 + 1.0 * 0.5 = 1.0, no penalty
    assert.equal(result.composite, 1.0);
    assert.equal(result.promotedToSimulation, true);
  });

  it("gates at PROMOTION_THRESHOLD", () => {
    // Exactly at threshold
    const result = computeTwoPassComposite(0.6, 0.6, "AGREE");
    // 0.6 * 0.5 + 0.6 * 0.5 = 0.6, no penalty
    assert.equal(result.composite, 0.6);
    assert.equal(result.promotedToSimulation, true);

    // Just below threshold
    const result2 = computeTwoPassComposite(0.599, 0.599, "AGREE");
    assert.equal(result2.promotedToSimulation, false);
  });
});

// -- buildTechnicalLensFromLLM --

describe("buildTechnicalLensFromLLM", () => {
  it("builds LensScore with single platform_fit sub-dimension", () => {
    const llmOutput: ConsolidatedLensOutput = {
      platform_fit: { score: 2, reason: "Maps to Cortex Auto Forecast" },
      sanity_verdict: "AGREE",
      sanity_justification: "Scores look reasonable",
      confidence: "HIGH",
    };
    const lens = buildTechnicalLensFromLLM(llmOutput);

    assert.equal(lens.lens, "technical");
    assert.equal(lens.subDimensions.length, 1);
    assert.equal(lens.subDimensions[0].name, "platform_fit");
    assert.equal(lens.subDimensions[0].score, 2);
    assert.equal(lens.subDimensions[0].reason, "Maps to Cortex Auto Forecast");
    assert.equal(lens.total, 2);
    assert.equal(lens.maxPossible, 3);
    assert.ok(Math.abs(lens.normalized - 2 / 3) < 0.001);
    assert.equal(lens.confidence, "HIGH");
  });

  it("maps LLM confidence to LensScore confidence", () => {
    const llmOutput: ConsolidatedLensOutput = {
      platform_fit: { score: 1, reason: "Weak fit" },
      sanity_verdict: "PARTIAL",
      sanity_justification: "Some concerns",
      flagged_dimensions: ["financial_signal"],
      confidence: "LOW",
    };
    const lens = buildTechnicalLensFromLLM(llmOutput);
    assert.equal(lens.confidence, "LOW");
  });
});

// -- buildAdoptionLensFromDeterministic --

describe("buildAdoptionLensFromDeterministic", () => {
  it("builds LensScore with 4 sub-dimensions from deterministic scores", () => {
    const preScore = makePreScore();
    const lens = buildAdoptionLensFromDeterministic(preScore);

    assert.equal(lens.lens, "adoption");
    assert.equal(lens.subDimensions.length, 4);
    assert.equal(lens.maxPossible, 12);
    assert.equal(lens.confidence, "HIGH");

    // Check sub-dimension names
    const names = lens.subDimensions.map(sd => sd.name);
    assert.deepEqual(names, [
      "financial_signal",
      "decision_density",
      "impact_order",
      "rating_confidence",
    ]);

    // Check scores are scaled via scaleTo03
    // financial_signal: 0.8 -> 3, decision_density: 0.7 -> 2, impact_order: 1.0 -> 3, rating_confidence: 0.6 -> 2
    const scores = lens.subDimensions.map(sd => sd.score);
    assert.deepEqual(scores, [3, 2, 3, 2]);

    // Total: 3 + 2 + 3 + 2 = 10
    assert.equal(lens.total, 10);
    assert.ok(Math.abs(lens.normalized - 10 / 12) < 0.001);
  });
});

// -- buildValueLensFromDeterministic --

describe("buildValueLensFromDeterministic", () => {
  it("builds LensScore with 2 sub-dimensions from deterministic scores", () => {
    const preScore = makePreScore();
    const lens = buildValueLensFromDeterministic(preScore);

    assert.equal(lens.lens, "value");
    assert.equal(lens.subDimensions.length, 2);
    assert.equal(lens.maxPossible, 6);
    assert.equal(lens.confidence, "HIGH");

    // Check sub-dimension names
    const names = lens.subDimensions.map(sd => sd.name);
    assert.deepEqual(names, ["value_density", "simulation_viability"]);

    // value_density from financial_signal: 0.8 -> 3
    // simulation_viability from archetype_completeness: 0.5 -> 2
    const scores = lens.subDimensions.map(sd => sd.score);
    assert.deepEqual(scores, [3, 2]);

    // Total: 3 + 2 = 5
    assert.equal(lens.total, 5);
    assert.ok(Math.abs(lens.normalized - 5 / 6) < 0.001);
  });
});
