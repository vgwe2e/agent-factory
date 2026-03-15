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
import type { ScoringResult } from "../types/scoring.js";
import type { SimulationInput } from "../types/simulation.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";
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
export declare function toSimulationInputs(promoted: ScoringResult[], l3Map: Map<string, L3Opportunity>, l4Map: Map<string, L4Activity[]>, companyContext: CompanyContext): SimulationInput[];
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
export declare function toL4SimulationInputs(promoted: ScoringResult[], l4Map: Map<string, L4Activity>, l3Map: Map<string, L3Opportunity>, companyContext: CompanyContext): SimulationInput[];
