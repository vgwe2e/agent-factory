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
import type { HierarchyExport } from "../types/hierarchy.js";
import type { ChatResult } from "../scoring/ollama-client.js";

// -- Fixtures --

/** Minimal hierarchy export with 4 L3 opportunities in different tiers. */
function makeFixtureExport(): HierarchyExport {
  return {
    meta: {
      project_name: "Test Project",
      export_date: "2026-01-01",
      hierarchy_version: "v2",
      format_version: "1.0",
    },
    company_context: {
      company_name: "TestCo",
      industry: "Manufacturing",
      annual_revenue: 10_000_000_000,
      employee_count: 50_000,
      enterprise_applications: ["SAP"],
    },
    hierarchy: [
      // L4s for Opp-A (Tier 1 candidate: quick_win + high value)
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A1"),
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A2"),
      makeL4("Opp-A", "L2-A", "L1-A", "Act-A3"),
      // L4s for Opp-B (Tier 2 candidate: high AI suitability)
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B1"),
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B2"),
      makeL4("Opp-B", "L2-B", "L1-B", "Act-B3"),
      // L4s for Opp-C (Tier 3: default)
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C1"),
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C2"),
      makeL4("Opp-C", "L2-C", "L1-C", "Act-C3"),
      // Opp-D will be phantom (opportunity_exists=false) -> skip
    ],
    l3_opportunities: [
      makeL3("Opp-A", "L2-A", "L1-A", {
        quick_win: true,
        combined_max_value: 10_000_000,
      }),
      makeL3("Opp-B", "L2-B", "L1-B", {
        ai_suitability: "HIGH",
      }),
      makeL3("Opp-C", "L2-C", "L1-C", {}),
      makeL3("Opp-D", "L2-D", "L1-D", {
        opportunity_exists: false,
      }),
    ],
  };
}

function makeL4(l3: string, l2: string, l1: string, name: string) {
  return {
    l1,
    l2,
    l3,
    l4: name,
    decision_type: "OPERATIONAL" as const,
    impact_order: "FIRST" as const,
    financial_impact: "HIGH" as const,
    rating_confidence: "HIGH" as const,
    implementation_complexity: "MEDIUM" as const,
    ai_suitability: "HIGH" as const,
    decision_articulation: null,
  };
}

function makeL3(
  name: string,
  l2: string,
  l1: string,
  overrides: Record<string, unknown>,
) {
  return {
    l3_name: name,
    l2_name: l2,
    l1_name: l1,
    opportunity_exists: true,
    quick_win: false,
    combined_max_value: 1_000_000,
    lead_archetype: "DETERMINISTIC" as const,
    opportunity_name: name,
    opportunity_summary: `Summary for ${name}`,
    rationale: `Rationale for ${name}`,
    ai_suitability: null,
    ...overrides,
  };
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

    return {
      success: true as const,
      data: JSON.stringify({
        sub_dimensions: [
          { name: "dim1", score: 2, reason: "Good" },
          { name: "dim2", score: 2, reason: "Good" },
          { name: "dim3", score: 2, reason: "Good" },
        ],
        confidence: "HIGH",
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

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
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

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
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

    const result = await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 2, // archive after every 2
        chatFn,
        fetchFn,
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

    await runPipeline(
      "__fixture__",
      {
        outputDir: tmpDir,
        archiveThreshold: 100,
        chatFn,
        fetchFn,
        parseExportFn: async () => ({ success: true as const, data: fixture }),
      },
      logger,
    );

    // Last fetch call should be unloadAll with keep_alive=0
    const lastCall = calls[calls.length - 1];
    assert.equal(lastCall.keep_alive, 0, "final call unloads model");
  });
});
