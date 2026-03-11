/**
 * Tests for the scoring pipeline orchestrator.
 *
 * All tests use mocked chatFn (no Ollama required).
 * Covers: process-only filtering, tier ordering, complete result structure,
 * promotion threshold, and failure handling.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreOpportunities, scoreOneOpportunity } from "./scoring-pipeline.js";
import type { ChatResult } from "./ollama-client.js";
import type { L3Opportunity, L4Activity, CompanyContext, HierarchyExport } from "../types/hierarchy.js";
import type { TriageResult } from "../types/triage.js";

// -- Test fixtures --

function makeL3(overrides: Partial<L3Opportunity> = {}): L3Opportunity {
  return {
    l3_name: "Test Opportunity",
    l2_name: "Test L2",
    l1_name: "Test L1",
    opportunity_exists: true,
    opportunity_name: "Test Opp Name",
    opportunity_summary: "Test summary",
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 5_000_000,
    implementation_complexity: "MEDIUM",
    quick_win: false,
    competitive_positioning: null,
    aera_differentiators: [],
    l4_count: 3,
    high_value_l4_count: 2,
    rationale: "Test rationale",
    ...overrides,
  };
}

function makeL4(overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: "l4-001",
    name: "Test Activity",
    description: "Test description",
    l1: "Test L1",
    l2: "Test L2",
    l3: "Test Opportunity",
    financial_rating: "HIGH",
    value_metric: "revenue",
    impact_order: "FIRST",
    rating_confidence: "HIGH",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: "Test decision",
    escalation_flag: null,
    skills: [],
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

function makeTriage(overrides: Partial<TriageResult> = {}): TriageResult {
  return {
    l3Name: "Test Opportunity",
    l2Name: "Test L2",
    l1Name: "Test L1",
    tier: 1,
    redFlags: [],
    action: "process",
    combinedMaxValue: 5_000_000,
    quickWin: false,
    leadArchetype: "DETERMINISTIC",
    l4Count: 3,
    ...overrides,
  };
}

function makeExport(opps: L3Opportunity[], l4s: L4Activity[], company?: CompanyContext): HierarchyExport {
  return {
    meta: {
      project_name: "Test",
      version_date: "2026-01-01",
      created_date: "2026-01-01",
      exported_by: null,
      description: "Test export",
    },
    company_context: company ?? makeCompany(),
    hierarchy: l4s,
    l3_opportunities: opps,
  };
}

// -- Mock chat functions --

// Returns valid JSON for all three lenses based on the prompt content
function makeMultiLensChatFn(options?: { failForL3?: string }): (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult> {
  return async (messages, _format) => {
    const userMsg = messages.find((m) => m.role === "user")?.content ?? "";

    // Check if we should fail for a specific L3
    if (options?.failForL3 && userMsg.includes(options.failForL3)) {
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

describe("scoreOpportunities", () => {
  it("only scores triage results with action === 'process'", async () => {
    const opp1 = makeL3({ l3_name: "Opp A" });
    const opp2 = makeL3({ l3_name: "Opp B" });
    const opp3 = makeL3({ l3_name: "Opp C" });
    const l4a = makeL4({ l3: "Opp A", id: "a1" });
    const l4b = makeL4({ l3: "Opp B", id: "b1" });
    const l4c = makeL4({ l3: "Opp C", id: "c1" });

    const triageResults: TriageResult[] = [
      makeTriage({ l3Name: "Opp A", action: "process", tier: 1 }),
      makeTriage({ l3Name: "Opp B", action: "skip", tier: 2 }),
      makeTriage({ l3Name: "Opp C", action: "demote", tier: 3 }),
    ];

    const gen = scoreOpportunities({
      hierarchyExport: makeExport([opp1, opp2, opp3], [l4a, l4b, l4c]),
      triageResults,
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn(),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 1);
    assert.ok("l3Name" in results[0]);
    assert.equal((results[0] as { l3Name: string }).l3Name, "Opp A");
  });

  it("processes opportunities in tier order (Tier 1 before Tier 2)", async () => {
    const opp1 = makeL3({ l3_name: "Tier2 Opp" });
    const opp2 = makeL3({ l3_name: "Tier1 Opp" });
    const l4a = makeL4({ l3: "Tier2 Opp", id: "a1" });
    const l4b = makeL4({ l3: "Tier1 Opp", id: "b1" });

    const triageResults: TriageResult[] = [
      makeTriage({ l3Name: "Tier2 Opp", action: "process", tier: 2 }),
      makeTriage({ l3Name: "Tier1 Opp", action: "process", tier: 1 }),
    ];

    const gen = scoreOpportunities({
      hierarchyExport: makeExport([opp1, opp2], [l4a, l4b]),
      triageResults,
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn(),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 2);
    assert.equal((results[0] as { l3Name: string }).l3Name, "Tier1 Opp");
    assert.equal((results[1] as { l3Name: string }).l3Name, "Tier2 Opp");
  });

  it("produces complete ScoringResult with all fields", async () => {
    const opp = makeL3();
    const l4s = [makeL4(), makeL4({ id: "l4-002", name: "Activity 2" })];

    const gen = scoreOpportunities({
      hierarchyExport: makeExport([opp], l4s),
      triageResults: [makeTriage()],
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn(),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 1);
    const r = results[0];
    assert.ok("archetype" in r);
    // Full ScoringResult type check
    const sr = r as {
      l3Name: string; l2Name: string; l1Name: string;
      archetype: string; archetypeSource: string;
      lenses: { technical: unknown; adoption: unknown; value: unknown };
      composite: number; overallConfidence: string;
      promotedToSimulation: boolean; scoringDurationMs: number;
    };
    assert.equal(sr.l3Name, "Test Opportunity");
    assert.equal(sr.l2Name, "Test L2");
    assert.equal(sr.l1Name, "Test L1");
    assert.ok(sr.archetype);
    assert.ok(["export", "inferred"].includes(sr.archetypeSource));
    assert.ok(sr.lenses.technical);
    assert.ok(sr.lenses.adoption);
    assert.ok(sr.lenses.value);
    assert.ok(typeof sr.composite === "number");
    assert.ok(["HIGH", "MEDIUM", "LOW"].includes(sr.overallConfidence));
    assert.ok(typeof sr.promotedToSimulation === "boolean");
    assert.ok(typeof sr.scoringDurationMs === "number");
  });
});

describe("scoreOneOpportunity", () => {
  it("opportunity with high scores has promotedToSimulation = true", async () => {
    const opp = makeL3();
    const l4s = [makeL4(), makeL4({ id: "l4-002" })];
    const company = makeCompany();

    const result = await scoreOneOpportunity(
      opp, l4s, company,
      { components: "test", processBuilder: "test" },
      makeHighScoringChatFn(),
    );

    assert.ok("composite" in result);
    const sr = result as { composite: number; promotedToSimulation: boolean };
    assert.ok(sr.composite >= 0.60, `Expected composite >= 0.60, got ${sr.composite}`);
    assert.equal(sr.promotedToSimulation, true);
  });

  it("opportunity with low scores has promotedToSimulation = false", async () => {
    const opp = makeL3();
    const l4s = [makeL4(), makeL4({ id: "l4-002" })];
    const company = makeCompany();

    const result = await scoreOneOpportunity(
      opp, l4s, company,
      { components: "test", processBuilder: "test" },
      makeLowScoringChatFn(),
    );

    assert.ok("composite" in result);
    const sr = result as { composite: number; promotedToSimulation: boolean };
    assert.ok(sr.composite < 0.60, `Expected composite < 0.60, got ${sr.composite}`);
    assert.equal(sr.promotedToSimulation, false);
  });

  it("LLM failure for one opportunity yields error, does not crash pipeline", async () => {
    const opp1 = makeL3({ l3_name: "Good Opp" });
    const opp2 = makeL3({ l3_name: "Bad Opp" });
    const l4a = makeL4({ l3: "Good Opp", id: "a1" });
    const l4b = makeL4({ l3: "Bad Opp", id: "b1" });

    const triageResults: TriageResult[] = [
      makeTriage({ l3Name: "Good Opp", action: "process", tier: 1 }),
      makeTriage({ l3Name: "Bad Opp", action: "process", tier: 2 }),
    ];

    const gen = scoreOpportunities({
      hierarchyExport: makeExport([opp1, opp2], [l4a, l4b]),
      triageResults,
      knowledgeContext: { components: "test", processBuilder: "test" },
      chatFn: makeMultiLensChatFn({ failForL3: "Bad Opp" }),
    });

    const results = await collectResults(gen);
    assert.equal(results.length, 2);

    // First result should be successful
    assert.ok("archetype" in results[0], "First result should be a ScoringResult");

    // Second result should be an error
    assert.ok("error" in results[1], "Second result should be an error");
    assert.equal((results[1] as { l3Name: string }).l3Name, "Bad Opp");
  });
});
