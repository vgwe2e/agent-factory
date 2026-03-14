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
import type {
  LensScore,
  SubDimensionScore,
  ConfidenceLevel,
  SanityVerdict,
  PreScoreResult,
} from "../types/scoring.js";
import { PROMOTION_THRESHOLD } from "../types/scoring.js";
import type { ConsolidatedLensOutput } from "./schemas.js";
import { ConsolidatedLensSchema, consolidatedJsonSchema } from "./schemas.js";
import { scoreWithRetry } from "./ollama-client.js";
import type { ChatResult } from "./ollama-client.js";
import { buildConsolidatedPrompt } from "./prompts/consolidated.js";

// -- Constants --

export const DISAGREE_PENALTY = 0.15;
export const PARTIAL_PENALTY = 0.075;
export const PRE_SCORE_WEIGHT = 0.50;
export const LLM_WEIGHT = 0.50;

// -- Types --

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export type ConsolidatedScorerResult =
  | {
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
    }
  | { success: false; error: string };

// -- Pure functions --

/**
 * Scale a 0-1 normalized value to a 0-3 integer via floor-based bucketing.
 * Used to convert deterministic dimension scores to LensScore sub-dimensions.
 */
export function scaleTo03(value: number): number {
  if (value >= 0.75) return 3;
  if (value >= 0.50) return 2;
  if (value >= 0.25) return 1;
  return 0;
}

/**
 * Compute the two-pass composite score.
 *
 * Blends pre-score (50%) and LLM platform fit normalized (50%),
 * applies sanity penalty, clamps to [0,1], and gates at PROMOTION_THRESHOLD.
 */
export function computeTwoPassComposite(
  preScoreComposite: number,
  platformFitNormalized: number,
  sanityVerdict: SanityVerdict,
): { composite: number; promotedToSimulation: boolean } {
  const blended =
    preScoreComposite * PRE_SCORE_WEIGHT +
    platformFitNormalized * LLM_WEIGHT;

  const penalty =
    sanityVerdict === "DISAGREE"
      ? DISAGREE_PENALTY
      : sanityVerdict === "PARTIAL"
        ? PARTIAL_PENALTY
        : 0;

  const composite = Math.min(1, Math.max(0, blended - penalty));
  const promotedToSimulation = composite >= PROMOTION_THRESHOLD;

  return { composite, promotedToSimulation };
}

// -- LensScore builders --

/**
 * Build technical LensScore from LLM output (platform_fit only).
 * Single sub-dimension, maxPossible=3.
 */
export function buildTechnicalLensFromLLM(
  llmOutput: ConsolidatedLensOutput,
): LensScore {
  const subDimensions: SubDimensionScore[] = [
    {
      name: "platform_fit",
      score: llmOutput.platform_fit.score,
      reason: llmOutput.platform_fit.reason,
    },
  ];
  const total = llmOutput.platform_fit.score;
  const maxPossible = 3;

  return {
    lens: "technical",
    subDimensions,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: llmOutput.confidence,
  };
}

/**
 * Build adoption LensScore from deterministic pre-score dimensions.
 * 4 sub-dimensions: financial_signal, decision_density, impact_order, rating_confidence.
 * maxPossible=12, confidence=HIGH (deterministic).
 */
export function buildAdoptionLensFromDeterministic(
  preScore: PreScoreResult,
): LensScore {
  const dims = preScore.dimensions;
  const subDimensions: SubDimensionScore[] = [
    { name: "financial_signal", score: scaleTo03(dims.financial_signal), reason: `Deterministic: ${dims.financial_signal.toFixed(2)}` },
    { name: "decision_density", score: scaleTo03(dims.decision_density), reason: `Deterministic: ${dims.decision_density.toFixed(2)}` },
    { name: "impact_order", score: scaleTo03(dims.impact_order), reason: `Deterministic: ${dims.impact_order.toFixed(2)}` },
    { name: "rating_confidence", score: scaleTo03(dims.rating_confidence), reason: `Deterministic: ${dims.rating_confidence.toFixed(2)}` },
  ];
  const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
  const maxPossible = 12;

  return {
    lens: "adoption",
    subDimensions,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: "HIGH",
  };
}

/**
 * Build value LensScore from deterministic pre-score dimensions.
 * 2 sub-dimensions: value_density (from financial_signal), simulation_viability (from archetype_completeness).
 * maxPossible=6, confidence=HIGH (deterministic).
 */
export function buildValueLensFromDeterministic(
  preScore: PreScoreResult,
): LensScore {
  const dims = preScore.dimensions;
  const subDimensions: SubDimensionScore[] = [
    { name: "value_density", score: scaleTo03(dims.financial_signal), reason: `Deterministic: ${dims.financial_signal.toFixed(2)}` },
    { name: "simulation_viability", score: scaleTo03(dims.archetype_completeness), reason: `Deterministic: ${dims.archetype_completeness.toFixed(2)}` },
  ];
  const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
  const maxPossible = 6;

  return {
    lens: "value",
    subDimensions,
    total,
    maxPossible,
    normalized: total / maxPossible,
    confidence: "HIGH",
  };
}

// -- Main scorer function --

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
export async function scoreConsolidated(
  skill: SkillWithContext,
  knowledgeContext: string,
  preScore: PreScoreResult,
  chatFn: ChatFn,
): Promise<ConsolidatedScorerResult> {
  const startMs = Date.now();

  // Build prompt
  const messages = buildConsolidatedPrompt(skill, knowledgeContext, preScore);

  // Single LLM call with Zod validation + retry
  const result = await scoreWithRetry(
    ConsolidatedLensSchema,
    async () => {
      const chatResult = await chatFn(messages, consolidatedJsonSchema);
      if (!chatResult.success) throw new Error(chatResult.error);
      return chatResult.content;
    },
    2,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const llmOutput = result.data;

  // Build 3 LensScore objects
  const technical = buildTechnicalLensFromLLM(llmOutput);
  const adoption = buildAdoptionLensFromDeterministic(preScore);
  const value = buildValueLensFromDeterministic(preScore);

  // Compute two-pass composite
  const platformFitNormalized = llmOutput.platform_fit.score / 3;
  const { composite, promotedToSimulation } = computeTwoPassComposite(
    preScore.composite,
    platformFitNormalized,
    llmOutput.sanity_verdict,
  );

  const scoringDurationMs = Date.now() - startMs;

  return {
    success: true,
    lenses: { technical, adoption, value },
    composite,
    promotedToSimulation,
    sanityVerdict: llmOutput.sanity_verdict,
    sanityJustification: llmOutput.sanity_justification,
    preScore: preScore.composite,
    overallConfidence: llmOutput.confidence,
    scoringDurationMs,
  };
}
