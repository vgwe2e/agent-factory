import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTechnicalConfidence,
  computeAdoptionConfidence,
  computeValueConfidence,
  computeOverallConfidence,
} from "./confidence.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";

// -- Minimal test factories --

function makeL3(overrides: Partial<L3Opportunity> = {}): L3Opportunity {
  return {
    l3_name: "Test Opportunity",
    l2_name: "Test L2",
    l1_name: "Test L1",
    opportunity_exists: true,
    opportunity_name: null,
    opportunity_summary: null,
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 5_000_000,
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

function makeL4(overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: "L4-001",
    name: "Test Activity",
    description: "test",
    l1: "L1",
    l2: "L2",
    l3: "L3",
    financial_rating: "MEDIUM",
    value_metric: "cost_reduction",
    impact_order: "FIRST",
    rating_confidence: "MEDIUM",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
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

describe("computeTechnicalConfidence", () => {
  it("returns HIGH when lead_archetype present and >75% L4s have non-null/non-NOT_APPLICABLE ai_suitability", () => {
    const opp = makeL3({ lead_archetype: "DETERMINISTIC" });
    const l4s = [
      makeL4({ ai_suitability: "HIGH" }),
      makeL4({ ai_suitability: "MEDIUM" }),
      makeL4({ ai_suitability: "HIGH" }),
      makeL4({ ai_suitability: "LOW" }),
    ];
    assert.equal(computeTechnicalConfidence(opp, l4s), "HIGH");
  });

  it("returns LOW when lead_archetype is null", () => {
    const opp = makeL3({ lead_archetype: null });
    const l4s = [
      makeL4({ ai_suitability: "HIGH" }),
      makeL4({ ai_suitability: "HIGH" }),
    ];
    assert.equal(computeTechnicalConfidence(opp, l4s), "LOW");
  });

  it("returns LOW when >50% L4s have null ai_suitability", () => {
    const opp = makeL3({ lead_archetype: "AGENTIC" });
    const l4s = [
      makeL4({ ai_suitability: null }),
      makeL4({ ai_suitability: null }),
      makeL4({ ai_suitability: "HIGH" }),
    ];
    // 2/3 = 66% null > 50%
    assert.equal(computeTechnicalConfidence(opp, l4s), "LOW");
  });

  it("returns LOW for empty L4 array", () => {
    const opp = makeL3({ lead_archetype: "DETERMINISTIC" });
    assert.equal(computeTechnicalConfidence(opp, []), "LOW");
  });

  it("returns MEDIUM for intermediate cases", () => {
    const opp = makeL3({ lead_archetype: "DETERMINISTIC" });
    // 2/4 = 50% non-null-non-NA (not > 75%)
    const l4s = [
      makeL4({ ai_suitability: "HIGH" }),
      makeL4({ ai_suitability: "HIGH" }),
      makeL4({ ai_suitability: null }),
      makeL4({ ai_suitability: "NOT_APPLICABLE" }),
    ];
    assert.equal(computeTechnicalConfidence(opp, l4s), "MEDIUM");
  });
});

// -- Adoption Confidence --

describe("computeAdoptionConfidence", () => {
  it("returns HIGH when >60% have decision_exists and >50% have financial_rating !== LOW", () => {
    const l4s = [
      makeL4({ decision_exists: true, financial_rating: "HIGH" }),
      makeL4({ decision_exists: true, financial_rating: "MEDIUM" }),
      makeL4({ decision_exists: true, financial_rating: "HIGH" }),
      makeL4({ decision_exists: false, financial_rating: "MEDIUM" }),
    ];
    // 3/4 = 75% decision_exists > 60%, 4/4 = 100% non-LOW > 50%
    assert.equal(computeAdoptionConfidence(l4s), "HIGH");
  });

  it("returns LOW when <25% have decision_exists", () => {
    const l4s = [
      makeL4({ decision_exists: false }),
      makeL4({ decision_exists: false }),
      makeL4({ decision_exists: false }),
      makeL4({ decision_exists: false }),
      makeL4({ decision_exists: true }),
    ];
    // 1/5 = 20% < 25%
    assert.equal(computeAdoptionConfidence(l4s), "LOW");
  });

  it("returns LOW when >75% have rating_confidence = LOW", () => {
    const l4s = [
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "MEDIUM" }),
    ];
    // 3/4 = 75% LOW -- need >75%, so 4 LOW out of 5:
    const l4s2 = [
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "LOW" }),
      makeL4({ decision_exists: true, rating_confidence: "MEDIUM" }),
    ];
    // 4/5 = 80% > 75%
    assert.equal(computeAdoptionConfidence(l4s2), "LOW");
  });

  it("returns LOW for empty L4 array", () => {
    assert.equal(computeAdoptionConfidence([]), "LOW");
  });

  it("returns MEDIUM for intermediate cases", () => {
    const l4s = [
      makeL4({ decision_exists: true, financial_rating: "LOW", rating_confidence: "MEDIUM" }),
      makeL4({ decision_exists: true, financial_rating: "LOW", rating_confidence: "MEDIUM" }),
      makeL4({ decision_exists: false, financial_rating: "HIGH", rating_confidence: "MEDIUM" }),
    ];
    // 2/3 = 66% decision_exists > 60%, but 2/3 = 66% LOW financial_rating -- not > 50% non-LOW
    // So not HIGH. Not LOW either (>25% decision_exists, not >75% rating_confidence LOW)
    assert.equal(computeAdoptionConfidence(l4s), "MEDIUM");
  });
});

// -- Value Confidence --

describe("computeValueConfidence", () => {
  it("returns HIGH when combined_max_value not null and annual_revenue present", () => {
    const opp = makeL3({ combined_max_value: 5_000_000 });
    const company = makeCompany({ annual_revenue: 100_000_000 });
    assert.equal(computeValueConfidence(opp, company), "HIGH");
  });

  it("returns LOW when combined_max_value is null", () => {
    const opp = makeL3({ combined_max_value: null });
    const company = makeCompany({ annual_revenue: 100_000_000 });
    assert.equal(computeValueConfidence(opp, company), "LOW");
  });

  it("returns LOW when annual_revenue and cogs are both null", () => {
    const opp = makeL3({ combined_max_value: 5_000_000 });
    const company = makeCompany({ annual_revenue: null, cogs: null });
    assert.equal(computeValueConfidence(opp, company), "LOW");
  });

  it("returns MEDIUM when combined_max_value present but only cogs available", () => {
    const opp = makeL3({ combined_max_value: 5_000_000 });
    const company = makeCompany({ annual_revenue: null, cogs: 50_000_000 });
    assert.equal(computeValueConfidence(opp, company), "MEDIUM");
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
