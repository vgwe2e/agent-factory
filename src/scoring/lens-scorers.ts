/**
 * Lens scorer functions.
 *
 * Three async functions that call the LLM (via injected chatFn) to score
 * skills on Technical Feasibility, Adoption Realism, and Value & Efficiency.
 *
 * Each scorer:
 * 1. Builds a prompt via the corresponding prompt builder
 * 2. Calls scoreWithRetry with the Zod schema and ollamaChat bound with JSON schema
 * 3. Maps validated output to LensScore
 * 4. Attaches algorithmic confidence
 *
 * chatFn parameter enables dependency injection for testing (defaults to ollamaChat).
 */

import type { SkillWithContext, CompanyContext, LeadArchetype } from "../types/hierarchy.js";
import type { LensScore, SubDimensionScore, ConfidenceLevel } from "../types/scoring.js";
import { MAX_SCORES } from "../types/scoring.js";
import { ollamaChat, scoreWithRetry } from "./ollama-client.js";
import type { ChatResult } from "./ollama-client.js";
import {
  TechnicalLensSchema,
  AdoptionLensSchema,
  ValueLensSchema,
  technicalJsonSchema,
  adoptionJsonSchema,
  valueJsonSchema,
} from "./schemas.js";
import type { TechnicalLensOutput, AdoptionLensOutput, ValueLensOutput } from "./schemas.js";
import { buildTechnicalPrompt } from "./prompts/technical.js";
import { buildAdoptionPrompt } from "./prompts/adoption.js";
import { buildValuePrompt } from "./prompts/value.js";
import { computeSkillTechnicalConfidence, computeSkillAdoptionConfidence, computeSkillValueConfidence } from "./confidence.js";

// -- Types --

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export type LensScorerResult =
  | { success: true; score: LensScore }
  | { success: false; error: string };

// -- Helpers --

/**
 * Map Zod-validated schema output fields to SubDimensionScore array.
 */
function mapToSubDimensions(
  output: Record<string, { score: number; reason: string }>,
  fieldNames: string[],
): SubDimensionScore[] {
  return fieldNames.map((name) => ({
    name,
    score: output[name].score,
    reason: output[name].reason,
  }));
}

// -- Public API --

/**
 * Score a skill on Technical Feasibility (3 sub-dimensions, max 9).
 */
export async function scoreTechnical(
  skill: SkillWithContext,
  knowledgeContext: string,
  archetypeHint: LeadArchetype | null,
  chatFn: ChatFn = ollamaChat,
): Promise<LensScorerResult> {
  const messages = buildTechnicalPrompt(skill, knowledgeContext, archetypeHint);

  const result = await scoreWithRetry(
    TechnicalLensSchema,
    async () => {
      const chatResult = await chatFn(messages, technicalJsonSchema);
      if (!chatResult.success) throw new Error(chatResult.error);
      return chatResult.content;
    },
    2,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as TechnicalLensOutput;
  const fieldNames = ["data_readiness", "aera_platform_fit", "archetype_confidence"];
  const subDimensions = mapToSubDimensions(data as unknown as Record<string, { score: number; reason: string }>, fieldNames);
  const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
  const confidence: ConfidenceLevel = computeSkillTechnicalConfidence(skill);

  return {
    success: true,
    score: {
      lens: "technical",
      subDimensions,
      total,
      maxPossible: MAX_SCORES.technical,
      normalized: total / MAX_SCORES.technical,
      confidence,
    },
  };
}

/**
 * Score a skill on Adoption Realism (4 sub-dimensions, max 12).
 */
export async function scoreAdoption(
  skill: SkillWithContext,
  archetypeHint: LeadArchetype | null,
  chatFn: ChatFn = ollamaChat,
): Promise<LensScorerResult> {
  const messages = buildAdoptionPrompt(skill, archetypeHint);

  const result = await scoreWithRetry(
    AdoptionLensSchema,
    async () => {
      const chatResult = await chatFn(messages, adoptionJsonSchema);
      if (!chatResult.success) throw new Error(chatResult.error);
      return chatResult.content;
    },
    2,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as AdoptionLensOutput;
  const fieldNames = ["decision_density", "financial_gravity", "impact_proximity", "confidence_signal"];
  const subDimensions = mapToSubDimensions(data as unknown as Record<string, { score: number; reason: string }>, fieldNames);
  const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
  const confidence: ConfidenceLevel = computeSkillAdoptionConfidence(skill);

  return {
    success: true,
    score: {
      lens: "adoption",
      subDimensions,
      total,
      maxPossible: MAX_SCORES.adoption,
      normalized: total / MAX_SCORES.adoption,
      confidence,
    },
  };
}

/**
 * Score a skill on Value & Efficiency (2 sub-dimensions, max 6).
 */
export async function scoreValue(
  skill: SkillWithContext,
  company: CompanyContext,
  archetypeHint: LeadArchetype | null,
  chatFn: ChatFn = ollamaChat,
): Promise<LensScorerResult> {
  const messages = buildValuePrompt(skill, company, archetypeHint);

  const result = await scoreWithRetry(
    ValueLensSchema,
    async () => {
      const chatResult = await chatFn(messages, valueJsonSchema);
      if (!chatResult.success) throw new Error(chatResult.error);
      return chatResult.content;
    },
    2,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as ValueLensOutput;
  const fieldNames = ["value_density", "simulation_viability"];
  const subDimensions = mapToSubDimensions(data as unknown as Record<string, { score: number; reason: string }>, fieldNames);
  const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
  const confidence: ConfidenceLevel = computeSkillValueConfidence(skill, company);

  return {
    success: true,
    score: {
      lens: "value",
      subDimensions,
      total,
      maxPossible: MAX_SCORES.value,
      normalized: total / MAX_SCORES.value,
      confidence,
    },
  };
}
