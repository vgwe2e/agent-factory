/**
 * Integration tests for the simulation pipeline orchestrator.
 *
 * All four generators are mocked at the module level to test
 * pipeline orchestration logic: filtering, sorting, file writing,
 * partial failure handling, and result aggregation.
 */
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import yaml from "js-yaml";
// -- Test fixtures --
function makeSimulationInput(overrides = {}) {
    const name = overrides.name ?? "Test Opportunity";
    const composite = overrides.composite ?? 0.75;
    return {
        opportunity: {
            l3_name: name,
            l3_id: "L3-001",
            parent_l2: "L2-001",
            parent_l1: "L1-001",
            l2_name: "Test L2",
            l1_name: "Test L1",
            combined_max_value: 5_000_000,
            impact_order: "FIRST",
            lead_archetype: "DETERMINISTIC",
            implementation_complexity: "LOW",
            ai_suitability: "HIGH",
            quick_win: true,
            decision_articulation: null,
            opportunity_name: name,
            opportunity_summary: "Test summary",
            opportunity_exists: true,
            supporting_archetypes: [],
            l4_count: 0,
            total_value: 5_000_000,
            avg_confidence: 0.8,
            ai_suitability_counts: { HIGH: 1, MEDIUM: 0, LOW: 0, NOT_APPLICABLE: 0 },
        },
        l4s: [],
        companyContext: { company_name: "TestCo", industry: "Manufacturing" },
        archetype: "DETERMINISTIC",
        archetypeRoute: "deterministic-route",
        composite,
        ...overrides,
    };
}
const MOCK_COMPONENT_MAP = {
    streams: [{ name: "Event Stream", confidence: "confirmed" }],
    cortex: [{ name: "Custom Model", confidence: "inferred" }],
    process_builder: [{ name: "Decision Node", confidence: "confirmed" }],
    agent_teams: [],
    ui: [{ name: "Dashboard", confidence: "confirmed" }],
};
const MOCK_VALIDATION = [
    { component: "Event Stream", section: "streams", status: "confirmed", matchedTo: "Aera:event stream" },
    { component: "Custom Model", section: "cortex", status: "inferred" },
    { component: "Decision Node", section: "process_builder", status: "confirmed", matchedTo: "PB:Decision Node" },
    { component: "Dashboard", section: "ui", status: "confirmed", matchedTo: "UI:Dashboard" },
];
const MOCK_MOCK_TEST = {
    decision: "Approve budget",
    input: { financial_context: { budget: 100000 }, trigger: "quarterly review" },
    expected_output: { action: "approve", outcome: "Budget approved" },
    rationale: "Standard approval flow",
};
const MOCK_INTEGRATION_SURFACE = {
    source_systems: [{ name: "SAP", type: "ERP", status: "identified" }],
    aera_ingestion: [{ stream_name: "financials", stream_type: "transaction", source: "SAP" }],
    processing: [{ component: "Budget Cortex", type: "cortex", function: "analyze" }],
    ui_surface: [{ component: "Budget Dashboard", screen: "main", purpose: "display" }],
};
const MOCK_MERMAID = `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Approve]
  B -->|No| D[Reject]`;
// -- Mocked generator modules --
const mockDecisionFlow = mock.fn(async (_input, _url) => ({
    success: true,
    data: { mermaid: MOCK_MERMAID, attempts: 1 },
}));
const mockComponentMap = mock.fn(async (_input, _ki, _url) => ({
    success: true,
    data: { componentMap: MOCK_COMPONENT_MAP, validation: MOCK_VALIDATION, attempts: 1 },
}));
const mockMockTest = mock.fn(async (_input, _url) => ({
    success: true,
    data: { mockTest: MOCK_MOCK_TEST, attempts: 1 },
}));
const mockIntegrationSurface = mock.fn(async (_input, _url) => ({
    success: true,
    data: { integrationSurface: MOCK_INTEGRATION_SURFACE, attempts: 1 },
}));
const mockBuildKnowledgeIndex = mock.fn(() => new Map([["event stream", "Aera:event stream"]]));
// -- Tests --
describe("runSimulationPipeline", () => {
    let tmpDir;
    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sim-pipeline-"));
        mockDecisionFlow.mock.resetCalls();
        mockComponentMap.mock.resetCalls();
        mockMockTest.mock.resetCalls();
        mockIntegrationSurface.mock.resetCalls();
        mockBuildKnowledgeIndex.mock.resetCalls();
    });
    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
    it("returns zero counts for empty inputs", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const result = await runSimulationPipeline([], tmpDir);
        assert.equal(result.totalSimulated, 0);
        assert.equal(result.totalFailed, 0);
        assert.equal(result.totalConfirmed, 0);
        assert.equal(result.totalInferred, 0);
        assert.deepEqual(result.results, []);
    });
    it("processes inputs sorted by composite descending", async () => {
        const callOrder = [];
        mockDecisionFlow.mock.mockImplementation(async (input, _url) => {
            callOrder.push(input.opportunity.l3_name);
            return { success: true, data: { mermaid: MOCK_MERMAID, attempts: 1 } };
        });
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [
            makeSimulationInput({ name: "Low Score", composite: 0.65 }),
            makeSimulationInput({ name: "High Score", composite: 0.90 }),
        ];
        await runSimulationPipeline(inputs, tmpDir);
        assert.equal(callOrder[0], "High Score");
        assert.equal(callOrder[1], "Low Score");
    });
    it("writes all 4 artifact files per opportunity", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [makeSimulationInput({ name: "File Write Test" })];
        await runSimulationPipeline(inputs, tmpDir);
        const slug = "file-write-test";
        const dir = path.join(tmpDir, slug);
        assert.ok(fs.existsSync(path.join(dir, "decision-flow.mmd")));
        assert.ok(fs.existsSync(path.join(dir, "component-map.yaml")));
        assert.ok(fs.existsSync(path.join(dir, "mock-test.yaml")));
        assert.ok(fs.existsSync(path.join(dir, "integration-surface.yaml")));
    });
    it("writes valid YAML for component map, mock test, and integration surface", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [makeSimulationInput({ name: "YAML Validation" })];
        await runSimulationPipeline(inputs, tmpDir);
        const slug = "yaml-validation";
        const dir = path.join(tmpDir, slug);
        const compMap = yaml.load(fs.readFileSync(path.join(dir, "component-map.yaml"), "utf-8"));
        assert.ok(compMap !== null && typeof compMap === "object");
        const mockTest = yaml.load(fs.readFileSync(path.join(dir, "mock-test.yaml"), "utf-8"));
        assert.ok(mockTest !== null && typeof mockTest === "object");
        const intSurface = yaml.load(fs.readFileSync(path.join(dir, "integration-surface.yaml"), "utf-8"));
        assert.ok(intSurface !== null && typeof intSurface === "object");
    });
    it("handles partial generator failure gracefully", async () => {
        mockDecisionFlow.mock.mockImplementation(async (_input, _url) => ({
            success: false,
            error: "LLM timeout",
        }));
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [makeSimulationInput({ name: "Partial Fail" })];
        const result = await runSimulationPipeline(inputs, tmpDir);
        // Decision flow failed, but others should succeed
        const slug = "partial-fail";
        const dir = path.join(tmpDir, slug);
        assert.ok(!fs.existsSync(path.join(dir, "decision-flow.mmd")));
        assert.ok(fs.existsSync(path.join(dir, "component-map.yaml")));
        assert.ok(fs.existsSync(path.join(dir, "mock-test.yaml")));
        assert.ok(fs.existsSync(path.join(dir, "integration-surface.yaml")));
        // Result should still be counted, with mermaidValid=false
        assert.equal(result.results.length, 1);
        assert.equal(result.results[0].validationSummary.mermaidValid, false);
        assert.equal(result.totalSimulated, 1);
    });
    it("creates output directories with correct slug names", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [
            makeSimulationInput({ name: "Revenue Optimization & Analysis" }),
        ];
        await runSimulationPipeline(inputs, tmpDir);
        const expectedSlug = "revenue-optimization-analysis";
        assert.ok(fs.existsSync(path.join(tmpDir, expectedSlug)));
    });
    it("aggregates confirmed and inferred counts across all opportunities", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [
            makeSimulationInput({ name: "Opp A", composite: 0.80 }),
            makeSimulationInput({ name: "Opp B", composite: 0.70 }),
        ];
        const result = await runSimulationPipeline(inputs, tmpDir);
        // Each opp has 3 confirmed + 1 inferred from MOCK_VALIDATION
        assert.equal(result.totalConfirmed, 6);
        assert.equal(result.totalInferred, 2);
        assert.equal(result.totalSimulated, 2);
        assert.equal(result.results.length, 2);
    });
    it("builds knowledge index once and passes to all component map calls", async () => {
        const { runSimulationPipeline } = await loadPipelineWithMocks();
        const inputs = [
            makeSimulationInput({ name: "KI Reuse A", composite: 0.80 }),
            makeSimulationInput({ name: "KI Reuse B", composite: 0.70 }),
        ];
        await runSimulationPipeline(inputs, tmpDir);
        // buildKnowledgeIndex called exactly once
        assert.equal(mockBuildKnowledgeIndex.mock.callCount(), 1);
        // componentMap called twice (once per opp), each with the knowledge index
        assert.equal(mockComponentMap.mock.callCount(), 2);
    });
});
/**
 * Load the pipeline module with mocked generator dependencies.
 * Uses dynamic import with mock.module to replace generators at module level.
 */
async function loadPipelineWithMocks() {
    // We use a direct approach: import the module and replace its dependencies
    // via mock.module (Node 22+) or manual injection
    const pipeline = await import("./simulation-pipeline.js");
    // Inject mocked functions via the module's test hook
    return {
        runSimulationPipeline: (inputs, outputDir, ollamaUrl) => pipeline.runSimulationPipeline(inputs, outputDir, ollamaUrl, {
            generateDecisionFlow: mockDecisionFlow,
            generateComponentMap: mockComponentMap,
            generateMockTest: mockMockTest,
            generateIntegrationSurface: mockIntegrationSurface,
            buildKnowledgeIndex: mockBuildKnowledgeIndex,
        }),
    };
}
