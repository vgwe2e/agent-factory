/**
 * Archetype classification with null fallback inference.
 *
 * Resolves the archetype for every opportunity, ensuring the output
 * never has a null archetype. Uses a three-step fallback chain:
 * 1. Direct export (lead_archetype on L3Opportunity)
 * 2. Supporting archetypes array (first valid entry)
 * 3. Heuristic inference from L4 activity patterns
 * 4. Safe default (DETERMINISTIC) for empty L4 arrays
 */
import type { ArchetypeMapping } from "../types/orchestration.js";
import type { LeadArchetype, L3Opportunity, L4Activity } from "../types/hierarchy.js";
export interface ArchetypeClassification {
    archetype: LeadArchetype;
    source: "export" | "inferred";
    route: ArchetypeMapping;
}
/**
 * Classify the archetype for an opportunity.
 *
 * @param opp - The L3 opportunity (may have null lead_archetype)
 * @param l4s - Constituent L4 activities for heuristic inference
 * @returns Classification with archetype, source, and routing info
 */
export declare function classifyArchetype(opp: L3Opportunity, l4s: L4Activity[]): ArchetypeClassification;
