/**
 * Triage TSV formatter.
 *
 * Pure function: takes TriageResult[] and returns a TSV string.
 * Sorted by tier ASC, then combined_max_value DESC within tier.
 * Produces evaluation/triage.tsv content.
 */
import type { TriageResult } from "../types/triage.js";
export declare function formatTriageTsv(opportunities: TriageResult[]): string;
