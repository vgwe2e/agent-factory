/**
 * Technical Feasibility lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: data_readiness, aera_platform_fit, archetype_confidence
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses skill's execution,
 *   actions, constraints, and aera_skill_pattern for precise assessment.
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, tightened rubrics.
 * - v1.0: Initial implementation with basic rubrics.
 */
import type { SkillWithContext, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Technical Feasibility lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export declare function buildTechnicalPrompt(skill: SkillWithContext, knowledgeContext: string, archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
