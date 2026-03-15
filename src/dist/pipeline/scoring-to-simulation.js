/**
 * Adapter: scoring results -> simulation inputs.
 *
 * Pure function that converts promoted ScoringResult[] into
 * SimulationInput[] by looking up parent L3 opportunities, L4 activities,
 * and archetype routing from the knowledge base.
 *
 * Since scoring now operates at skill level, this adapter bridges
 * skill-level results back to the L3-level SimulationInput format
 * expected by the simulation pipeline.
 */
import { getRouteForArchetype } from "../knowledge/orchestration.js";
/**
 * Convert promoted scoring results into simulation pipeline inputs.
 *
 * Groups skill-level results by L3 name and uses the highest-composite
 * skill per L3 to drive simulation. This ensures simulation artifacts
 * are generated at the opportunity level (L3) even though scoring is
 * at the skill level.
 *
 * @param promoted - ScoringResult[] already filtered to promotedToSimulation === true
 * @param l3Map - Map of l3_name -> L3Opportunity
 * @param l4Map - Map of l3_name -> L4Activity[]
 * @param companyContext - Company context from the hierarchy export
 * @returns SimulationInput[] ready for runSimulationPipeline
 */
export function toSimulationInputs(promoted, l3Map, l4Map, companyContext) {
    // Group promoted skills by L3, keeping the highest-composite skill per L3
    const bestByL3 = new Map();
    for (const sr of promoted) {
        const existing = bestByL3.get(sr.l3Name);
        if (!existing || sr.composite > existing.composite) {
            bestByL3.set(sr.l3Name, sr);
        }
    }
    const inputs = [];
    for (const [l3Name, sr] of bestByL3) {
        const opp = l3Map.get(l3Name);
        const l4s = l4Map.get(l3Name) ?? [];
        if (l4s.length === 0)
            continue;
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
/**
 * Convert promoted scoring results into per-L4 simulation inputs (two-pass mode).
 *
 * In two-pass mode, each promoted ScoringResult maps 1:1 to an L4 activity.
 * The L4 is the primary simulation subject; the parent L3 is optional metadata.
 *
 * @param promoted - ScoringResult[] from the two-pass scoring pipeline
 * @param l4Map - Map of l4Name -> L4Activity (individual, not grouped)
 * @param l3Map - Map of l3_name -> L3Opportunity
 * @param companyContext - Company context from the hierarchy export
 * @returns SimulationInput[] ready for runSimulationPipeline
 */
export function toL4SimulationInputs(promoted, l4Map, l3Map, companyContext) {
    const inputs = [];
    for (const sr of promoted) {
        const l4 = l4Map.get(sr.l4Name);
        if (!l4)
            continue; // skip if L4 not found
        const opp = l3Map.get(sr.l3Name);
        const mapping = getRouteForArchetype(sr.archetype);
        inputs.push({
            l4Activity: l4,
            opportunity: opp,
            l4s: [l4],
            companyContext,
            archetype: sr.archetype,
            archetypeRoute: mapping.primary_route,
            composite: sr.composite,
        });
    }
    return inputs;
}
