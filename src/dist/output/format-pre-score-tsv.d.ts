/**
 * Pre-score TSV formatter.
 *
 * Pure function: takes PreScoreResult[] and returns a TSV string.
 * Sorted by composite DESC (highest first). Eliminated candidates sort
 * to the bottom (composite=0). Every L4 appears for audit visibility.
 * Produces evaluation/pre-scores.tsv content.
 */
import type { PreScoreResult } from "../types/scoring.js";
export declare function formatPreScoreTsv(results: PreScoreResult[]): string;
