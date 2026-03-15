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
  scoreConsolidated,
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
import type { ChatResult } from "./ollama-client.js";
import type { SkillWithContext } from "../types/hierarchy.js";

// -- Helpers --

function makeSkill(overrides: Partial<SkillWithContext> = {}): SkillWithContext {
  return {
    id: "SK-001",
    name: "Test Skill",
    description: "A test skill for scoring",
    archetype: "DETERMINISTIC",
    max_value: 100000,
    slider_percent: null,
    overlap_group: null,
    value_metric: null,
    decision_made: null,
    aera_skill_pattern: "Forecast",
    is_actual: false,
    source: null,
    loe: "MEDIUM",
    savings_type: null,
    actions: [],
    constraints: [],
    execution: {
      target_systems: ["SAP"],
      write_back_actions: [],
      execution_trigger: "Daily",
      execution_frequency: "Daily",
      autonomy_level: "SUPERVISED",
      approval_required: false,
      approval_threshold: null,
      rollback_strategy: null,
    },
    problem_statement: {
      current_state: "Manual process",
      quantified_pain: "$500K",
      root_cause: "Lack of automation",
      falsifiability_check: "Measurable",
      outcome: "Automated workflow",
    },
    differentiation: null,
    generated_at: null,
    prompt_version: null,
    is_cross_functional: null,
    cross_functional_scope: null,
    operational_flow: [],
    walkthrough_decision: null,
    walkthrough_actions: [],
    walkthrough_narrative: null,
    l4Name: "Test Activity",
    l4Id: "L4-001",
    l3Name: "Test Category",
    l2Name: "Test Domain",
    l1Name: "Test Area",
    financialRating: "HIGH",
    aiSuitability: "HIGH",
    impactOrder: "FIRST",
    ratingConfidence: "HIGH",
    decisionExists: true,
    decisionArticulation: "Test decision",
    ...overrides,
  } as SkillWithContext;
}

function makeMockChatFn(response: ConsolidatedLensOutput): (messages: Array<{ role: string; content: string }>, format: Record<string, unknown>) => Promise<ChatResult> {
  return async () => ({
    success: true as const,
    content: JSON.stringify(response),
    durationMs: 100,
  });
}

const VALID_LLM_RESPONSE: ConsolidatedLensOutput = {
  platform_fit: { score: 2, reason: "Maps to Cortex Auto Forecast and STREAMS" },
  sanity_verdict: "AGREE",
  sanity_justification: "All dimension scores are reasonable given the skill data",
  flagged_dimensions: [],
  confidence: "HIGH",
};

const DISAGREE_LLM_RESPONSE: ConsolidatedLensOutput = {
  platform_fit: { score: 1, reason: "Weak fit to Aera components" },
  sanity_verdict: "DISAGREE",
  sanity_justification: "financial_signal and archetype_completeness are overweighted",
  flagged_dimensions: ["financial_signal", "archetype_completeness"],
  confidence: "MEDIUM",
};

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
      flagged_dimensions: [],
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

// -- scoreConsolidated --

describe("scoreConsolidated", () => {
  it("returns correct lenses and composite with AGREE verdict", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    // Technical lens from LLM: platform_fit score 2, maxPossible 3
    assert.equal(result.lenses.technical.subDimensions.length, 1);
    assert.equal(result.lenses.technical.subDimensions[0].name, "platform_fit");
    assert.equal(result.lenses.technical.subDimensions[0].score, 2);
    assert.equal(result.lenses.technical.maxPossible, 3);

    // Adoption lens from deterministic: 4 sub-dims, maxPossible 12
    assert.equal(result.lenses.adoption.subDimensions.length, 4);
    assert.equal(result.lenses.adoption.maxPossible, 12);

    // Value lens from deterministic: 2 sub-dims, maxPossible 6
    assert.equal(result.lenses.value.subDimensions.length, 2);
    assert.equal(result.lenses.value.maxPossible, 6);

    // Composite: preScore 0.7 * 0.5 + (2/3) * 0.5 = 0.35 + 0.333 = 0.683, AGREE no penalty
    assert.ok(result.composite > 0.60);
    assert.equal(result.promotedToSimulation, true);
  });

  it("applies DISAGREE penalty correctly", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(DISAGREE_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    // Composite: preScore 0.7 * 0.5 + (1/3) * 0.5 = 0.35 + 0.167 = 0.517 - 0.15 = 0.367
    assert.ok(result.composite < 0.60);
    assert.equal(result.promotedToSimulation, false);
    assert.equal(result.sanityVerdict, "DISAGREE");
  });

  it("records scoringDurationMs > 0", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.ok(result.scoringDurationMs >= 0);
  });

  it("returns error when chatFn always fails", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const failChatFn = async () => ({
      success: false as const,
      error: "LLM unavailable",
    });

    const result = await scoreConsolidated(skill, "test knowledge", preScore, failChatFn);

    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.includes("Failed after"));
  });

  it("populates sanityVerdict, sanityJustification, and preScore fields", async () => {
    const skill = makeSkill();
    const preScore = makePreScore({ composite: 0.85 });
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.sanityVerdict, "AGREE");
    assert.equal(result.sanityJustification, "All dimension scores are reasonable given the skill data");
    assert.equal(result.preScore, 0.85);
  });

  it("technical LensScore has exactly 1 sub-dimension with maxPossible=3", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.lenses.technical.subDimensions.length, 1);
    assert.equal(result.lenses.technical.maxPossible, 3);
    assert.equal(result.lenses.technical.lens, "technical");
  });

  it("adoption LensScore has exactly 4 sub-dimensions with maxPossible=12", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.lenses.adoption.subDimensions.length, 4);
    assert.equal(result.lenses.adoption.maxPossible, 12);
    assert.equal(result.lenses.adoption.lens, "adoption");
  });

  it("value LensScore has exactly 2 sub-dimensions with maxPossible=6", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(VALID_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.lenses.value.subDimensions.length, 2);
    assert.equal(result.lenses.value.maxPossible, 6);
    assert.equal(result.lenses.value.lens, "value");
  });

  it("overallConfidence comes from LLM output", async () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const chatFn = makeMockChatFn(DISAGREE_LLM_RESPONSE);

    const result = await scoreConsolidated(skill, "test knowledge", preScore, chatFn);

    assert.equal(result.success, true);
    if (!result.success) return;

    assert.equal(result.overallConfidence, "MEDIUM");
  });
});
