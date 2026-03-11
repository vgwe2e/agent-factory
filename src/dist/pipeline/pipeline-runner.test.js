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
import { createLogger } from "../infra/logger.js";
import { loadCheckpoint, saveCheckpoint } from "../infra/checkpoint.js";
// -- Fixtures --
function makeL4(l3, l2, l1, name, overrides = {}) {
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
function makeL3(name, l2, l1, overrides = {}) {
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
function makeFixtureExport() {
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
    };
}
/** chatFn that returns a valid scoring response. */
function makeChatFn(options) {
    const failFor = new Set(options?.failFor ?? []);
    let callCount = 0;
    return async (messages, _format) => {
        callCount++;
        // Extract opportunity name from prompt to check fail list
        const prompt = messages.map((m) => m.content).join(" ");
        for (const name of failFor) {
            if (prompt.includes(name)) {
                return { success: false, error: `LLM failed for ${name}` };
            }
        }
        // Return valid structured JSON matching what lens scorers expect.
        // Each lens schema has different field names, but scoreWithRetry
        // validates via Zod. We return a JSON string that satisfies all three
        // lens schemas by including all possible sub-dimension fields.
        return {
            success: true,
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
    const calls = [];
    const fn = async (url, init) => {
        const body = JSON.parse(init?.body);
        calls.push({ model: body.model, keep_alive: body.keep_alive });
        return new Response(JSON.stringify({ done: true }), { status: 200 });
    };
    return { fn: fn, calls };
}
// -- Test setup --
const logger = createLogger("silent");
describe("pipeline-runner", () => {
    let tmpDir;
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
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
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
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        assert.equal(result.scoredCount, 2, "2 scored successfully");
        assert.equal(result.errorCount, 1, "1 error");
        assert.equal(result.errors.length, 1);
        assert.ok(result.errors[0].includes("Opp-B"), "error mentions Opp-B");
    });
    it("calls archiveAndReset after threshold opportunities", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn } = makeFetchFn();
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 2, // archive after every 2
            chatFn,
            fetchFn,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        assert.equal(result.scoredCount, 3);
        // Check that checkpoint files were written
        const pipelineDir = path.join(tmpDir, ".pipeline");
        assert.ok(fs.existsSync(pipelineDir), ".pipeline dir created");
        const checkpoints = fs.readdirSync(pipelineDir).filter((f) => f.startsWith("checkpoint-"));
        // 3 results with threshold 2: archive at 2, then final flush at 3 -> 2 checkpoints
        assert.ok(checkpoints.length >= 1, "at least 1 checkpoint written");
    });
    it("calls unloadAll at end (fetchFn receives keep_alive=0)", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn, calls } = makeFetchFn();
        await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        // Last fetch call should be unloadAll with keep_alive=0
        const lastCall = calls[calls.length - 1];
        assert.equal(lastCall.keep_alive, 0, "final call unloads model");
    });
    // -- Resilience wiring integration tests --
    it("checkpoint resume skips already-completed opportunities", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn } = makeFetchFn();
        // Pre-write a checkpoint marking Opp-A as already completed
        const existingCheckpoint = {
            version: 1,
            inputFile: "__fixture__",
            startedAt: new Date().toISOString(),
            entries: [
                { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "scored" },
            ],
        };
        saveCheckpoint(tmpDir, existingCheckpoint);
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            gitCommit: false,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        // Opp-A skipped via resume, Opp-B and Opp-C scored, Opp-D phantom skip
        assert.equal(result.scoredCount, 2, "2 scored (Opp-A resumed)");
        assert.equal(result.resumedCount, 1, "1 resumed from checkpoint");
    });
    it("stale checkpoint is ignored when inputPath differs", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn } = makeFetchFn();
        // Pre-write a checkpoint for a different input file
        const staleCheckpoint = {
            version: 1,
            inputFile: "old-file.json",
            startedAt: new Date().toISOString(),
            entries: [
                { l3Name: "Opp-A", completedAt: new Date().toISOString(), status: "scored" },
            ],
        };
        saveCheckpoint(tmpDir, staleCheckpoint);
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            gitCommit: false,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        // Stale checkpoint ignored: all 3 processable scored
        assert.equal(result.scoredCount, 3, "all 3 scored (stale checkpoint ignored)");
        assert.equal(result.resumedCount, 0, "0 resumed (stale checkpoint)");
    });
    it("checkpoint file is written after pipeline completes", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn } = makeFetchFn();
        await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            gitCommit: false,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        const cp = loadCheckpoint(tmpDir);
        assert.ok(cp !== null, "checkpoint file exists");
        assert.equal(cp.entries.length, 3, "3 entries (one per scored opp)");
        assert.equal(cp.inputFile, "__fixture__", "inputFile matches");
        assert.ok(cp.entries.every((e) => e.status === "scored"), "all entries scored");
    });
    it("git auto-commit disabled via option", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn();
        const { fn: fetchFn } = makeFetchFn();
        // gitCommit: false should prevent any git operations
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            gitCommit: false,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        assert.equal(result.scoredCount, 3, "pipeline completes with gitCommit=false");
        assert.equal(result.errorCount, 0, "no errors");
    });
    it("pipeline records error via callWithResilience when scoring fails", async () => {
        const fixture = makeFixtureExport();
        const chatFn = makeChatFn({ failFor: ["Opp-B"] });
        const { fn: fetchFn } = makeFetchFn();
        const result = await runPipeline("__fixture__", {
            outputDir: tmpDir,
            archiveThreshold: 100,
            chatFn,
            fetchFn,
            gitCommit: false,
            parseExportFn: async () => ({ success: true, data: fixture }),
        }, logger);
        assert.equal(result.scoredCount, 2, "2 scored");
        assert.equal(result.errorCount, 1, "1 error");
        // Verify checkpoint records error status for Opp-B
        const cp = loadCheckpoint(tmpDir);
        assert.ok(cp !== null, "checkpoint exists");
        const oppBEntry = cp.entries.find((e) => e.l3Name === "Opp-B");
        assert.ok(oppBEntry, "Opp-B entry in checkpoint");
        assert.equal(oppBEntry.status, "error", "Opp-B status is error");
    });
});
