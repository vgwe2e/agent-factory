import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatTriageTsv } from "./format-triage-tsv.js";
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
describe("formatTriageTsv", () => {
    it("returns header + trailing newline for empty array", () => {
        const result = formatTriageTsv([]);
        const lines = result.split("\n");
        // Header line + empty trailing line after final newline
        assert.equal(lines[0], "tier\tl3_name\tl1_name\tl2_name\tlead_archetype\tquick_win\tcombined_max_value\tflag_count\tflags");
        assert.ok(result.endsWith("\n"), "should end with trailing newline");
        assert.equal(lines.length, 2, "header + trailing empty");
    });
    it("sorts by tier ASC then combined_max_value DESC", () => {
        const opps = [
            makeTriage({ l3Name: "Tier3Low", tier: 3, combinedMaxValue: 1_000_000 }),
            makeTriage({ l3Name: "Tier1High", tier: 1, combinedMaxValue: 10_000_000 }),
            makeTriage({ l3Name: "Tier2Mid", tier: 2, combinedMaxValue: 5_000_000 }),
            makeTriage({ l3Name: "Tier1Low", tier: 1, combinedMaxValue: 3_000_000 }),
        ];
        const result = formatTriageTsv(opps);
        const dataRows = result.trim().split("\n").slice(1); // skip header
        assert.equal(dataRows.length, 4);
        assert.ok(dataRows[0].startsWith("1\tTier1High"), "first row should be Tier1High");
        assert.ok(dataRows[1].startsWith("1\tTier1Low"), "second row should be Tier1Low");
        assert.ok(dataRows[2].startsWith("2\tTier2Mid"), "third row should be Tier2Mid");
        assert.ok(dataRows[3].startsWith("3\tTier3Low"), "fourth row should be Tier3Low");
    });
    it("renders null lead_archetype as empty cell", () => {
        const opp = makeTriage({ leadArchetype: null });
        const result = formatTriageTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // lead_archetype is column index 4
        assert.equal(cells[4], "", "null archetype should be empty string");
    });
    it("joins red flag types with semicolon separator", () => {
        const opp = makeTriage({
            redFlags: [
                { type: "DEAD_ZONE", decisionDensity: 0 },
                { type: "ORPHAN", l4Count: 1 },
            ],
        });
        const result = formatTriageTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // flag_count is second to last, flags is last
        assert.equal(cells[cells.length - 2], "2", "flag_count should be 2");
        assert.equal(cells[cells.length - 1], "DEAD_ZONE; ORPHAN");
    });
    it("renders quick_win as Y/N", () => {
        const opp = makeTriage({ quickWin: true });
        const result = formatTriageTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // quick_win is column index 5
        assert.equal(cells[5], "Y");
    });
    it("renders null combined_max_value as empty cell", () => {
        const opp = makeTriage({ combinedMaxValue: null });
        const result = formatTriageTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // combined_max_value is column index 6
        assert.equal(cells[6], "");
    });
});
