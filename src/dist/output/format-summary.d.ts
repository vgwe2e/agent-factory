/**
 * Executive summary markdown report formatter.
 *
 * Pure function: takes scored results, triage results, and simulation
 * pipeline results. Produces an executive summary with top 10 table,
 * tier distribution, and archetype breakdown.
 */
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
export declare function formatSummary(scored: ScoringResult[], triaged: TriageResult[], simResults: SimulationPipelineResult, companyName: string, date?: string): string;
