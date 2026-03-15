/**
 * Full triage pipeline for the triage subsystem.
 *
 * Orchestrates: red flag detection -> tier assignment -> sorting.
 * Now operates at SKILL level -- each skill is individually triaged.
 * L4 activities without skills are skipped.
 *
 * Output is sorted: Tier 1 first, then 2, then 3, value descending within tier.
 *
 * All functions are pure (no I/O, no side effects).
 */
import type { HierarchyExport } from "../types/hierarchy.js";
import type { TriageResult } from "../types/triage.js";
/**
 * Runs the full triage pipeline on a hierarchy export at SKILL level.
 *
 * Steps:
 * 1. Extract all skills with parent L4 context
 * 2. For each skill: detect flags, resolve action, assign tier
 * 3. Skipped/demoted items forced to Tier 3
 * 4. Sort by tier ascending, then value descending (nulls last)
 */
export declare function triageOpportunities(data: HierarchyExport): TriageResult[];
/**
 * Comparison function for sorting TriageResults.
 * Sorts by tier ascending, then by combinedMaxValue descending (nulls last).
 */
export declare function compareTriage(a: TriageResult, b: TriageResult): number;
