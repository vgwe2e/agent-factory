/**
 * Adoption risk markdown report formatter.
 *
 * Pure function: takes TriageResult[] and returns markdown string.
 * Groups red-flagged opportunities by flag type with generated
 * reason strings derived from each flag's typed data.
 * Produces evaluation/adoption-risk.md content.
 */
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult } from "../types/scoring.js";
interface FormatAdoptionRiskOptions {
    date?: string;
    scored?: ScoringResult[];
}
export declare function formatAdoptionRisk(opportunities: TriageResult[], optionsOrDate?: string | FormatAdoptionRiskOptions): string;
export {};
