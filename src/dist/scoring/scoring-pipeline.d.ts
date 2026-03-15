/**
 * Scoring pipeline orchestrator.
 *
 * Wires together: archetype classification, lens scoring,
 * composite computation, confidence aggregation, and threshold gating.
 *
 * Scores individual SKILLS (not L3 rollups) for accurate assessment.
 * Uses dependency injection (chatFn) for testability.
 */
import type { SkillWithContext, CompanyContext } from "../types/hierarchy.js";
import type { ScoringResult } from "../types/scoring.js";
import type { ChatResult } from "./ollama-client.js";
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export interface ScoringPipelineInput {
    skills: SkillWithContext[];
    company: CompanyContext;
    knowledgeContext: {
        components: string;
        processBuilder: string;
        capabilities?: string;
    };
    chatFn?: ChatFn;
}
export type ScoringPipelineResult = ScoringResult | {
    error: string;
    skillId: string;
    skillName: string;
};
/**
 * Score a single skill across all three lenses.
 *
 * @returns Complete ScoringResult or error with skillId/skillName for logging
 */
export declare function scoreOneSkill(skill: SkillWithContext, company: CompanyContext, knowledgeContext: {
    components: string;
    processBuilder: string;
    capabilities?: string;
}, chatFn?: ChatFn): Promise<ScoringPipelineResult>;
/**
 * Score all skills (async generator for incremental consumption).
 *
 * Sorts by parent L3 name for progress tracking continuity.
 */
export declare function scoreSkills(input: ScoringPipelineInput): AsyncGenerator<ScoringPipelineResult>;
export {};
