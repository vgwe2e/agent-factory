/**
 * Consolidated LLM scorer (v1.3).
 *
 * Replaces three separate LLM calls with a single call per survivor.
 * The LLM evaluates platform fit (0-3) and sanity-checks deterministic
 * pre-scores. Adoption and value lenses are synthesized from deterministic
 * dimensions without LLM involvement.
 *
 * Two-pass composite: 50% pre-score + 50% LLM platform fit (normalized),
 * with sanity penalty (DISAGREE=-0.15, PARTIAL=-0.075, AGREE=0),
 * clamped to [0,1], gated at PROMOTION_THRESHOLD (0.60).
 */
import type { SkillWithContext } from "../types/hierarchy.js";
import type { LensScore, ConfidenceLevel, SanityVerdict, PreScoreResult } from "../types/scoring.js";
import type { ConsolidatedLensOutput } from "./schemas.js";
import type { ChatResult } from "./ollama-client.js";
export declare const DISAGREE_PENALTY = 0.15;
export declare const PARTIAL_PENALTY = 0.075;
export declare const PRE_SCORE_WEIGHT = 0.5;
export declare const LLM_WEIGHT = 0.5;
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export type ConsolidatedScorerResult = {
    success: true;
    lenses: {
        technical: LensScore;
        adoption: LensScore;
        value: LensScore;
    };
    composite: number;
    promotedToSimulation: boolean;
    sanityVerdict: SanityVerdict;
    sanityJustification: string;
    preScore: number;
    overallConfidence: ConfidenceLevel;
    scoringDurationMs: number;
} | {
    success: false;
    error: string;
};
/**
 * Scale a 0-1 normalized value to a 0-3 integer via floor-based bucketing.
 * Used to convert deterministic dimension scores to LensScore sub-dimensions.
 */
export declare function scaleTo03(value: number): number;
/**
 * Compute the two-pass composite score.
 *
 * Blends pre-score (50%) and LLM platform fit normalized (50%),
 * applies sanity penalty, clamps to [0,1], and gates at PROMOTION_THRESHOLD.
 */
export declare function computeTwoPassComposite(preScoreComposite: number, platformFitNormalized: number, sanityVerdict: SanityVerdict): {
    composite: number;
    promotedToSimulation: boolean;
};
/**
 * Build technical LensScore from LLM output (platform_fit only).
 * Single sub-dimension, maxPossible=3.
 */
export declare function buildTechnicalLensFromLLM(llmOutput: ConsolidatedLensOutput): LensScore;
/**
 * Build adoption LensScore from deterministic pre-score dimensions.
 * 4 sub-dimensions: financial_signal, decision_density, impact_order, rating_confidence.
 * maxPossible=12, confidence=HIGH (deterministic).
 */
export declare function buildAdoptionLensFromDeterministic(preScore: PreScoreResult): LensScore;
/**
 * Build value LensScore from deterministic pre-score dimensions.
 * 2 sub-dimensions: value_density (from financial_signal), simulation_viability (from archetype_completeness).
 * maxPossible=6, confidence=HIGH (deterministic).
 */
export declare function buildValueLensFromDeterministic(preScore: PreScoreResult): LensScore;
/**
 * Score a single survivor with one consolidated LLM call.
 *
 * Makes exactly one LLM call via chatFn to get platform fit + sanity check.
 * Builds 3 LensScore objects (technical from LLM, adoption + value from deterministic).
 * Computes two-pass composite with sanity penalty.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param knowledgeContext - Pre-formatted string of Aera component summaries
 * @param preScore - Deterministic pre-score result from Phase 21
 * @param chatFn - Injected chat function (for testability)
 * @returns ConsolidatedScorerResult (success/error union)
 */
export declare function scoreConsolidated(skill: SkillWithContext, knowledgeContext: string, preScore: PreScoreResult, chatFn: ChatFn): Promise<ConsolidatedScorerResult>;
export {};
