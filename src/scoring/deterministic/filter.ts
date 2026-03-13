/**
 * Top-N filter with cluster-aware tie handling for deterministic pre-scoring.
 *
 * Ranks PreScoreResult candidates by composite DESC, breaks ties by
 * aggregatedMaxValue DESC then l4Id ascending (deterministic).
 * Expands at boundary to include all tied candidates, capped at topN * 1.1.
 *
 * Pure function: no I/O, no side effects.
 */

import type { PreScoreResult, FilterResult, FilterStats } from "../../types/scoring.js";

/**
 * Compare function for deterministic ranking:
 * 1. composite DESC
 * 2. aggregatedMaxValue DESC
 * 3. l4Id ascending (deterministic tiebreaker)
 */
function rankComparator(a: PreScoreResult, b: PreScoreResult): number {
  if (b.composite !== a.composite) return b.composite - a.composite;
  if (b.aggregatedMaxValue !== a.aggregatedMaxValue) return b.aggregatedMaxValue - a.aggregatedMaxValue;
  return a.l4Id < b.l4Id ? -1 : a.l4Id > b.l4Id ? 1 : 0;
}

/**
 * Round to 4 decimal places for floating-point comparison safety.
 */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Filter pre-scored L4 candidates to top-N with cluster-aware tie handling.
 *
 * Algorithm:
 * 1. Separate eliminated (eliminationReason !== null) from rankable candidates.
 * 2. Sort rankable by composite DESC, aggregatedMaxValue DESC, l4Id ASC.
 * 3. Take initial top-N slice.
 * 4. Find boundary score = composite of the Nth candidate.
 * 5. Expand to include all candidates tied at the boundary score.
 * 6. Cap at floor(topN * 1.1) if expansion overflows.
 * 7. Mark survived=true on survivors, survived=false on the rest.
 */
export function filterTopN(scored: PreScoreResult[], topN: number): FilterResult {
  // Edge: topN <= 0 -> no survivors
  if (topN <= 0) {
    const allEliminated = scored.map((s) => ({ ...s, survived: false }));
    return {
      survivors: [],
      eliminated: allEliminated,
      stats: {
        totalCandidates: scored.length,
        requestedTopN: topN,
        actualSurvivors: 0,
        eliminated: scored.length,
        cutoffScore: 0,
        tiesAtBoundary: 0,
      },
    };
  }

  // Step 1: Separate eliminated from rankable
  const alreadyEliminated: PreScoreResult[] = [];
  const rankable: PreScoreResult[] = [];

  for (const s of scored) {
    if (s.eliminationReason !== null) {
      alreadyEliminated.push(s);
    } else {
      rankable.push(s);
    }
  }

  // Step 2: Sort rankable
  rankable.sort(rankComparator);

  // Edge: fewer rankable than topN -> all survive
  if (rankable.length <= topN) {
    const survivors = rankable.map((s) => ({ ...s, survived: true }));
    const eliminated = alreadyEliminated.map((s) => ({ ...s, survived: false }));
    const cutoff = rankable.length > 0 ? rankable[rankable.length - 1].composite : 0;
    return {
      survivors,
      eliminated,
      stats: {
        totalCandidates: scored.length,
        requestedTopN: topN,
        actualSurvivors: survivors.length,
        eliminated: eliminated.length,
        cutoffScore: cutoff,
        tiesAtBoundary: rankable.length > 0 ? rankable.filter((r) => round4(r.composite) === round4(cutoff)).length : 0,
      },
    };
  }

  // Step 3-4: Find boundary score at position topN-1 (0-indexed)
  const boundaryScore = round4(rankable[topN - 1].composite);

  // Step 5: Count ALL candidates at boundary score
  const aboveBoundary: PreScoreResult[] = [];
  const atBoundary: PreScoreResult[] = [];
  const belowBoundary: PreScoreResult[] = [];

  for (const r of rankable) {
    const rounded = round4(r.composite);
    if (rounded > boundaryScore) {
      aboveBoundary.push(r);
    } else if (rounded === boundaryScore) {
      atBoundary.push(r);
    } else {
      belowBoundary.push(r);
    }
  }

  const tiesAtBoundary = atBoundary.length;

  // Step 6: Determine how many from boundary group to include
  const cap = Math.floor(topN * 1.1);
  const slotsForBoundary = cap - aboveBoundary.length;

  let selectedFromBoundary: PreScoreResult[];
  if (slotsForBoundary >= atBoundary.length) {
    // All tied candidates fit within cap
    selectedFromBoundary = atBoundary;
  } else {
    // Must trim: sort boundary group by tiebreakers and take what fits
    atBoundary.sort(rankComparator);
    selectedFromBoundary = atBoundary.slice(0, Math.max(slotsForBoundary, 0));
  }

  const survivorSet = [...aboveBoundary, ...selectedFromBoundary];
  const survivorIds = new Set(survivorSet.map((s) => s.l4Id));

  // Step 7: Mark survived
  const survivors = survivorSet.map((s) => ({ ...s, survived: true }));

  const nonSurvivingRankable = rankable
    .filter((r) => !survivorIds.has(r.l4Id))
    .map((r) => ({ ...r, survived: false }));

  const eliminated = [
    ...alreadyEliminated.map((s) => ({ ...s, survived: false })),
    ...nonSurvivingRankable,
  ];

  const stats: FilterStats = {
    totalCandidates: scored.length,
    requestedTopN: topN,
    actualSurvivors: survivors.length,
    eliminated: eliminated.length,
    cutoffScore: boundaryScore,
    tiesAtBoundary,
  };

  return { survivors, eliminated, stats };
}
