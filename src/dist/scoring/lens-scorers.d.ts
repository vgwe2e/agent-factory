/**
 * Lens scorer functions.
 *
 * Three async functions that call Ollama (via injected chatFn) to score
 * opportunities on Technical Feasibility, Adoption Realism, and Value & Efficiency.
 *
 * Each scorer:
 * 1. Builds a prompt via the corresponding prompt builder
 * 2. Calls scoreWithRetry with the Zod schema and ollamaChat bound with JSON schema
 * 3. Maps validated output to LensScore
 * 4. Attaches algorithmic confidence
 *
 * chatFn parameter enables dependency injection for testing (defaults to ollamaChat).
 */
import type { L3Opportunity, L4Activity, CompanyContext, LeadArchetype } from "../types/hierarchy.js";
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
 * Score an opportunity on Technical Feasibility (3 sub-dimensions, max 9).
 */
export declare function scoreTechnical(opp: L3Opportunity, l4s: L4Activity[], knowledgeContext: string, archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
/**
 * Score an opportunity on Adoption Realism (4 sub-dimensions, max 12).
 */
export declare function scoreAdoption(opp: L3Opportunity, l4s: L4Activity[], archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
/**
 * Score an opportunity on Value & Efficiency (2 sub-dimensions, max 6).
 */
export declare function scoreValue(opp: L3Opportunity, l4s: L4Activity[], company: CompanyContext, archetypeHint: LeadArchetype | null, chatFn?: ChatFn): Promise<LensScorerResult>;
export {};
