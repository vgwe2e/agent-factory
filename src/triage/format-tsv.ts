/**
 * TSV output formatter for triage results.
 *
 * Produces a tab-separated-values string with a header row
 * followed by one data row per TriageResult. Consumed by
 * downstream scoring (Phase 4) and output (Phase 5).
 */

import type { TriageResult } from "../types/triage.js";

/** Tab-joined column header for triage TSV output. */
export const TSV_HEADERS =
  "tier\taction\tl1_name\tl2_name\tl3_name\tcombined_max_value\tquick_win\tlead_archetype\tl4_count\tred_flags";

/**
 * Replace newlines (CR, LF, CRLF) with spaces to prevent
 * field values from breaking TSV row structure.
 */
function sanitize(value: string): string {
  return value.replace(/\r\n|\r|\n/g, " ");
}

/**
 * Format an array of triage results as a TSV string.
 *
 * - Header row is always present.
 * - Each result maps to one data row, preserving input order.
 * - Null numeric/string fields render as empty strings.
 * - Red flags are comma-joined by type name.
 * - No trailing newline.
 */
export function formatTriageTsv(results: TriageResult[]): string {
  const rows = results.map((r) => {
    const fields: string[] = [
      String(r.tier),
      r.action,
      sanitize(r.l1Name),
      sanitize(r.l2Name),
      sanitize(r.l3Name),
      r.combinedMaxValue === null ? "" : String(r.combinedMaxValue),
      String(r.quickWin),
      r.leadArchetype === null ? "" : sanitize(r.leadArchetype),
      String(r.l4Count),
      r.redFlags.map((f) => f.type).join(","),
    ];
    return fields.join("\t");
  });

  return [TSV_HEADERS, ...rows].join("\n");
}
