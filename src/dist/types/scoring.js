/**
 * Scoring engine types.
 *
 * Defines all types for the three-lens scoring system:
 * Technical Feasibility, Adoption Realism, Value & Efficiency.
 * Consumed by scoring modules and downstream Phase 5 reports.
 */
// -- Constants --
/** Lens weights for composite score computation. */
export const WEIGHTS = {
    technical: 0.30,
    adoption: 0.45,
    value: 0.25,
};
/** Maximum possible raw scores per lens. */
export const MAX_SCORES = {
    technical: 9, // 3 sub-dimensions * 3 max each
    adoption: 12, // 4 sub-dimensions * 3 max each
    value: 6, // 2 sub-dimensions * 3 max each
};
/** Minimum composite score required for simulation promotion. */
export const PROMOTION_THRESHOLD = 0.60;
