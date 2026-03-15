/**
 * Feasibility scores TSV formatter.
 *
 * Pure function: takes ScoringResult[] and returns a TSV string.
 * Sorted by composite DESC (highest score first).
 * Each row is one skill -- the unit of scoring.
 * Produces evaluation/feasibility-scores.tsv content.
 */
import type { ScoringResult } from "../types/scoring.js";
export declare function formatScoresTsv(results: ScoringResult[], scoringMode?: "two-pass" | "three-lens"): string;
