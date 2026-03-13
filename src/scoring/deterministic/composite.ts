/**
 * Weighted composite computation for deterministic pre-scoring.
 *
 * Pure function: takes DimensionScores, returns a 0-1 weighted sum
 * rounded to 4 decimal places.
 */

import { DETERMINISTIC_WEIGHTS, type DimensionScores, type DeterministicDimension } from "../../types/scoring.js";

/**
 * Compute the weighted composite score from individual dimension scores.
 * Result is rounded to 4 decimal places to avoid floating-point tie issues.
 */
export function computeDeterministicComposite(scores: DimensionScores): number {
  let composite = 0;
  for (const key of Object.keys(DETERMINISTIC_WEIGHTS) as DeterministicDimension[]) {
    composite += scores[key] * DETERMINISTIC_WEIGHTS[key];
  }
  return Math.round(composite * 10000) / 10000;
}
