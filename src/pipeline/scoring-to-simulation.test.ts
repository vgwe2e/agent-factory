/**
 * Unit tests for scoring-to-simulation adapter.
 *
 * Tests the pure toSimulationInputs function that converts
 * promoted ScoringResult[] into SimulationInput[] for the
 * simulation pipeline.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { toSimulationInputs } from "./scoring-to-simulation.js";
import { getRouteForArchetype } from "../knowledge/orchestration.js";
import type { ScoringResult } from "../types/scoring.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";

// -- Fixtures --

function makeL3(name: string, overrides: Partial<L3Opportunity> = {}): L3Opportunity {
  return {
    l3_name: name,
    l2_name: "L2-Test",
    l1_name: "L1-Test",
    opportunity_exists: true,
    opportunity_name: name,
    opportunity_summary: `Summary for ${name}`,
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 1_000_000,
    implementation_complexity: "MEDIUM",
    quick_win: false,
    competitive_positioning: null,
    aera_differentiators: [],
    l4_count: 2,
    high_value_l4_count: 1,
    rationale: `Rationale for ${name}`,
    ...overrides,
  } as L3Opportunity;
}

function makeL4(l3: string, name: string): L4Activity {
  return {
    id: `${l3}-${name}`,
    name,
    description: `Description of ${name}`,
    l1: "L1-Test",
    l2: "L2-Test",
    l3,
    financial_rating: "HIGH",
    value_metric: "cost_savings",
    impact_order: "FIRST",
    rating_confidence: "HIGH",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
  } as L4Activity;
}

function makeScoringResult(l3Name: string, overrides: Partial<ScoringResult> = {}): ScoringResult {
  return {
    l3Name,
    l2Name: "L2-Test",
    l1Name: "L1-Test",
    skillId: "skill-test",
    skillName: "Test Skill",
    l4Name: "Test L4",
    archetype: "DETERMINISTIC",
    lenses: {
      technical: { lens: "technical", subDimensions: [], total: 6, maxPossible: 9, normalized: 0.67, confidence: "HIGH" },
      adoption: { lens: "adoption", subDimensions: [], total: 8, maxPossible: 12, normalized: 0.67, confidence: "HIGH" },
      value: { lens: "value", subDimensions: [], total: 4, maxPossible: 6, normalized: 0.67, confidence: "HIGH" },
    },
    composite: 0.67,
    overallConfidence: "HIGH",
    promotedToSimulation: true,
    scoringDurationMs: 100,
    ...overrides,
  };
}

const COMPANY_CONTEXT: CompanyContext = {
  company_name: "TestCo",
  industry: "Manufacturing",
  annual_revenue: 10_000_000_000,
  employee_count: 50_000,
  enterprise_applications: ["SAP"],
  cogs: null,
  sga: null,
  ebitda: null,
  working_capital: null,
  inventory_value: null,
  annual_hires: null,
  geographic_scope: "Global",
  notes: "",
  business_exclusions: "",
  detected_applications: [],
  pptx_template: null,
  industry_specifics: null,
  raw_context: "",
  enriched_context: {},
  enrichment_applied_at: "",
  existing_systems: [],
  hard_exclusions: [],
  filtered_skills: [],
} as CompanyContext;

// -- Tests --

describe("toSimulationInputs", () => {
  it("returns empty array when given empty promoted array", () => {
    const l3Map = new Map<string, L3Opportunity>();
    const l4Map = new Map<string, L4Activity[]>();

    const result = toSimulationInputs([], l3Map, l4Map, COMPANY_CONTEXT);

    assert.deepStrictEqual(result, []);
  });

  it("converts a single promoted ScoringResult into a SimulationInput", () => {
    const opp = makeL3("Opp-A");
    const l4s = [makeL4("Opp-A", "Act-1"), makeL4("Opp-A", "Act-2")];
    const sr = makeScoringResult("Opp-A");

    const l3Map = new Map([["Opp-A", opp]]);
    const l4Map = new Map([["Opp-A", l4s]]);

    const result = toSimulationInputs([sr], l3Map, l4Map, COMPANY_CONTEXT);

    assert.equal(result.length, 1);
    assert.equal(result[0].opportunity, opp);
    assert.deepStrictEqual(result[0].l4s, l4s);
    assert.equal(result[0].companyContext, COMPANY_CONTEXT);
    assert.equal(result[0].archetype, "DETERMINISTIC");
    assert.equal(result[0].composite, 0.67);
  });

  it("skips entries where l3Name is not found in l3Map", () => {
    const opp = makeL3("Opp-A");
    const sr1 = makeScoringResult("Opp-A");
    const sr2 = makeScoringResult("Opp-Missing");

    const l3Map = new Map([["Opp-A", opp]]);
    const l4Map = new Map<string, L4Activity[]>([["Opp-A", [makeL4("Opp-A", "Act-1")]]]);

    const result = toSimulationInputs([sr1, sr2], l3Map, l4Map, COMPANY_CONTEXT);

    assert.equal(result.length, 1, "only valid entry returned");
    assert.equal(result[0].opportunity.l3_name, "Opp-A");
  });

  it("correctly maps archetypeRoute via getRouteForArchetype", () => {
    const opp = makeL3("Opp-A");
    const sr = makeScoringResult("Opp-A", { archetype: "DETERMINISTIC" });

    const l3Map = new Map([["Opp-A", opp]]);
    const l4Map = new Map<string, L4Activity[]>();

    const result = toSimulationInputs([sr], l3Map, l4Map, COMPANY_CONTEXT);

    // Verify the archetypeRoute matches what getRouteForArchetype returns
    const expected = getRouteForArchetype("DETERMINISTIC").primary_route;
    assert.equal(result[0].archetypeRoute, expected);
  });
});
