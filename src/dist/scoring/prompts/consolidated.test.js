/**
 * Consolidated prompt builder tests.
 *
 * Verifies that buildConsolidatedPrompt produces the correct 2-message
 * structure with 4-layer system prompt and user message containing
 * deterministic score breakdown.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildConsolidatedPrompt } from "./consolidated.js";
// -- Test fixtures --
function makeSkill(overrides = {}) {
    return {
        id: "skill-001",
        name: "Automated Demand Forecast Adjustment",
        description: "Adjusts demand forecasts based on real-time signals",
        archetype: "DETERMINISTIC",
        max_value: 5_000_000,
        slider_percent: 50,
        overlap_group: null,
        value_metric: "forecast_accuracy",
        decision_made: "Adjust forecast parameters",
        aera_skill_pattern: "Rule-based exception handling",
        is_actual: false,
        source: null,
        loe: "Medium",
        savings_type: "efficiency",
        actions: [
            {
                action_type: "AUTOMATED",
                action_name: "Adjust Forecast",
                description: "Automatically adjusts demand forecast parameters based on exception triggers",
                target_system: "SAP IBP",
            },
        ],
        constraints: [
            {
                constraint_type: "DATA",
                constraint_name: "Historical Sales",
                description: "Requires 24 months of historical sales data",
                data_source: "SAP ECC",
            },
        ],
        execution: {
            target_systems: ["SAP IBP", "SAP ECC"],
            write_back_actions: ["update_forecast"],
            execution_trigger: "Exception alert",
            execution_frequency: "Daily",
            autonomy_level: "Semi-autonomous",
            approval_required: true,
            approval_threshold: ">10% deviation",
            rollback_strategy: "Revert to previous forecast",
        },
        problem_statement: {
            current_state: "Manual forecast adjustments take 3-5 days",
            quantified_pain: "$2M in lost revenue from delayed adjustments",
            root_cause: "No automated exception detection",
            falsifiability_check: "Can be measured by adjustment cycle time",
            outcome: "Same-day forecast adjustments",
        },
        differentiation: null,
        generated_at: null,
        prompt_version: null,
        is_cross_functional: false,
        cross_functional_scope: null,
        operational_flow: [],
        walkthrough_decision: null,
        walkthrough_actions: [],
        walkthrough_narrative: null,
        l4Name: "Demand Forecast Optimization",
        l4Id: "l4-001",
        l3Name: "Demand Planning",
        l2Name: "Supply Chain",
        l1Name: "Operations",
        financialRating: "HIGH",
        aiSuitability: "HIGH",
        impactOrder: "FIRST",
        ratingConfidence: "HIGH",
        decisionExists: true,
        decisionArticulation: "Whether to adjust forecast parameters",
        ...overrides,
    };
}
function makePreScore(overrides = {}) {
    return {
        l4Id: "l4-001",
        l4Name: "Demand Forecast Optimization",
        l3Name: "Demand Planning",
        l2Name: "Supply Chain",
        l1Name: "Operations",
        dimensions: {
            financial_signal: 0.85,
            ai_suitability: 0.75,
            decision_density: 0.60,
            impact_order: 1.0,
            rating_confidence: 0.80,
            archetype_completeness: 0.70,
        },
        composite: 0.7825,
        survived: true,
        eliminationReason: null,
        redFlags: [],
        skillCount: 3,
        aggregatedMaxValue: 15_000_000,
        ...overrides,
    };
}
// -- Tests --
describe("buildConsolidatedPrompt", () => {
    const skill = makeSkill();
    const preScore = makePreScore();
    const knowledgeContext = "## Aera Capabilities\n- Cortex Auto Forecast\n- STREAMS\n- Subject Areas\n\n## Platform Boundaries\nAera is NOT an ERP system.";
    it("should return exactly 2 messages (system + user)", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        assert.equal(messages.length, 2);
        assert.equal(messages[0].role, "system");
        assert.equal(messages[1].role, "user");
    });
    it("should include platform_fit rubric in system message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const system = messages[0].content;
        assert.ok(system.includes("platform_fit"), "Should mention platform_fit");
        assert.ok(system.includes("0 =") || system.includes("0="), "Should include score 0 rubric");
        assert.ok(system.includes("3 =") || system.includes("3="), "Should include score 3 rubric");
    });
    it("should include worked example JSON snippets in system message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const system = messages[0].content;
        assert.ok(system.includes("platform_fit"), "Examples should reference platform_fit");
        assert.ok(system.includes("sanity_verdict"), "Examples should reference sanity_verdict");
        assert.ok(system.includes("sanity_justification"), "Examples should reference sanity_justification");
        assert.ok(system.includes("confidence"), "Examples should reference confidence");
    });
    it("should include all 3 negative constraints in system message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const system = messages[0].content;
        assert.ok(system.includes("Do NOT score platform_fit >= 2 based on generic keyword overlap alone"), "Should include keyword overlap constraint");
        assert.ok(system.includes("Do NOT let sanity check override more than 2 dimensions"), "Should include sanity override constraint");
        assert.ok(system.includes("Do NOT assume all HIGH ai_suitability candidates deserve strong platform fit"), "Should include ai_suitability constraint");
    });
    it("should include confidence calibration in system message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const system = messages[0].content;
        assert.ok(system.includes("HIGH"), "Should mention HIGH confidence");
        assert.ok(system.includes("MEDIUM"), "Should mention MEDIUM confidence");
        assert.ok(system.includes("LOW"), "Should mention LOW confidence");
    });
    it("should include all 6 dimension names with scores in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("financial_signal"), "Should include financial_signal");
        assert.ok(user.includes("0.85"), "Should include financial_signal score");
        assert.ok(user.includes("ai_suitability"), "Should include ai_suitability");
        assert.ok(user.includes("0.75"), "Should include ai_suitability score");
        assert.ok(user.includes("decision_density"), "Should include decision_density");
        assert.ok(user.includes("0.60") || user.includes("0.6"), "Should include decision_density score");
        assert.ok(user.includes("impact_order"), "Should include impact_order");
        assert.ok(user.includes("rating_confidence"), "Should include rating_confidence");
        assert.ok(user.includes("0.80") || user.includes("0.8"), "Should include rating_confidence score");
        assert.ok(user.includes("archetype_completeness"), "Should include archetype_completeness");
        assert.ok(user.includes("0.70") || user.includes("0.7"), "Should include archetype_completeness score");
    });
    it("should include deterministic composite in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("0.7825"), "Should include composite score");
    });
    it("should include knowledge context in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("Cortex Auto Forecast"), "Should include knowledge context content");
        assert.ok(user.includes("STREAMS"), "Should include knowledge context content");
    });
    it("should include L4 activity name in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("Automated Demand Forecast Adjustment"), "Should include skill name");
    });
    it("should include hierarchy context in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("Operations"), "Should include L1");
        assert.ok(user.includes("Supply Chain"), "Should include L2");
        assert.ok(user.includes("Demand Planning"), "Should include L3");
        assert.ok(user.includes("Demand Forecast Optimization"), "Should include L4");
    });
    it("should include DISAGREE flagged_dimensions instruction in system message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const system = messages[0].content;
        assert.ok(system.includes("DISAGREE") && system.includes("flagged_dimensions"), "Should instruct DISAGREE to cite flagged_dimensions");
    });
    it("should include archetype in user message", () => {
        const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);
        const user = messages[1].content;
        assert.ok(user.includes("DETERMINISTIC"), "Should include archetype");
    });
});
