/**
 * Tests for per-lens algorithmic confidence computation (skill-level).
 *
 * Verifies that confidence is derived from skill data signals, not LLM output.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeSkillTechnicalConfidence,
  computeSkillAdoptionConfidence,
  computeSkillValueConfidence,
  computeOverallConfidence,
} from "./confidence.js";
import type { SkillWithContext, CompanyContext } from "../types/hierarchy.js";

// -- Minimal test factory --

function makeSkill(overrides: Partial<SkillWithContext> = {}): SkillWithContext {
  return {
    id: "skill-001",
    name: "Test Skill",
    description: "Test description",
    archetype: "DETERMINISTIC",
    max_value: 1_000_000,
    slider_percent: null,
    overlap_group: null,
    value_metric: "cost_reduction",
    decision_made: "Reduce lead times",
    aera_skill_pattern: "AutoPilot",
    is_actual: false,
    source: null,
    loe: null,
    savings_type: null,
    actions: [
      { action_type: "alert", action_name: "Notify", description: "Notify team" },
    ],
    constraints: [
      { constraint_type: "threshold", constraint_name: "Min value", description: "Must exceed $100K" },
    ],
    execution: {
      target_systems: ["SAP", "Salesforce"],
      write_back_actions: [],
      execution_trigger: "daily",
      execution_frequency: "daily",
      autonomy_level: "supervised",
      approval_required: true,
      approval_threshold: "$50K",
      rollback_strategy: null,
    },
    problem_statement: {
      current_state: "Manual process",
      quantified_pain: "Costs $2M annually",
      root_cause: "No automation",
      falsifiability_check: "If automated, savings realized",
      outcome: "Reduce cost by 50%",
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
    // Parent L4 context
    l4Name: "Test Activity",
    l4Id: "L4-001",
    l3Name: "Test L3",
    l2Name: "Test L2",
    l1Name: "Test L1",
    financialRating: "MEDIUM",
    aiSuitability: "HIGH",
    impactOrder: "FIRST",
    ratingConfidence: "MEDIUM",
    decisionExists: true,
    decisionArticulation: null,
    ...overrides,
  };
}

function makeCompany(overrides: Partial<CompanyContext> = {}): CompanyContext {
  return {
    industry: "Automotive",
    company_name: "Test Corp",
    annual_revenue: 100_000_000,
    cogs: 50_000_000,
    sga: 20_000_000,
    ebitda: 15_000_000,
    working_capital: 10_000_000,
    inventory_value: 5_000_000,
    annual_hires: 500,
    employee_count: 5000,
    geographic_scope: "Global",
    notes: "",
    business_exclusions: "",
    enterprise_applications: [],
    detected_applications: [],
    pptx_template: null,
    industry_specifics: null,
    raw_context: "",
    enriched_context: {},
    enrichment_applied_at: "",
    existing_systems: [],
    hard_exclusions: [],
    filtered_skills: [],
    ...overrides,
  };
}

// -- Technical Confidence --

describe("computeSkillTechnicalConfidence", () => {
  it("returns HIGH when target_systems present, pattern present, and ai_suitability usable", () => {
    const skill = makeSkill({
      execution: {
        target_systems: ["SAP"],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      aera_skill_pattern: "AutoPilot",
      aiSuitability: "HIGH",
    });
    assert.equal(computeSkillTechnicalConfidence(skill), "HIGH");
  });

  it("returns LOW when aiSuitability is null and no target_systems", () => {
    const skill = makeSkill({
      execution: {
        target_systems: [],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      aiSuitability: null,
    });
    assert.equal(computeSkillTechnicalConfidence(skill), "LOW");
  });

  it("returns LOW when aiSuitability is NOT_APPLICABLE and no target_systems", () => {
    const skill = makeSkill({
      execution: {
        target_systems: [],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      aiSuitability: "NOT_APPLICABLE",
    });
    assert.equal(computeSkillTechnicalConfidence(skill), "LOW");
  });

  it("returns MEDIUM for intermediate cases", () => {
    // Has target_systems but no pattern and null aiSuitability
    const skill = makeSkill({
      execution: {
        target_systems: ["SAP"],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      aera_skill_pattern: null,
      aiSuitability: null,
    });
    assert.equal(computeSkillTechnicalConfidence(skill), "MEDIUM");
  });
});

// -- Adoption Confidence --

describe("computeSkillAdoptionConfidence", () => {
  it("returns HIGH when autonomy, approval, quantified_pain, and decision all present", () => {
    const skill = makeSkill({
      execution: {
        target_systems: [],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: "supervised",
        approval_required: true,
        approval_threshold: null,
        rollback_strategy: null,
      },
      problem_statement: {
        current_state: "Manual",
        quantified_pain: "$2M loss",
        root_cause: "No automation",
        falsifiability_check: "Check",
        outcome: "Save",
      },
      decisionExists: true,
    });
    assert.equal(computeSkillAdoptionConfidence(skill), "HIGH");
  });

  it("returns LOW when no decision_made, no actions, and no constraints", () => {
    const skill = makeSkill({
      decision_made: null,
      actions: [],
      constraints: [],
      execution: {
        target_systems: [],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      problem_statement: {
        current_state: "",
        quantified_pain: "",
        root_cause: "",
        falsifiability_check: "",
        outcome: "",
      },
      decisionExists: false,
    });
    assert.equal(computeSkillAdoptionConfidence(skill), "LOW");
  });

  it("returns MEDIUM for intermediate cases", () => {
    const skill = makeSkill({
      execution: {
        target_systems: [],
        write_back_actions: [],
        execution_trigger: null,
        execution_frequency: null,
        autonomy_level: null,
        approval_required: null,
        approval_threshold: null,
        rollback_strategy: null,
      },
      decision_made: "Some decision",
      actions: [{ action_type: "alert", action_name: "Test", description: "test" }],
    });
    assert.equal(computeSkillAdoptionConfidence(skill), "MEDIUM");
  });
});

// -- Value Confidence --

describe("computeSkillValueConfidence", () => {
  it("returns HIGH when max_value > 0, annual_revenue present, and value_metric present", () => {
    const skill = makeSkill({ max_value: 5_000_000, value_metric: "cost_reduction" });
    const company = makeCompany({ annual_revenue: 100_000_000 });
    assert.equal(computeSkillValueConfidence(skill, company), "HIGH");
  });

  it("returns LOW when max_value is 0", () => {
    const skill = makeSkill({ max_value: 0 });
    const company = makeCompany({ annual_revenue: 100_000_000 });
    assert.equal(computeSkillValueConfidence(skill, company), "LOW");
  });

  it("returns LOW when annual_revenue and cogs are both null", () => {
    const skill = makeSkill({ max_value: 5_000_000 });
    const company = makeCompany({ annual_revenue: null, cogs: null });
    assert.equal(computeSkillValueConfidence(skill, company), "LOW");
  });

  it("returns MEDIUM when max_value present but value_metric null", () => {
    const skill = makeSkill({ max_value: 5_000_000, value_metric: null });
    const company = makeCompany({ annual_revenue: 100_000_000 });
    assert.equal(computeSkillValueConfidence(skill, company), "MEDIUM");
  });
});

// -- Overall Confidence --

describe("computeOverallConfidence", () => {
  it("returns lowest of the three lenses", () => {
    assert.equal(computeOverallConfidence("HIGH", "HIGH", "HIGH"), "HIGH");
    assert.equal(computeOverallConfidence("HIGH", "MEDIUM", "HIGH"), "MEDIUM");
    assert.equal(computeOverallConfidence("HIGH", "HIGH", "LOW"), "LOW");
    assert.equal(computeOverallConfidence("LOW", "HIGH", "HIGH"), "LOW");
    assert.equal(computeOverallConfidence("MEDIUM", "LOW", "MEDIUM"), "LOW");
  });
});
