/**
 * Type system for the triage subsystem.
 *
 * Defines red flag tagged unions, flag-to-action mappings,
 * tier assignments, and the complete triage result type.
 */

// -- Red Flag Tagged Union --

export type RedFlag =
  | { type: "DEAD_ZONE"; decisionDensity: 0 }
  | { type: "PHANTOM"; opportunityExists: false }
  | { type: "NO_STAKES"; highFinancialCount: 0; allSecondOrder: true }
  | { type: "CONFIDENCE_GAP"; lowConfidencePct: number }
  | { type: "ORPHAN"; l4Count: number };

// -- Flag Action --

export type FlagAction = "skip" | "demote" | "flag";

// -- Flag-to-Action Mapping --

export const FLAG_ACTIONS: Record<RedFlag["type"], FlagAction> = {
  DEAD_ZONE: "skip",
  PHANTOM: "skip",
  NO_STAKES: "demote",
  CONFIDENCE_GAP: "flag",
  ORPHAN: "flag",
};

// -- Tier --

export type Tier = 1 | 2 | 3;

// -- Triage Result --

export interface TriageResult {
  l3Name: string;
  l2Name: string;
  l1Name: string;
  /** Skill ID (present for skill-level triage). */
  skillId?: string;
  /** Skill name (present for skill-level triage). */
  skillName?: string;
  tier: Tier;
  redFlags: RedFlag[];
  action: "process" | "skip" | "demote";
  combinedMaxValue: number | null;
  quickWin: boolean;
  leadArchetype: string | null;
  l4Count: number;
  rationale?: string;
}
