import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assignTier, TIER1_VALUE_THRESHOLD, TIER2_AI_SUITABILITY_THRESHOLD } from "./tier-engine.js";
// -- Minimal Fixtures --
function makeL3(overrides = {}) {
    return {
        l3_name: "Test L3",
        l2_name: "Test L2",
        l1_name: "Test L1",
        opportunity_exists: true,
        opportunity_name: "Test Opp",
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
function makeL4(overrides = {}) {
    return {
        id: "L4-001",
        name: "Test Activity",
        description: "desc",
        l1: "Test L1",
        l2: "Test L2",
        l3: "Test L3",
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
// -- Constants --
describe("tier-engine constants", () => {
    it("exports TIER1_VALUE_THRESHOLD as 5_000_000", () => {
        assert.equal(TIER1_VALUE_THRESHOLD, 5_000_000);
    });
    it("exports TIER2_AI_SUITABILITY_THRESHOLD as 0.5", () => {
        assert.equal(TIER2_AI_SUITABILITY_THRESHOLD, 0.5);
    });
});
// -- Tier 1 --
describe("assignTier - Tier 1", () => {
    it("assigns Tier 1 when quick_win=true AND combined_max_value > $5M", () => {
        const opp = makeL3({ quick_win: true, combined_max_value: 10_000_000 });
        const result = assignTier(opp, []);
        assert.equal(result, 1);
    });
    it("does NOT assign Tier 1 when combined_max_value is null", () => {
        const opp = makeL3({ quick_win: true, combined_max_value: null });
        const result = assignTier(opp, []);
        assert.notEqual(result, 1);
    });
    it("does NOT assign Tier 1 when value is below threshold ($3M)", () => {
        const opp = makeL3({ quick_win: true, combined_max_value: 3_000_000 });
        const result = assignTier(opp, []);
        assert.notEqual(result, 1);
    });
    it("does NOT assign Tier 1 when quick_win=false even with high value", () => {
        const opp = makeL3({ quick_win: false, combined_max_value: 10_000_000 });
        const result = assignTier(opp, []);
        assert.notEqual(result, 1);
    });
    it("Tier 1 takes priority over Tier 2 qualifications", () => {
        const opp = makeL3({ quick_win: true, combined_max_value: 10_000_000 });
        const l4s = [
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "HIGH" }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 1);
    });
});
// -- Tier 2 --
describe("assignTier - Tier 2", () => {
    it("assigns Tier 2 when >=50% of L4s have ai_suitability=HIGH", () => {
        const opp = makeL3({ quick_win: false, combined_max_value: 1_000_000 });
        const l4s = [
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "MEDIUM" }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 2);
    });
    it("assigns Tier 2 at exactly 50% HIGH boundary", () => {
        const opp = makeL3({ quick_win: false });
        const l4s = [
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "MEDIUM" }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 2);
    });
    it("assigns Tier 3 when below 50% HIGH (40%)", () => {
        const opp = makeL3({ quick_win: false });
        const l4s = [
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: "MEDIUM" }),
            makeL4({ ai_suitability: "MEDIUM" }),
            makeL4({ ai_suitability: "LOW" }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 3);
    });
    it("assigns Tier 3 when L4s array is empty (cannot be Tier 2)", () => {
        const opp = makeL3({ quick_win: false });
        const result = assignTier(opp, []);
        assert.equal(result, 3);
    });
    it("treats null ai_suitability as non-HIGH", () => {
        const opp = makeL3({ quick_win: false });
        const l4s = [
            makeL4({ ai_suitability: "HIGH" }),
            makeL4({ ai_suitability: null }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 2); // 1 of 2 = 50% -> tier 2
    });
    it("assigns Tier 3 when all ai_suitability are null", () => {
        const opp = makeL3({ quick_win: false });
        const l4s = [
            makeL4({ ai_suitability: null }),
            makeL4({ ai_suitability: null }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 3);
    });
});
// -- Tier 3 --
describe("assignTier - Tier 3", () => {
    it("assigns Tier 3 for everything that does not qualify for 1 or 2", () => {
        const opp = makeL3({ quick_win: false, combined_max_value: 500_000 });
        const l4s = [
            makeL4({ ai_suitability: "LOW" }),
            makeL4({ ai_suitability: "MEDIUM" }),
        ];
        const result = assignTier(opp, l4s);
        assert.equal(result, 3);
    });
});
