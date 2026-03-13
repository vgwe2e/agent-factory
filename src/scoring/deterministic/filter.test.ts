import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PreScoreResult } from "../../types/scoring.js";
import { filterTopN } from "./filter.js";

// -- Factory helper --

function makeResult(overrides: Partial<PreScoreResult> = {}): PreScoreResult {
  return {
    l4Id: "l4-1",
    l4Name: "Test L4",
    l3Name: "L3",
    l2Name: "L2",
    l1Name: "L1",
    dimensions: {
      financial_signal: 0.5,
      ai_suitability: 0.5,
      decision_density: 0.5,
      impact_order: 0.5,
      rating_confidence: 0.5,
      archetype_completeness: 0.5,
    },
    composite: 0.5,
    survived: false,
    eliminationReason: null,
    redFlags: [],
    skillCount: 1,
    aggregatedMaxValue: 100_000,
    ...overrides,
  };
}

// -- Basic filtering --

describe("filterTopN", () => {
  it("selects correct top-3 from 10 candidates", () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeResult({ l4Id: `l4-${i}`, composite: (10 - i) * 0.1 }),
    );
    const result = filterTopN(candidates, 3);
    assert.equal(result.survivors.length, 3);
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-0", "l4-1", "l4-2"],
    );
    assert.equal(result.eliminated.length, 7);
    assert.equal(result.stats.totalCandidates, 10);
    assert.equal(result.stats.requestedTopN, 3);
    assert.equal(result.stats.actualSurvivors, 3);
    assert.equal(result.stats.eliminated, 7);
  });

  // -- Tie at boundary --

  it("includes tied candidates at boundary within 1.1x cap", () => {
    // 5 candidates: top-2 unique, then 2 tied at position 3 composite
    const candidates = [
      makeResult({ l4Id: "l4-a", composite: 0.9 }),
      makeResult({ l4Id: "l4-b", composite: 0.8 }),
      makeResult({ l4Id: "l4-c", composite: 0.7, aggregatedMaxValue: 200_000 }),
      makeResult({ l4Id: "l4-d", composite: 0.7, aggregatedMaxValue: 100_000 }),
      makeResult({ l4Id: "l4-e", composite: 0.5 }),
    ];
    // topN=3, boundary at composite 0.7, 2 tied at boundary
    // 1.1x cap = floor(3*1.1) = 3, but we already have 4 if we include both ties
    // Wait: top-3 slice includes l4-a(0.9), l4-b(0.8), l4-c(0.7). Boundary = 0.7.
    // l4-d also at 0.7, so expand to 4. Cap = floor(3*1.1) = 3.
    // 4 > 3, so cap triggers: break ties at boundary by maxValue DESC then l4Id ASC.
    // At boundary 0.7: l4-c (maxVal=200k) > l4-d (maxVal=100k). Keep l4-c.
    // Survivors: l4-a, l4-b, l4-c = 3
    const result = filterTopN(candidates, 3);
    assert.equal(result.survivors.length, 3);
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-a", "l4-b", "l4-c"],
    );
    assert.equal(result.stats.tiesAtBoundary, 2);
    assert.equal(result.stats.cutoffScore, 0.7);
  });

  it("includes all ties when within 1.1x cap", () => {
    // topN=10, 1.1x cap = 11. 10 unique + 2 tied at boundary = 12 > 11, trim.
    // But let's do: topN=10, 9 unique above, 2 tied at boundary = 11 total, within cap of 11.
    const candidates = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeResult({ l4Id: `l4-${i}`, composite: 1.0 - i * 0.05 }),
      ),
      // positions 10-11: tied at boundary composite
      makeResult({ l4Id: "l4-tie-a", composite: 0.55, aggregatedMaxValue: 300_000 }),
      makeResult({ l4Id: "l4-tie-b", composite: 0.55, aggregatedMaxValue: 200_000 }),
      makeResult({ l4Id: "l4-below", composite: 0.4 }),
    ];
    // topN=10, initial top-10 includes 9 unique + l4-tie-a (0.55). Boundary = 0.55.
    // l4-tie-b also at 0.55, expand to 11. Cap = floor(10*1.1) = 11. 11 <= 11, all survive.
    const result = filterTopN(candidates, 10);
    assert.equal(result.survivors.length, 11);
    assert.equal(result.stats.tiesAtBoundary, 2);
  });

  // -- Tie overflow cap --

  it("caps at floor(topN * 1.1) when many tied candidates exceed limit", () => {
    // topN=3, cap=floor(3.3)=3. 2 unique above + 5 all tied at boundary.
    const candidates = [
      makeResult({ l4Id: "l4-top1", composite: 0.9 }),
      makeResult({ l4Id: "l4-top2", composite: 0.8 }),
      // 5 tied at 0.7 -- topN slot 3 is in here
      makeResult({ l4Id: "l4-t1", composite: 0.7, aggregatedMaxValue: 500_000 }),
      makeResult({ l4Id: "l4-t2", composite: 0.7, aggregatedMaxValue: 400_000 }),
      makeResult({ l4Id: "l4-t3", composite: 0.7, aggregatedMaxValue: 300_000 }),
      makeResult({ l4Id: "l4-t4", composite: 0.7, aggregatedMaxValue: 200_000 }),
      makeResult({ l4Id: "l4-t5", composite: 0.7, aggregatedMaxValue: 100_000 }),
    ];
    // Expand: 2 above + 5 tied = 7. Cap = floor(3*1.1) = 3. 7 > 3, trim.
    // Among the 5 tied, sort by maxValue DESC: t1, t2, t3, t4, t5.
    // Need 3 - 2 = 1 from ties. Keep t1 only.
    const result = filterTopN(candidates, 3);
    assert.equal(result.survivors.length, 3);
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-top1", "l4-top2", "l4-t1"],
    );
    assert.equal(result.stats.tiesAtBoundary, 5);
  });

  // -- Max value tiebreaking --

  it("breaks ties by aggregatedMaxValue DESC", () => {
    const candidates = [
      makeResult({ l4Id: "l4-a", composite: 0.8, aggregatedMaxValue: 50_000 }),
      makeResult({ l4Id: "l4-b", composite: 0.8, aggregatedMaxValue: 200_000 }),
      makeResult({ l4Id: "l4-c", composite: 0.8, aggregatedMaxValue: 100_000 }),
    ];
    const result = filterTopN(candidates, 2);
    // Sort by maxValue DESC: l4-b(200k), l4-c(100k), l4-a(50k). Top 2: l4-b, l4-c.
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-b", "l4-c"],
    );
  });

  // -- L4 ID final tiebreaker --

  it("breaks ties by l4Id ascending when composite and maxValue match", () => {
    const candidates = [
      makeResult({ l4Id: "l4-z", composite: 0.8, aggregatedMaxValue: 100_000 }),
      makeResult({ l4Id: "l4-a", composite: 0.8, aggregatedMaxValue: 100_000 }),
      makeResult({ l4Id: "l4-m", composite: 0.8, aggregatedMaxValue: 100_000 }),
    ];
    const result = filterTopN(candidates, 2);
    // All same composite + maxValue. Sort by l4Id ASC: l4-a, l4-m, l4-z. Top 2: l4-a, l4-m.
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-a", "l4-m"],
    );
  });

  // -- Eliminated candidates excluded from ranking --

  it("excludes eliminated candidates from ranking but includes in result", () => {
    const candidates = [
      makeResult({ l4Id: "l4-a", composite: 0.9 }),
      makeResult({ l4Id: "l4-elim", composite: 0.95, eliminationReason: "DEAD_ZONE" }),
      makeResult({ l4Id: "l4-b", composite: 0.8 }),
      makeResult({ l4Id: "l4-c", composite: 0.7 }),
    ];
    const result = filterTopN(candidates, 2);
    // l4-elim is eliminated, not ranked. Rankable: l4-a(0.9), l4-b(0.8), l4-c(0.7). Top 2: l4-a, l4-b.
    assert.equal(result.survivors.length, 2);
    assert.deepEqual(
      result.survivors.map((s) => s.l4Id),
      ["l4-a", "l4-b"],
    );
    // eliminated includes l4-elim + l4-c
    assert.equal(result.eliminated.length, 2);
    const elimIds = result.eliminated.map((e) => e.l4Id).sort();
    assert.deepEqual(elimIds, ["l4-c", "l4-elim"]);
    // stats
    assert.equal(result.stats.totalCandidates, 4);
    assert.equal(result.stats.eliminated, 2);
  });

  // -- Edge: fewer candidates than topN --

  it("returns all candidates as survivors when fewer than topN", () => {
    const candidates = [
      makeResult({ l4Id: "l4-a", composite: 0.9 }),
      makeResult({ l4Id: "l4-b", composite: 0.7 }),
    ];
    const result = filterTopN(candidates, 10);
    assert.equal(result.survivors.length, 2);
    assert.equal(result.eliminated.length, 0);
    assert.equal(result.stats.actualSurvivors, 2);
    assert.equal(result.stats.cutoffScore, 0.7);
  });

  // -- Edge: topN <= 0 --

  it("returns no survivors when topN is 0", () => {
    const candidates = [
      makeResult({ l4Id: "l4-a", composite: 0.9 }),
    ];
    const result = filterTopN(candidates, 0);
    assert.equal(result.survivors.length, 0);
    assert.equal(result.eliminated.length, 1);
  });

  // -- FilterStats correctness --

  it("reports accurate FilterStats", () => {
    const candidates = Array.from({ length: 20 }, (_, i) =>
      makeResult({ l4Id: `l4-${String(i).padStart(2, "0")}`, composite: (20 - i) * 0.05 }),
    );
    const result = filterTopN(candidates, 5);
    assert.equal(result.stats.totalCandidates, 20);
    assert.equal(result.stats.requestedTopN, 5);
    assert.equal(result.stats.actualSurvivors, 5);
    assert.equal(result.stats.eliminated, 15);
    // 5th candidate (index 4) has composite (20-4)*0.05 = 0.8
    assert.equal(result.stats.cutoffScore, 0.8);
    assert.equal(result.stats.tiesAtBoundary, 1);
  });
});
