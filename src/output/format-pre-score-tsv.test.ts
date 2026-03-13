/**
 * Tests for pre-score TSV formatter.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPreScoreTsv } from "./format-pre-score-tsv.js";
import type { PreScoreResult } from "../types/scoring.js";
import type { RedFlag } from "../types/triage.js";

// -- Test factory --

function makePreScore(overrides: Partial<PreScoreResult> = {}): PreScoreResult {
  return {
    l4Id: "L4-001",
    l4Name: "Test Activity",
    l3Name: "Test Category",
    l2Name: "Test Domain",
    l1Name: "Test Area",
    dimensions: {
      financial_signal: 0.75,
      ai_suitability: 0.6,
      decision_density: 0.8,
      impact_order: 1.0,
      rating_confidence: 0.6,
      archetype_completeness: 0.5,
    },
    composite: 0.7125,
    survived: true,
    eliminationReason: null,
    redFlags: [],
    skillCount: 3,
    aggregatedMaxValue: 15000000,
    ...overrides,
  };
}

const HEADER_COLUMNS = [
  "rank", "l4_id", "l4_name", "l3_name", "l2_name", "l1_name",
  "financial_signal", "ai_suitability", "decision_density",
  "impact_order", "rating_confidence", "archetype_completeness",
  "composite", "survived", "elimination_reason",
  "red_flags", "skill_count", "aggregated_max_value",
];

describe("formatPreScoreTsv", () => {
  it("returns header + newline for empty results", () => {
    const tsv = formatPreScoreTsv([]);
    const lines = tsv.split("\n");
    assert.equal(lines.length, 2, "header + trailing newline");
    assert.equal(lines[0], HEADER_COLUMNS.join("\t"));
    assert.equal(lines[1], "", "trailing newline");
  });

  it("produces header + 1 data row for single survivor", () => {
    const result = makePreScore();
    const tsv = formatPreScoreTsv([result]);
    const lines = tsv.split("\n");
    assert.equal(lines.length, 3, "header + 1 row + trailing newline");

    const cols = lines[1].split("\t");
    assert.equal(cols[0], "1", "rank");
    assert.equal(cols[1], "L4-001", "l4_id");
    assert.equal(cols[2], "Test Activity", "l4_name");
    assert.equal(cols[13], "Y", "survived");
    assert.equal(cols[14], "", "elimination_reason empty");
  });

  it("sorts survived before eliminated (eliminated at bottom)", () => {
    const survivor = makePreScore({ l4Id: "L4-A", composite: 0.8, survived: true });
    const eliminated = makePreScore({
      l4Id: "L4-B",
      composite: 0,
      survived: false,
      eliminationReason: "DEAD_ZONE",
    });
    const midSurvivor = makePreScore({ l4Id: "L4-C", composite: 0.5, survived: true });

    const tsv = formatPreScoreTsv([eliminated, midSurvivor, survivor]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    // Skip header
    const rows = lines.slice(1);

    assert.equal(rows.length, 3);
    // Sorted by composite DESC: 0.8, 0.5, 0 (eliminated)
    assert.ok(rows[0].includes("L4-A"), "highest composite first");
    assert.ok(rows[1].includes("L4-C"), "mid composite second");
    assert.ok(rows[2].includes("L4-B"), "eliminated (composite 0) last");
  });

  it("shows Y for survived and N for eliminated", () => {
    const survivor = makePreScore({ survived: true });
    const eliminated = makePreScore({
      l4Id: "L4-DEAD",
      survived: false,
      composite: 0,
      eliminationReason: "NO_STAKES",
    });

    const tsv = formatPreScoreTsv([survivor, eliminated]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const rows = lines.slice(1);

    const survivorCols = rows[0].split("\t");
    const eliminatedCols = rows[1].split("\t");

    assert.equal(survivorCols[13], "Y");
    assert.equal(eliminatedCols[13], "N");
  });

  it("shows elimination reason in column", () => {
    const eliminated = makePreScore({
      survived: false,
      composite: 0,
      eliminationReason: "DEAD_ZONE",
    });

    const tsv = formatPreScoreTsv([eliminated]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const cols = lines[1].split("\t");

    assert.equal(cols[14], "DEAD_ZONE");
  });

  it("formats red flags as comma-separated types", () => {
    const flags: RedFlag[] = [
      { type: "DEAD_ZONE", decisionDensity: 0 },
      { type: "CONFIDENCE_GAP", lowConfidencePct: 0.8 },
    ];
    const result = makePreScore({ redFlags: flags, survived: false, composite: 0, eliminationReason: "DEAD_ZONE" });

    const tsv = formatPreScoreTsv([result]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const cols = lines[1].split("\t");

    assert.equal(cols[15], "DEAD_ZONE,CONFIDENCE_GAP");
  });

  it("formats dimension scores to 4 decimal places", () => {
    const result = makePreScore({
      dimensions: {
        financial_signal: 0.33333333,
        ai_suitability: 0.66666666,
        decision_density: 1.0,
        impact_order: 0.0,
        rating_confidence: 0.12345678,
        archetype_completeness: 0.99999999,
      },
      composite: 0.55555555,
    });

    const tsv = formatPreScoreTsv([result]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const cols = lines[1].split("\t");

    // Dimension scores at indices 6-11
    assert.equal(cols[6], "0.3333");
    assert.equal(cols[7], "0.6667");
    assert.equal(cols[8], "1.0000");
    assert.equal(cols[9], "0.0000");
    assert.equal(cols[10], "0.1235");
    assert.equal(cols[11], "1.0000");
    // Composite at index 12
    assert.equal(cols[12], "0.5556");
  });

  it("assigns sequential rank numbers 1, 2, 3", () => {
    const r1 = makePreScore({ l4Id: "A", composite: 0.9 });
    const r2 = makePreScore({ l4Id: "B", composite: 0.7 });
    const r3 = makePreScore({ l4Id: "C", composite: 0.5 });

    const tsv = formatPreScoreTsv([r3, r1, r2]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const rows = lines.slice(1);

    assert.equal(rows[0].split("\t")[0], "1");
    assert.equal(rows[1].split("\t")[0], "2");
    assert.equal(rows[2].split("\t")[0], "3");
  });

  it("includes skill_count and aggregated_max_value", () => {
    const result = makePreScore({ skillCount: 5, aggregatedMaxValue: 25000000 });

    const tsv = formatPreScoreTsv([result]);
    const lines = tsv.split("\n").filter(l => l.length > 0);
    const cols = lines[1].split("\t");

    assert.equal(cols[16], "5");
    assert.equal(cols[17], "25000000");
  });
});
