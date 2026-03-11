import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTriageTsv, TSV_HEADERS } from "./format-tsv.js";
describe("formatTriageTsv", () => {
    const EXPECTED_HEADER = "tier\taction\tl1_name\tl2_name\tl3_name\tcombined_max_value\tquick_win\tlead_archetype\tl4_count\tred_flags";
    it("exports TSV_HEADERS matching the expected header string", () => {
        assert.equal(TSV_HEADERS, EXPECTED_HEADER);
    });
    it("returns header row only for empty input", () => {
        const result = formatTriageTsv([]);
        assert.equal(result, EXPECTED_HEADER);
    });
    it("produces header + one data row for a single result", () => {
        const input = [
            {
                l3Name: "Process Payments",
                l2Name: "Finance Ops",
                l1Name: "Finance",
                tier: 1,
                redFlags: [],
                action: "process",
                combinedMaxValue: 500000,
                quickWin: true,
                leadArchetype: "Operator",
                l4Count: 12,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        assert.equal(lines.length, 2, "should have header + 1 data row");
        assert.equal(lines[0], EXPECTED_HEADER);
        assert.equal(lines[1], "1\tprocess\tFinance\tFinance Ops\tProcess Payments\t500000\ttrue\tOperator\t12\t");
    });
    it("renders null combinedMaxValue as empty string", () => {
        const input = [
            {
                l3Name: "Review Claims",
                l2Name: "Claims",
                l1Name: "Insurance",
                tier: 2,
                redFlags: [],
                action: "process",
                combinedMaxValue: null,
                quickWin: false,
                leadArchetype: "Strategist",
                l4Count: 5,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        const fields = lines[1].split("\t");
        assert.equal(fields[5], "", "combinedMaxValue null should be empty string");
    });
    it("renders null leadArchetype as empty string", () => {
        const input = [
            {
                l3Name: "Approve Orders",
                l2Name: "Order Mgmt",
                l1Name: "Supply Chain",
                tier: 3,
                redFlags: [],
                action: "skip",
                combinedMaxValue: 100,
                quickWin: false,
                leadArchetype: null,
                l4Count: 2,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        const fields = lines[1].split("\t");
        assert.equal(fields[7], "", "leadArchetype null should be empty string");
    });
    it("joins multiple red flag types with comma", () => {
        const input = [
            {
                l3Name: "Ghost Process",
                l2Name: "Unknown",
                l1Name: "Mystery",
                tier: 3,
                redFlags: [
                    { type: "PHANTOM", opportunityExists: false },
                    { type: "ORPHAN", l4Count: 1 },
                ],
                action: "skip",
                combinedMaxValue: null,
                quickWin: false,
                leadArchetype: null,
                l4Count: 1,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        const fields = lines[1].split("\t");
        assert.equal(fields[9], "PHANTOM,ORPHAN");
    });
    it("renders no red flags as empty string", () => {
        const input = [
            {
                l3Name: "Clean Process",
                l2Name: "Good",
                l1Name: "Great",
                tier: 1,
                redFlags: [],
                action: "process",
                combinedMaxValue: 200,
                quickWin: true,
                leadArchetype: "Operator",
                l4Count: 8,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        const fields = lines[1].split("\t");
        assert.equal(fields[9], "", "no red flags should be empty string");
    });
    it("preserves input order for multiple results", () => {
        const input = [
            {
                l3Name: "First",
                l2Name: "A",
                l1Name: "X",
                tier: 1,
                redFlags: [],
                action: "process",
                combinedMaxValue: 100,
                quickWin: false,
                leadArchetype: null,
                l4Count: 3,
            },
            {
                l3Name: "Second",
                l2Name: "B",
                l1Name: "Y",
                tier: 2,
                redFlags: [{ type: "CONFIDENCE_GAP", lowConfidencePct: 60 }],
                action: "process",
                combinedMaxValue: 50,
                quickWin: true,
                leadArchetype: "Innovator",
                l4Count: 7,
            },
            {
                l3Name: "Third",
                l2Name: "C",
                l1Name: "Z",
                tier: 3,
                redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
                action: "skip",
                combinedMaxValue: null,
                quickWin: false,
                leadArchetype: null,
                l4Count: 0,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        assert.equal(lines.length, 4, "header + 3 data rows");
        assert.ok(lines[1].startsWith("1\tprocess\tX\tA\tFirst"));
        assert.ok(lines[2].startsWith("2\tprocess\tY\tB\tSecond"));
        assert.ok(lines[3].startsWith("3\tskip\tZ\tC\tThird"));
    });
    it("has no trailing newline", () => {
        const result = formatTriageTsv([]);
        assert.ok(!result.endsWith("\n"), "should not end with newline");
    });
    it("sanitizes newlines in field values to spaces", () => {
        const input = [
            {
                l3Name: "Process\nWith\nNewlines",
                l2Name: "L2\nName",
                l1Name: "L1",
                tier: 1,
                redFlags: [],
                action: "process",
                combinedMaxValue: 100,
                quickWin: false,
                leadArchetype: "Arch\nType",
                l4Count: 4,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        // After sanitization, data row should have no literal newlines
        // So total lines = header + 1 data row = 2
        assert.equal(lines.length, 2, "newlines in fields should be sanitized");
        assert.ok(lines[1].includes("Process With Newlines"));
        assert.ok(lines[1].includes("L2 Name"));
        assert.ok(lines[1].includes("Arch Type"));
    });
    it("renders quickWin boolean as 'true' or 'false' strings", () => {
        const makeResult = (qw) => ({
            l3Name: "Test",
            l2Name: "Test",
            l1Name: "Test",
            tier: 1,
            redFlags: [],
            action: "process",
            combinedMaxValue: 0,
            quickWin: qw,
            leadArchetype: null,
            l4Count: 1,
        });
        const resultTrue = formatTriageTsv([makeResult(true)]);
        const resultFalse = formatTriageTsv([makeResult(false)]);
        const fieldsTrue = resultTrue.split("\n")[1].split("\t");
        const fieldsFalse = resultFalse.split("\n")[1].split("\t");
        assert.equal(fieldsTrue[6], "true");
        assert.equal(fieldsFalse[6], "false");
    });
    it("has exactly 10 columns in header and data rows", () => {
        const input = [
            {
                l3Name: "Test",
                l2Name: "Test",
                l1Name: "Test",
                tier: 1,
                redFlags: [],
                action: "process",
                combinedMaxValue: null,
                quickWin: false,
                leadArchetype: null,
                l4Count: 0,
            },
        ];
        const result = formatTriageTsv(input);
        const lines = result.split("\n");
        const headerCols = lines[0].split("\t").length;
        const dataCols = lines[1].split("\t").length;
        assert.equal(headerCols, 10, "header should have 10 columns");
        assert.equal(dataCols, 10, "data row should have 10 columns");
    });
});
