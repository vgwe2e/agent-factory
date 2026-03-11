/**
 * Evaluation output orchestrator.
 *
 * Creates the evaluation/ directory and writes all 4 output files:
 * triage.tsv, feasibility-scores.tsv, adoption-risk.md, tier1-report.md.
 *
 * Single entry point for the pipeline to produce all Phase 5 output artifacts.
 * Phase 7 (pipeline orchestration) will call this function.
 */
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
type WriteResult = {
    success: true;
    files: string[];
} | {
    success: false;
    error: string;
};
export declare function writeEvaluation(outputDir: string, scoredOpportunities: ScoringResult[], triagedOpportunities: TriageResult[], companyName: string, date?: string): Promise<WriteResult>;
export {};
