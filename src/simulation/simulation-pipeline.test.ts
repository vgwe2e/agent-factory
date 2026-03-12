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
import type { SimulationInput, ComponentMap, MockTest, IntegrationSurface } from "../types/simulation.js";
import type { ValidationResult } from "./validators/knowledge-validator.js";
import { TimeoutError } from "../infra/timeout.js";

// -- Test fixtures --

function makeSimulationInput(overrides: Partial<SimulationInput> & { name?: string; composite?: number } = {}): SimulationInput {
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
    } as unknown as SimulationInput["opportunity"],
    l4s: [],
    companyContext: { company_name: "TestCo", industry: "Manufacturing" } as SimulationInput["companyContext"],
    archetype: "DETERMINISTIC" as SimulationInput["archetype"],
    archetypeRoute: "deterministic-route",
    composite,
    ...overrides,
  };
}

const MOCK_COMPONENT_MAP: ComponentMap = {
  streams: [{ name: "Event Stream", confidence: "confirmed" }],
  cortex: [{ name: "Custom Model", confidence: "inferred" }],
  process_builder: [{ name: "Decision Node", confidence: "confirmed" }],
  agent_teams: [],
  ui: [{ name: "Dashboard", confidence: "confirmed" }],
};

const MOCK_VALIDATION: ValidationResult[] = [
  { component: "Event Stream", section: "streams", status: "confirmed", matchedTo: "Aera:event stream" },
  { component: "Custom Model", section: "cortex", status: "inferred" },
  { component: "Decision Node", section: "process_builder", status: "confirmed", matchedTo: "PB:Decision Node" },
  { component: "Dashboard", section: "ui", status: "confirmed", matchedTo: "UI:Dashboard" },
];

const MOCK_MOCK_TEST: MockTest = {
  decision: "Approve budget",
  input: { financial_context: { budget: 100000 }, trigger: "quarterly review" },
  expected_output: { action: "approve", outcome: "Budget approved" },
  rationale: "Standard approval flow",
};

const MOCK_INTEGRATION_SURFACE: IntegrationSurface = {
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

const mockDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => ({
  success: true as const,
  data: { mermaid: MOCK_MERMAID, attempts: 1 },
} as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string }));

const mockComponentMap = mock.fn(async (_input: SimulationInput, _ki: Map<string, string>, _url?: string) => ({
  success: true as const,
  data: { componentMap: MOCK_COMPONENT_MAP, validation: MOCK_VALIDATION, attempts: 1 },
} as { success: true; data: { componentMap: ComponentMap; validation: ValidationResult[]; attempts: number } } | { success: false; error: string }));

const mockMockTest = mock.fn(async (_input: SimulationInput, _url?: string) => ({
  success: true as const,
  data: { mockTest: MOCK_MOCK_TEST, attempts: 1 },
} as { success: true; data: { mockTest: MockTest; attempts: number } } | { success: false; error: string }));

const mockIntegrationSurface = mock.fn(async (_input: SimulationInput, _url?: string) => ({
  success: true as const,
  data: { integrationSurface: MOCK_INTEGRATION_SURFACE, attempts: 1 },
} as { success: true; data: { integrationSurface: IntegrationSurface; attempts: number } } | { success: false; error: string }));

const mockBuildKnowledgeIndex = mock.fn(() => new Map([["event stream", "Aera:event stream"]]));

// -- Tests --

describe("runSimulationPipeline", () => {
  let tmpDir: string;

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
    const callOrder: string[] = [];
    mockDecisionFlow.mock.mockImplementation(async (input: SimulationInput, _url?: string) => {
      callOrder.push(input.opportunity.l3_name);
      return { success: true as const, data: { mermaid: MOCK_MERMAID, attempts: 1 } } as
        { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string };
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
    mockDecisionFlow.mock.mockImplementation(async (_input: SimulationInput, _url?: string) => ({
      success: false as const,
      error: "LLM timeout",
    } as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string }));

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

describe("per-opportunity error isolation", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sim-isolation-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("when generator 2 throws for opp 1, opp 2 still runs all 4 generators", async () => {
    let cmCallCount = 0;
    const localDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => ({
      success: true as const,
      data: { mermaid: MOCK_MERMAID, attempts: 1 },
    } as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string }));

    const localComponentMap = mock.fn(async (_input: SimulationInput, _ki: Map<string, string>, _url?: string) => {
      cmCallCount++;
      if (cmCallCount === 1) throw new Error("Unexpected crash in generator 2");
      return {
        success: true as const,
        data: { componentMap: MOCK_COMPONENT_MAP, validation: MOCK_VALIDATION, attempts: 1 },
      } as { success: true; data: { componentMap: ComponentMap; validation: ValidationResult[]; attempts: number } } | { success: false; error: string };
    });

    const localMockTest = mock.fn(async (_input: SimulationInput, _url?: string) => ({
      success: true as const,
      data: { mockTest: MOCK_MOCK_TEST, attempts: 1 },
    } as { success: true; data: { mockTest: MockTest; attempts: number } } | { success: false; error: string }));

    const localIntSurface = mock.fn(async (_input: SimulationInput, _url?: string) => ({
      success: true as const,
      data: { integrationSurface: MOCK_INTEGRATION_SURFACE, attempts: 1 },
    } as { success: true; data: { integrationSurface: IntegrationSurface; attempts: number } } | { success: false; error: string }));

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [
      makeSimulationInput({ name: "Opp Crash", composite: 0.90 }),
      makeSimulationInput({ name: "Opp OK", composite: 0.80 }),
    ];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: localDecisionFlow,
      generateComponentMap: localComponentMap,
      generateMockTest: localMockTest,
      generateIntegrationSurface: localIntSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    });

    // Opp 1 failed (componentMap threw), opp 2 succeeded -- both in results
    assert.equal(result.results.length, 2);
    assert.equal(result.totalSimulated, 2);
    assert.equal(result.totalFailed, 1);
    // Opp 1: decisionFlow called (before crash), opp 2: all 4 generators called
    assert.equal(localDecisionFlow.mock.callCount(), 2);
    assert.equal(localMockTest.mock.callCount(), 1); // only opp 2
    assert.equal(localIntSurface.mock.callCount(), 1); // only opp 2
  });

  it("when all 4 generators fail for one opp, totalFailed increments and result has default artifacts", async () => {
    const throwingDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => {
      throw new Error("Generator crash");
    });
    const throwingComponentMap = mock.fn(async (_input: SimulationInput, _ki: Map<string, string>, _url?: string) => {
      throw new Error("Generator crash");
    });
    const throwingMockTest = mock.fn(async (_input: SimulationInput, _url?: string) => {
      throw new Error("Generator crash");
    });
    const throwingIntSurface = mock.fn(async (_input: SimulationInput, _url?: string) => {
      throw new Error("Generator crash");
    });

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [makeSimulationInput({ name: "All Fail", composite: 0.80 })];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: throwingDecisionFlow,
      generateComponentMap: throwingComponentMap,
      generateMockTest: throwingMockTest,
      generateIntegrationSurface: throwingIntSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    });

    assert.equal(result.totalFailed, 1);
    assert.equal(result.results.length, 1);
    // Default artifacts should be present
    assert.equal(result.results[0].artifacts.decisionFlow, "");
    assert.deepEqual(result.results[0].artifacts.componentMap.streams, []);
  });

  it("when timeoutMs is set and generators exceed it, TimeoutError is caught and remaining opps continue", async () => {
    // First opp hangs forever, second opp succeeds
    let oppIndex = 0;
    const slowDecisionFlow = mock.fn(async (input: SimulationInput, _url?: string) => {
      oppIndex++;
      if (oppIndex === 1) {
        // Simulate a hang by waiting longer than timeout
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      return {
        success: true as const,
        data: { mermaid: MOCK_MERMAID, attempts: 1 },
      } as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string };
    });

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [
      makeSimulationInput({ name: "Slow Opp", composite: 0.90 }),
      makeSimulationInput({ name: "Fast Opp", composite: 0.80 }),
    ];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: slowDecisionFlow,
      generateComponentMap: mockComponentMap,
      generateMockTest: mockMockTest,
      generateIntegrationSurface: mockIntegrationSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    }, { timeoutMs: 50 });

    assert.equal(result.totalSimulated, 2);
    assert.equal(result.totalFailed, 1);
    assert.equal(result.results.length, 2);
    // Fast opp should have succeeded
    assert.equal(result.results[1].l3Name, "Fast Opp");
  });

  it("when timeoutMs is NOT set, generators run without timeout wrapping", async () => {
    // Use a generator that takes 100ms -- should succeed without timeout
    const delayedDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true as const,
        data: { mermaid: MOCK_MERMAID, attempts: 1 },
      } as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string };
    });

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [makeSimulationInput({ name: "No Timeout", composite: 0.80 })];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: delayedDecisionFlow,
      generateComponentMap: mockComponentMap,
      generateMockTest: mockMockTest,
      generateIntegrationSurface: mockIntegrationSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    });
    // No options passed = no timeout = should succeed
    assert.equal(result.totalFailed, 0);
    assert.equal(result.totalSimulated, 1);
  });

  it("when timeout fires after generator 1, result includes default artifacts for remaining", async () => {
    // Decision flow succeeds fast, then component map hangs
    const fastDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => ({
      success: true as const,
      data: { mermaid: MOCK_MERMAID, attempts: 1 },
    } as { success: true; data: { mermaid: string; attempts: number } } | { success: false; error: string }));

    const hangingComponentMap = mock.fn(async (_input: SimulationInput, _ki: Map<string, string>, _url?: string) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return {
        success: true as const,
        data: { componentMap: MOCK_COMPONENT_MAP, validation: MOCK_VALIDATION, attempts: 1 },
      } as { success: true; data: { componentMap: ComponentMap; validation: ValidationResult[]; attempts: number } } | { success: false; error: string };
    });

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [makeSimulationInput({ name: "Partial Timeout", composite: 0.80 })];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: fastDecisionFlow,
      generateComponentMap: hangingComponentMap,
      generateMockTest: mockMockTest,
      generateIntegrationSurface: mockIntegrationSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    }, { timeoutMs: 50 });

    assert.equal(result.totalFailed, 1);
    assert.equal(result.results.length, 1);
    // Result should have default artifacts (timeout killed the whole opp block)
    assert.equal(result.results[0].artifacts.decisionFlow, "");
    assert.deepEqual(result.results[0].artifacts.componentMap.streams, []);
  });

  it("error count is returned so callers can track simulation failures", async () => {
    const throwingDecisionFlow = mock.fn(async (_input: SimulationInput, _url?: string) => {
      throw new Error("Unexpected error");
    });

    const pipeline = await import("./simulation-pipeline.js");
    const inputs = [
      makeSimulationInput({ name: "Fail Opp", composite: 0.90 }),
      makeSimulationInput({ name: "OK Opp", composite: 0.80 }),
    ];

    const result = await pipeline.runSimulationPipeline(inputs, tmpDir, undefined, {
      generateDecisionFlow: throwingDecisionFlow,
      generateComponentMap: mockComponentMap,
      generateMockTest: mockMockTest,
      generateIntegrationSurface: mockIntegrationSurface,
      buildKnowledgeIndex: mockBuildKnowledgeIndex,
    });

    // First opp throws, second opp also throws (same mock) -- both fail
    assert.equal(result.totalFailed, 2);
    assert.equal(result.totalSimulated, 2);
    assert.equal(typeof result.totalFailed, "number");
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
    runSimulationPipeline: (inputs: SimulationInput[], outputDir: string, ollamaUrl?: string) =>
      pipeline.runSimulationPipeline(inputs, outputDir, ollamaUrl, {
        generateDecisionFlow: mockDecisionFlow,
        generateComponentMap: mockComponentMap,
        generateMockTest: mockMockTest,
        generateIntegrationSurface: mockIntegrationSurface,
        buildKnowledgeIndex: mockBuildKnowledgeIndex,
      }),
  };
}
