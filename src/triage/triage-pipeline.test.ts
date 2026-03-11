import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { triageOpportunities } from "./triage-pipeline.js";
import type {
  L3Opportunity,
  L4Activity,
  HierarchyExport,
  Meta,
  CompanyContext,
} from "../types/hierarchy.js";
import type { TriageResult } from "../types/triage.js";

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

// -- Test Data --
// 5 L3 opportunities:
// 1. Tier1Opp: quick_win=true, value=$10M -> Tier 1
// 2. Tier2Opp: 2/2 L4s HIGH ai_suitability -> Tier 2
// 3. Tier3Opp: no special qualifications -> Tier 3
// 4. PhantomOpp: opportunity_exists=false -> skip, forced Tier 3
// 5. NoStakesOpp: all SECOND order, no HIGH financial -> demote, forced Tier 3

const tier1L3 = makeL3({
  l3_name: "Tier1Opp",
  l2_name: "L2-A",
  l1_name: "L1-A",
  quick_win: true,
  combined_max_value: 10_000_000,
  l4_count: 3,
  lead_archetype: "AGENTIC",
});

const tier2L3 = makeL3({
  l3_name: "Tier2Opp",
  l2_name: "L2-B",
  l1_name: "L1-A",
  quick_win: false,
  combined_max_value: 4_000_000,
  l4_count: 2,
});

const tier3L3 = makeL3({
  l3_name: "Tier3Opp",
  l2_name: "L2-C",
  l1_name: "L1-B",
  quick_win: false,
  combined_max_value: 500_000,
  l4_count: 2,
});

const phantomL3 = makeL3({
  l3_name: "PhantomOpp",
  l2_name: "L2-D",
  l1_name: "L1-B",
  opportunity_exists: false,
  combined_max_value: 8_000_000,
  quick_win: true,
  l4_count: 3,
});

const noStakesL3 = makeL3({
  l3_name: "NoStakesOpp",
  l2_name: "L2-E",
  l1_name: "L1-C",
  quick_win: false,
  combined_max_value: 2_000_000,
  l4_count: 2,
});

// L4s for each L3
const tier1L4s = [
  makeL4("Tier1Opp", { id: "T1-1", ai_suitability: "MEDIUM", decision_exists: true }),
  makeL4("Tier1Opp", { id: "T1-2", ai_suitability: "HIGH", decision_exists: true }),
  makeL4("Tier1Opp", { id: "T1-3", ai_suitability: "LOW", decision_exists: true }),
];

const tier2L4s = [
  makeL4("Tier2Opp", { id: "T2-1", ai_suitability: "HIGH", decision_exists: true }),
  makeL4("Tier2Opp", { id: "T2-2", ai_suitability: "HIGH", decision_exists: true }),
];

const tier3L4s = [
  makeL4("Tier3Opp", { id: "T3-1", ai_suitability: "LOW", decision_exists: true }),
  makeL4("Tier3Opp", { id: "T3-2", ai_suitability: "MEDIUM", decision_exists: true }),
];

const phantomL4s = [
  makeL4("PhantomOpp", { id: "P-1", ai_suitability: "HIGH", decision_exists: true }),
  makeL4("PhantomOpp", { id: "P-2", ai_suitability: "HIGH", decision_exists: true }),
  makeL4("PhantomOpp", { id: "P-3", ai_suitability: "HIGH", decision_exists: true }),
];

const noStakesL4s = [
  makeL4("NoStakesOpp", {
    id: "NS-1",
    ai_suitability: "HIGH",
    financial_rating: "LOW",
    impact_order: "SECOND",
    decision_exists: true,
  }),
  makeL4("NoStakesOpp", {
    id: "NS-2",
    ai_suitability: "HIGH",
    financial_rating: "MEDIUM",
    impact_order: "SECOND",
    decision_exists: true,
  }),
];

const allL3s = [tier1L3, tier2L3, tier3L3, phantomL3, noStakesL3];
const allL4s = [...tier1L4s, ...tier2L4s, ...tier3L4s, ...phantomL4s, ...noStakesL4s];

// -- Tests --

describe("triageOpportunities", () => {
  it("is a pure function returning TriageResult[]", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 5);
  });

  it("all opportunities appear in output (none filtered)", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    const names = result.map((r) => r.l3Name);
    assert.ok(names.includes("Tier1Opp"));
    assert.ok(names.includes("Tier2Opp"));
    assert.ok(names.includes("Tier3Opp"));
    assert.ok(names.includes("PhantomOpp"));
    assert.ok(names.includes("NoStakesOpp"));
  });

  it("assigns correct tiers", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    const byName = new Map(result.map((r) => [r.l3Name, r]));

    assert.equal(byName.get("Tier1Opp")!.tier, 1);
    assert.equal(byName.get("Tier2Opp")!.tier, 2);
    assert.equal(byName.get("Tier3Opp")!.tier, 3);
  });

  it("skipped opportunities (PHANTOM) forced to Tier 3 with action=skip", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    const phantom = result.find((r) => r.l3Name === "PhantomOpp")!;
    assert.equal(phantom.tier, 3);
    assert.equal(phantom.action, "skip");
  });

  it("demoted opportunities (NO_STAKES) forced to Tier 3 with action=demote", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    const noStakes = result.find((r) => r.l3Name === "NoStakesOpp")!;
    assert.equal(noStakes.tier, 3);
    assert.equal(noStakes.action, "demote");
  });

  it("flagged opportunities keep computed tier with action=process", () => {
    // Create an opp that triggers ORPHAN (l4_count < 3) but would be Tier 2
    const orphanL3 = makeL3({
      l3_name: "OrphanTier2",
      l4_count: 2, // triggers ORPHAN flag
      quick_win: false,
    });
    const orphanL4s = [
      makeL4("OrphanTier2", { id: "O-1", ai_suitability: "HIGH" }),
      makeL4("OrphanTier2", { id: "O-2", ai_suitability: "HIGH" }),
    ];
    const data = makeExport([orphanL3], orphanL4s);
    const result = triageOpportunities(data);
    assert.equal(result[0].tier, 2);
    assert.equal(result[0].action, "process");
    assert.ok(result[0].redFlags.some((f) => f.type === "ORPHAN"));
  });

  it("output sorted: Tier 1 first, then 2, then 3", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    const tiers = result.map((r) => r.tier);
    for (let i = 1; i < tiers.length; i++) {
      assert.ok(tiers[i] >= tiers[i - 1], `tier order violated at index ${i}: ${tiers[i - 1]} > ${tiers[i]}`);
    }
  });

  it("within same tier, sorted by combined_max_value descending (nulls last)", () => {
    const data = makeExport(allL3s, allL4s);
    const result = triageOpportunities(data);
    // Tier 3 has: Tier3Opp (500k), PhantomOpp (8M), NoStakesOpp (2M)
    const tier3 = result.filter((r) => r.tier === 3);
    assert.ok(tier3.length >= 2);
    for (let i = 1; i < tier3.length; i++) {
      const prev = tier3[i - 1].combinedMaxValue;
      const curr = tier3[i].combinedMaxValue;
      // nulls last
      if (prev === null) {
        assert.fail("null value should be sorted last but appeared before non-null");
      }
      if (curr !== null) {
        assert.ok(prev >= curr, `value order violated: ${prev} < ${curr}`);
      }
    }
  });

  it("populates TriageResult fields from L3Opportunity", () => {
    const data = makeExport([tier1L3], tier1L4s);
    const result = triageOpportunities(data);
    const r = result[0];
    assert.equal(r.l3Name, "Tier1Opp");
    assert.equal(r.l2Name, "L2-A");
    assert.equal(r.l1Name, "L1-A");
    assert.equal(r.combinedMaxValue, 10_000_000);
    assert.equal(r.quickWin, true);
    assert.equal(r.leadArchetype, "AGENTIC");
    assert.equal(r.l4Count, 3);
  });

  it("red flags are applied before tier assignment", () => {
    // PhantomOpp would qualify for Tier 1 (quick_win=true, value=$8M)
    // but gets forced to Tier 3 because PHANTOM flag triggers skip
    const data = makeExport([phantomL3], phantomL4s);
    const result = triageOpportunities(data);
    assert.equal(result[0].tier, 3);
    assert.equal(result[0].action, "skip");
    assert.ok(result[0].redFlags.some((f) => f.type === "PHANTOM"));
  });

  it("handles empty l3_opportunities", () => {
    const data = makeExport([], []);
    const result = triageOpportunities(data);
    assert.equal(result.length, 0);
  });

  it("handles L3 with no matching L4s", () => {
    const loneL3 = makeL3({ l3_name: "LoneL3", l4_count: 0 });
    const data = makeExport([loneL3], []);
    const result = triageOpportunities(data);
    assert.equal(result.length, 1);
    assert.equal(result[0].tier, 3);
  });
});
