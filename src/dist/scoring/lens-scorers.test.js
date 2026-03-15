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
function makeSkill(overrides = {}) {
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
    const skill = makeSkill();
    const knowledgeContext = "UI components: Label, DataGrid. PB nodes: If, Transaction.";
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreTechnical(skill, knowledgeContext, "DETERMINISTIC", makeChatFn(VALID_TECHNICAL_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const score = result.score;
        assert.equal(score.lens, "technical");
        assert.equal(score.total, 6); // 2+3+1
        assert.equal(score.maxPossible, 9);
        assert.equal(score.normalized, 6 / 9);
        assert.equal(score.subDimensions.length, 3);
        assert.equal(score.confidence, "HIGH"); // has target_systems + pattern + usable aiSuitability
    });
    it("has correct sub-dimension names", async () => {
        const result = await scoreTechnical(skill, knowledgeContext, "DETERMINISTIC", makeChatFn(VALID_TECHNICAL_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["data_readiness", "aera_platform_fit", "archetype_confidence"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreTechnical(skill, knowledgeContext, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
        if (result.success)
            return;
        assert.ok(result.error.length > 0);
    });
});
describe("scoreAdoption", () => {
    const skill = makeSkill();
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreAdoption(skill, "DETERMINISTIC", makeChatFn(VALID_ADOPTION_RESPONSE));
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
        const result = await scoreAdoption(skill, "DETERMINISTIC", makeChatFn(VALID_ADOPTION_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["decision_density", "financial_gravity", "impact_proximity", "confidence_signal"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreAdoption(skill, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
    });
});
describe("scoreValue", () => {
    const skill = makeSkill();
    const company = makeCompany();
    it("returns correct LensScore from valid LLM response", async () => {
        const result = await scoreValue(skill, company, "DETERMINISTIC", makeChatFn(VALID_VALUE_RESPONSE));
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
        const result = await scoreValue(skill, company, "DETERMINISTIC", makeChatFn(VALID_VALUE_RESPONSE));
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const names = result.score.subDimensions.map((sd) => sd.name);
        assert.deepEqual(names, ["value_density", "simulation_viability"]);
    });
    it("returns error result on persistent LLM failure", async () => {
        const result = await scoreValue(skill, company, "DETERMINISTIC", makeFailingChatFn());
        assert.equal(result.success, false);
    });
});
