/**
 * Feasibility scores TSV formatter.
 *
 * Pure function: takes ScoringResult[] and returns a 19-column TSV string.
 * Sorted by composite DESC (highest score first).
 * Produces evaluation/feasibility-scores.tsv content.
 */
import type { ScoringResult } from "../types/scoring.js";
export declare function formatScoresTsv(results: ScoringResult[]): string;
