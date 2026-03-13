/**
 * Red flag detection for the triage subsystem.
 *
 * Detects 5 types of red flags on L3 opportunities:
 * - PHANTOM: opportunity_exists = false
 * - ORPHAN: l4_count < 3
 * - DEAD_ZONE: 0% decision density across all L4s
 * - NO_STAKES: zero HIGH financial + all SECOND order impact
 * - CONFIDENCE_GAP: >50% of L4s have LOW rating confidence
 *
 * All functions are pure (no I/O, no side effects).
 */

import type { L3Opportunity, L4Activity, SkillWithContext } from "../types/hierarchy.js";
import type { RedFlag } from "../types/triage.js";
import { FLAG_ACTIONS } from "../types/triage.js";

/**
 * Groups L4 activities by their l3 field into a Map.
 */
export function groupL4sByL3(
  hierarchy: L4Activity[],
): Map<string, L4Activity[]> {
  const map = new Map<string, L4Activity[]>();
  for (const l4 of hierarchy) {
    const existing = map.get(l4.l3) ?? [];
    existing.push(l4);
    map.set(l4.l3, existing);
  }
  return map;
}

/**
 * Detects red flags for a single L3 opportunity given its associated L4 activities.
 *
 * Checks flags in order: PHANTOM, ORPHAN, DEAD_ZONE, NO_STAKES, CONFIDENCE_GAP.
 * Returns early from L4-dependent checks if l4s array is empty.
 */
export function detectRedFlags(
  opp: L3Opportunity,
  l4s: L4Activity[],
): RedFlag[] {
  const flags: RedFlag[] = [];

  // FLAG-04: Phantom (cheapest check -- direct boolean on L3)
  if (!opp.opportunity_exists) {
    flags.push({ type: "PHANTOM", opportunityExists: false });
  }

  // FLAG-05: Orphan/thin (direct numeric check on L3)
  if (opp.l4_count < 3) {
    flags.push({ type: "ORPHAN", l4Count: opp.l4_count });
  }

  // Remaining flags require L4 data -- bail if none available
  if (l4s.length === 0) return flags;

  // FLAG-01: Dead zone (0% decision density)
  const decisionCount = l4s.filter((l4) => l4.decision_exists).length;
  if (decisionCount === 0) {
    flags.push({ type: "DEAD_ZONE", decisionDensity: 0 });
  }

  // FLAG-02: No stakes (zero HIGH financial + all SECOND order)
  const hasHighFinancial = l4s.some(
    (l4) => l4.financial_rating === "HIGH",
  );
  const allSecondOrder = l4s.every((l4) => l4.impact_order === "SECOND");
  if (!hasHighFinancial && allSecondOrder) {
    flags.push({
      type: "NO_STAKES",
      highFinancialCount: 0,
      allSecondOrder: true,
    });
  }

  // FLAG-03: Confidence gap (strictly >50% LOW confidence)
  const lowConfCount = l4s.filter(
    (l4) => l4.rating_confidence === "LOW",
  ).length;
  const lowConfPct = lowConfCount / l4s.length;
  if (lowConfPct > 0.5) {
    flags.push({ type: "CONFIDENCE_GAP", lowConfidencePct: lowConfPct });
  }

  return flags;
}

/**
 * Detects red flags for a single skill.
 *
 * Skill-level flags:
 * - DEAD_ZONE: no actions and no constraints (nothing to automate)
 * - NO_STAKES: LOW financial rating on parent L4 AND all SECOND order impact
 * - CONFIDENCE_GAP: LOW rating_confidence on parent L4
 */
export function detectSkillRedFlags(
  skill: SkillWithContext,
): RedFlag[] {
  const flags: RedFlag[] = [];

  // DEAD_ZONE: no actions and no constraints means nothing to automate
  if (skill.actions.length === 0 && skill.constraints.length === 0 && !skill.decision_made) {
    flags.push({ type: "DEAD_ZONE", decisionDensity: 0 });
  }

  // NO_STAKES: LOW financial rating + SECOND order impact
  if (skill.financialRating === "LOW" && skill.impactOrder === "SECOND") {
    flags.push({
      type: "NO_STAKES",
      highFinancialCount: 0,
      allSecondOrder: true,
    });
  }

  // CONFIDENCE_GAP: LOW rating confidence
  if (skill.ratingConfidence === "LOW") {
    flags.push({ type: "CONFIDENCE_GAP", lowConfidencePct: 1.0 });
  }

  return flags;
}

/**
 * Resolves the worst action from a set of red flags.
 *
 * Priority: skip > demote > flag (flag maps to "process" since flagged items still get processed).
 * Returns "process" if no flags.
 */
export function resolveAction(
  flags: RedFlag[],
): "process" | "skip" | "demote" {
  if (flags.length === 0) return "process";

  const ACTION_PRIORITY: Record<string, number> = {
    skip: 3,
    demote: 2,
    flag: 1,
  };

  let worstAction = "flag";
  let worstPriority = 0;

  for (const flag of flags) {
    const action = FLAG_ACTIONS[flag.type];
    const priority = ACTION_PRIORITY[action];
    if (priority > worstPriority) {
      worstPriority = priority;
      worstAction = action;
    }
  }

  // "flag" action means the item is flagged but still processed
  if (worstAction === "flag") return "process";
  return worstAction as "skip" | "demote";
}
