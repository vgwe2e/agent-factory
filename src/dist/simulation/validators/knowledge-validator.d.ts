/**
 * KNOW-04 knowledge base component reference validator.
 *
 * Validates that component names referenced in LLM-generated simulation
 * artifacts match known Aera components from the bundled knowledge base.
 * Returns "confirmed" for matches and "inferred" for unknown components.
 *
 * Uses case-insensitive exact matching first, then substring matching
 * in both directions to handle LLM name variations.
 */
import type { ComponentMap } from "../../types/simulation.js";
export interface ValidationResult {
    component: string;
    section: string;
    status: "confirmed" | "inferred";
    matchedTo?: string;
}
/**
 * Build a lookup index from all knowledge base sources.
 * Keys are lowercase names, values are prefixed identifiers.
 */
export declare function buildKnowledgeIndex(): Map<string, string>;
/**
 * Validate a single component reference against the knowledge index.
 *
 * Matching strategy:
 * 1. Case-insensitive exact match
 * 2. Substring match in both directions (name contains known, or known contains name)
 * 3. Falls back to "inferred" if no match found
 */
export declare function validateComponentRef(name: string, knowledgeIndex: Map<string, string>): "confirmed" | "inferred";
/**
 * Validate all component references in a ComponentMap.
 * Returns per-entry validation results with section context.
 */
export declare function validateComponentMap(map: ComponentMap, knowledgeIndex: Map<string, string>): ValidationResult[];
