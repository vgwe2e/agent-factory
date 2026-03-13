/**
 * Pre-scorer orchestrator for deterministic L4 scoring.
 *
 * Wires together dimension scorers, composite computation, red flag detection,
 * and top-N filtering into a single synchronous function.
 *
 * Pure function: no I/O, no side effects, no async.
 */

import type { L4Activity } from "../../types/hierarchy.js";
import type { PreScoreResult, FilterResult } from "../../types/scoring.js";
import {
  scoreFinancialSignal,
  scoreAiSuitability,
  scoreDecisionDensity,
  scoreImpactOrder,
  scoreRatingConfidence,
  scoreArchetypeCompleteness,
} from "./dimensions.js";
import { computeDeterministicComposite } from "./composite.js";
import { detectL4RedFlags, applyRedFlagPenalties } from "./red-flags.js";
import { filterTopN } from "./filter.js";

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
export function preScoreAll(hierarchy: L4Activity[], topN: number): FilterResult {
  const scored: PreScoreResult[] = [];

  for (const l4 of hierarchy) {
    // Step 1: Compute dimension scores
    const dimensions = {
      financial_signal: scoreFinancialSignal(l4),
      ai_suitability: scoreAiSuitability(l4),
      decision_density: scoreDecisionDensity(l4),
      impact_order: scoreImpactOrder(l4),
      rating_confidence: scoreRatingConfidence(l4),
      archetype_completeness: scoreArchetypeCompleteness(l4),
    };

    // Step 2: Weighted composite
    const rawComposite = computeDeterministicComposite(dimensions);

    // Step 3: Red flags
    const redFlags = detectL4RedFlags(l4);

    // Step 4: Apply penalties
    const { composite, eliminated, eliminationReason } = applyRedFlagPenalties(rawComposite, redFlags);

    // Step 5: Aggregate max_value
    let aggregatedMaxValue = 0;
    for (const skill of l4.skills) {
      aggregatedMaxValue += skill.max_value;
    }

    // Step 6: Build result
    scored.push({
      l4Id: l4.id,
      l4Name: l4.name,
      l3Name: l4.l3,
      l2Name: l4.l2,
      l1Name: l4.l1,
      dimensions,
      composite,
      survived: false, // filter will update
      eliminationReason: eliminated ? eliminationReason : null,
      redFlags,
      skillCount: l4.skills.length,
      aggregatedMaxValue,
    });
  }

  // Step 7: Filter
  return filterTopN(scored, topN);
}
