/**
 * Full triage pipeline for the triage subsystem.
 *
 * Orchestrates: red flag detection -> tier assignment -> sorting.
 * Now operates at SKILL level -- each skill is individually triaged.
 * L4 activities without skills are skipped.
 *
 * Output is sorted: Tier 1 first, then 2, then 3, value descending within tier.
 *
 * All functions are pure (no I/O, no side effects).
 */

import type { HierarchyExport, SkillWithContext } from "../types/hierarchy.js";
import type { TriageResult, Tier, RedFlag } from "../types/triage.js";
import { detectSkillRedFlags, resolveAction } from "./red-flags.js";
import { assignSkillTier } from "./tier-engine.js";
import { buildScoringHierarchy, extractScoringSkills } from "../pipeline/extract-skills.js";

/**
 * Runs the full triage pipeline on a hierarchy export at SKILL level.
 *
 * Steps:
 * 1. Extract all skills with parent L4 context
 * 2. For each skill: detect flags, resolve action, assign tier
 * 3. Skipped/demoted items forced to Tier 3
 * 4. Sort by tier ascending, then value descending (nulls last)
 */
export function triageOpportunities(data: HierarchyExport): TriageResult[] {
  const skills = extractScoringSkills(buildScoringHierarchy(data));
  const results: TriageResult[] = [];

  for (const skill of skills) {
    const redFlags = detectSkillRedFlags(skill);
    const action = resolveAction(redFlags);

    let tier: Tier;
    if (action === "skip" || action === "demote") {
      tier = 3;
    } else {
      tier = assignSkillTier(skill);
    }

    results.push(buildSkillTriageResult(skill, tier, redFlags, action));
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
 * Maps a SkillWithContext to a TriageResult.
 */
function buildSkillTriageResult(
  skill: SkillWithContext,
  tier: Tier,
  redFlags: RedFlag[],
  action: "process" | "skip" | "demote",
): TriageResult {
  return {
    l3Name: skill.l3Name,
    l2Name: skill.l2Name,
    l1Name: skill.l1Name,
    l4Name: skill.l4Name,
    skillId: skill.id,
    skillName: skill.name,
    tier,
    redFlags,
    action,
    combinedMaxValue: skill.max_value,
    quickWin: false, // skills don't have quick_win -- derived from L3 rollup
    leadArchetype: skill.archetype,
    l4Count: 1, // each skill is a single unit
  };
}
