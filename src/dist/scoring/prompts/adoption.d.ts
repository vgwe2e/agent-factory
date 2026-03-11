/**
 * Adoption Realism lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: decision_density, financial_gravity, impact_proximity, confidence_signal
 */
import type { L3Opportunity, L4Activity, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Adoption Realism lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export declare function buildAdoptionPrompt(opp: L3Opportunity, l4s: L4Activity[], archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
