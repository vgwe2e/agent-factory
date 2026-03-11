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

import { getRouteForArchetype } from "../knowledge/orchestration.js";
import type { ArchetypeMapping } from "../types/orchestration.js";
import type { LeadArchetype, L3Opportunity, L4Activity } from "../types/hierarchy.js";

const VALID_ARCHETYPES: readonly string[] = ["DETERMINISTIC", "AGENTIC", "GENERATIVE"];

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
export function classifyArchetype(
  opp: L3Opportunity,
  l4s: L4Activity[],
): ArchetypeClassification {
  // Step 1: Use export archetype if available
  if (opp.lead_archetype !== null) {
    return {
      archetype: opp.lead_archetype,
      source: "export",
      route: getRouteForArchetype(opp.lead_archetype),
    };
  }

  // Step 2: Check supporting_archetypes for a valid LeadArchetype
  if (opp.supporting_archetypes.length > 0) {
    const first = opp.supporting_archetypes[0];
    if (VALID_ARCHETYPES.includes(first)) {
      const archetype = first as LeadArchetype;
      return {
        archetype,
        source: "inferred",
        route: getRouteForArchetype(archetype),
      };
    }
  }

  // Step 3: Infer from L4 data patterns
  let inferred: LeadArchetype = "DETERMINISTIC"; // safe default

  if (l4s.length > 0) {
    const decisionCount = l4s.filter((l4) => l4.decision_exists).length;
    const highAiCount = l4s.filter((l4) => l4.ai_suitability === "HIGH").length;
    const decisionPct = decisionCount / l4s.length;
    const aiPct = highAiCount / l4s.length;

    if (decisionPct < 0.3 && aiPct < 0.3) {
      inferred = "GENERATIVE";
    } else if (decisionPct < 0.5 || aiPct > 0.6) {
      inferred = "AGENTIC";
    }
    // else: DETERMINISTIC (conservative default)
  }

  return {
    archetype: inferred,
    source: "inferred",
    route: getRouteForArchetype(inferred),
  };
}
