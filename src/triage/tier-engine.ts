/**
 * Tier assignment engine for the triage subsystem.
 *
 * Bins L3 opportunities into Tier 1, 2, or 3 based on:
 * - Tier 1: quick_win AND combined_max_value > $5M
 * - Tier 2: >=50% of L4 activities have ai_suitability = HIGH
 * - Tier 3: everything else
 *
 * Tier 1 is checked first (takes priority over Tier 2).
 * All functions are pure (no I/O, no side effects).
 */

import type { L3Opportunity, L4Activity, SkillWithContext } from "../types/hierarchy.js";
import type { Tier } from "../types/triage.js";

/** Minimum combined_max_value for Tier 1 qualification (exclusive). */
export const TIER1_VALUE_THRESHOLD = 5_000_000;

/** Minimum fraction of L4s with ai_suitability=HIGH for Tier 2 (inclusive). */
export const TIER2_AI_SUITABILITY_THRESHOLD = 0.5;

/**
 * Assigns a tier to an L3 opportunity based on its properties and L4 activities.
 *
 * Check order: Tier 1 first, then Tier 2, then default to Tier 3.
 */
export function assignTier(opp: L3Opportunity, l4s: L4Activity[]): Tier {
  // Tier 1: quick_win AND value > threshold (null value disqualifies)
  if (
    opp.quick_win &&
    opp.combined_max_value !== null &&
    opp.combined_max_value > TIER1_VALUE_THRESHOLD
  ) {
    return 1;
  }

  // Tier 2: >=50% of L4s have ai_suitability = HIGH (empty L4s -> Tier 3)
  if (l4s.length > 0) {
    const highAiCount = l4s.filter(
      (l4) => l4.ai_suitability === "HIGH",
    ).length;
    if (highAiCount / l4s.length >= TIER2_AI_SUITABILITY_THRESHOLD) {
      return 2;
    }
  }

  // Tier 3: default
  return 3;
}

/**
 * Assigns a tier to a skill based on its properties.
 *
 * Check order: Tier 1 first, then Tier 2, then default to Tier 3.
 *
 * - Tier 1: max_value > $5M AND HIGH financial_rating AND FIRST impact_order
 * - Tier 2: ai_suitability = HIGH on parent L4
 * - Tier 3: default
 */
export function assignSkillTier(skill: SkillWithContext): Tier {
  // Tier 1: high value + financial urgency + first-order impact
  if (
    skill.max_value > TIER1_VALUE_THRESHOLD &&
    skill.financialRating === "HIGH" &&
    skill.impactOrder === "FIRST"
  ) {
    return 1;
  }

  // Tier 2: HIGH AI suitability on parent L4
  if (skill.aiSuitability === "HIGH") {
    return 2;
  }

  // Tier 3: default
  return 3;
}
