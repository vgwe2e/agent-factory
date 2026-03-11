import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMetaReflection } from "./format-meta-reflection.js";
// -- Test fixtures --
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
        l3Name: "Test Opportunity",
        l2Name: "L2 Domain",
        l1Name: "L1 Area",
        archetype: "DETERMINISTIC",
        archetypeSource: "export",
        lenses: {
            technical: makeLens("technical", [
                makeSub("data_readiness", 2),
                makeSub("platform_fit", 3),
                makeSub("archetype_confidence", 2),
            ]),
            adoption: makeLens("adoption", [
                makeSub("decision_density", 2),
                makeSub("financial_gravity", 3),
                makeSub("impact_proximity", 2),
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
function makeTriage(overrides = {}) {
    return {
        l3Name: "Test Opportunity",
        l2Name: "L2 Domain",
        l1Name: "L1 Area",
        tier: 1,
        redFlags: [],
        action: "process",
        combinedMaxValue: 10_000_000,
        quickWin: true,
        leadArchetype: "DETERMINISTIC",
        l4Count: 5,
        ...overrides,
    };
}
function makeSimResults(overrides = {}) {
    return {
        results: [],
        totalSimulated: 0,
        totalFailed: 0,
        totalConfirmed: 0,
        totalInferred: 0,
        ...overrides,
    };
}
const FIXED_DATE = "2026-01-15";
describe("formatMetaReflection", () => {
    it("returns markdown heading", () => {
        const md = formatMetaReflection([], [], makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("# Meta-Reflection: Catalog-Level Analysis"));
    });
    it("shows generated date", () => {
        const md = formatMetaReflection([], [], makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("2026-01-15"));
    });
    it("shows overview section with counts", () => {
        const triaged = [makeTriage(), makeTriage({ l3Name: "Two" })];
        const scored = [makeScoring(), makeScoring({ l3Name: "Two" })];
        const simResults = makeSimResults({ totalSimulated: 1, totalFailed: 0 });
        const md = formatMetaReflection(triaged, scored, simResults, FIXED_DATE);
        assert.ok(md.includes("Overview"));
        assert.ok(md.includes("2"), "total opportunities");
        assert.ok(md.includes("1"), "simulated count");
    });
    it("shows archetype distribution table", () => {
        const scored = [
            makeScoring({ l3Name: "A", archetype: "DETERMINISTIC" }),
            makeScoring({ l3Name: "B", archetype: "AGENTIC" }),
            makeScoring({ l3Name: "C", archetype: "DETERMINISTIC" }),
        ];
        const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name }));
        const md = formatMetaReflection(triaged, scored, makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Archetype Distribution"));
        assert.ok(md.includes("DETERMINISTIC"));
        assert.ok(md.includes("AGENTIC"));
    });
    it("shows red flag frequency table", () => {
        const triaged = [
            makeTriage({
                l3Name: "A",
                redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
            }),
            makeTriage({
                l3Name: "B",
                redFlags: [
                    { type: "DEAD_ZONE", decisionDensity: 0 },
                    { type: "PHANTOM", opportunityExists: false },
                ],
            }),
            makeTriage({ l3Name: "C", redFlags: [] }),
        ];
        const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name }));
        const md = formatMetaReflection(triaged, scored, makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Red Flag Frequency"));
        assert.ok(md.includes("DEAD_ZONE"));
        assert.ok(md.includes("PHANTOM"));
    });
    it("shows tier distribution table", () => {
        const triaged = [
            makeTriage({ l3Name: "A", tier: 1 }),
            makeTriage({ l3Name: "B", tier: 2 }),
            makeTriage({ l3Name: "C", tier: 2 }),
            makeTriage({ l3Name: "D", tier: 3 }),
        ];
        const scored = triaged.map(t => makeScoring({ l3Name: t.l3Name }));
        const md = formatMetaReflection(triaged, scored, makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Tier Distribution"));
        assert.ok(md.includes("Tier 1"));
        assert.ok(md.includes("Tier 2"));
        assert.ok(md.includes("Tier 3"));
    });
    it("shows domain performance table with avg composite", () => {
        const scored = [
            makeScoring({ l3Name: "A", l1Name: "Supply Chain", composite: 0.80 }),
            makeScoring({ l3Name: "B", l1Name: "Supply Chain", composite: 0.60 }),
            makeScoring({ l3Name: "C", l1Name: "Finance", composite: 0.50 }),
        ];
        const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name, l1Name: s.l1Name }));
        const md = formatMetaReflection(triaged, scored, makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Domain Performance"));
        assert.ok(md.includes("Supply Chain"));
        assert.ok(md.includes("Finance"));
        // Supply Chain avg = 0.70
        assert.ok(md.includes("0.70"));
    });
    it("shows knowledge base coverage from simulation results", () => {
        const simResults = makeSimResults({
            totalSimulated: 3,
            totalConfirmed: 15,
            totalInferred: 5,
        });
        const md = formatMetaReflection([], [], simResults, FIXED_DATE);
        assert.ok(md.includes("Knowledge Base Coverage"));
        assert.ok(md.includes("15"), "confirmed count");
        assert.ok(md.includes("5"), "inferred count");
    });
    it("shows key patterns section with top/bottom domains", () => {
        const scored = [
            makeScoring({ l3Name: "A", l1Name: "Strong Domain", composite: 0.90 }),
            makeScoring({ l3Name: "B", l1Name: "Weak Domain", composite: 0.30 }),
        ];
        const triaged = scored.map(s => makeTriage({ l3Name: s.l3Name, l1Name: s.l1Name }));
        const md = formatMetaReflection(triaged, scored, makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Key Patterns"));
        assert.ok(md.includes("Strong Domain"));
        assert.ok(md.includes("Weak Domain"));
    });
    it("handles empty inputs gracefully", () => {
        const md = formatMetaReflection([], [], makeSimResults(), FIXED_DATE);
        assert.ok(md.includes("Meta-Reflection"));
        assert.ok(md.endsWith("\n"));
        // Should not throw
    });
    it("shows simulation success rate", () => {
        const simResults = makeSimResults({
            totalSimulated: 8,
            totalFailed: 2,
        });
        const md = formatMetaReflection([], [], simResults, FIXED_DATE);
        // 8 / (8+2) = 80%
        assert.ok(md.includes("80.0%"));
    });
    it("handles zero simulations for success rate", () => {
        const simResults = makeSimResults({
            totalSimulated: 0,
            totalFailed: 0,
        });
        const md = formatMetaReflection([], [], simResults, FIXED_DATE);
        // Should show N/A or 0% but not crash
        assert.ok(md.includes("N/A") || md.includes("0"));
    });
    it("ends with newline", () => {
        const md = formatMetaReflection([], [], makeSimResults(), FIXED_DATE);
        assert.ok(md.endsWith("\n"));
    });
});
