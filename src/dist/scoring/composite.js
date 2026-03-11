/**
 * Weighted composite score calculation and threshold gate.
 *
 * Pure arithmetic: normalizes each lens total by its max possible score,
 * applies weights, and sums to produce a 0.0-1.0 composite.
 * Opportunities with composite >= 0.60 are promoted to simulation.
 */
import { WEIGHTS, MAX_SCORES, PROMOTION_THRESHOLD } from "../types/scoring.js";
/**
 * Compute weighted composite score from raw lens totals.
 *
 * @param technicalTotal - Raw technical lens total (0-9)
 * @param adoptionTotal - Raw adoption lens total (0-12)
 * @param valueTotal - Raw value lens total (0-6)
 * @returns CompositeResult with normalized values, composite, and promotion status
 */
export function computeComposite(technicalTotal, adoptionTotal, valueTotal) {
    const techNorm = technicalTotal / MAX_SCORES.technical;
    const adoptNorm = adoptionTotal / MAX_SCORES.adoption;
    const valNorm = valueTotal / MAX_SCORES.value;
    const composite = techNorm * WEIGHTS.technical +
        adoptNorm * WEIGHTS.adoption +
        valNorm * WEIGHTS.value;
    return {
        technical: { total: technicalTotal, normalized: techNorm },
        adoption: { total: adoptionTotal, normalized: adoptNorm },
        value: { total: valueTotal, normalized: valNorm },
        composite,
        promotedToSimulation: composite >= PROMOTION_THRESHOLD,
    };
}
