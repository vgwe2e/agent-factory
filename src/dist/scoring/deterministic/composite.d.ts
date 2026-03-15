/**
 * Weighted composite computation for deterministic pre-scoring.
 *
 * Pure function: takes DimensionScores, returns a 0-1 weighted sum
 * rounded to 4 decimal places.
 */
import { type DimensionScores } from "../../types/scoring.js";
/**
 * Compute the weighted composite score from individual dimension scores.
 * Result is rounded to 4 decimal places to avoid floating-point tie issues.
 */
export declare function computeDeterministicComposite(scores: DimensionScores): number;
