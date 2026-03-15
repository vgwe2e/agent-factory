import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

import type { SimulationInput, ScenarioSpec } from "../types/simulation.js";
import type { SimulationLlmTarget } from "./llm-client.js";
import { renderScenarioArtifacts } from "./renderers.js";

function makeSimulationInput(
  overrides: Partial<SimulationInput> & { name?: string; composite?: number } = {},
): SimulationInput {
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
    companyContext: {
      company_name: "TestCo",
      industry: "Manufacturing",
      enterprise_applications: ["SAP S/4HANA", "Blue Yonder WMS"],
    } as SimulationInput["companyContext"],
    archetype: "DETERMINISTIC",
    archetypeRoute: "process",
    composite,
    ...overrides,
  };
}

function makeScenarioSpec(overrides: Partial<ScenarioSpec> = {}): ScenarioSpec {
  return {
    objective: "Stabilize inventory replenishment decisions",
    trigger: "A demand spike exceeds the replenishment threshold",
    decision: "Should Aera recommend an expedited replenishment action?",
    expected_action: "Create an Action Item for the planner to approve replenishment",
    expected_outcome: "Planner approves the replenishment recommendation",
    rationale: "Demand exceeds the threshold and inventory risk is rising.",
    source_systems: [
      { name: "SAP S/4HANA", type: "ERP", status: "identified" },
      { name: "Blue Yonder WMS", type: "WMS", status: "identified" },
    ],
    key_inputs: [
      {
        name: "Demand Orders",
        source: "SAP S/4HANA",
        purpose: "Detect the demand spike",
        preferred_stream_type: "Transaction Stream",
      },
      {
        name: "Inventory Position",
        source: "Blue Yonder WMS",
        purpose: "Check on-hand and in-transit supply",
        preferred_stream_type: "Reference Stream",
      },
    ],
    happy_path: [
      {
        step: "Ingest demand and inventory signals",
        stage: "ingest",
        component: "Event Stream",
        purpose: "Capture the latest operational signals.",
      },
      {
        step: "Analyze inventory risk",
        stage: "analyze",
        component: "Demand Analysis",
        purpose: "Estimate replenishment urgency.",
      },
      {
        step: "Evaluate replenishment policy",
        stage: "decide",
        component: "If",
        purpose: "Compare urgency to policy thresholds.",
      },
      {
        step: "Create the planner action item",
        stage: "act",
        component: "Action Item",
        purpose: "Route the recommendation for approval.",
      },
      {
        step: "Display the recommendation",
        stage: "surface",
        component: "Dashboard",
        purpose: "Show the planner the recommended action.",
      },
    ],
    branches: [
      {
        condition: "Policy threshold not met",
        response: "Send a notification for manual review",
        outcome: "Planner reviews the case manually",
      },
    ],
    ...overrides,
  };
}

describe("runSimulationPipeline", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sim-pipeline-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns zero counts for empty inputs", async () => {
    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const result = await runSimulationPipeline([], tmpDir);

    assert.equal(result.totalSimulated, 0);
    assert.equal(result.totalFailed, 0);
    assert.equal(result.totalConfirmed, 0);
    assert.equal(result.totalInferred, 0);
    assert.deepEqual(result.results, []);
  });

  it("processes inputs sorted by composite descending", async () => {
    const callOrder: string[] = [];
    const specFn = mock.fn(async (input: SimulationInput, _llmTarget?: SimulationLlmTarget) => {
      callOrder.push(input.opportunity?.l3_name ?? input.l4Activity?.name ?? "unknown");
      return {
        success: true as const,
        data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
      };
    });

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    await runSimulationPipeline(
      [
        makeSimulationInput({ name: "Low Score", composite: 0.65 }),
        makeSimulationInput({ name: "High Score", composite: 0.90 }),
      ],
      tmpDir,
      undefined,
      {
        generateScenarioSpec: specFn,
        buildKnowledgeIndex: () => new Map([["event stream", "Aera:event stream"], ["dashboard", "UI:Dashboard"], ["if", "PB:If"], ["action item", "PB:Action Item"]]),
      },
    );

    assert.deepEqual(callOrder, ["High Score", "Low Score"]);
  });

  it("writes scenario-spec and all four artifact files per opportunity", async () => {
    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    await runSimulationPipeline(
      [makeSimulationInput({ name: "File Write Test" })],
      tmpDir,
      undefined,
      {
        generateScenarioSpec: async () => ({
          success: true as const,
          data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
        }),
        buildKnowledgeIndex: () => new Map([["event stream", "Aera:event stream"], ["dashboard", "UI:Dashboard"], ["if", "PB:If"], ["action item", "PB:Action Item"]]),
      },
    );

    const dir = path.join(tmpDir, "file-write-test");
    assert.ok(fs.existsSync(path.join(dir, "scenario-spec.yaml")));
    assert.ok(fs.existsSync(path.join(dir, "simulation-assessment.yaml")));
    assert.ok(fs.existsSync(path.join(dir, "decision-flow.mmd")));
    assert.ok(fs.existsSync(path.join(dir, "component-map.yaml")));
    assert.ok(fs.existsSync(path.join(dir, "mock-test.yaml")));
    assert.ok(fs.existsSync(path.join(dir, "integration-surface.yaml")));
  });

  it("writes valid YAML for component map, mock test, integration surface, and scenario spec", async () => {
    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    await runSimulationPipeline(
      [makeSimulationInput({ name: "YAML Validation" })],
      tmpDir,
      undefined,
      {
        generateScenarioSpec: async () => ({
          success: true as const,
          data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
        }),
        buildKnowledgeIndex: () => new Map([["event stream", "Aera:event stream"], ["dashboard", "UI:Dashboard"], ["if", "PB:If"], ["action item", "PB:Action Item"]]),
      },
    );

    const dir = path.join(tmpDir, "yaml-validation");
    for (const filename of [
      "scenario-spec.yaml",
      "simulation-assessment.yaml",
      "component-map.yaml",
      "mock-test.yaml",
      "integration-surface.yaml",
    ]) {
      const parsed = yaml.load(fs.readFileSync(path.join(dir, filename), "utf-8"));
      assert.ok(parsed !== null && typeof parsed === "object", `${filename} should parse as YAML`);
    }
  });

  it("aggregates confirmed and inferred counts across all opportunities", async () => {
    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const result = await runSimulationPipeline(
      [
        makeSimulationInput({ name: "Opp A", composite: 0.80 }),
        makeSimulationInput({ name: "Opp B", composite: 0.70 }),
      ],
      tmpDir,
      undefined,
      {
        generateScenarioSpec: async () => ({
          success: true as const,
          data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
        }),
        buildKnowledgeIndex: () => new Map([
          ["event stream", "Aera:event stream"],
          ["dashboard", "UI:Dashboard"],
          ["if", "PB:If"],
          ["action item", "PB:Action Item"],
        ]),
      },
    );

    assert.equal(result.totalSimulated, 2);
    assert.equal(result.results.length, 2);
    assert.ok(result.totalConfirmed >= 6);
    assert.ok(result.totalInferred >= 2);
    assert.ok(result.results.every((entry) => entry.assessment), "each result should include an assessment");
  });

  it("builds knowledge index once and passes through reused artifacts on rerun", async () => {
    const buildKnowledgeIndex = mock.fn(() =>
      new Map([
        ["event stream", "Aera:event stream"],
        ["dashboard", "UI:Dashboard"],
        ["if", "PB:If"],
        ["action item", "PB:Action Item"],
      ]),
    );
    const generateScenarioSpec = mock.fn(async () => ({
      success: true as const,
      data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
    }));

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const inputs = [
      makeSimulationInput({ name: "Reuse Existing", composite: 0.81 }),
    ];

    await runSimulationPipeline(inputs, tmpDir, undefined, {
      generateScenarioSpec,
      buildKnowledgeIndex,
    });

    generateScenarioSpec.mock.resetCalls();

    const second = await runSimulationPipeline(inputs, tmpDir, undefined, {
      generateScenarioSpec,
      buildKnowledgeIndex,
    });

    assert.equal(buildKnowledgeIndex.mock.callCount(), 2);
    assert.equal(generateScenarioSpec.mock.callCount(), 0);
    assert.equal(second.results.length, 1);
    assert.equal(second.results[0].l3Name, "Reuse Existing");
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

  it("when scenario generation throws for opp 1, opp 2 still completes", async () => {
    let callCount = 0;
    const generateScenarioSpec = mock.fn(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Scenario generation crashed");
      }
      return {
        success: true as const,
        data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
      };
    });

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const result = await runSimulationPipeline(
      [
        makeSimulationInput({ name: "Opp Crash", composite: 0.90 }),
        makeSimulationInput({ name: "Opp OK", composite: 0.80 }),
      ],
      tmpDir,
      undefined,
      {
        generateScenarioSpec,
        buildKnowledgeIndex: () => new Map([["event stream", "Aera:event stream"], ["dashboard", "UI:Dashboard"], ["if", "PB:If"], ["action item", "PB:Action Item"]]),
      },
    );

    assert.equal(result.totalSimulated, 2);
    assert.equal(result.totalFailed, 1);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[1].l3Name, "Opp OK");
  });

  it("when timeoutMs is set and generation exceeds it, TimeoutError is caught and remaining opps continue", async () => {
    let oppIndex = 0;
    const generateScenarioSpec = mock.fn(async (
      _input: SimulationInput,
      _llmTarget?: SimulationLlmTarget,
      signal?: AbortSignal,
    ) => {
      oppIndex++;
      if (oppIndex === 1) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 5000);
          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(signal.reason instanceof Error ? signal.reason : new Error("aborted"));
            },
            { once: true },
          );
        });
      }

      return {
        success: true as const,
        data: { scenarioSpec: makeScenarioSpec(), attempts: 1 },
      };
    });

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const result = await runSimulationPipeline(
      [
        makeSimulationInput({ name: "Slow Opp", composite: 0.90 }),
        makeSimulationInput({ name: "Fast Opp", composite: 0.80 }),
      ],
      tmpDir,
      undefined,
      {
        generateScenarioSpec,
        buildKnowledgeIndex: () => new Map([["event stream", "Aera:event stream"], ["dashboard", "UI:Dashboard"], ["if", "PB:If"], ["action item", "PB:Action Item"]]),
      },
      { timeoutMs: 50 },
    );

    assert.equal(result.totalSimulated, 2);
    assert.equal(result.totalFailed, 1);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[1].l3Name, "Fast Opp");
  });

  it("reuses artifact directories created outside the current process", async () => {
    const input = makeSimulationInput({ name: "Prebuilt Reuse", composite: 0.80 });
    const scenarioSpec = makeScenarioSpec();
    const knowledgeIndex = new Map([
      ["event stream", "Aera:event stream"],
      ["dashboard", "UI:Dashboard"],
      ["if", "PB:If"],
      ["action item", "PB:Action Item"],
    ]);
    const rendered = renderScenarioArtifacts(input, scenarioSpec, knowledgeIndex);
    const dir = path.join(tmpDir, "prebuilt-reuse");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "scenario-spec.yaml"), yaml.dump(scenarioSpec), "utf-8");
    fs.writeFileSync(path.join(dir, "decision-flow.mmd"), rendered.artifacts.decisionFlow, "utf-8");
    fs.writeFileSync(path.join(dir, "component-map.yaml"), yaml.dump(rendered.artifacts.componentMap), "utf-8");
    fs.writeFileSync(path.join(dir, "mock-test.yaml"), yaml.dump(rendered.artifacts.mockTest), "utf-8");
    fs.writeFileSync(path.join(dir, "integration-surface.yaml"), yaml.dump(rendered.artifacts.integrationSurface), "utf-8");

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const generateScenarioSpec = mock.fn(async () => ({
      success: true as const,
      data: { scenarioSpec, attempts: 1 },
    }));
    const result = await runSimulationPipeline(
      [input],
      tmpDir,
      undefined,
      {
        generateScenarioSpec,
        buildKnowledgeIndex: () => knowledgeIndex,
      },
    );

    assert.equal(generateScenarioSpec.mock.callCount(), 0);
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].l3Name, "Prebuilt Reuse");
  });

  it("does not reuse legacy artifact directories that are missing scenario-spec.yaml", async () => {
    const input = makeSimulationInput({ name: "Legacy Rebuild", composite: 0.80 });
    const scenarioSpec = makeScenarioSpec();
    const knowledgeIndex = new Map([
      ["event stream", "Aera:event stream"],
      ["dashboard", "UI:Dashboard"],
      ["if", "PB:If"],
      ["action item", "PB:Action Item"],
    ]);
    const rendered = renderScenarioArtifacts(input, scenarioSpec, knowledgeIndex);
    const dir = path.join(tmpDir, "legacy-rebuild");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "decision-flow.mmd"), rendered.artifacts.decisionFlow, "utf-8");
    fs.writeFileSync(path.join(dir, "component-map.yaml"), yaml.dump(rendered.artifacts.componentMap), "utf-8");
    fs.writeFileSync(path.join(dir, "mock-test.yaml"), yaml.dump(rendered.artifacts.mockTest), "utf-8");
    fs.writeFileSync(path.join(dir, "integration-surface.yaml"), yaml.dump(rendered.artifacts.integrationSurface), "utf-8");

    const generateScenarioSpec = mock.fn(async () => ({
      success: true as const,
      data: { scenarioSpec, attempts: 1 },
    }));

    const { runSimulationPipeline } = await import("./simulation-pipeline.js");
    const result = await runSimulationPipeline(
      [input],
      tmpDir,
      undefined,
      {
        generateScenarioSpec,
        buildKnowledgeIndex: () => knowledgeIndex,
      },
    );

    assert.equal(generateScenarioSpec.mock.callCount(), 1);
    assert.equal(result.results.length, 1);
    assert.ok(fs.existsSync(path.join(dir, "scenario-spec.yaml")));
  });
});
