/**
 * Tests for extractScoringSkills utility.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildScoringHierarchy, extractScoringSkills } from "./extract-skills.js";
function makeSkill(overrides = {}) {
    return {
        id: "skill-001",
        name: "Test Skill",
        description: "A test skill",
        archetype: "DETERMINISTIC",
        max_value: 1_000_000,
        slider_percent: 0.5,
        overlap_group: null,
        value_metric: "COGS",
        decision_made: "Test decision",
        aera_skill_pattern: "Test Pattern",
        is_actual: false,
        source: null,
        loe: "HIGH",
        savings_type: "RECURRING",
        actions: [],
        constraints: [],
        execution: {
            target_systems: ["ERP"],
            write_back_actions: ["Create order"],
            execution_trigger: "REAL_TIME",
            execution_frequency: null,
            autonomy_level: "SEMI_AUTONOMOUS",
            approval_required: true,
            approval_threshold: null,
            rollback_strategy: null,
        },
        problem_statement: {
            current_state: "Manual process",
            quantified_pain: "High cost",
            root_cause: "No automation",
            falsifiability_check: "Check if automated",
            outcome: "Automated process",
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
        ...overrides,
    };
}
function makeL4(l3, name, skills = [], overrides = {}) {
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
        skills,
        ...overrides,
    };
}
describe("extractScoringSkills", () => {
    it("returns empty array for empty hierarchy", () => {
        const result = extractScoringSkills([]);
        assert.deepStrictEqual(result, []);
    });
    it("skips L4 activities with no skills", () => {
        const hierarchy = [makeL4("L3-A", "Act-1", [])];
        const result = extractScoringSkills(hierarchy);
        assert.equal(result.length, 0);
    });
    it("extracts skills with parent L4 context attached", () => {
        const skill = makeSkill({ id: "s1", name: "Skill Alpha" });
        const l4 = makeL4("L3-A", "Activity One", [skill], {
            l1: "Plan",
            l2: "Demand Planning",
            financial_rating: "MEDIUM",
            ai_suitability: "LOW",
        });
        const result = extractScoringSkills([l4]);
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "s1");
        assert.equal(result[0].name, "Skill Alpha");
        assert.equal(result[0].l4Name, "Activity One");
        assert.equal(result[0].l4Id, "L3-A-Activity One");
        assert.equal(result[0].l3Name, "L3-A");
        assert.equal(result[0].l2Name, "Demand Planning");
        assert.equal(result[0].l1Name, "Plan");
        assert.equal(result[0].financialRating, "MEDIUM");
        assert.equal(result[0].aiSuitability, "LOW");
        assert.equal(result[0].impactOrder, "FIRST");
        assert.equal(result[0].ratingConfidence, "HIGH");
        assert.equal(result[0].decisionExists, true);
    });
    it("flattens multiple skills from multiple L4s", () => {
        const s1 = makeSkill({ id: "s1", name: "Skill A" });
        const s2 = makeSkill({ id: "s2", name: "Skill B" });
        const s3 = makeSkill({ id: "s3", name: "Skill C" });
        const hierarchy = [
            makeL4("L3-X", "Act-1", [s1, s2]),
            makeL4("L3-Y", "Act-2", [s3]),
            makeL4("L3-Z", "Act-3", []), // no skills
        ];
        const result = extractScoringSkills(hierarchy);
        assert.equal(result.length, 3);
        assert.deepStrictEqual(result.map(r => r.id), ["s1", "s2", "s3"]);
    });
    it("preserves skill archetype from the skill object", () => {
        const skill = makeSkill({ archetype: "AGENTIC" });
        const result = extractScoringSkills([makeL4("L3-A", "Act-1", [skill])]);
        assert.equal(result[0].archetype, "AGENTIC");
    });
    it("adds cross-functional skills as synthetic L4 activities", () => {
        const hierarchy = [makeL4("L3-A", "Act-1", [makeSkill({ id: "embedded-1" })])];
        const cfSkill = makeSkill({
            id: "cf-001",
            name: "Cross-Plant Load Balancing",
            is_cross_functional: true,
            source: "value_flow",
            max_value: 25_000_000,
            decision_made: "Balance work across plants",
            cross_functional_scope: {
                l1_domains: ["Make", "Plan", "Move & Fulfill"],
            },
        });
        const data = {
            meta: {},
            company_context: {},
            hierarchy,
            l3_opportunities: [],
            cross_functional_skills: [cfSkill],
        };
        const scoringHierarchy = buildScoringHierarchy(data);
        assert.equal(scoringHierarchy.length, 2);
        const synthetic = scoringHierarchy[1];
        assert.equal(synthetic.id, "cf-001");
        assert.equal(synthetic.name, "Cross-Plant Load Balancing");
        assert.equal(synthetic.l1, "Cross-Functional");
        assert.equal(synthetic.l2, "Value Flow");
        assert.equal(synthetic.l3, "Cross-Functional: Make + Plan + Move & Fulfill");
        assert.equal(synthetic.financial_rating, "HIGH");
        assert.equal(synthetic.ai_suitability, "MEDIUM");
        assert.equal(synthetic.skills.length, 1);
    });
    it("extracts cross-functional skills with synthetic parent context", () => {
        const cfSkill = makeSkill({
            id: "cf-002",
            name: "Real-Time ATP Orchestration",
            is_cross_functional: true,
            source: "feedback_loop",
            max_value: 25_000_000,
            decision_made: "Route ATP decisions across domains",
            cross_functional_scope: {
                l1_domains: ["Order Domain", "Plan", "Move & Fulfill", "Procure Source & Buy"],
            },
        });
        const data = {
            meta: {},
            company_context: {},
            hierarchy: [],
            l3_opportunities: [],
            cross_functional_skills: [cfSkill],
        };
        const result = extractScoringSkills(buildScoringHierarchy(data));
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "cf-002");
        assert.equal(result[0].l4Name, "Real-Time ATP Orchestration");
        assert.equal(result[0].l4Id, "cf-002");
        assert.equal(result[0].l1Name, "Cross-Functional");
        assert.equal(result[0].l2Name, "Feedback Loop");
        assert.equal(result[0].l3Name, "Cross-Functional: Order Domain + Plan + Move & Fulfill + Procure Source & Buy");
        assert.equal(result[0].financialRating, "HIGH");
        assert.equal(result[0].decisionExists, true);
    });
    it("backfills embedded confidence when the export collapses all L4s to LOW", () => {
        const richSkill = makeSkill({
            id: "embedded-rich",
            actions: [{ action_type: "notify", action_name: "notify", description: "notify" }],
            constraints: [{ constraint_type: "threshold", constraint_name: "threshold", description: "threshold" }],
        });
        const sparseSkill = makeSkill({
            id: "embedded-sparse",
            decision_made: null,
            execution: null,
            problem_statement: null,
            actions: [],
            constraints: [],
            walkthrough_decision: null,
            walkthrough_narrative: null,
        });
        const data = {
            meta: {},
            company_context: {},
            hierarchy: [
                makeL4("L3-A", "Rich", [richSkill], { rating_confidence: "LOW", ai_suitability: "HIGH" }),
                makeL4("L3-B", "Sparse", [sparseSkill], { rating_confidence: "LOW", ai_suitability: "LOW", decision_exists: false }),
            ],
            l3_opportunities: [],
            cross_functional_skills: [],
        };
        const scoringHierarchy = buildScoringHierarchy(data);
        assert.equal(scoringHierarchy[0].rating_confidence, "HIGH");
        assert.equal(scoringHierarchy[1].rating_confidence, "LOW");
    });
    it("preserves embedded confidence when the export already has a real mix", () => {
        const data = {
            meta: {},
            company_context: {},
            hierarchy: [
                makeL4("L3-A", "High", [makeSkill({ id: "high" })], { rating_confidence: "HIGH" }),
                makeL4("L3-B", "Low", [makeSkill({ id: "low" })], { rating_confidence: "LOW" }),
            ],
            l3_opportunities: [],
            cross_functional_skills: [],
        };
        const scoringHierarchy = buildScoringHierarchy(data);
        assert.equal(scoringHierarchy[0].rating_confidence, "HIGH");
        assert.equal(scoringHierarchy[1].rating_confidence, "LOW");
    });
});
