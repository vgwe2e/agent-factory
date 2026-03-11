import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyArchetype } from "./archetype-router.js";
// -- Minimal test factories --
function makeL3(overrides = {}) {
    return {
        l3_name: "Test Opportunity",
        l2_name: "Test L2",
        l1_name: "Test L1",
        opportunity_exists: true,
        opportunity_name: null,
        opportunity_summary: null,
        lead_archetype: null,
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
function makeL4(overrides = {}) {
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
// -- Direct export cases --
describe("classifyArchetype - direct export", () => {
    it("returns DETERMINISTIC with source export when lead_archetype is DETERMINISTIC", () => {
        const opp = makeL3({ lead_archetype: "DETERMINISTIC" });
        const result = classifyArchetype(opp, [makeL4()]);
        assert.equal(result.archetype, "DETERMINISTIC");
        assert.equal(result.source, "export");
        assert.ok(result.route);
        assert.ok(result.route.primary_route);
    });
    it("returns AGENTIC with source export when lead_archetype is AGENTIC", () => {
        const opp = makeL3({ lead_archetype: "AGENTIC" });
        const result = classifyArchetype(opp, [makeL4()]);
        assert.equal(result.archetype, "AGENTIC");
        assert.equal(result.source, "export");
    });
    it("returns GENERATIVE with source export when lead_archetype is GENERATIVE", () => {
        const opp = makeL3({ lead_archetype: "GENERATIVE" });
        const result = classifyArchetype(opp, [makeL4()]);
        assert.equal(result.archetype, "GENERATIVE");
        assert.equal(result.source, "export");
    });
});
// -- Supporting archetypes fallback --
describe("classifyArchetype - supporting_archetypes fallback", () => {
    it("uses first supporting archetype when lead is null", () => {
        const opp = makeL3({ lead_archetype: null, supporting_archetypes: ["AGENTIC"] });
        const result = classifyArchetype(opp, [makeL4()]);
        assert.equal(result.archetype, "AGENTIC");
        assert.equal(result.source, "inferred");
    });
});
// -- L4-based inference --
describe("classifyArchetype - L4-based inference", () => {
    it("returns DETERMINISTIC inferred for high decision density + high AI suitability", () => {
        const opp = makeL3({ lead_archetype: null, supporting_archetypes: [] });
        const l4s = [
            makeL4({ decision_exists: true, ai_suitability: "HIGH" }),
            makeL4({ decision_exists: true, ai_suitability: "HIGH" }),
            makeL4({ decision_exists: true, ai_suitability: "MEDIUM" }),
            makeL4({ decision_exists: true, ai_suitability: "MEDIUM" }),
            makeL4({ decision_exists: true, ai_suitability: "MEDIUM" }),
        ];
        // decisionPct = 5/5 = 1.0, aiPct = 2/5 = 0.4
        // decisionPct >= 0.5 AND aiPct <= 0.6 => DETERMINISTIC (else branch)
        const result = classifyArchetype(opp, l4s);
        assert.equal(result.archetype, "DETERMINISTIC");
        assert.equal(result.source, "inferred");
    });
    it("returns GENERATIVE inferred for low decision density + low AI suitability", () => {
        const opp = makeL3({ lead_archetype: null, supporting_archetypes: [] });
        const l4s = [
            makeL4({ decision_exists: false, ai_suitability: "LOW" }),
            makeL4({ decision_exists: false, ai_suitability: "LOW" }),
            makeL4({ decision_exists: false, ai_suitability: "NOT_APPLICABLE" }),
            makeL4({ decision_exists: true, ai_suitability: "LOW" }),
        ];
        // decisionPct = 1/4 = 0.25 < 0.3, aiPct = 0/4 = 0.0 < 0.3 => GENERATIVE
        const result = classifyArchetype(opp, l4s);
        assert.equal(result.archetype, "GENERATIVE");
        assert.equal(result.source, "inferred");
    });
    it("returns AGENTIC inferred for mixed signals", () => {
        const opp = makeL3({ lead_archetype: null, supporting_archetypes: [] });
        const l4s = [
            makeL4({ decision_exists: true, ai_suitability: "HIGH" }),
            makeL4({ decision_exists: false, ai_suitability: "HIGH" }),
            makeL4({ decision_exists: false, ai_suitability: "HIGH" }),
            makeL4({ decision_exists: false, ai_suitability: "HIGH" }),
        ];
        // decisionPct = 1/4 = 0.25 < 0.3, aiPct = 4/4 = 1.0 -- not both < 0.3
        // decisionPct < 0.5 => AGENTIC
        const result = classifyArchetype(opp, l4s);
        assert.equal(result.archetype, "AGENTIC");
        assert.equal(result.source, "inferred");
    });
});
// -- Empty L4s default --
describe("classifyArchetype - empty L4s", () => {
    it("returns DETERMINISTIC inferred as safe default for empty L4s", () => {
        const opp = makeL3({ lead_archetype: null, supporting_archetypes: [] });
        const result = classifyArchetype(opp, []);
        assert.equal(result.archetype, "DETERMINISTIC");
        assert.equal(result.source, "inferred");
    });
});
// -- Route populated --
describe("classifyArchetype - route populated", () => {
    it("includes route from getRouteForArchetype for all results", () => {
        const opp = makeL3({ lead_archetype: "DETERMINISTIC" });
        const result = classifyArchetype(opp, [makeL4()]);
        assert.ok(result.route);
        assert.ok(typeof result.route.primary_route === "string");
        assert.ok(typeof result.route.secondary_route === "string");
        assert.ok(typeof result.route.rationale === "string");
    });
});
