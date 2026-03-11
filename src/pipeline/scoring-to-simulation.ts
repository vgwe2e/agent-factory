/**
 * Adapter: scoring results -> simulation inputs.
 *
 * Pure function that converts promoted ScoringResult[] into
 * SimulationInput[] by looking up L3 opportunities, L4 activities,
 * and archetype routing from the knowledge base.
 */

import type { ScoringResult } from "../types/scoring.js";
import type { SimulationInput } from "../types/simulation.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";
import { getRouteForArchetype } from "../knowledge/orchestration.js";

/**
 * Convert promoted scoring results into simulation pipeline inputs.
 *
 * @param promoted - ScoringResult[] already filtered to promotedToSimulation === true
 * @param l3Map - Map of l3_name -> L3Opportunity
 * @param l4Map - Map of l3_name -> L4Activity[]
 * @param companyContext - Company context from the hierarchy export
 * @returns SimulationInput[] ready for runSimulationPipeline
 */
export function toSimulationInputs(
  promoted: ScoringResult[],
  l3Map: Map<string, L3Opportunity>,
  l4Map: Map<string, L4Activity[]>,
  companyContext: CompanyContext,
): SimulationInput[] {
  const inputs: SimulationInput[] = [];

  for (const sr of promoted) {
    const opp = l3Map.get(sr.l3Name);
    if (!opp) continue; // defensive: skip if L3 not found

    const l4s = l4Map.get(sr.l3Name) ?? [];
    const mapping = getRouteForArchetype(sr.archetype);

    inputs.push({
      opportunity: opp,
      l4s,
      companyContext,
      archetype: sr.archetype,
      archetypeRoute: mapping.primary_route,
      composite: sr.composite,
    });
  }

  return inputs;
}
