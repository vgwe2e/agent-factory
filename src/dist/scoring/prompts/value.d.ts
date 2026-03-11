/**
 * Value & Efficiency lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: value_density, simulation_viability
 */
import type { L3Opportunity, L4Activity, CompanyContext, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Value & Efficiency lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param company - Company financial context
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export declare function buildValuePrompt(opp: L3Opportunity, l4s: L4Activity[], company: CompanyContext, archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
