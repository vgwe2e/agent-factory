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
// -- Deterministic Pre-Scoring Types (v1.3) --
/** Locked dimension weights for deterministic pre-scoring. Adoption-heavy. */
export const DETERMINISTIC_WEIGHTS = {
    financial_signal: 0.25,
    ai_suitability: 0.15,
    decision_density: 0.20,
    impact_order: 0.10,
    rating_confidence: 0.10,
    archetype_completeness: 0.20,
};
