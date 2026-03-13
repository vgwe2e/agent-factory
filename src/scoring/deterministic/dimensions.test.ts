import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { L4Activity, Skill, SkillExecution, SkillProblemStatement } from "../../types/hierarchy.js";
import {
  scoreFinancialSignal,
  scoreAiSuitability,
  scoreDecisionDensity,
  scoreImpactOrder,
  scoreRatingConfidence,
  scoreArchetypeCompleteness,
  MAX_SIGNALS,
} from "./dimensions.js";

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

// -- scoreFinancialSignal --

describe("scoreFinancialSignal", () => {
  it("returns 1.0 for HIGH", () => {
    assert.equal(scoreFinancialSignal(makeL4({ financial_rating: "HIGH" })), 1.0);
  });

  it("returns 0.5 for MEDIUM", () => {
    assert.equal(scoreFinancialSignal(makeL4({ financial_rating: "MEDIUM" })), 0.5);
  });

  it("returns 0.0 for LOW", () => {
    assert.equal(scoreFinancialSignal(makeL4({ financial_rating: "LOW" })), 0.0);
  });
});

// -- scoreAiSuitability --

describe("scoreAiSuitability", () => {
  it("returns 1.0 for HIGH", () => {
    assert.equal(scoreAiSuitability(makeL4({ ai_suitability: "HIGH" })), 1.0);
  });

  it("returns 0.5 for MEDIUM", () => {
    assert.equal(scoreAiSuitability(makeL4({ ai_suitability: "MEDIUM" })), 0.5);
  });

  it("returns 0.25 for LOW", () => {
    assert.equal(scoreAiSuitability(makeL4({ ai_suitability: "LOW" })), 0.25);
  });

  it("returns 0.0 for NOT_APPLICABLE", () => {
    assert.equal(scoreAiSuitability(makeL4({ ai_suitability: "NOT_APPLICABLE" })), 0.0);
  });

  it("returns 0.0 for null", () => {
    assert.equal(scoreAiSuitability(makeL4({ ai_suitability: null })), 0.0);
  });
});

// -- scoreDecisionDensity --

describe("scoreDecisionDensity", () => {
  it("returns 0.0 with no decision and no skills", () => {
    assert.equal(scoreDecisionDensity(makeL4({ decision_exists: false, skills: [] })), 0.0);
  });

  it("returns 0.5 with decision but no skills", () => {
    assert.equal(scoreDecisionDensity(makeL4({ decision_exists: true, skills: [] })), 0.5);
  });

  it("returns 1.0 with decision and >= MAX_SIGNALS signals", () => {
    const actions = Array.from({ length: 10 }, (_, i) => ({
      action_type: "test",
      action_name: `action-${i}`,
      description: null,
    }));
    const constraints = Array.from({ length: 10 }, (_, i) => ({
      constraint_type: "test",
      constraint_name: `constraint-${i}`,
      description: null,
    }));
    const skill = makeSkill({ actions, constraints });
    const l4 = makeL4({ decision_exists: true, skills: [skill] });
    assert.equal(scoreDecisionDensity(l4), 1.0);
  });

  it("returns correct score with partial signals", () => {
    const actions = Array.from({ length: 4 }, (_, i) => ({
      action_type: "test",
      action_name: `action-${i}`,
      description: null,
    }));
    const skill = makeSkill({ actions, constraints: [] });
    // decision_exists=false: 0 base. 4 signals / 20 = 0.2 * 0.5 = 0.1
    const l4 = makeL4({ decision_exists: false, skills: [skill] });
    assert.equal(scoreDecisionDensity(l4), 0.1);
  });

  it("caps signal richness at 1.0 before multiplying", () => {
    const actions = Array.from({ length: 30 }, (_, i) => ({
      action_type: "test",
      action_name: `action-${i}`,
      description: null,
    }));
    const skill = makeSkill({ actions });
    // decision_exists=true: 0.5 base. 30/20=1.5, capped to 1.0 * 0.5 = 0.5. Total: 1.0
    const l4 = makeL4({ decision_exists: true, skills: [skill] });
    assert.equal(scoreDecisionDensity(l4), 1.0);
  });
});

// -- scoreImpactOrder --

describe("scoreImpactOrder", () => {
  it("returns 1.0 for FIRST", () => {
    assert.equal(scoreImpactOrder(makeL4({ impact_order: "FIRST" })), 1.0);
  });

  it("returns 0.25 for SECOND", () => {
    assert.equal(scoreImpactOrder(makeL4({ impact_order: "SECOND" })), 0.25);
  });
});

// -- scoreRatingConfidence --

describe("scoreRatingConfidence", () => {
  it("returns 1.0 for HIGH", () => {
    assert.equal(scoreRatingConfidence(makeL4({ rating_confidence: "HIGH" })), 1.0);
  });

  it("returns 0.6 for MEDIUM", () => {
    assert.equal(scoreRatingConfidence(makeL4({ rating_confidence: "MEDIUM" })), 0.6);
  });

  it("returns 0.2 for LOW", () => {
    assert.equal(scoreRatingConfidence(makeL4({ rating_confidence: "LOW" })), 0.2);
  });
});

// -- scoreArchetypeCompleteness --

describe("scoreArchetypeCompleteness", () => {
  it("returns 0.0 for empty skills", () => {
    assert.equal(scoreArchetypeCompleteness(makeL4({ skills: [] })), 0.0);
  });

  it("returns 0.0 for skill with null execution and null problem_statement and null aera_skill_pattern", () => {
    const skill = makeSkill({ execution: null, problem_statement: null, aera_skill_pattern: null });
    // 7 fields per skill, null execution = 5 unpopulated (target_systems, trigger, frequency, autonomy, approval)
    // null problem_statement = quantified_pain counts as unpopulated = 1
    // null aera_skill_pattern = 1
    // total = 0/7 = 0.0
    assert.equal(scoreArchetypeCompleteness(makeL4({ skills: [skill] })), 0.0);
  });

  it("returns 1.0 for fully populated skill", () => {
    const execution: SkillExecution = {
      target_systems: ["SAP"],
      write_back_actions: [],
      execution_trigger: "daily",
      execution_frequency: "daily",
      autonomy_level: "full",
      approval_required: true,
      approval_threshold: "$10k",
      rollback_strategy: null,
    };
    const problem_statement: SkillProblemStatement = {
      current_state: "bad",
      quantified_pain: "$1M/year waste",
      root_cause: "manual process",
      falsifiability_check: "check",
      outcome: "automate",
    };
    const skill = makeSkill({
      execution,
      problem_statement,
      aera_skill_pattern: "pattern-1",
    });
    // 7 fields: target_systems.length>0 (1), trigger (1), frequency (1), autonomy (1), approval (1), quantified_pain (1), aera_skill_pattern (1) = 7/7 = 1.0
    assert.equal(scoreArchetypeCompleteness(makeL4({ skills: [skill] })), 1.0);
  });

  it("averages across multiple skills", () => {
    const fullExec: SkillExecution = {
      target_systems: ["SAP"],
      write_back_actions: [],
      execution_trigger: "daily",
      execution_frequency: "daily",
      autonomy_level: "full",
      approval_required: true,
      approval_threshold: null,
      rollback_strategy: null,
    };
    const fullPs: SkillProblemStatement = {
      current_state: "bad",
      quantified_pain: "$1M",
      root_cause: "manual",
      falsifiability_check: "check",
      outcome: "automate",
    };
    const fullSkill = makeSkill({ execution: fullExec, problem_statement: fullPs, aera_skill_pattern: "p1" });
    const emptySkill = makeSkill({ execution: null, problem_statement: null, aera_skill_pattern: null });
    // fullSkill = 7/7 = 1.0, emptySkill = 0/7 = 0.0, average = 0.5
    assert.equal(scoreArchetypeCompleteness(makeL4({ skills: [fullSkill, emptySkill] })), 0.5);
  });
});
