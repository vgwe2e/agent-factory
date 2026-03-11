/**
 * Scoring engine types.
 *
 * Defines all types for the three-lens scoring system:
 * Technical Feasibility, Adoption Realism, Value & Efficiency.
 * Consumed by scoring modules and downstream Phase 5 reports.
 */
import type { LeadArchetype } from "./hierarchy.js";
/** Lens weights for composite score computation. */
export declare const WEIGHTS: {
    readonly technical: 0.3;
    readonly adoption: 0.45;
    readonly value: 0.25;
};
/** Maximum possible raw scores per lens. */
export declare const MAX_SCORES: {
    readonly technical: 9;
    readonly adoption: 12;
    readonly value: 6;
};
/** Minimum composite score required for simulation promotion. */
export declare const PROMOTION_THRESHOLD = 0.6;
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type LensName = "technical" | "adoption" | "value";
export interface SubDimensionScore {
    name: string;
    score: number;
    reason: string;
}
export interface LensScore {
    lens: LensName;
    subDimensions: SubDimensionScore[];
    total: number;
    maxPossible: number;
    normalized: number;
    confidence: ConfidenceLevel;
}
export interface CompositeResult {
    technical: {
        total: number;
        normalized: number;
    };
    adoption: {
        total: number;
        normalized: number;
    };
    value: {
        total: number;
        normalized: number;
    };
    composite: number;
    promotedToSimulation: boolean;
}
export interface ScoringResult {
    l3Name: string;
    l2Name: string;
    l1Name: string;
    archetype: LeadArchetype;
    archetypeSource: "export" | "inferred";
    lenses: {
        technical: LensScore;
        adoption: LensScore;
        value: LensScore;
    };
    composite: number;
    overallConfidence: ConfidenceLevel;
    promotedToSimulation: boolean;
    scoringDurationMs: number;
}
