/**
 * Technical Feasibility lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: data_readiness, aera_platform_fit, archetype_confidence
 */
import type { L3Opportunity, L4Activity, LeadArchetype } from "../../types/hierarchy.js";
interface ChatMessage {
    role: string;
    content: string;
}
/**
 * Build the Technical Feasibility lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export declare function buildTechnicalPrompt(opp: L3Opportunity, l4s: L4Activity[], knowledgeContext: string, archetypeHint: LeadArchetype | null): ChatMessage[];
export {};
