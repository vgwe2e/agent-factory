/**
 * Tests for the skill-level triage pipeline.
 *
 * The triage pipeline now extracts skills from L4 activities and triages each
 * skill individually. L4 activities without skills are skipped entirely.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { triageOpportunities } from "./triage-pipeline.js";
import type {
  L3Opportunity,
  L4Activity,
  Skill,
  HierarchyExport,
  Meta,
  CompanyContext,
} from "../types/hierarchy.js";

// -- Minimal Fixtures --

const baseMeta: Meta = {
  project_name: "Test",
  version_date: "2026-01-01",
  created_date: "2026-01-01",
  exported_by: null,
  description: "test",
};

const baseContext: CompanyContext = {
  industry: "Test",
  company_name: "TestCo",
  annual_revenue: null,
  cogs: null,
  sga: null,
  ebitda: null,
  working_capital: null,
  inventory_value: null,
  annual_hires: null,
  employee_count: null,
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
};

function makeSkill(overrides: Partial<Skill> = {}): Skill {
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
      target_systems: ["SAP"],
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

function makeL3(overrides: Partial<L3Opportunity> = {}): L3Opportunity {
  return {
    l3_name: "Default L3",
    l2_name: "Default L2",
    l1_name: "Default L1",
    opportunity_exists: true,
    opportunity_name: "Opp",
    opportunity_summary: "Summary",
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 1_000_000,
    implementation_complexity: "MEDIUM",
    quick_win: false,
    competitive_positioning: null,
    aera_differentiators: [],
    l4_count: 3,
    high_value_l4_count: 1,
    rationale: "test",
    ...overrides,
  };
}

function makeL4(l3Name: string, overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: `L4-${l3Name}-001`,
    name: "Activity",
    description: "desc",
    l1: "Default L1",
    l2: "Default L2",
    l3: l3Name,
    financial_rating: "MEDIUM",
    value_metric: "metric",
    impact_order: "FIRST",
    rating_confidence: "MEDIUM",
    ai_suitability: "MEDIUM",
    decision_exists: true,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
    ...overrides,
  };
}

function makeExport(
  l3s: L3Opportunity[],
  l4s: L4Activity[],
): HierarchyExport {
  return {
    meta: baseMeta,
    company_context: baseContext,
    hierarchy: l4s,
    l3_opportunities: l3s,
  };
}

// -- Tests --

describe("triageOpportunities", () => {
  it("is a pure function returning TriageResult[]", () => {
    const skill1 = makeSkill({ id: "s1", name: "Skill A" });
    const l4 = makeL4("L3-A", { id: "L4-A1", skills: [skill1] });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 1);
  });

  it("skips L4 activities with no skills", () => {
    const l4NoSkills = makeL4("L3-A", { id: "L4-empty", skills: [] });
    const l4WithSkill = makeL4("L3-A", { id: "L4-skill", skills: [makeSkill({ id: "s1" })] });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4NoSkills, l4WithSkill]);
    const result = triageOpportunities(data);
    assert.equal(result.length, 1);
    assert.equal(result[0].skillId, "s1");
  });

  it("assigns Tier 1 to high-value skills with HIGH financial and FIRST impact", () => {
    const skill = makeSkill({
      id: "s-tier1",
      max_value: 10_000_000,
    });
    const l4 = makeL4("L3-A", {
      id: "L4-1",
      financial_rating: "HIGH",
      impact_order: "FIRST",
      ai_suitability: "HIGH",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    assert.equal(result[0].tier, 1);
  });

  it("assigns Tier 2 to skills with HIGH ai_suitability", () => {
    const skill = makeSkill({
      id: "s-tier2",
      max_value: 1_000_000,
    });
    const l4 = makeL4("L3-A", {
      id: "L4-2",
      financial_rating: "MEDIUM",
      impact_order: "FIRST",
      ai_suitability: "HIGH",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    assert.equal(result[0].tier, 2);
  });

  it("assigns Tier 3 to default skills", () => {
    const skill = makeSkill({
      id: "s-tier3",
      max_value: 100_000,
    });
    const l4 = makeL4("L3-A", {
      id: "L4-3",
      financial_rating: "LOW",
      impact_order: "SECOND",
      ai_suitability: "MEDIUM",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    assert.equal(result[0].tier, 3);
  });

  it("demotes NO_STAKES skills to Tier 3 with action=demote", () => {
    const skill = makeSkill({
      id: "s-nostakes",
      max_value: 2_000_000,
    });
    const l4 = makeL4("L3-A", {
      id: "L4-ns",
      financial_rating: "LOW",
      impact_order: "SECOND",
      ai_suitability: "HIGH",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    const r = result[0];
    assert.equal(r.tier, 3);
    assert.equal(r.action, "demote");
    assert.ok(r.redFlags.some(f => f.type === "NO_STAKES"));
  });

  it("flags DEAD_ZONE when skill has no actions, constraints, or decision_made", () => {
    const skill = makeSkill({
      id: "s-dead",
      actions: [],
      constraints: [],
      decision_made: null,
    });
    const l4 = makeL4("L3-A", {
      id: "L4-dz",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-A" })], [l4]);
    const result = triageOpportunities(data);
    assert.ok(result[0].redFlags.some(f => f.type === "DEAD_ZONE"));
  });

  it("output sorted: Tier 1 first, then 2, then 3", () => {
    const skills = [
      makeSkill({ id: "s-t3", max_value: 100_000 }),
      makeSkill({ id: "s-t1", max_value: 10_000_000 }),
    ];
    const l4s = [
      makeL4("L3-A", { id: "L4-t3", financial_rating: "LOW", impact_order: "SECOND", ai_suitability: "MEDIUM", skills: [skills[0]] }),
      makeL4("L3-B", { id: "L4-t1", financial_rating: "HIGH", impact_order: "FIRST", ai_suitability: "HIGH", skills: [skills[1]] }),
    ];
    const data = makeExport(
      [makeL3({ l3_name: "L3-A" }), makeL3({ l3_name: "L3-B" })],
      l4s,
    );
    const result = triageOpportunities(data);
    const tiers = result.map(r => r.tier);
    for (let i = 1; i < tiers.length; i++) {
      assert.ok(tiers[i] >= tiers[i - 1], `tier order violated at index ${i}: ${tiers[i - 1]} > ${tiers[i]}`);
    }
  });

  it("populates TriageResult fields from skill context", () => {
    const skill = makeSkill({ id: "s-ctx", name: "Context Skill", max_value: 5_000_000 });
    const l4 = makeL4("L3-Ctx", {
      id: "L4-ctx",
      l1: "L1-Ctx",
      l2: "L2-Ctx",
      financial_rating: "HIGH",
      ai_suitability: "HIGH",
      impact_order: "FIRST",
      skills: [skill],
    });
    const data = makeExport([makeL3({ l3_name: "L3-Ctx", l1_name: "L1-Ctx", l2_name: "L2-Ctx" })], [l4]);
    const result = triageOpportunities(data);
    const r = result[0];
    assert.equal(r.l3Name, "L3-Ctx");
    assert.equal(r.l2Name, "L2-Ctx");
    assert.equal(r.l1Name, "L1-Ctx");
    assert.equal(r.skillId, "s-ctx");
    assert.equal(r.skillName, "Context Skill");
    assert.equal(r.combinedMaxValue, 5_000_000);
    assert.equal(r.leadArchetype, "DETERMINISTIC");
  });

  it("handles empty l3_opportunities with no L4s", () => {
    const data = makeExport([], []);
    const result = triageOpportunities(data);
    assert.equal(result.length, 0);
  });

  it("handles L4 with multiple skills", () => {
    const skills = [
      makeSkill({ id: "s-a", name: "Skill A" }),
      makeSkill({ id: "s-b", name: "Skill B" }),
    ];
    const l4 = makeL4("L3-Multi", { id: "L4-multi", skills });
    const data = makeExport([makeL3({ l3_name: "L3-Multi" })], [l4]);
    const result = triageOpportunities(data);
    assert.equal(result.length, 2);
    const ids = result.map(r => r.skillId).sort();
    assert.deepEqual(ids, ["s-a", "s-b"]);
  });

  it("within same tier, sorted by max_value descending", () => {
    const skills = [
      makeSkill({ id: "s-low", max_value: 500_000 }),
      makeSkill({ id: "s-high", max_value: 3_000_000 }),
    ];
    const l4s = [
      makeL4("L3-A", { id: "L4-low", skills: [skills[0]] }),
      makeL4("L3-B", { id: "L4-high", skills: [skills[1]] }),
    ];
    const data = makeExport(
      [makeL3({ l3_name: "L3-A" }), makeL3({ l3_name: "L3-B" })],
      l4s,
    );
    const result = triageOpportunities(data);
    // Both should be same tier, higher value first
    if (result[0].tier === result[1].tier) {
      assert.ok(result[0].combinedMaxValue! >= result[1].combinedMaxValue!);
    }
  });
});
