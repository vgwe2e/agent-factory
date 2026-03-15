import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessSimulation, countAssessmentVerdicts } from "./assessment.js";
function makeScenarioSpec(overrides = {}) {
    return {
        objective: "Optimize replenishment decisions",
        trigger: "Inventory falls below target",
        decision: "Should the planner expedite replenishment?",
        expected_action: "Create a replenishment action item",
        expected_outcome: "Inventory gap is covered without excess stock",
        rationale: "Demand and supply conditions are known.",
        source_systems: [{ name: "SAP S/4HANA", status: "identified", type: "ERP" }],
        key_inputs: [{ name: "Inventory position", source: "SAP S/4HANA", purpose: "Measure shortage risk" }],
        happy_path: [
            { step: "Ingest inventory", stage: "ingest", component: "STREAMS", purpose: "Collect source data" },
            { step: "Analyze shortage", stage: "analyze", component: "Cortex", purpose: "Estimate urgency" },
            { step: "Create action", stage: "act", component: "Action Item", purpose: "Route recommendation" },
            { step: "Show result", stage: "surface", component: "Dashboard", purpose: "Display to user" },
        ],
        branches: [],
        ...overrides,
    };
}
function makeMockTest(overrides = {}) {
    return {
        decision: "Expedite replenishment",
        input: { financial_context: { impact: 1000 }, trigger: "inventory_low" },
        expected_output: { action: "expedite", outcome: "inventory restored" },
        rationale: "Stockout risk is too high.",
        ...overrides,
    };
}
function makeIntegrationSurface(overrides = {}) {
    return {
        source_systems: [{ name: "SAP S/4HANA", status: "identified", type: "ERP" }],
        aera_ingestion: [{ stream_name: "inventory", source: "SAP S/4HANA" }],
        processing: [{ component: "Cortex", type: "analytics", function: "Estimate shortage risk" }],
        ui_surface: [{ component: "Dashboard", purpose: "Show recommendation" }],
        ...overrides,
    };
}
describe("assessSimulation", () => {
    it("returns ADVANCE for a grounded, integration-ready scenario", () => {
        const assessment = assessSimulation({
            scenarioSpec: makeScenarioSpec(),
            mockTest: makeMockTest(),
            integrationSurface: makeIntegrationSurface(),
            confirmedCount: 6,
            inferredCount: 1,
            mermaidValid: true,
        });
        assert.equal(assessment.verdict, "ADVANCE");
        assert.ok(assessment.groundednessScore >= 80);
        assert.ok(assessment.integrationConfidenceScore >= 80);
        assert.ok(assessment.ambiguityRiskScore <= 20);
        assert.ok(assessment.implementationReadinessScore >= 70);
    });
    it("returns REVIEW for a mixed-confidence scenario", () => {
        const assessment = assessSimulation({
            scenarioSpec: makeScenarioSpec({
                source_systems: [
                    { name: "SAP S/4HANA", status: "identified", type: "ERP" },
                    { name: "Legacy pricing DB", status: "tbd", type: "Database" },
                ],
                key_inputs: [],
            }),
            mockTest: makeMockTest({ expected_output: { action: "", outcome: "inventory restored" } }),
            integrationSurface: makeIntegrationSurface({
                source_systems: [
                    { name: "SAP S/4HANA", status: "identified", type: "ERP" },
                    { name: "Legacy pricing DB", status: "tbd", type: "Database" },
                ],
                processing: [],
                ui_surface: [],
            }),
            confirmedCount: 3,
            inferredCount: 2,
            mermaidValid: true,
        });
        assert.equal(assessment.verdict, "REVIEW");
        assert.ok(assessment.ambiguityRiskScore >= 30);
        assert.ok(assessment.implementationReadinessScore >= 50);
    });
    it("returns HOLD for an ambiguous, weakly-grounded scenario", () => {
        const assessment = assessSimulation({
            scenarioSpec: makeScenarioSpec({
                source_systems: [{ name: "Unknown", status: "tbd" }],
                key_inputs: [],
            }),
            mockTest: makeMockTest({ decision: "", expected_output: { action: "", outcome: "" } }),
            integrationSurface: makeIntegrationSurface({
                source_systems: [{ name: "Unknown", status: "tbd" }],
                aera_ingestion: [],
                processing: [],
                ui_surface: [],
            }),
            confirmedCount: 0,
            inferredCount: 4,
            mermaidValid: false,
        });
        assert.equal(assessment.verdict, "HOLD");
        assert.ok(assessment.groundednessScore <= 10);
        assert.ok(assessment.integrationConfidenceScore <= 25);
        assert.ok(assessment.ambiguityRiskScore >= 80);
    });
});
describe("countAssessmentVerdicts", () => {
    it("counts verdict distribution", () => {
        const counts = countAssessmentVerdicts([
            { verdict: "ADVANCE" },
            { verdict: "ADVANCE" },
            { verdict: "REVIEW" },
            { verdict: "HOLD" },
            undefined,
        ]);
        assert.deepEqual(counts, {
            ADVANCE: 2,
            REVIEW: 1,
            HOLD: 1,
        });
    });
});
