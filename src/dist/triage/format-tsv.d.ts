/**
 * TSV output formatter for triage results.
 *
 * Produces a tab-separated-values string with a header row
 * followed by one data row per TriageResult. Consumed by
 * downstream scoring (Phase 4) and output (Phase 5).
 */
import type { TriageResult } from "../types/triage.js";
/** Tab-joined column header for triage TSV output. */
export declare const TSV_HEADERS = "tier\taction\tl1_name\tl2_name\tl3_name\tcombined_max_value\tquick_win\tlead_archetype\tl4_count\tred_flags";
/**
 * Format an array of triage results as a TSV string.
 *
 * - Header row is always present.
 * - Each result maps to one data row, preserving input order.
 * - Null numeric/string fields render as empty strings.
 * - Red flags are comma-joined by type name.
 * - No trailing newline.
 */
export declare function formatTriageTsv(results: TriageResult[]): string;
