/**
 * Pre-score TSV formatter.
 *
 * Pure function: takes PreScoreResult[] and returns a TSV string.
 * Sorted by composite DESC (highest first). Eliminated candidates sort
 * to the bottom (composite=0). Every L4 appears for audit visibility.
 * Produces evaluation/pre-scores.tsv content.
 */

import type { PreScoreResult } from "../types/scoring.js";
import { tsvCell, tsvRow } from "./tsv-utils.js";

const HEADER = [
  "rank", "l4_id", "l4_name", "l3_name", "l2_name", "l1_name",
  "financial_signal", "ai_suitability", "decision_density",
  "impact_order", "rating_confidence", "archetype_completeness",
  "composite", "survived", "elimination_reason",
  "red_flags", "skill_count", "aggregated_max_value",
].join("\t");

/** Format a number to 4 decimal places. */
function fmt4(n: number): string {
  return n.toFixed(4);
}

export function formatPreScoreTsv(results: PreScoreResult[]): string {
  const sorted = [...results].sort((a, b) => b.composite - a.composite);

  const rows = sorted.map((r, i) => {
    const d = r.dimensions;
    const flagStr = r.redFlags.map(f => f.type).join(",");

    return tsvRow([
      i + 1,                              // rank
      r.l4Id,
      tsvCell(r.l4Name),
      r.l3Name,
      r.l2Name,
      r.l1Name,
      fmt4(d.financial_signal),
      fmt4(d.ai_suitability),
      fmt4(d.decision_density),
      fmt4(d.impact_order),
      fmt4(d.rating_confidence),
      fmt4(d.archetype_completeness),
      fmt4(r.composite),
      r.survived,                         // tsvRow handles boolean -> Y/N
      r.eliminationReason,                // tsvRow handles null -> ""
      flagStr,
      r.skillCount,
      r.aggregatedMaxValue,
    ]);
  });

  return [HEADER, ...rows].join("\n") + "\n";
}
