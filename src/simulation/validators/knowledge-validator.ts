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

import { getAllPBNodes, getWorkflowPatterns } from "../../knowledge/process-builder.js";
import { getAllComponents } from "../../knowledge/components.js";
import { getIntegrationPatterns } from "../../knowledge/orchestration.js";
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
export function buildKnowledgeIndex(): Map<string, string> {
  const index = new Map<string, string>();

  // PB nodes (22)
  for (const node of getAllPBNodes()) {
    index.set(node.name.toLowerCase(), `PB:${node.name}`);
  }

  // UI components (21)
  for (const comp of getAllComponents()) {
    index.set(comp.name.toLowerCase(), `UI:${comp.name}`);
  }

  // Workflow patterns (7)
  for (const pattern of getWorkflowPatterns()) {
    index.set(pattern.name.toLowerCase(), `Pattern:${pattern.name}`);
  }

  // Integration patterns (4)
  for (const pattern of getIntegrationPatterns()) {
    index.set(pattern.name.toLowerCase(), `Integration:${pattern.name}`);
  }

  // Known Aera product concepts (valid references not in knowledge base files)
  const aeraConcepts = [
    "event stream",
    "reference stream",
    "transaction stream",
    "cortex",
    "aera chat",
    "action item",
    "inbox",
    "agent function",
    "llm agent",
    "autonomous agent",
    "subject area",
    "streams",
  ];
  for (const concept of aeraConcepts) {
    const key = concept.toLowerCase();
    if (!index.has(key)) {
      index.set(key, `Aera:${concept}`);
    }
  }

  return index;
}

/**
 * Validate a single component reference against the knowledge index.
 *
 * Matching strategy:
 * 1. Case-insensitive exact match
 * 2. Substring match in both directions (name contains known, or known contains name)
 * 3. Falls back to "inferred" if no match found
 */
export function validateComponentRef(
  name: string,
  knowledgeIndex: Map<string, string>,
): "confirmed" | "inferred" {
  const lower = name.toLowerCase();

  // Direct exact match
  if (knowledgeIndex.has(lower)) return "confirmed";

  // Substring match in both directions
  for (const [known] of knowledgeIndex) {
    if (lower.includes(known) || known.includes(lower)) {
      return "confirmed";
    }
  }

  return "inferred";
}

/**
 * Validate all component references in a ComponentMap.
 * Returns per-entry validation results with section context.
 */
export function validateComponentMap(
  map: ComponentMap,
  knowledgeIndex: Map<string, string>,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const sections: Array<{ key: keyof ComponentMap; entries: Array<{ name: string }> }> = [
    { key: "streams", entries: map.streams },
    { key: "cortex", entries: map.cortex },
    { key: "process_builder", entries: map.process_builder },
    { key: "agent_teams", entries: map.agent_teams },
    { key: "ui", entries: map.ui },
  ];

  for (const { key, entries } of sections) {
    for (const entry of entries) {
      const status = validateComponentRef(entry.name, knowledgeIndex);
      const lower = entry.name.toLowerCase();
      const matchedTo = status === "confirmed"
        ? knowledgeIndex.get(lower) ?? findSubstringMatch(lower, knowledgeIndex)
        : undefined;

      results.push({
        component: entry.name,
        section: key,
        status,
        matchedTo,
      });
    }
  }

  return results;
}

/** Find the first substring match in the knowledge index. */
function findSubstringMatch(
  lower: string,
  knowledgeIndex: Map<string, string>,
): string | undefined {
  for (const [known, value] of knowledgeIndex) {
    if (lower.includes(known) || known.includes(lower)) {
      return value;
    }
  }
  return undefined;
}
