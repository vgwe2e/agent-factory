/**
 * Per-L4 red flag detection and penalty application.
 *
 * Detects DEAD_ZONE, NO_STAKES, and CONFIDENCE_GAP at the L4 activity level.
 * PHANTOM and ORPHAN are L3 properties -- not applicable here.
 *
 * Pure functions with zero I/O.
 */
import type { L4Activity } from "../../types/hierarchy.js";
import type { RedFlag } from "../../types/triage.js";
/**
 * Detect red flags for a single L4 activity.
 *
 * - DEAD_ZONE: no decision and all skills have 0 actions + 0 constraints (or empty skills)
 * - NO_STAKES: LOW financial rating AND SECOND impact order
 * - CONFIDENCE_GAP: LOW rating confidence
 */
export declare function detectL4RedFlags(l4: L4Activity): RedFlag[];
/**
 * Apply red flag penalties to a composite score.
 *
 * - DEAD_ZONE or NO_STAKES: hard elimination (composite=0)
 * - CONFIDENCE_GAP: 0.3 penalty multiplier (composite *= 0.3)
 * - Hard elimination takes priority over penalty
 * - Result rounded to 4 decimal places
 */
export declare function applyRedFlagPenalties(composite: number, flags: RedFlag[]): {
    composite: number;
    eliminated: boolean;
    eliminationReason: string | null;
};
