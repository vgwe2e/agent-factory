/**
 * Integration tests for pipeline runner.
 *
 * Uses dependency injection to mock: parseExport, chatFn, fetchFn.
 * Verifies end-to-end pipeline flow with model switching, context
 * tracking, error resilience, and structured logging.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { runPipeline } from "./pipeline-runner.js";
import type { PipelineOptions, PipelineResult } from "./pipeline-runner.js";
import { createLogger } from "../infra/logger.js";
import type { HierarchyExport, L3Opportunity, L4Activity } from "../types/hierarchy.js";
import type { ChatResult } from "../scoring/ollama-client.js";
import { loadCheckpoint, saveCheckpoint } from "../infra/checkpoint.js";
import type { Checkpoint } from "../infra/checkpoint.js";
import type { SimulationInput } from "../types/simulation.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { CostTracker, CostSummary } from "../infra/cost-tracker.js";
import type { ScoringResult } from "../types/scoring.js";

// -- Fixtures --

function makeL4(l3: string, l2: string, l1: string, name: string, overrides: Partial<L4Activity> = {}): L4Activity {
  return {
    id: `${l3}-${name}`,
    name,
    description: `Description of ${name}`,
    l1,
    l2,
    l3,
    financial_rating: "HIGH",
    value_metric: "cost_savings",
    impact_order: "FIRST",
    rating_confidence: "HIGH",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
    ...overrides,
  };
}

function makeL3(
  name: string,
  l2: string,
  l1: string,
  overrides: Partial<L3Opportunity> = {},
): L3Opportunity {
  return {
    l3_name: name,
    l2_name: l2,
    l1_name: l1,
    opportunity_exists: true,
    opportunity_name: name,
    opportunity_summary: `Summary for ${name}`,
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 1_000_000,
    implementation_complexity: "MEDIUM",
    quick_win: false,
    competitive_positioning: null,
    aera_differentiators: [],
    l4_count: 3,
    high_value_l4_count: 2,
    rationale: `Rationale for ${name}`,
    ...overrides,
  };
}

/** Minimal hierarchy export with 4 L3 opportunities in different tiers. */
function makeFixtureExport(): HierarchyExport {
  return {
    meta: {
      project_name: "Test Project",
      version_date: "2026-01-01",
      created_date: "2026-01-01",
      exported_by: null,
      description: "Test export",
    },
    company_context: {
      company_name: "TestCo",
      industry: "Manufacturing",
      annual_revenue: 10_000_000_000,
      employee_count: 50_000,
      enterprise_applications: ["SAP"],
      cogs: null,
      sga: null,
      ebitda: null,
      working_capital: null,
      inventory_value: null,
      annual_hires: null,
      geographic_scope: "Global",
      notes: "",
      business_exclusions: "",
      detected_applications: [],
      pptx_template: null,
      industry_specifics: null,
      raw_context: "",
      enriched_context: {},
      enrichment_applied_at: "",
      existing_systems: [],
      hard_exclusions: [],
      filtered_skills: [],
    },
    hierarchy: [
      // L4s for Opp-A (Tier 1 candidate: quick_win + high value)
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A1"),
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A2"),
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A3"),
      // L4s for Opp-B (Tier 2 candidate: high AI suitability L4s)
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B1", { ai_suitability: "HIGH" }),
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B2", { ai_suitability: "HIGH" }),
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B3", { ai_suitability: "HIGH" }),
      // L4s for Opp-C (Tier 3: default -- low ai suitability, low value)
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C1", { ai_suitability: "LOW", financial_rating: "LOW" }),
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C2", { ai_suitability: "LOW", financial_rating: "LOW" }),
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C3", { ai_suitability: "LOW", financial_rating: "LOW" }),
      // Opp-D will be phantom (opportunity_exists=false) -> skip
    ],
    l3_opportunities: [
      makeL3("Opp-A", "L2-A", "L1-A", {
        quick_win: true,
        combined_max_value: 10_000_000,
      }),
      makeL3("Opp-B", "L2-B", "L1-B", {}),
      makeL3("Opp-C", "L2-C", "L1-C", {
        combined_max_value: 100_000,
      }),
      makeL3("Opp-D", "L2-D", "L1-D", {
        opportunity_exists: false,
      }),
    ],
  } as HierarchyExport;
}

/** chatFn that returns a valid scoring response. */
function makeChatFn(options?: { failFor?: string[] }) {
  const failFor = new Set(options?.failFor ?? []);
  let callCount = 0;

  return async (
    messages: Array<{ role: string; content: string }>,
    _format: Record<string, unknown>,
  ): Promise<ChatResult> => {
    callCount++;
    // Extract opportunity name from prompt to check fail list
    const prompt = messages.map((m) => m.content).join(" ");
    for (const name of failFor) {
      if (prompt.includes(name)) {
        return { success: false as const, error: `LLM failed for ${name}` };
      }
    }

    // Return valid structured JSON matching what lens scorers expect.
    // Each lens schema has different field names, but scoreWithRetry
    // validates via Zod. We return a JSON string that satisfies all three
    // lens schemas by including all possible sub-dimension fields.
    return {
      success: true as const,
      content: JSON.stringify({
        // Technical lens fields
        data_readiness: { score: 2, reason: "Good" },
        aera_platform_fit: { score: 2, reason: "Good" },
        archetype_confidence: { score: 2, reason: "Good" },
        // Adoption lens fields
        decision_density: { score: 2, reason: "Good" },
        financial_gravity: { score: 2, reason: "Good" },
        impact_proximity: { score: 2, reason: "Good" },
        confidence_signal: { score: 2, reason: "Good" },
        // Value lens fields
        value_density: { score: 2, reason: "Good" },
        simulation_viability: { score: 2, reason: "Good" },
      }),
      durationMs: 100,
    };
  };
}

/** Mock fetchFn for ModelManager (always succeeds). */
function makeFetchFn() {
  const calls: Array<{ model: string; keep_alive: unknown }> = [];

  const fn = async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string);
    calls.push({ model: body.model, keep_alive: body.keep_alive });
    return new Response(JSON.stringify({ done: true }), { status: 200 });
  };

  return { fn: fn as typeof globalThis.fetch, calls };
}

/**
 * Mock runSimulationPipeline that creates stub artifact directories
 * and returns a valid SimulationPipelineResult with non-zero counts.
 */
function makeMockSimulationPipeline(options?: { shouldThrow?: boolean }) {
  const calls: SimulationInput[][] = [];

  const fn = async (
    inputs: SimulationInput[],
    outputDir: string,
  ): Promise<SimulationPipelineResult> => {
    calls.push(inputs);

    if (options?.shouldThrow) {
      throw new Error("Simulation pipeline exploded");
    }

    // Create artifact directories with stub files for each input
    for (const input of inputs) {
      const slug = input.opportunity.l3_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const oppDir = path.join(outputDir, slug);
      fs.mkdirSync(oppDir, { recursive: true });
      fs.writeFileSync(path.join(oppDir, "decision-flow.mmd"), "graph TD\n  A-->B", "utf-8");
      fs.writeFileSync(path.join(oppDir, "component-map.yaml"), "streams: []\n", "utf-8");
      fs.writeFileSync(path.join(oppDir, "mock-test.yaml"), "decision: test\n", "utf-8");
      fs.writeFileSync(path.join(oppDir, "integration-surface.yaml"), "source_systems: []\n", "utf-8");
    }

    return {
      results: inputs.map((input) => ({
        l3Name: input.opportunity.l3_name,
        slug: input.opportunity.l3_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        artifacts: {
          decisionFlow: "graph TD\n  A-->B",
          componentMap: { streams: [], cortex: [], process_builder: [], agent_teams: [], ui: [] },
          mockTest: { decision: "test", input: { financial_context: {}, trigger: "test" }, expected_output: { action: "test", outcome: "test" }, rationale: "test" },
          integrationSurface: { source_systems: [], aera_ingestion: [], processing: [], ui_surface: [] },
        },
        validationSummary: { confirmedCount: 2, inferredCount: 1, mermaidValid: true },
      })),
      totalSimulated: inputs.length,
      totalFailed: 0,
      totalConfirmed: inputs.length * 2,
      totalInferred: inputs.length,
    };
  };

  return { fn, calls };
}

// -- Test setup --

const logger = createLogger("silent");

describe("pipeline-runner", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("processes all non-skipped opportunities and returns correct counts", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Opp-D is phantom (skip), so 3 processable
    assert.equal(result.triageCount, 4, "all 4 triaged");
    assert.equal(result.skippedCount, 1, "1 skipped (phantom)");
    assert.equal(result.scoredCount, 3, "3 scored");
    assert.equal(result.errorCount, 0, "no errors");
    assert.ok(result.totalDurationMs >= 0, "has duration");
  });

  it("records error and continues when chatFn fails for one opportunity", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn({ failFor: ["Opp-B"] });
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.scoredCount, 2, "2 scored successfully");
    assert.equal(result.errorCount, 1, "1 error");
    assert.equal(result.errors.length, 1);
    assert.ok(result.errors[0].includes("Opp-B"), "error mentions Opp-B");
  });

  it("calls archiveAndReset after threshold opportunities", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 2, // archive after every 2
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.scoredCount, 3);

    // Check that checkpoint files were written
    const pipelineDir = path.join(tmpDir, ".pipeline");
    assert.ok(fs.existsSync(pipelineDir), ".pipeline dir created");
    const checkpoints = fs.readdirSync(pipelineDir).filter((f) =>
      f.startsWith("checkpoint-"),
    );
    // 3 results with threshold 2: archive at 2, then final flush at 3 -> 2 checkpoints
    assert.ok(checkpoints.length >= 1, "at least 1 checkpoint written");
  });

  it("calls unloadAll at end (fetchFn receives keep_alive=0)", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn, calls } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Last fetch call should be unloadAll with keep_alive=0
    const lastCall = calls[calls.length - 1];
    assert.equal(lastCall.keep_alive, 0, "final call unloads model");
  });

  // -- Resilience wiring integration tests --

  it("checkpoint resume skips already-completed opportunities", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Pre-write a checkpoint marking Opp-A as already completed
    const existingCheckpoint: Checkpoint = {
      version: 1,
      inputFile: "__fixture__",
      startedAt: new Date().toISOString(),
      entries: [
        { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "scored" },
      ],
    };
    saveCheckpoint(tmpDir, existingCheckpoint);

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Opp-A skipped via resume, Opp-B and Opp-C scored, Opp-D phantom skip
    assert.equal(result.scoredCount, 2, "2 scored (Opp-A resumed)");
    assert.equal(result.resumedCount, 1, "1 resumed from checkpoint");
  });

  it("stale checkpoint is ignored when inputPath differs", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Pre-write a checkpoint for a different input file
    const staleCheckpoint: Checkpoint = {
      version: 1,
      inputFile: "old-file.json",
      startedAt: new Date().toISOString(),
      entries: [
        { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "scored" },
      ],
    };
    saveCheckpoint(tmpDir, staleCheckpoint);

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Stale checkpoint ignored: all 3 processable scored
    assert.equal(result.scoredCount, 3, "all 3 scored (stale checkpoint ignored)");
    assert.equal(result.resumedCount, 0, "0 resumed (stale checkpoint)");
  });

  it("checkpoint file is written after pipeline completes", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const cp = loadCheckpoint(tmpDir);
    assert.ok(cp !== null, "checkpoint file exists");
    assert.equal(cp!.entries.length, 3, "3 entries (one per scored opp)");
    assert.equal(cp!.inputFile, path.resolve("__fixture__"), "inputFile matches (resolved to absolute)");
    assert.ok(cp!.entries.every((e) => e.status === "scored"), "all entries scored");
  });

  it("writes evaluation output files after scoring completes", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const evalDir = path.join(tmpDir, "evaluation");
    assert.ok(fs.existsSync(path.join(evalDir, "triage.tsv")), "triage.tsv exists");
    assert.ok(fs.existsSync(path.join(evalDir, "feasibility-scores.tsv")), "feasibility-scores.tsv exists");
    assert.ok(fs.existsSync(path.join(evalDir, "adoption-risk.md")), "adoption-risk.md exists");
    assert.ok(fs.existsSync(path.join(evalDir, "tier1-report.md")), "tier1-report.md exists");
  });

  it("writes final report files after scoring completes", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const evalDir = path.join(tmpDir, "evaluation");
    assert.ok(fs.existsSync(path.join(evalDir, "summary.md")), "summary.md exists");
    assert.ok(fs.existsSync(path.join(evalDir, "dead-zones.md")), "dead-zones.md exists");
    assert.ok(fs.existsSync(path.join(evalDir, "meta-reflection.md")), "meta-reflection.md exists");
    assert.ok(fs.existsSync(path.join(evalDir, "simulations")), "simulations/ dir exists");
  });

  it("pipeline succeeds even if writeFinalReports fails", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline({ shouldThrow: true });

    // Use a read-only directory to force writeFinalReports to fail
    const readOnlyDir = path.join(tmpDir, "readonly");
    fs.mkdirSync(readOnlyDir);
    // Create the evaluation dir as a FILE to block mkdir inside writeFinalReports
    fs.writeFileSync(path.join(readOnlyDir, "evaluation"), "block");

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: readOnlyDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Pipeline should still return a valid result (non-fatal)
    assert.equal(result.scoredCount, 3, "3 scored despite report failure");
    assert.equal(result.errorCount, 0, "writeFinalReports failure is not counted as pipeline error");
  });

  it("git auto-commit disabled via option", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // gitCommit: false should prevent any git operations
    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.scoredCount, 3, "pipeline completes with gitCommit=false");
    assert.equal(result.errorCount, 0, "no errors");
  });

  it("pipeline records error via callWithResilience when scoring fails", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn({ failFor: ["Opp-B"] });
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.scoredCount, 2, "2 scored");
    assert.equal(result.errorCount, 1, "1 error");

    // Verify checkpoint records error status for Opp-B
    const cp = loadCheckpoint(tmpDir);
    assert.ok(cp !== null, "checkpoint exists");
    const oppBEntry = cp!.entries.find((e) => e.l3Name === "Opp-B");
    assert.ok(oppBEntry, "Opp-B entry in checkpoint");
    assert.equal(oppBEntry!.status, "error", "Opp-B status is error");
  });

  // -- Simulation wiring integration tests --

  it("runs simulation pipeline for promoted opportunities and creates artifact directories", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn, calls } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Mock simulation was called with promoted inputs
    assert.equal(calls.length, 1, "simulation pipeline called once");
    assert.ok(calls[0].length > 0, "at least one promoted input");

    // Check artifact directories exist
    const simDir = path.join(tmpDir, "evaluation", "simulations");
    assert.ok(fs.existsSync(simDir), "simulations/ dir exists");

    // Check each promoted opportunity has artifact files
    for (const input of calls[0]) {
      const slug = input.opportunity.l3_name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const oppDir = path.join(simDir, slug);
      assert.ok(fs.existsSync(path.join(oppDir, "decision-flow.mmd")), `${slug}/decision-flow.mmd exists`);
      assert.ok(fs.existsSync(path.join(oppDir, "component-map.yaml")), `${slug}/component-map.yaml exists`);
      assert.ok(fs.existsSync(path.join(oppDir, "mock-test.yaml")), `${slug}/mock-test.yaml exists`);
      assert.ok(fs.existsSync(path.join(oppDir, "integration-surface.yaml")), `${slug}/integration-surface.yaml exists`);
    }
  });

  it("passes real simulation results to writeFinalReports (summary.md has non-zero simulation counts)", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const summaryPath = path.join(tmpDir, "evaluation", "summary.md");
    assert.ok(fs.existsSync(summaryPath), "summary.md exists");
    const content = fs.readFileSync(summaryPath, "utf-8");
    // The summary should contain non-zero simulation metrics
    // formatSummary includes totalSimulated from the sim result
    assert.ok(!content.includes("Simulated: 0"), "summary does not show 0 simulated");
  });

  it("simulation pipeline failure is non-fatal -- pipeline still completes", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline({ shouldThrow: true });

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Pipeline should still complete successfully
    assert.equal(result.scoredCount, 3, "3 scored despite simulation failure");
    assert.equal(result.errorCount, 0, "simulation failure is not a pipeline error");
    assert.equal(result.simulatedCount, 0, "simulatedCount is 0 due to failure");
  });

  it("PipelineResult includes simulatedCount reflecting number of simulated opportunities", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // All 3 scored opportunities get composite ~0.67 >= 0.60 threshold -> all promoted
    assert.equal(result.simulatedCount, 3, "all promoted opportunities were simulated");
    assert.equal(result.promotedCount, result.simulatedCount, "simulatedCount matches promotedCount");
  });

  // -- Concurrency integration tests --

  it("concurrency > 1 scores all opportunities in parallel", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        concurrency: 3,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Same counts as sequential -- concurrency doesn't change correctness
    assert.equal(result.scoredCount, 3, "3 scored with concurrency=3");
    assert.equal(result.errorCount, 0, "no errors");
    assert.equal(result.concurrency, 3, "concurrency recorded in result");
    assert.ok(result.avgPerOppMs >= 0, "avgPerOppMs is non-negative");
  });

  it("timed-out opportunity produces error entry, not a hang", async () => {
    const fixture = makeFixtureExport();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // chatFn that hangs forever for Opp-A
    const chatFn = async (
      messages: Array<{ role: string; content: string }>,
      _format: Record<string, unknown>,
    ): Promise<ChatResult> => {
      const prompt = messages.map((m) => m.content).join(" ");
      if (prompt.includes("Opp-A")) {
        // Hang forever (will be timed out)
        return new Promise(() => {});
      }
      return {
        success: true as const,
        content: JSON.stringify({
          data_readiness: { score: 2, reason: "Good" },
          aera_platform_fit: { score: 2, reason: "Good" },
          archetype_confidence: { score: 2, reason: "Good" },
          decision_density: { score: 2, reason: "Good" },
          financial_gravity: { score: 2, reason: "Good" },
          impact_proximity: { score: 2, reason: "Good" },
          confidence_signal: { score: 2, reason: "Good" },
          value_density: { score: 2, reason: "Good" },
          simulation_viability: { score: 2, reason: "Good" },
        }),
        durationMs: 100,
      };
    };

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        concurrency: 3,
        requestTimeoutMs: 200, // 200ms timeout
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Opp-A should timeout, Opp-B and Opp-C should score
    assert.equal(result.scoredCount, 2, "2 scored (Opp-A timed out)");
    assert.equal(result.errorCount, 1, "1 error (timeout)");
    assert.ok(
      result.errors.some((e) => e.includes("timed out")),
      "error message mentions timeout",
    );
  });

  // -- Cost tracker integration tests --

  it("PipelineResult includes costSummary when costTracker is provided", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Mock cost tracker
    let started = false;
    let stopped = false;
    const mockCostTracker: CostTracker = {
      start: () => { started = true; },
      stop: () => { stopped = true; },
      summary: () => ({
        gpuSeconds: 120,
        gpuHours: "0h 2m 0s",
        estimatedCost: "$0.19",
        ratePerHour: 5.58,
      }),
    };

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        costTracker: mockCostTracker,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.ok(result.costSummary, "costSummary is present");
    assert.equal(result.costSummary!.gpuSeconds, 120, "gpuSeconds from mock");
    assert.equal(result.costSummary!.estimatedCost, "$0.19", "estimatedCost from mock");
    assert.equal(result.costSummary!.ratePerHour, 5.58, "ratePerHour from mock");
  });

  it("PipelineResult has no costSummary when costTracker is not provided (Ollama path)", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.costSummary, undefined, "costSummary is undefined for Ollama path");
  });

  // -- Cloud cost artifact tests --

  it("writes cloud-cost.json when costTracker is provided", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const expectedCost: CostSummary = {
      gpuSeconds: 240,
      gpuHours: "0h 4m 0s",
      estimatedCost: "$0.37",
      ratePerHour: 5.58,
    };

    const mockCostTracker: CostTracker = {
      start: () => {},
      stop: () => {},
      summary: () => expectedCost,
    };

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        costTracker: mockCostTracker,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const costPath = path.join(tmpDir, "evaluation", "cloud-cost.json");
    assert.ok(fs.existsSync(costPath), "cloud-cost.json exists");
    const written = JSON.parse(fs.readFileSync(costPath, "utf-8"));
    assert.deepStrictEqual(written, expectedCost, "cloud-cost.json matches CostSummary");
  });

  it("does not write cloud-cost.json when no costTracker", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const costPath = path.join(tmpDir, "evaluation", "cloud-cost.json");
    assert.ok(!fs.existsSync(costPath), "cloud-cost.json does NOT exist for Ollama path");
  });

  it("checkpoint writer is flushed after pipeline completes with concurrency", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        concurrency: 2,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    const cp = loadCheckpoint(tmpDir);
    assert.ok(cp !== null, "checkpoint file exists after concurrent run");
    assert.equal(cp!.entries.length, 3, "3 entries (one per scored opp)");
    assert.ok(cp!.entries.every((e) => e.status === "scored"), "all entries scored");
  });

  // -- Archived score loading on resume integration tests --

  /**
   * Helper: create a ScoringResult fixture matching what archiveAndReset writes.
   */
  function makeScoringResult(l3Name: string, l2Name: string, l1Name: string, composite: number = 0.67): ScoringResult {
    return {
      l3Name,
      l2Name,
      l1Name,
      archetype: "DETERMINISTIC",
      archetypeSource: "export",
      lenses: {
        technical: {
          lens: "technical",
          subDimensions: [
            { name: "data_readiness", score: 2, reason: "Good" },
            { name: "aera_platform_fit", score: 2, reason: "Good" },
            { name: "archetype_confidence", score: 2, reason: "Good" },
          ],
          total: 6, maxPossible: 9, normalized: 0.67, confidence: "MEDIUM",
        },
        adoption: {
          lens: "adoption",
          subDimensions: [
            { name: "decision_density", score: 2, reason: "Good" },
            { name: "financial_gravity", score: 2, reason: "Good" },
            { name: "impact_proximity", score: 2, reason: "Good" },
            { name: "confidence_signal", score: 2, reason: "Good" },
          ],
          total: 8, maxPossible: 12, normalized: 0.67, confidence: "MEDIUM",
        },
        value: {
          lens: "value",
          subDimensions: [
            { name: "value_density", score: 2, reason: "Good" },
            { name: "simulation_viability", score: 2, reason: "Good" },
          ],
          total: 4, maxPossible: 6, normalized: 0.67, confidence: "MEDIUM",
        },
      },
      composite,
      overallConfidence: "MEDIUM",
      promotedToSimulation: composite >= 0.60,
      scoringDurationMs: 5000,
    } as ScoringResult;
  }

  it("resumed run with archives produces reports with ALL scored opportunities", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Pre-write checkpoint marking Opp-A as completed
    const existingCheckpoint: Checkpoint = {
      version: 1,
      inputFile: "__fixture__",
      startedAt: new Date().toISOString(),
      entries: [
        { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "scored" },
      ],
    };
    saveCheckpoint(tmpDir, existingCheckpoint);

    // Pre-write archive file with Opp-A's full ScoringResult
    const archivedOppA = makeScoringResult("Opp-A", "L2-A", "L1-A", 0.75);
    const pipelineDir = path.join(tmpDir, ".pipeline");
    fs.mkdirSync(pipelineDir, { recursive: true });
    fs.writeFileSync(
      path.join(pipelineDir, "checkpoint-1000.json"),
      JSON.stringify({ "Opp-A": archivedOppA }, null, 2),
      "utf-8",
    );

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Opp-A resumed, Opp-B + Opp-C scored in current session
    assert.equal(result.scoredCount, 2, "2 scored in current session");
    assert.equal(result.resumedCount, 1, "1 resumed from checkpoint");

    // Verify summary.md reports ALL 3 scored opportunities
    const summaryPath = path.join(tmpDir, "evaluation", "summary.md");
    assert.ok(fs.existsSync(summaryPath), "summary.md exists");
    const summaryContent = fs.readFileSync(summaryPath, "utf-8");
    assert.ok(
      summaryContent.includes("**Total Evaluated:** 3"),
      `summary.md should show Total Evaluated: 3, got: ${summaryContent.match(/\*\*Total Evaluated:\*\* \d+/)?.[0]}`,
    );

    // Verify feasibility-scores.tsv has all 3 opportunities
    const tsvPath = path.join(tmpDir, "evaluation", "feasibility-scores.tsv");
    assert.ok(fs.existsSync(tsvPath), "feasibility-scores.tsv exists");
    const tsvContent = fs.readFileSync(tsvPath, "utf-8");
    assert.ok(tsvContent.includes("Opp-A"), "TSV contains Opp-A");
    assert.ok(tsvContent.includes("Opp-B"), "TSV contains Opp-B");
    assert.ok(tsvContent.includes("Opp-C"), "TSV contains Opp-C");
  });

  it("fresh run (no checkpoint) does not load archived scores", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Fresh run: all 3 processable scored, no resume
    assert.equal(result.scoredCount, 3, "3 scored");
    assert.equal(result.resumedCount, 0, "0 resumed");

    // Summary should show 3 evaluated
    const summaryPath = path.join(tmpDir, "evaluation", "summary.md");
    const summaryContent = fs.readFileSync(summaryPath, "utf-8");
    assert.ok(
      summaryContent.includes("**Total Evaluated:** 3"),
      "fresh run also shows 3 evaluated",
    );
  });

  // -- skipSim and simTimeout integration tests --

  it("skipSim=true causes simulation to be skipped entirely", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn, calls } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        skipSim: true,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Simulation should never be called
    assert.equal(calls.length, 0, "simulation pipeline was not called");
    assert.equal(result.simulatedCount, 0, "simulatedCount is 0");
    assert.equal(result.simErrorCount, 0, "simErrorCount is 0");
    // Scoring and promotion still work
    assert.equal(result.scoredCount, 3, "3 scored");
    assert.ok(result.promotedCount > 0, "promotedCount is still computed");
  });

  it("skipSim=true preserves promotedCount (promotion is a scoring outcome)", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Run without skipSim to get baseline
    const baseResult = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Run with skipSim in a fresh dir
    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-skip-"));
    try {
      const { fn: simFn2 } = makeMockSimulationPipeline();
      const skipResult = await runPipeline(
        "__fixture__",
        {
          outputDir: tmpDir2,
          archiveThreshold: 100,
          chatFn,
          fetchFn,
          runSimulationPipelineFn: simFn2,
          gitCommit: false,
          skipSim: true,
          parseExportFn: async () => ({ success: true as const, data: fixture }),
        },
        logger,
      );

      assert.equal(skipResult.promotedCount, baseResult.promotedCount, "promotedCount same with or without skipSim");
    } finally {
      fs.rmSync(tmpDir2, { recursive: true, force: true });
    }
  });

  it("simTimeoutMs is passed through to runSimulationPipeline when skipSim is false", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();

    // Custom mock that captures the options argument
    const capturedOptions: Array<{ timeoutMs?: number } | undefined> = [];
    const simFn = async (
      inputs: SimulationInput[],
      outputDir: string,
      _llmTarget?: unknown,
      _deps?: unknown,
      options?: { timeoutMs?: number },
    ): Promise<SimulationPipelineResult> => {
      capturedOptions.push(options);
      return { results: [], totalSimulated: 0, totalFailed: 0, totalConfirmed: 0, totalInferred: 0 };
    };

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        simTimeoutMs: 60000,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(capturedOptions.length, 1, "simulation was called once");
    assert.deepStrictEqual(capturedOptions[0], { timeoutMs: 60000 }, "timeoutMs threaded through");
  });

  it("simulationLlmTarget is passed through to runSimulationPipeline", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const capturedTargets: unknown[] = [];

    const simFn = async (
      _inputs: SimulationInput[],
      _outputDir: string,
      llmTarget?: unknown,
    ): Promise<SimulationPipelineResult> => {
      capturedTargets.push(llmTarget);
      return { results: [], totalSimulated: 0, totalFailed: 0, totalConfirmed: 0, totalInferred: 0 };
    };

    const simulationLlmTarget = {
      backend: "vllm" as const,
      baseUrl: "https://pod.proxy.runpod.net/v1",
      model: "Qwen/Qwen2.5-32B-Instruct",
      apiKey: "vllm-test-key",
    };

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        simulationLlmTarget,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(capturedTargets.length, 1, "simulation target was passed once");
    assert.deepStrictEqual(capturedTargets[0], simulationLlmTarget);
  });

  it("simErrorCount on PipelineResult reflects simulation failures", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();

    // Mock that returns some failures
    const simFn = async (
      inputs: SimulationInput[],
      _outputDir: string,
    ): Promise<SimulationPipelineResult> => {
      return {
        results: [],
        totalSimulated: inputs.length - 1,
        totalFailed: 1,
        totalConfirmed: 0,
        totalInferred: 0,
      };
    };

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.simErrorCount, 1, "simErrorCount from totalFailed");
  });

  it("default behavior unchanged when skipSim and simTimeoutMs are not set", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn, calls } = makeMockSimulationPipeline();

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Simulation should be called normally
    assert.equal(calls.length, 1, "simulation pipeline called once");
    assert.ok(result.simulatedCount > 0, "simulatedCount > 0");
    assert.equal(typeof result.simErrorCount, "number", "simErrorCount exists on result");
  });

  it("resumed run with overlapping archived scores uses current session score (freshest wins)", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    // Archive has Opp-A scored, but do NOT mark it in the checkpoint resume
    // file -- so Opp-A will be scored again in the current session.
    // The report should use the current session's score (not the archived one).
    const archivedOppA = makeScoringResult("Opp-A", "L2-A", "L1-A", 0.30); // low composite
    const pipelineDir = path.join(tmpDir, ".pipeline");
    fs.mkdirSync(pipelineDir, { recursive: true });
    fs.writeFileSync(
      path.join(pipelineDir, "checkpoint-1000.json"),
      JSON.stringify({ "Opp-A": archivedOppA }, null, 2),
      "utf-8",
    );

    // No checkpoint resume file -- fresh run, but archive exists on disk

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Fresh run: completed.size === 0, so no archived scores loaded
    // All 3 scored in current session
    assert.equal(result.scoredCount, 3, "3 scored in current session");
    assert.equal(result.resumedCount, 0, "0 resumed (no checkpoint)");

    // Verify feasibility-scores.tsv contains all 3
    const tsvPath = path.join(tmpDir, "evaluation", "feasibility-scores.tsv");
    const tsvContent = fs.readFileSync(tsvPath, "utf-8");
    assert.ok(tsvContent.includes("Opp-A"), "Opp-A in TSV");
    assert.ok(tsvContent.includes("Opp-B"), "Opp-B in TSV");
    assert.ok(tsvContent.includes("Opp-C"), "Opp-C in TSV");
  });

  it("checkpoint error entries are retried and do not resume stale archived scores", async () => {
    const fixture = makeFixtureExport();
    const chatFn = makeChatFn();
    const { fn: fetchFn } = makeFetchFn();
    const { fn: simFn } = makeMockSimulationPipeline();

    const existingCheckpoint: Checkpoint = {
      version: 1,
      inputFile: "__fixture__",
      startedAt: new Date().toISOString(),
      entries: [
        { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "error" },
      ],
    };
    saveCheckpoint(tmpDir, existingCheckpoint);

    const archivedOppA = makeScoringResult("Opp-A", "L2-A", "L1-A", 0.30);
    const pipelineDir = path.join(tmpDir, ".pipeline");
    fs.mkdirSync(pipelineDir, { recursive: true });
    fs.writeFileSync(
      path.join(pipelineDir, "checkpoint-1000.json"),
      JSON.stringify({ "Opp-A": archivedOppA }, null, 2),
      "utf-8",
    );

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        runSimulationPipelineFn: simFn,
        gitCommit: false,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    assert.equal(result.resumedCount, 0, "error entries should not count as resumed");
    assert.equal(result.scoredCount, 3, "Opp-A should be retried in the current session");
  });
});
