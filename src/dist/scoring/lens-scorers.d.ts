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
import type { LensScore } from "../types/scoring.js";
import type { ChatResult } from "./ollama-client.js";
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export type LensScorerResult = {
    success: true;
    score: LensScore;
} | {
    success: false;
    error: string;
};
/**
 * Score a skill on Technical Feasibility (3 sub-dimensions, max 9).
 */
export declare function scoreTechnical(skill: SkillWithContext, knowledgeContext: string, archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
/**
 * Score a skill on Adoption Realism (4 sub-dimensions, max 12).
 */
export declare function scoreAdoption(skill: SkillWithContext, archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
/**
 * Score a skill on Value & Efficiency (2 sub-dimensions, max 6).
 */
export declare function scoreValue(skill: SkillWithContext, company: CompanyContext, archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
export {};
