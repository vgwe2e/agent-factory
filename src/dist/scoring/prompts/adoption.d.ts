/**
 * Adoption Realism lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: decision_density, financial_gravity, impact_proximity, confidence_signal
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses execution.autonomy_level,
 *   execution.approval_required, loe, and problem_statement for realistic adoption scoring.
 * - v2.0: Hardened from audit findings.
 * - v1.0: Initial implementation with basic rubrics.
 */
import type { SkillWithContext, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Adoption Realism lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export declare function buildAdoptionPrompt(skill: SkillWithContext, archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
