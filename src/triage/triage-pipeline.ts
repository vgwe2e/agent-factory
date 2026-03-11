/**
 * Full triage pipeline for the triage subsystem.
 *
 * Orchestrates: red flag detection -> tier assignment -> sorting.
 * Skipped/demoted opportunities are forced to Tier 3.
 * Output is sorted: Tier 1 first, then 2, then 3, value descending within tier.
 *
 * All functions are pure (no I/O, no side effects).
 */

import type { HierarchyExport, L3Opportunity } from "../types/hierarchy.js";
import type { TriageResult, Tier, RedFlag } from "../types/triage.js";
import { groupL4sByL3, detectRedFlags, resolveAction } from "./red-flags.js";
import { assignTier } from "./tier-engine.js";

/**
 * Runs the full triage pipeline on a hierarchy export.
 *
 * Steps:
 * 1. Group L4 activities by L3 name
 * 2. For each L3 opportunity: detect flags, resolve action, assign tier
 * 3. Skipped/demoted items forced to Tier 3
 * 4. Sort by tier ascending, then value descending (nulls last)
 */
export function triageOpportunities(data: HierarchyExport): TriageResult[] {
  const l4Map = groupL4sByL3(data.hierarchy);
  const results: TriageResult[] = [];

  for (const opp of data.l3_opportunities) {
    const l4s = l4Map.get(opp.l3_name) ?? [];
    const redFlags = detectRedFlags(opp, l4s);
    const action = resolveAction(redFlags);

    let tier: Tier;
    if (action === "skip" || action === "demote") {
      tier = 3;
    } else {
      tier = assignTier(opp, l4s);
    }

    results.push(buildTriageResult(opp, tier, redFlags, action, l4s.length));
  }

  results.sort(compareTriage);
  return results;
}

/**
 * Comparison function for sorting TriageResults.
 * Sorts by tier ascending, then by combinedMaxValue descending (nulls last).
 */
export function compareTriage(a: TriageResult, b: TriageResult): number {
  // Tier ascending
  if (a.tier !== b.tier) return a.tier - b.tier;

  // Value descending, nulls last
  if (a.combinedMaxValue === null && b.combinedMaxValue === null) return 0;
  if (a.combinedMaxValue === null) return 1;
  if (b.combinedMaxValue === null) return -1;
  return b.combinedMaxValue - a.combinedMaxValue;
}

/**
 * Maps an L3Opportunity to a TriageResult.
 */
function buildTriageResult(
  opp: L3Opportunity,
  tier: Tier,
  redFlags: RedFlag[],
  action: "process" | "skip" | "demote",
  l4Count: number,
): TriageResult {
  return {
    l3Name: opp.l3_name,
    l2Name: opp.l2_name,
    l1Name: opp.l1_name,
    tier,
    redFlags,
    action,
    combinedMaxValue: opp.combined_max_value,
    quickWin: opp.quick_win,
    leadArchetype: opp.lead_archetype,
    l4Count: l4Count,
    rationale: opp.rationale,
  };
}
