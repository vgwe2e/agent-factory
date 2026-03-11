/**
 * Final reports output orchestrator.
 *
 * Creates the evaluation/ directory and writes Phase 9 output files:
 * summary.md, dead-zones.md, meta-reflection.md, plus simulation
 * artifact subdirectories under evaluation/simulations/.
 *
 * Designed to be called alongside writeEvaluation from the Phase 7
 * pipeline runner. Does NOT replace writeEvaluation.
 */
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
type WriteResult = {
    success: true;
    files: string[];
} | {
    success: false;
    error: string;
};
export declare function writeFinalReports(outputDir: string, scored: ScoringResult[], triaged: TriageResult[], simResults: SimulationPipelineResult, companyName: string, date?: string): Promise<WriteResult>;
export {};
