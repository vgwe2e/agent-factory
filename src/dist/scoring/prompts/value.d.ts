/**
 * Value & Efficiency lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: value_density, simulation_viability
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses max_value, value_metric,
 *   savings_type, and problem_statement.quantified_pain for grounded value assessment.
 * - v2.0: Hardened from audit findings.
 * - v1.0: Initial implementation with basic rubrics.
 */
import type { SkillWithContext, CompanyContext, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Value & Efficiency lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param company - Company financial context
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export declare function buildValuePrompt(skill: SkillWithContext, company: CompanyContext, archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
