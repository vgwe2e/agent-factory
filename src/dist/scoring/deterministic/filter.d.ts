/**
 * Top-N filter with cluster-aware tie handling for deterministic pre-scoring.
 *
 * Ranks PreScoreResult candidates by composite DESC, breaks ties by
 * aggregatedMaxValue DESC then l4Id ascending (deterministic).
 * Expands at boundary to include all tied candidates, capped at topN * 1.1.
 *
 * Pure function: no I/O, no side effects.
 */
import type { PreScoreResult, FilterResult } from "../../types/scoring.js";
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
export declare function filterTopN(scored: PreScoreResult[], topN: number): FilterResult;
