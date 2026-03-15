import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAdoptionRisk } from "./format-adoption-risk.js";
function makeTriage(overrides = {}) {
    return {
        l3Name: "Test Opportunity",
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
const FIXED_DATE = "2026-03-11";
describe("formatAdoptionRisk", () => {
    it("produces header with 0 flagged count for empty array", () => {
        const result = formatAdoptionRisk([], FIXED_DATE);
        assert.ok(result.includes("# Adoption Risk Assessment"));
        assert.ok(result.includes("Generated:"));
        assert.ok(result.includes("Total opportunities evaluated:** 0"));
        assert.ok(result.includes("Red-flagged opportunities:** 0"));
    });
    it("contains all 5 flag type sections", () => {
        const result = formatAdoptionRisk([], FIXED_DATE);
        assert.ok(result.includes("## Dead Zones (FLAG-01)"));
        assert.ok(result.includes("## No Stakes (FLAG-02)"));
        assert.ok(result.includes("## Confidence Gaps (FLAG-03)"));
        assert.ok(result.includes("## Phantoms (FLAG-04)"));
        assert.ok(result.includes("## Orphan/Thin Opportunities (FLAG-05)"));
    });
    it("shows 'None identified.' for empty flag type sections", () => {
        const result = formatAdoptionRisk([], FIXED_DATE);
        // Each section with no flags should show "None identified."
        const sections = result.split("## ").slice(1); // skip header before first ##
        for (const section of sections) {
            assert.ok(section.includes("None identified."), `Section should show 'None identified.' but got: ${section.slice(0, 100)}`);
        }
    });
    it("groups flagged opportunities by flag type", () => {
        const opps = [
            makeTriage({
                l3Name: "Dead Opp",
                l1Name: "Finance",
                l2Name: "AP",
                redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
                action: "skip",
            }),
            makeTriage({
                l3Name: "Orphan Opp",
                l1Name: "Supply Chain",
                l2Name: "Logistics",
                redFlags: [{ type: "ORPHAN", l4Count: 1 }],
                action: "demote",
                l4Count: 1,
            }),
        ];
        const result = formatAdoptionRisk(opps, FIXED_DATE);
        // Dead Zones section should contain "Dead Opp"
        const deadIdx = result.indexOf("## Dead Zones");
        const noStakesIdx = result.indexOf("## No Stakes");
        const deadSection = result.slice(deadIdx, noStakesIdx);
        assert.ok(deadSection.includes("Dead Opp"), "Dead Zones should list Dead Opp");
        assert.ok(deadSection.includes("Finance"), "Dead Zones should show domain");
        // Orphan section should contain "Orphan Opp"
        const orphanIdx = result.indexOf("## Orphan/Thin");
        const orphanSection = result.slice(orphanIdx);
        assert.ok(orphanSection.includes("Orphan Opp"), "Orphan section should list Orphan Opp");
    });
    it("counts only flagged opportunities in red-flagged count", () => {
        const opps = [
            makeTriage({ l3Name: "Clean", redFlags: [] }),
            makeTriage({
                l3Name: "Flagged",
                redFlags: [{ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true }],
                action: "demote",
            }),
        ];
        const result = formatAdoptionRisk(opps, FIXED_DATE);
        assert.ok(result.includes("Total opportunities evaluated:** 2"));
        assert.ok(result.includes("Red-flagged opportunities:** 1"));
    });
    it("includes Generated date line with provided date", () => {
        const result = formatAdoptionRisk([], "2026-01-15");
        assert.ok(result.includes("**Generated:** 2026-01-15"));
    });
    it("handles opportunity with multiple flags in different sections", () => {
        const opps = [
            makeTriage({
                l3Name: "Multi-Flag Opp",
                l1Name: "HR",
                l2Name: "Recruiting",
                redFlags: [
                    { type: "DEAD_ZONE", decisionDensity: 0 },
                    { type: "CONFIDENCE_GAP", lowConfidencePct: 0.65 },
                ],
                action: "skip",
            }),
        ];
        const result = formatAdoptionRisk(opps, FIXED_DATE);
        // Should appear in both Dead Zones and Confidence Gaps
        const deadIdx = result.indexOf("## Dead Zones");
        const noStakesIdx = result.indexOf("## No Stakes");
        const deadSection = result.slice(deadIdx, noStakesIdx);
        assert.ok(deadSection.includes("Multi-Flag Opp"));
        const confIdx = result.indexOf("## Confidence Gaps");
        const phantomIdx = result.indexOf("## Phantoms");
        const confSection = result.slice(confIdx, phantomIdx);
        assert.ok(confSection.includes("Multi-Flag Opp"));
    });
    it("includes markdown table with Opportunity, Domain, Reason columns", () => {
        const opps = [
            makeTriage({
                l3Name: "Flagged Opp",
                l1Name: "Finance",
                l2Name: "AP",
                redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
                action: "skip",
            }),
        ];
        const result = formatAdoptionRisk(opps, FIXED_DATE);
        assert.ok(result.includes("| Opportunity | L4 | L3 | Domain | Reason |"));
        assert.ok(result.includes("Flagged Opp"));
        assert.ok(result.includes("Finance > AP"));
    });
    it("uses skill and L4 names when available", () => {
        const opps = [
            makeTriage({
                l3Name: "Parent L3",
                l4Name: "Parent L4",
                skillId: "skill-1",
                skillName: "Forward Opportunity",
                redFlags: [{ type: "DEAD_ZONE", decisionDensity: 0 }],
            }),
        ];
        const result = formatAdoptionRisk(opps, {
            date: FIXED_DATE,
            scored: [{
                    l1Name: "L1 Area",
                    l2Name: "L2 Domain",
                    l3Name: "Parent L3",
                    l4Name: "Parent L4",
                    skillId: "skill-1",
                    skillName: "Forward Opportunity",
                    archetype: "DETERMINISTIC",
                    lenses: {
                        technical: { lens: "technical", subDimensions: [], total: 0, maxPossible: 9, normalized: 0, confidence: "LOW" },
                        adoption: { lens: "adoption", subDimensions: [], total: 0, maxPossible: 12, normalized: 0, confidence: "LOW" },
                        value: { lens: "value", subDimensions: [], total: 0, maxPossible: 6, normalized: 0, confidence: "LOW" },
                    },
                    composite: 0,
                    overallConfidence: "LOW",
                    promotedToSimulation: false,
                    scoringDurationMs: 0,
                }],
        });
        assert.ok(result.includes("Forward Opportunity"));
        assert.ok(result.includes("Parent L4"));
        assert.ok(result.includes("Parent L3"));
    });
    it("marks skipped opportunities", () => {
        const opps = [
            makeTriage({
                l3Name: "Skipped Opp",
                redFlags: [{ type: "PHANTOM", opportunityExists: false }],
                action: "skip",
            }),
        ];
        const result = formatAdoptionRisk(opps, FIXED_DATE);
        // Skipped should be indicated somehow
        assert.ok(result.includes("SKIP") || result.includes("skipped") || result.includes("Skipped"), "Should indicate skipped status");
    });
    it("ends with trailing newline", () => {
        const result = formatAdoptionRisk([], FIXED_DATE);
        assert.ok(result.endsWith("\n"), "should end with trailing newline");
    });
});
