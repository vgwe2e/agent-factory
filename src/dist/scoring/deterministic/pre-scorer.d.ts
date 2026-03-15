/**
 * Pre-scorer orchestrator for deterministic L4 scoring.
 *
 * Wires together dimension scorers, composite computation, red flag detection,
 * and top-N filtering into a single synchronous function.
 *
 * Pure function: no I/O, no side effects, no async.
 */
import type { L4Activity } from "../../types/hierarchy.js";
import type { FilterResult } from "../../types/scoring.js";
/**
 * Score all L4 activities deterministically and filter to top-N.
 *
 * Flow per L4:
 * 1. Compute 6 dimension scores
 * 2. Compute weighted composite
 * 3. Detect red flags
 * 4. Apply red flag penalties (may eliminate or reduce composite)
 * 5. Aggregate max_value across skills
 * 6. Build PreScoreResult
 *
 * Then pass all results through filterTopN for cluster-aware selection.
 */
export declare function preScoreAll(hierarchy: L4Activity[], topN: number): FilterResult;
