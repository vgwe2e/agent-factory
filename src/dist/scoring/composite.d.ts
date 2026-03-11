/**
 * Weighted composite score calculation and threshold gate.
 *
 * Pure arithmetic: normalizes each lens total by its max possible score,
 * applies weights, and sums to produce a 0.0-1.0 composite.
 * Opportunities with composite >= 0.60 are promoted to simulation.
 */
import type { CompositeResult } from "../types/scoring.js";
/**
 * Compute weighted composite score from raw lens totals.
 *
 * @param technicalTotal - Raw technical lens total (0-9)
 * @param adoptionTotal - Raw adoption lens total (0-12)
 * @param valueTotal - Raw value lens total (0-6)
 * @returns CompositeResult with normalized values, composite, and promotion status
 */
export declare function computeComposite(technicalTotal: number, adoptionTotal: number, valueTotal: number): CompositeResult;
