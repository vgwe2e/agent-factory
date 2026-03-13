/**
 * Tests for the scoring pipeline orchestrator.
 *
 * All tests use mocked chatFn (no Ollama required).
 * Covers: scoreOneSkill result structure, promotion threshold, failure handling,
 * and scoreSkills generator behavior.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreOneSkill, scoreSkills } from "./scoring-pipeline.js";
import type { ChatResult } from "./ollama-client.js";
import type { SkillWithContext, CompanyContext } from "../types/hierarchy.js";

// -- Test fixtures --

function makeSkill(overrides: Partial<SkillWithContext> = {}): SkillWithContext {
  return {
    id: "skill-001",
    name: "Test Skill",
    description: "Test description",
    archetype: "DETERMINISTIC",
    max_value: 5_000_000,
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
    l3Name: "Test Opportunity",
    l2Name: "Test L2",
    l1Name: "Test L1",
    financialRating: "HIGH",
    aiSuitability: "HIGH",
    impactOrder: "FIRST",
    ratingConfidence: "HIGH",
    decisionExists: true,
    decisionArticulation: "Test decision",
    ...overrides,
  };
}

function makeCompany(overrides: Partial<CompanyContext> = {}): CompanyContext {
  return {
    industry: "Manufacturing",
    company_name: "Test Corp",
    annual_revenue: 50_000_000_000,
    cogs: 30_000_000_000,
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
    ...overrides,
  };
}

// -- Mock chat functions --

// Returns valid JSON for all three lenses based on the prompt content
function makeMultiLensChatFn(options?: { failForSkill?: string }): (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult> {
  return async (messages, _format) => {
    const userMsg = messages.find((m) => m.role === "user")?.content ?? "";

    // Check if we should fail for a specific skill
    if (options?.failForSkill && userMsg.includes(options.failForSkill)) {
      return { success: false as const, error: "Simulated LLM failure" };
    }

    // Detect lens from system message content
    const sysMsg = messages.find((m) => m.role === "system")?.content ?? "";

    if (sysMsg.includes("technical feasibility")) {
      return {
        success: true as const,
        content: JSON.stringify({
          data_readiness: { score: 2, reason: "Good data." },
          aera_platform_fit: { score: 3, reason: "Strong fit." },
          archetype_confidence: { score: 2, reason: "Solid archetype." },
        }),
        durationMs: 50,
      };
    }

    if (sysMsg.includes("adoption realism")) {
      return {
        success: true as const,
        content: JSON.stringify({
          decision_density: { score: 2, reason: "Good density." },
          financial_gravity: { score: 2, reason: "Medium financial." },
          impact_proximity: { score: 2, reason: "Mixed impact." },
          confidence_signal: { score: 2, reason: "Reasonable signals." },
        }),
        durationMs: 50,
      };
    }

    if (sysMsg.includes("value and efficiency")) {
      return {
        success: true as const,
        content: JSON.stringify({
          value_density: { score: 2, reason: "Moderate value." },
          simulation_viability: { score: 2, reason: "Viable simulation." },
        }),
        durationMs: 50,
      };
    }

    return { success: false as const, error: "Unknown lens" };
  };
}

// High-scoring chat fn for promotion testing (composite >= 0.60)
function makeHighScoringChatFn(): (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult> {
  return async (messages, _format) => {
    const sysMsg = messages.find((m) => m.role === "system")?.content ?? "";
    if (sysMsg.includes("technical feasibility")) {
      return {
        success: true as const,
        content: JSON.stringify({
          data_readiness: { score: 3, reason: "Excellent." },
          aera_platform_fit: { score: 3, reason: "Perfect fit." },
          archetype_confidence: { score: 3, reason: "Strong." },
        }),
        durationMs: 50,
      };
    }
    if (sysMsg.includes("adoption realism")) {
      return {
        success: true as const,
        content: JSON.stringify({
          decision_density: { score: 3, reason: "High." },
          financial_gravity: { score: 3, reason: "High." },
          impact_proximity: { score: 3, reason: "Direct." },
          confidence_signal: { score: 3, reason: "Very high." },
        }),
        durationMs: 50,
      };
    }
    if (sysMsg.includes("value and efficiency")) {
      return {
        success: true as const,
        content: JSON.stringify({
          value_density: { score: 3, reason: "Excellent." },
          simulation_viability: { score: 3, reason: "Clear." },
        }),
        durationMs: 50,
      };
    }
    return { success: false as const, error: "Unknown lens" };
  };
}

// Low-scoring chat fn for promotion testing (composite < 0.60)
function makeLowScoringChatFn(): (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult> {
  return async (messages, _format) => {
    const sysMsg = messages.find((m) => m.role === "system")?.content ?? "";
    if (sysMsg.includes("technical feasibility")) {
      return {
        success: true as const,
        content: JSON.stringify({
          data_readiness: { score: 1, reason: "Sparse." },
          aera_platform_fit: { score: 0, reason: "No fit." },
          archetype_confidence: { score: 1, reason: "Weak." },
        }),
        durationMs: 50,
      };
    }
    if (sysMsg.includes("adoption realism")) {
      return {
        success: true as const,
        content: JSON.stringify({
          decision_density: { score: 1, reason: "Low." },
          financial_gravity: { score: 0, reason: "None." },
          impact_proximity: { score: 1, reason: "Second-order." },
          confidence_signal: { score: 0, reason: "Low signals." },
        }),
        durationMs: 50,
      };
    }
    if (sysMsg.includes("value and efficiency")) {
      return {
        success: true as const,
        content: JSON.stringify({
          value_density: { score: 0, reason: "None." },
          simulation_viability: { score: 1, reason: "Weak." },
        }),
        durationMs: 50,
      };
    }
    return { success: false as const, error: "Unknown lens" };
  };
}

// -- Helper to drain async generator --

async function collectResults<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of gen) {
    results.push(item);
  }
  return results;
}

// -- Tests --

describe("scoreOneSkill", () => {
  it("produces complete ScoringResult with all fields", async () => {
    const skill = makeSkill();
    const company = makeCompany();

    const result = await scoreOneSkill(
      skill, company,
      { components: "test", processBuilder: "test" },
      makeMultiLensChatFn(),
    );

    assert.ok("archetype" in result);
    const sr = result as {
      skillId: string; skillName: string; l4Name: string;
      l3Name: string; l2Name: string; l1Name: string;
      archetype: string;
      lenses: { technical: unknown; adoption: unknown; value: unknown };
      composite: number; overallConfidence: string;
      promotedToSimulation: boolean; scoringDurationMs: number;
    };
    assert.equal(sr.skillId, "skill-001");
    assert.equal(sr.skillName, "Test Skill");
    assert.equal(sr.l4Name, "Test Activity");
    assert.equal(sr.l3Name, "Test Opportunity");
    assert.equal(sr.l2Name, "Test L2");
    assert.equal(sr.l1Name, "Test L1");
    assert.equal(sr.archetype, "DETERMINISTIC");
    assert.ok(sr.lenses.technical);
    assert.ok(sr.lenses.adoption);
    assert.ok(sr.lenses.value);
    assert.ok(typeof sr.composite === "number");
    assert.ok(["HIGH", "MEDIUM", "LOW"].includes(sr.overallConfidence));
    assert.ok(typeof sr.promotedToSimulation === "boolean");
    assert.ok(typeof sr.scoringDurationMs === "number");
  });

  it("skill with high scores has promotedToSimulation = true", async () => {
    const skill = makeSkill();
    const company = makeCompany();

    const result = await scoreOneSkill(
      skill, company,
      { components: "test", processBuilder: "test" },
      makeHighScoringChatFn(),
    );

    assert.ok("composite" in result);
    const sr = result as { composite: number; promotedToSimulation: boolean };
    assert.ok(sr.composite >= 0.60, `Expected composite >= 0.60, got ${sr.composite}`);
    assert.equal(sr.promotedToSimulation, true);
  });

  it("skill with low scores has promotedToSimulation = false", async () => {
    const skill = makeSkill();
    const company = makeCompany();

    const result = await scoreOneSkill(
      skill, company,
      { components: "test", processBuilder: "test" },
      makeLowScoringChatFn(),
    );

    assert.ok("composite" in result);
    const sr = result as { composite: number; promotedToSimulation: boolean };
    assert.ok(sr.composite < 0.60, `Expected composite < 0.60, got ${sr.composite}`);
    assert.equal(sr.promotedToSimulation, false);
  });

  it("LLM failure yields error with skillId, does not throw", async () => {
    const skill = makeSkill({ id: "skill-bad", name: "Bad Skill" });
    const company = makeCompany();

    const failChatFn = async () => ({
      success: false as const,
      error: "Simulated LLM failure",
    });

    const result = await scoreOneSkill(
      skill, company,
      { components: "test", processBuilder: "test" },
      failChatFn,
    );

    assert.ok("error" in result, "Result should be an error");
    assert.equal((result as { skillId: string }).skillId, "skill-bad");
    assert.equal((result as { skillName: string }).skillName, "Bad Skill");
  });
});

describe("scoreSkills", () => {
  it("scores multiple skills via generator", async () => {
    const skills = [
      makeSkill({ id: "s1", name: "Skill A", l3Name: "L3-B" }),
      makeSkill({ id: "s2", name: "Skill B", l3Name: "L3-A" }),
    ];
    const company = makeCompany();

    const gen = scoreSkills({
      skills,
      company,
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn(),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 2);

    // Should be sorted by L3 name
    const firstSkillId = "skillId" in results[0] ? (results[0] as { skillId: string }).skillId : "";
    const secondSkillId = "skillId" in results[1] ? (results[1] as { skillId: string }).skillId : "";
    // L3-A sorts before L3-B, so s2 (L3-A) should come first
    assert.equal(firstSkillId, "s2");
    assert.equal(secondSkillId, "s1");
  });

  it("continues on failure for one skill", async () => {
    const skills = [
      makeSkill({ id: "s-good", name: "Good Skill", l3Name: "L3-A" }),
      makeSkill({ id: "s-bad", name: "Bad Skill", l3Name: "L3-B" }),
    ];
    const company = makeCompany();

    const gen = scoreSkills({
      skills,
      company,
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn({ failForSkill: "Bad Skill" }),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 2);

    // First result should be successful
    assert.ok("archetype" in results[0], "First result should be a ScoringResult");

    // Second result should be an error
    assert.ok("error" in results[1], "Second result should be an error");
    assert.equal((results[1] as { skillId: string }).skillId, "s-bad");
  });
});
