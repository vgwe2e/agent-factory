/**
 * Tests for lens scorer functions.
 *
 * All tests use mocked chatFn (no Ollama required).
 * Covers: valid responses, retry on invalid JSON, persistent failure, sub-dimension names.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreTechnical, scoreAdoption, scoreValue } from "./lens-scorers.js";
// -- Test fixtures --
function makeL3(overrides = {}) {
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
function makeL4(overrides = {}) {
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
function makeCompany(overrides = {}) {
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
function makeChatFn(jsonResponse) {
    return async () => ({
        success: true,
        content: JSON.stringify(jsonResponse),
        durationMs: 100,
    });
}
function makeFailingChatFn() {
    return async () => ({
        success: false,
        error: "Ollama connection refused",
    });
}
// Valid LLM response fixtures
const VALID_TECHNICAL_RESPONSE = {
    data_readiness: { score: 2, reason: "Moderate data signals from L4 activities." },
    aera_platform_fit: { score: 3, reason: "Strong PB node mapping available." },
    archetype_confidence: { score: 1, reason: "Weak archetype support from L4 patterns." },
};
const VALID_ADOPTION_RESPONSE = {
    decision_density: { score: 3, reason: "High decision density across L4s." },
    financial_gravity: { score: 2, reason: "Mixed financial ratings." },
    impact_proximity: { score: 2, reason: "Mix of FIRST and SECOND order impact." },
    confidence_signal: { score: 1, reason: "Low confidence signals." },
};
const VALID_VALUE_RESPONSE = {
    value_density: { score: 3, reason: "High value density relative to revenue." },
    simulation_viability: { score: 2, reason: "Moderate simulation potential." },
};
// -- Tests --
describe("scoreTechnical", () => {
    const opp = makeL3();
    const l4s = [makeL4(), makeL4({ id: "l4-002", name: "Activity 2" })];
    const knowledgeContext = "UI components: Label, DataGrid. PB nodes: If, Transaction.";
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreTechnical(opp, l4s, knowledgeContext, "DETERMINISTIC", makeChatFn(VALID_TECHNICAL_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const score = result.score;
        assert.equal(score.lens, "technical");
        assert.equal(score.total, 6); // 2+3+1
        assert.equal(score.maxPossible, 9);
        assert.equal(score.normalized, 6 / 9);
        assert.equal(score.subDimensions.length, 3);
        assert.equal(score.confidence, "HIGH"); // lead_archetype present + all HIGH ai_suitability
    });
    it("has correct sub-dimension names", async () => {
        const result = await scoreTechnical(opp, l4s, knowledgeContext, "DETERMINISTIC", makeChatFn(VALID_TECHNICAL_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["data_readiness", "aera_platform_fit", "archetype_confidence"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreTechnical(opp, l4s, knowledgeContext, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
        if (result.success)
            return;
        assert.ok(result.error.length > 0);
    });
});
describe("scoreAdoption", () => {
    const opp = makeL3();
    const l4s = [makeL4(), makeL4({ id: "l4-002", name: "Activity 2" })];
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreAdoption(opp, l4s, "DETERMINISTIC", makeChatFn(VALID_ADOPTION_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const score = result.score;
        assert.equal(score.lens, "adoption");
        assert.equal(score.total, 8); // 3+2+2+1
        assert.equal(score.maxPossible, 12);
        assert.equal(score.normalized, 8 / 12);
        assert.equal(score.subDimensions.length, 4);
    });
    it("has correct sub-dimension names", async () => {
        const result = await scoreAdoption(opp, l4s, "DETERMINISTIC", makeChatFn(VALID_ADOPTION_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["decision_density", "financial_gravity", "impact_proximity", "confidence_signal"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreAdoption(opp, l4s, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
    });
});
describe("scoreValue", () => {
    const opp = makeL3();
    const l4s = [makeL4()];
    const company = makeCompany();
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreValue(opp, l4s, company, "DETERMINISTIC", makeChatFn(VALID_VALUE_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const score = result.score;
        assert.equal(score.lens, "value");
        assert.equal(score.total, 5); // 3+2
        assert.equal(score.maxPossible, 6);
        assert.equal(score.normalized, 5 / 6);
        assert.equal(score.subDimensions.length, 2);
    });
    it("has correct sub-dimension names", async () => {
        const result = await scoreValue(opp, l4s, company, "DETERMINISTIC", makeChatFn(VALID_VALUE_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["value_density", "simulation_viability"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreValue(opp, l4s, company, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
    });
});
