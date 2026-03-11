/**
 * Triage TSV formatter.
 *
 * Pure function: takes TriageResult[] and returns a TSV string.
 * Sorted by tier ASC, then combined_max_value DESC within tier.
 * Produces evaluation/triage.tsv content.
 */

import type { TriageResult } from "../types/triage.js";
import { tsvRow } from "./tsv-utils.js";

const HEADER = [
  "tier", "l3_name", "l1_name", "l2_name",
  "lead_archetype", "quick_win", "combined_max_value",
  "flag_count", "flags",
].join("\t");

export function formatTriageTsv(opportunities: TriageResult[]): string {
  const sorted = [...opportunities].sort((a, b) => {
    // Tier ASC
    if (a.tier !== b.tier) return a.tier - b.tier;
    // Combined max value DESC (nulls sort last)
    const aVal = a.combinedMaxValue ?? -Infinity;
    const bVal = b.combinedMaxValue ?? -Infinity;
    return bVal - aVal;
  });

  const rows = sorted.map(opp => tsvRow([
    opp.tier,
    opp.l3Name,
    opp.l1Name,
    opp.l2Name,
    opp.leadArchetype,
    opp.quickWin,
    opp.combinedMaxValue,
    opp.redFlags.length,
    opp.redFlags.map(f => f.type).join("; ") || null,
  ]));

  return [HEADER, ...rows].join("\n") + "\n";
}
