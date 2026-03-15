import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatScoresTsv } from "./format-scores-tsv.js";
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
function makeScoring(overrides = {}) {
    return {
        skillId: "skill-test",
        skillName: "Autonomous Test Skill",
        l4Name: "Test L4 Activity",
        l3Name: "Test Opportunity",
        l2Name: "L2 Domain",
        l1Name: "L1 Area",
        archetype: "DETERMINISTIC",
        lenses: {
            technical: makeLens("technical", [
                makeSub("data_readiness", 2),
                makeSub("aera_platform_fit", 3),
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
const EXPECTED_HEADER = [
    "skill_id", "skill_name", "l4_name", "l3_name", "l2_name", "l1_name", "archetype",
    "data_readiness", "platform_fit", "archetype_conf", "tech_total",
    "decision_density", "financial_gravity", "impact_proximity", "confidence_signal", "adoption_total",
    "value_density", "simulation_viability", "value_total",
    "composite", "confidence", "promotes_to_sim", "is_cross_functional",
].join("\t");
describe("formatScoresTsv", () => {
    it("returns header + trailing newline for empty array", () => {
        const result = formatScoresTsv([]);
        const lines = result.split("\n");
        assert.equal(lines[0], EXPECTED_HEADER);
        assert.ok(result.endsWith("\n"), "should end with trailing newline");
        assert.equal(lines.length, 2, "header + trailing empty");
    });
    it("contains all 23 columns", () => {
        const result = formatScoresTsv([makeScoring()]);
        const headerCols = result.split("\n")[0].split("\t");
        assert.equal(headerCols.length, 23);
    });
    it("sorts by composite DESC", () => {
        const opps = [
            makeScoring({ l3Name: "Low", composite: 0.30 }),
            makeScoring({ l3Name: "High", composite: 0.85 }),
        ];
        const result = formatScoresTsv(opps);
        const dataRows = result.trim().split("\n").slice(1);
        assert.equal(dataRows.length, 2);
        // Data rows start with skill_id, then skill_name, then l4_name, then l3_name
        assert.ok(dataRows[0].includes("High"), "higher composite first");
        assert.ok(dataRows[1].includes("Low"), "lower composite second");
    });
    it("formats composite to 2 decimal places", () => {
        const opp = makeScoring({ composite: 0.7 });
        const result = formatScoresTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // composite is column index 19 (0-based)
        assert.equal(cells[19], "0.70");
    });
    it("renders promotes_to_simulation as Y/N", () => {
        const opp = makeScoring({ promotedToSimulation: true });
        const result = formatScoresTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // promotes_to_sim is last column (index 21)
        assert.equal(cells[21], "Y");
    });
    it("renders is_cross_functional as Y/N", () => {
        const result = formatScoresTsv([
            makeScoring({ skillId: "cf-123", l1Name: "Cross-Functional" }),
        ]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        assert.equal(cells[22], "Y");
    });
    it("renders sub-dimension scores as numbers only", () => {
        const opp = makeScoring();
        const result = formatScoresTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        // data_readiness is column index 7
        assert.equal(cells[7], "2", "data_readiness score");
        // platform_fit is column index 8
        assert.equal(cells[8], "3", "platform_fit score");
        // archetype_conf is column index 9
        assert.equal(cells[9], "1", "archetype_confidence score");
    });
    it("renders two-pass naming variants into legacy TSV columns", () => {
        const opp = makeScoring({
            lenses: {
                technical: makeLens("technical", [
                    makeSub("platform_fit", 2),
                ]),
                adoption: makeLens("adoption", [
                    makeSub("decision_density", 3),
                    makeSub("financial_signal", 2),
                    makeSub("impact_order", 1),
                    makeSub("rating_confidence", 2),
                ]),
                value: makeLens("value", [
                    makeSub("value_density", 2),
                    makeSub("simulation_viability", 3),
                ]),
            },
        });
        const result = formatScoresTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        assert.equal(cells[8], "2", "platform_fit should map from two-pass technical lens");
        assert.equal(cells[12], "2", "financial_gravity column should map from financial_signal");
        assert.equal(cells[13], "1", "impact_proximity column should map from impact_order");
        assert.equal(cells[14], "2", "confidence_signal column should map from rating_confidence");
    });
    it("omits placeholder technical columns in two-pass mode", () => {
        const opp = makeScoring({
            lenses: {
                technical: makeLens("technical", [
                    makeSub("platform_fit", 2),
                ]),
                adoption: makeLens("adoption", [
                    makeSub("decision_density", 3),
                    makeSub("financial_signal", 2),
                    makeSub("impact_order", 1),
                    makeSub("rating_confidence", 2),
                ]),
                value: makeLens("value", [
                    makeSub("value_density", 2),
                    makeSub("simulation_viability", 3),
                ]),
            },
        });
        const result = formatScoresTsv([opp], "two-pass");
        const [header, row] = result.trim().split("\n");
        const headerCols = header.split("\t");
        const cells = row.split("\t");
        assert.ok(!headerCols.includes("data_readiness"));
        assert.ok(!headerCols.includes("archetype_conf"));
        assert.equal(headerCols[7], "platform_fit");
        assert.equal(cells[7], "2");
        assert.equal(headerCols.at(-1), "is_cross_functional");
    });
    it("renders archetype correctly", () => {
        const opp = makeScoring();
        const result = formatScoresTsv([opp]);
        const dataRow = result.trim().split("\n")[1];
        const cells = dataRow.split("\t");
        assert.equal(cells[6], "DETERMINISTIC");
    });
});
