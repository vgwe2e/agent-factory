import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { L4Activity, Skill } from "../../types/hierarchy.js";
import { detectL4RedFlags, applyRedFlagPenalties } from "./red-flags.js";

// -- Factory helpers --

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "sk-1",
    name: "Test Skill",
    description: null,
    archetype: "DETERMINISTIC",
    max_value: 100_000,
    slider_percent: null,
    overlap_group: null,
    value_metric: null,
    decision_made: null,
    aera_skill_pattern: null,
    is_actual: false,
    source: null,
    loe: null,
    savings_type: null,
    actions: [],
    constraints: [],
    execution: null,
    problem_statement: null,
    differentiation: null,
    generated_at: null,
    prompt_version: null,
    is_cross_functional: null,
    cross_functional_scope: null,
    operational_flow: [],
    walkthrough_decision: null,
    walkthrough_actions: [],
    walkthrough_narrative: null,
    ...overrides,
  };
}

function makeL4(overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: "l4-1",
    name: "Test L4",
    description: "Test description",
    l1: "L1",
    l2: "L2",
    l3: "L3",
    financial_rating: "MEDIUM",
    value_metric: "$1M",
    impact_order: "FIRST",
    rating_confidence: "MEDIUM",
    ai_suitability: "MEDIUM",
    decision_exists: false,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
    ...overrides,
  };
}

// -- detectL4RedFlags --

describe("detectL4RedFlags", () => {
  it("detects DEAD_ZONE when no decision and empty skills", () => {
    const l4 = makeL4({ decision_exists: false, skills: [] });
    const flags = detectL4RedFlags(l4);
    assert.equal(flags.length, 1);
    assert.equal(flags[0].type, "DEAD_ZONE");
  });

  it("detects DEAD_ZONE when no decision and skills have 0 actions + 0 constraints", () => {
    const l4 = makeL4({ decision_exists: false, skills: [makeSkill()] });
    const flags = detectL4RedFlags(l4);
    const deadZone = flags.find((f) => f.type === "DEAD_ZONE");
    assert.ok(deadZone, "Expected DEAD_ZONE flag");
  });

  it("does NOT detect DEAD_ZONE when decision_exists is true", () => {
    const l4 = makeL4({ decision_exists: true, skills: [] });
    const flags = detectL4RedFlags(l4);
    const deadZone = flags.find((f) => f.type === "DEAD_ZONE");
    assert.equal(deadZone, undefined);
  });

  it("does NOT detect DEAD_ZONE when skills have actions", () => {
    const skill = makeSkill({
      actions: [{ action_type: "test", action_name: "a1", description: null }],
    });
    const l4 = makeL4({ decision_exists: false, skills: [skill] });
    const flags = detectL4RedFlags(l4);
    const deadZone = flags.find((f) => f.type === "DEAD_ZONE");
    assert.equal(deadZone, undefined);
  });

  it("detects NO_STAKES when LOW financial + SECOND impact", () => {
    const l4 = makeL4({ financial_rating: "LOW", impact_order: "SECOND" });
    const flags = detectL4RedFlags(l4);
    const noStakes = flags.find((f) => f.type === "NO_STAKES");
    assert.ok(noStakes, "Expected NO_STAKES flag");
  });

  it("does NOT detect NO_STAKES when financial is MEDIUM", () => {
    const l4 = makeL4({ financial_rating: "MEDIUM", impact_order: "SECOND" });
    const flags = detectL4RedFlags(l4);
    const noStakes = flags.find((f) => f.type === "NO_STAKES");
    assert.equal(noStakes, undefined);
  });

  it("does NOT detect NO_STAKES when impact is FIRST", () => {
    const l4 = makeL4({ financial_rating: "LOW", impact_order: "FIRST" });
    const flags = detectL4RedFlags(l4);
    const noStakes = flags.find((f) => f.type === "NO_STAKES");
    assert.equal(noStakes, undefined);
  });

  it("detects CONFIDENCE_GAP when rating_confidence is LOW", () => {
    const l4 = makeL4({ rating_confidence: "LOW" });
    const flags = detectL4RedFlags(l4);
    const gap = flags.find((f) => f.type === "CONFIDENCE_GAP");
    assert.ok(gap, "Expected CONFIDENCE_GAP flag");
  });

  it("does NOT detect CONFIDENCE_GAP for MEDIUM confidence", () => {
    const l4 = makeL4({ rating_confidence: "MEDIUM" });
    const flags = detectL4RedFlags(l4);
    const gap = flags.find((f) => f.type === "CONFIDENCE_GAP");
    assert.equal(gap, undefined);
  });

  it("detects multiple flags on same L4", () => {
    const l4 = makeL4({
      decision_exists: false,
      financial_rating: "LOW",
      impact_order: "SECOND",
      rating_confidence: "LOW",
      skills: [],
    });
    const flags = detectL4RedFlags(l4);
    assert.equal(flags.length, 3); // DEAD_ZONE + NO_STAKES + CONFIDENCE_GAP
    const types = flags.map((f) => f.type).sort();
    assert.deepEqual(types, ["CONFIDENCE_GAP", "DEAD_ZONE", "NO_STAKES"]);
  });

  it("returns empty array when no flags", () => {
    const skill = makeSkill({
      actions: [{ action_type: "test", action_name: "a1", description: null }],
    });
    const l4 = makeL4({
      decision_exists: true,
      financial_rating: "HIGH",
      impact_order: "FIRST",
      rating_confidence: "HIGH",
      skills: [skill],
    });
    assert.deepEqual(detectL4RedFlags(l4), []);
  });
});

// -- applyRedFlagPenalties --

describe("applyRedFlagPenalties", () => {
  it("returns unchanged composite when no flags", () => {
    const result = applyRedFlagPenalties(0.85, []);
    assert.equal(result.composite, 0.85);
    assert.equal(result.eliminated, false);
    assert.equal(result.eliminationReason, null);
  });

  it("eliminates for DEAD_ZONE", () => {
    const result = applyRedFlagPenalties(0.8, [{ type: "DEAD_ZONE", decisionDensity: 0 }]);
    assert.equal(result.composite, 0);
    assert.equal(result.eliminated, true);
    assert.equal(result.eliminationReason, "DEAD_ZONE");
  });

  it("eliminates for NO_STAKES", () => {
    const result = applyRedFlagPenalties(0.7, [
      { type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true },
    ]);
    assert.equal(result.composite, 0);
    assert.equal(result.eliminated, true);
    assert.equal(result.eliminationReason, "NO_STAKES");
  });

  it("applies 0.3 penalty for CONFIDENCE_GAP", () => {
    const result = applyRedFlagPenalties(0.8, [{ type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 }]);
    assert.equal(result.composite, 0.24); // 0.8 * 0.3 = 0.24
    assert.equal(result.eliminated, false);
    assert.equal(result.eliminationReason, null);
  });

  it("elimination takes priority over penalty", () => {
    const result = applyRedFlagPenalties(0.8, [
      { type: "DEAD_ZONE", decisionDensity: 0 },
      { type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 },
    ]);
    assert.equal(result.composite, 0);
    assert.equal(result.eliminated, true);
    assert.equal(result.eliminationReason, "DEAD_ZONE");
  });

  it("rounds penalized composite to 4 decimal places", () => {
    const result = applyRedFlagPenalties(0.7777, [{ type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 }]);
    // 0.7777 * 0.3 = 0.23331
    assert.equal(result.composite, 0.2333);
  });
});
