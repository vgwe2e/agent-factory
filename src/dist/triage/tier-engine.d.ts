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
export declare const TIER1_VALUE_THRESHOLD = 5000000;
/** Minimum fraction of L4s with ai_suitability=HIGH for Tier 2 (inclusive). */
export declare const TIER2_AI_SUITABILITY_THRESHOLD = 0.5;
/**
 * Assigns a tier to an L3 opportunity based on its properties and L4 activities.
 *
 * Check order: Tier 1 first, then Tier 2, then default to Tier 3.
 */
export declare function assignTier(opp: L3Opportunity, l4s: L4Activity[]): Tier;
/**
 * Assigns a tier to a skill based on its properties.
 *
 * Check order: Tier 1 first, then Tier 2, then default to Tier 3.
 *
 * - Tier 1: max_value > $5M AND HIGH financial_rating AND FIRST impact_order
 * - Tier 2: ai_suitability = HIGH on parent L4
 * - Tier 3: default
 */
export declare function assignSkillTier(skill: SkillWithContext): Tier;
