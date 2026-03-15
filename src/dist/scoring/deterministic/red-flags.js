/**
 * Per-L4 red flag detection and penalty application.
 *
 * Detects DEAD_ZONE, NO_STAKES, and CONFIDENCE_GAP at the L4 activity level.
 * PHANTOM and ORPHAN are L3 properties -- not applicable here.
 *
 * Pure functions with zero I/O.
 */
/**
 * Detect red flags for a single L4 activity.
 *
 * - DEAD_ZONE: no decision and all skills have 0 actions + 0 constraints (or empty skills)
 * - NO_STAKES: LOW financial rating AND SECOND impact order
 * - CONFIDENCE_GAP: LOW rating confidence
 */
export function detectL4RedFlags(l4) {
    const flags = [];
    // DEAD_ZONE: no decision and no signal density in any skill
    if (!l4.decision_exists) {
        const allEmpty = l4.skills.every((s) => s.actions.length === 0 && s.constraints.length === 0);
        if (allEmpty) {
            flags.push({ type: "DEAD_ZONE", decisionDensity: 0 });
        }
    }
    // NO_STAKES: low financial + second order impact
    if (l4.financial_rating === "LOW" && l4.impact_order === "SECOND") {
        flags.push({ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true });
    }
    // CONFIDENCE_GAP: low rating confidence
    if (l4.rating_confidence === "LOW") {
        flags.push({ type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 });
    }
    return flags;
}
/**
 * Apply red flag penalties to a composite score.
 *
 * - DEAD_ZONE or NO_STAKES: hard elimination (composite=0)
 * - CONFIDENCE_GAP: 0.3 penalty multiplier (composite *= 0.3)
 * - Hard elimination takes priority over penalty
 * - Result rounded to 4 decimal places
 */
export function applyRedFlagPenalties(composite, flags) {
    // Check for hard elimination first
    const deadZone = flags.find((f) => f.type === "DEAD_ZONE");
    if (deadZone) {
        return { composite: 0, eliminated: true, eliminationReason: "DEAD_ZONE" };
    }
    const noStakes = flags.find((f) => f.type === "NO_STAKES");
    if (noStakes) {
        return { composite: 0, eliminated: true, eliminationReason: "NO_STAKES" };
    }
    // Apply penalty multiplier
    let result = composite;
    const confidenceGap = flags.find((f) => f.type === "CONFIDENCE_GAP");
    if (confidenceGap) {
        result = Math.round(result * 0.3 * 10000) / 10000;
    }
    return { composite: result, eliminated: false, eliminationReason: null };
}
