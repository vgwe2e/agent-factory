/**
 * Red flag detection for the triage subsystem.
 *
 * Detects 5 types of red flags on L3 opportunities:
 * - PHANTOM: opportunity_exists = false
 * - ORPHAN: l4_count < 3
 * - DEAD_ZONE: 0% decision density across all L4s
 * - NO_STAKES: zero HIGH financial + all SECOND order impact
 * - CONFIDENCE_GAP: >50% of L4s have LOW rating confidence
 *
 * All functions are pure (no I/O, no side effects).
 */
import type { L3Opportunity, L4Activity } from "../types/hierarchy.js";
import type { RedFlag } from "../types/triage.js";
/**
 * Groups L4 activities by their l3 field into a Map.
 */
export declare function groupL4sByL3(hierarchy: L4Activity[]): Map<string, L4Activity[]>;
/**
 * Detects red flags for a single L3 opportunity given its associated L4 activities.
 *
 * Checks flags in order: PHANTOM, ORPHAN, DEAD_ZONE, NO_STAKES, CONFIDENCE_GAP.
 * Returns early from L4-dependent checks if l4s array is empty.
 */
export declare function detectRedFlags(opp: L3Opportunity, l4s: L4Activity[]): RedFlag[];
/**
 * Resolves the worst action from a set of red flags.
 *
 * Priority: skip > demote > flag (flag maps to "process" since flagged items still get processed).
 * Returns "process" if no flags.
 */
export declare function resolveAction(flags: RedFlag[]): "process" | "skip" | "demote";
