/**
 * Tests for the hierarchy export ingestion module.
 *
 * Covers: valid parsing, file-not-found, invalid JSON, missing fields (Zod),
 * and real Ford export data verification.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseExport } from "./parse-export.js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
// Helper: write a temp file with given content, return its path
async function writeTempFile(content) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "parse-export-test-"));
    const filePath = path.join(dir, "test-export.json");
    await fs.writeFile(filePath, content, "utf-8");
    return filePath;
}
// Minimal valid hierarchy export for unit tests
const MINIMAL_VALID_EXPORT = {
    meta: {
        project_name: "test_project",
        version_date: "2026-01-01T00:00:00",
        created_date: "2026-01-01T00:00:00",
        exported_by: null,
        description: "Test export",
    },
    company_context: {
        industry: "Technology",
        company_name: "Test Corp",
        annual_revenue: 1000000,
        cogs: null,
        sga: null,
        ebitda: null,
        working_capital: null,
        inventory_value: null,
        annual_hires: null,
        employee_count: 500,
        geographic_scope: "Global",
        notes: "",
        business_exclusions: "",
        enterprise_applications: ["SAP S/4HANA"],
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
    hierarchy: [],
    l3_opportunities: [],
};
describe("parseExport", () => {
    it("returns success with typed HierarchyExport for valid minimal JSON", async () => {
        const filePath = await writeTempFile(JSON.stringify(MINIMAL_VALID_EXPORT));
        const result = await parseExport(filePath);
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.meta.project_name, "test_project");
            assert.equal(result.data.company_context.company_name, "Test Corp");
            assert.deepEqual(result.data.hierarchy, []);
            assert.deepEqual(result.data.l3_opportunities, []);
        }
    });
    it("returns error with 'file not found' for non-existent file path", async () => {
        const result = await parseExport("/tmp/nonexistent-file-abc123.json");
        assert.equal(result.success, false);
        if (!result.success) {
            assert.match(result.error, /file not found/i);
        }
    });
    it("returns error with 'invalid JSON' for unparseable content", async () => {
        const filePath = await writeTempFile("{ not valid json !!!");
        const result = await parseExport(filePath);
        assert.equal(result.success, false);
        if (!result.success) {
            assert.match(result.error, /invalid json/i);
        }
    });
    it("returns error with Zod field path for JSON missing required fields", async () => {
        const incomplete = { meta: { project_name: "test" } }; // missing many fields
        const filePath = await writeTempFile(JSON.stringify(incomplete));
        const result = await parseExport(filePath);
        assert.equal(result.success, false);
        if (!result.success) {
            // Should include field path info like "meta.version_date"
            assert.match(result.error, /meta/i);
        }
    });
    it("parses ford_hierarchy_v2_export.json with 362 L3 opportunities and 2016 L4 activities", async () => {
        const fordPath = path.resolve(import.meta.dirname, "../../ford_hierarchy_v2_export.json");
        const result = await parseExport(fordPath);
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.l3_opportunities.length, 362);
            assert.equal(result.data.hierarchy.length, 2016);
        }
    });
    it("extracts correct company context from Ford export", async () => {
        const fordPath = path.resolve(import.meta.dirname, "../../ford_hierarchy_v2_export.json");
        const result = await parseExport(fordPath);
        assert.equal(result.success, true);
        if (result.success) {
            const ctx = result.data.company_context;
            assert.equal(ctx.industry, "Automotive");
            assert.equal(ctx.company_name, "Ford Motor Company");
            assert.ok(ctx.enterprise_applications.includes("SAP S/4HANA"), 'enterprise_applications should include "SAP S/4HANA"');
        }
    });
});
