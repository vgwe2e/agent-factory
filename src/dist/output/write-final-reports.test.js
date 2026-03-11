/**
 * Integration tests for writeFinalReports orchestrator.
 *
 * Verifies that writeFinalReports creates the evaluation/ directory
 * and writes summary.md, dead-zones.md, meta-reflection.md, and
 * simulation subdirectories with artifact files.
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { writeFinalReports } from "./write-final-reports.js";
// -- Fixtures --
function makeSub(name, score) {
    return { name, score, reason: `Reason for ${name}` };
}
function makeLens(lens, subs) {
    const total = subs.reduce((s, d) => s + d.score, 0);
    const maxPossible = lens === "technical" ? 9 : lens === "adoption" ? 12 : 6;
    return {
        lens,
        subDimensions: subs,
        total,
        maxPossible,
        normalized: total / maxPossible,
        confidence: "HIGH",
    };
}
function makeTriage(overrides = {}) {
    return {
        l3Name: "Test Opp",
        l2Name: "L2 Domain",
        l1Name: "L1 Area",
        tier: 2,
        redFlags: [],
        action: "process",
        combinedMaxValue: 5_000_000,
        quickWin: false,
        leadArchetype: "DETERMINISTIC",
        l4Count: 4,
        ...overrides,
    };
}
function makeScoring(overrides = {}) {
    return {
        l3Name: "Test Opp",
        l2Name: "L2 Domain",
        l1Name: "L1 Area",
        archetype: "DETERMINISTIC",
        archetypeSource: "export",
        lenses: {
            technical: makeLens("technical", [
                makeSub("data_readiness", 2),
                makeSub("platform_fit", 3),
                makeSub("archetype_confidence", 1),
            ]),
            adoption: makeLens("adoption", [
                makeSub("decision_density", 2),
                makeSub("financial_gravity", 3),
                makeSub("impact_proximity", 1),
                makeSub("confidence_signal", 2),
            ]),
            value: makeLens("value", [
                makeSub("value_density", 2),
                makeSub("simulation_viability", 3),
            ]),
        },
        composite: 0.72,
        overallConfidence: "HIGH",
        promotedToSimulation: true,
        scoringDurationMs: 150,
        ...overrides,
    };
}
function makeSimResult(overrides = {}) {
    return {
        l3Name: "Test Opp",
        slug: "test-opp",
        artifacts: {
            decisionFlow: "graph TD\n  A-->B",
            componentMap: {
                streams: [{ name: "test-stream", confidence: "confirmed" }],
                cortex: [],
                process_builder: [],
                agent_teams: [],
                ui: [],
            },
            mockTest: {
                decision: "Approve budget",
                input: { financial_context: { amount: 1000 }, trigger: "quarterly_review" },
                expected_output: { action: "approve", outcome: "Budget allocated" },
                rationale: "Standard approval flow",
            },
            integrationSurface: {
                source_systems: [{ name: "SAP", status: "identified" }],
                aera_ingestion: [],
                processing: [],
                ui_surface: [],
            },
        },
        validationSummary: {
            confirmedCount: 1,
            inferredCount: 0,
            mermaidValid: true,
        },
        ...overrides,
    };
}
function makeSimPipelineResult(results = [makeSimResult()]) {
    return {
        results,
        totalSimulated: results.length,
        totalFailed: 0,
        totalConfirmed: results.reduce((s, r) => s + r.validationSummary.confirmedCount, 0),
        totalInferred: results.reduce((s, r) => s + r.validationSummary.inferredCount, 0),
    };
}
// -- Test suite --
let tmpDir = null;
afterEach(async () => {
    if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true });
        tmpDir = null;
    }
});
async function makeTmpDir() {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "write-final-"));
    return tmpDir;
}
const DATE = "2026-01-15";
describe("writeFinalReports", () => {
    it("creates evaluation/ directory and writes 3 markdown files", async () => {
        const dir = await makeTmpDir();
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const simResults = makeSimPipelineResult();
        const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const evalDir = path.join(dir, "evaluation");
        const entries = await fs.readdir(evalDir);
        assert.ok(entries.includes("summary.md"));
        assert.ok(entries.includes("dead-zones.md"));
        assert.ok(entries.includes("meta-reflection.md"));
    });
    it("writes summary.md with formatSummary content", async () => {
        const dir = await makeTmpDir();
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const simResults = makeSimPipelineResult();
        await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        const content = await fs.readFile(path.join(dir, "evaluation", "summary.md"), "utf-8");
        assert.ok(content.includes("Executive Summary: TestCorp"));
        assert.ok(content.includes("2026-01-15"));
        assert.ok(content.length > 0);
    });
    it("writes dead-zones.md with formatDeadZones content", async () => {
        const dir = await makeTmpDir();
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const simResults = makeSimPipelineResult();
        await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        const content = await fs.readFile(path.join(dir, "evaluation", "dead-zones.md"), "utf-8");
        assert.ok(content.includes("Dead Zones Report"));
        assert.ok(content.length > 0);
    });
    it("writes meta-reflection.md with formatMetaReflection content", async () => {
        const dir = await makeTmpDir();
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const simResults = makeSimPipelineResult();
        await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        const content = await fs.readFile(path.join(dir, "evaluation", "meta-reflection.md"), "utf-8");
        assert.ok(content.includes("Meta-Reflection"));
        assert.ok(content.length > 0);
    });
    it("creates simulations/ directory with per-slug subdirectories", async () => {
        const dir = await makeTmpDir();
        const simResult1 = makeSimResult({ l3Name: "Opp Alpha", slug: "opp-alpha" });
        const simResult2 = makeSimResult({ l3Name: "Opp Beta", slug: "opp-beta" });
        const simResults = makeSimPipelineResult([simResult1, simResult2]);
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        const simDir = path.join(dir, "evaluation", "simulations");
        const entries = await fs.readdir(simDir);
        assert.ok(entries.includes("opp-alpha"));
        assert.ok(entries.includes("opp-beta"));
    });
    it("writes 4 artifact files per simulation slug", async () => {
        const dir = await makeTmpDir();
        const simResults = makeSimPipelineResult([makeSimResult()]);
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        const slugDir = path.join(dir, "evaluation", "simulations", "test-opp");
        const entries = await fs.readdir(slugDir);
        assert.ok(entries.includes("decision-flow.mmd"));
        assert.ok(entries.includes("component-map.yaml"));
        assert.ok(entries.includes("mock-test.yaml"));
        assert.ok(entries.includes("integration-surface.yaml"));
        // Verify content is non-empty
        const mmd = await fs.readFile(path.join(slugDir, "decision-flow.mmd"), "utf-8");
        assert.ok(mmd.includes("graph TD"));
        const cmYaml = await fs.readFile(path.join(slugDir, "component-map.yaml"), "utf-8");
        assert.ok(cmYaml.includes("test-stream"));
        const mtYaml = await fs.readFile(path.join(slugDir, "mock-test.yaml"), "utf-8");
        assert.ok(mtYaml.includes("Approve budget"));
        const isYaml = await fs.readFile(path.join(slugDir, "integration-surface.yaml"), "utf-8");
        assert.ok(isYaml.includes("SAP"));
    });
    it("returns success with all written file paths", async () => {
        const dir = await makeTmpDir();
        const simResults = makeSimPipelineResult([makeSimResult()]);
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        assert.equal(result.success, true);
        if (!result.success)
            return;
        // 3 markdown files + 4 simulation artifact files = 7
        assert.equal(result.files.length, 7);
        for (const filePath of result.files) {
            assert.ok(path.isAbsolute(filePath), `Expected absolute path: ${filePath}`);
            await fs.access(filePath);
        }
    });
    it("handles empty simResults.results -- creates simulations/ dir but no subdirs", async () => {
        const dir = await makeTmpDir();
        const simResults = makeSimPipelineResult([]);
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const result = await writeFinalReports(dir, scored, triaged, simResults, "TestCorp", DATE);
        assert.equal(result.success, true);
        if (!result.success)
            return;
        // Only 3 markdown files
        assert.equal(result.files.length, 3);
        const simDir = path.join(dir, "evaluation", "simulations");
        const entries = await fs.readdir(simDir);
        assert.equal(entries.length, 0);
    });
    it("returns error result if directory creation fails", async () => {
        const result = await writeFinalReports("/dev/null/impossible-path", [makeScoring()], [makeTriage()], makeSimPipelineResult(), "TestCorp", DATE);
        assert.equal(result.success, false);
        if (result.success)
            return;
        assert.ok(result.error.length > 0);
    });
    it("creates parent directories recursively", async () => {
        const dir = await makeTmpDir();
        const nestedDir = path.join(dir, "deep", "nested", "output");
        const simResults = makeSimPipelineResult([]);
        const triaged = [makeTriage()];
        const scored = [makeScoring()];
        const result = await writeFinalReports(nestedDir, scored, triaged, simResults, "TestCorp", DATE);
        assert.equal(result.success, true);
        if (!result.success)
            return;
        const evalDir = path.join(nestedDir, "evaluation");
        const entries = await fs.readdir(evalDir);
        assert.ok(entries.includes("summary.md"));
    });
});
