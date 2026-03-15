/**
 * Unit tests for scoring-to-simulation adapter.
 *
 * Tests the pure toSimulationInputs function that converts
 * promoted ScoringResult[] into SimulationInput[] for the
 * simulation pipeline.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toSimulationInputs, toL4SimulationInputs } from "./scoring-to-simulation.js";
import { getRouteForArchetype } from "../knowledge/orchestration.js";
// -- Fixtures --
function makeL3(name, overrides = {}) {
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
    };
}
function makeL4(l3, name) {
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
    };
}
function makeScoringResult(l3Name, overrides = {}) {
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
const COMPANY_CONTEXT = {
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
};
// -- Tests --
describe("toSimulationInputs", () => {
    it("returns empty array when given empty promoted array", () => {
        const l3Map = new Map();
        const l4Map = new Map();
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
    it("keeps entries when l4s exist even if l3Name is not found in l3Map", () => {
        const opp = makeL3("Opp-A");
        const sr1 = makeScoringResult("Opp-A");
        const sr2 = makeScoringResult("Opp-Missing");
        const l3Map = new Map([["Opp-A", opp]]);
        const l4Map = new Map([
            ["Opp-A", [makeL4("Opp-A", "Act-1")]],
            ["Opp-Missing", [makeL4("Opp-Missing", "Act-2")]],
        ]);
        const result = toSimulationInputs([sr1, sr2], l3Map, l4Map, COMPANY_CONTEXT);
        assert.equal(result.length, 2, "entries with L4 context should be retained");
        assert.ok(result[0]?.opportunity, "opportunity should be present");
        assert.equal(result[0].opportunity.l3_name, "Opp-A");
        assert.equal(result[1].opportunity, undefined);
        assert.equal(result[1].l4s[0].name, "Act-2");
    });
    it("correctly maps archetypeRoute via getRouteForArchetype", () => {
        const opp = makeL3("Opp-A");
        const sr = makeScoringResult("Opp-A", { archetype: "DETERMINISTIC" });
        const l3Map = new Map([["Opp-A", opp]]);
        const l4Map = new Map([["Opp-A", [makeL4("Opp-A", "Act-1")]]]);
        const result = toSimulationInputs([sr], l3Map, l4Map, COMPANY_CONTEXT);
        // Verify the archetypeRoute matches what getRouteForArchetype returns
        const expected = getRouteForArchetype("DETERMINISTIC").primary_route;
        assert.equal(result[0].archetypeRoute, expected);
    });
});
describe("toL4SimulationInputs", () => {
    it("produces SimulationInput with l4Activity populated", () => {
        const l4 = makeL4("Opp-A", "Act-1");
        const opp = makeL3("Opp-A");
        const sr = makeScoringResult("Opp-A", {
            l4Name: "Act-1",
            archetype: "DETERMINISTIC",
            composite: 0.75,
        });
        const l4Map = new Map([["Act-1", l4]]);
        const l3Map = new Map([["Opp-A", opp]]);
        const result = toL4SimulationInputs([sr], l4Map, l3Map, COMPANY_CONTEXT);
        assert.equal(result.length, 1);
        assert.ok(result[0].l4Activity, "l4Activity should be populated");
        assert.equal(result[0].l4Activity.name, "Act-1");
        assert.equal(result[0].composite, 0.75);
        assert.equal(result[0].archetype, "DETERMINISTIC");
    });
    it("sets opportunity from l3Map when available", () => {
        const l4 = makeL4("Opp-A", "Act-1");
        const opp = makeL3("Opp-A");
        const sr = makeScoringResult("Opp-A", { l4Name: "Act-1" });
        const l4Map = new Map([["Act-1", l4]]);
        const l3Map = new Map([["Opp-A", opp]]);
        const result = toL4SimulationInputs([sr], l4Map, l3Map, COMPANY_CONTEXT);
        assert.ok(result[0].opportunity, "opportunity should be set from l3Map");
        assert.equal(result[0].opportunity.l3_name, "Opp-A");
    });
    it("skips entries where L4 is not found in l4Map", () => {
        const opp = makeL3("Opp-A");
        const sr = makeScoringResult("Opp-A", { l4Name: "Missing-L4" });
        const l4Map = new Map();
        const l3Map = new Map([["Opp-A", opp]]);
        const result = toL4SimulationInputs([sr], l4Map, l3Map, COMPANY_CONTEXT);
        assert.equal(result.length, 0, "should skip when L4 not found");
    });
    it("handles missing L3 gracefully (opportunity is undefined)", () => {
        const l4 = makeL4("Opp-Missing", "Act-1");
        const sr = makeScoringResult("Opp-Missing", { l4Name: "Act-1" });
        const l4Map = new Map([["Act-1", l4]]);
        const l3Map = new Map();
        const result = toL4SimulationInputs([sr], l4Map, l3Map, COMPANY_CONTEXT);
        assert.equal(result.length, 1, "should still produce input without L3");
        assert.equal(result[0].opportunity, undefined, "opportunity should be undefined");
        assert.ok(result[0].l4Activity, "l4Activity should still be set");
    });
    it("sets l4s array to single L4", () => {
        const l4 = makeL4("Opp-A", "Act-1");
        const sr = makeScoringResult("Opp-A", { l4Name: "Act-1" });
        const l4Map = new Map([["Act-1", l4]]);
        const l3Map = new Map();
        const result = toL4SimulationInputs([sr], l4Map, l3Map, COMPANY_CONTEXT);
        assert.equal(result[0].l4s.length, 1);
        assert.equal(result[0].l4s[0].name, "Act-1");
    });
});
