/**
 * Scoring engine types.
 *
 * Defines all types for the three-lens scoring system:
 * Technical Feasibility, Adoption Realism, Value & Efficiency.
 * Consumed by scoring modules and downstream Phase 5 reports.
 */

import type { LeadArchetype } from "./hierarchy.js";

// -- Constants --

/** Lens weights for composite score computation. */
export const WEIGHTS = {
  technical: 0.30,
  adoption: 0.45,
  value: 0.25,
} as const;

/** Maximum possible raw scores per lens. */
export const MAX_SCORES = {
  technical: 9,   // 3 sub-dimensions * 3 max each
  adoption: 12,   // 4 sub-dimensions * 3 max each
  value: 6,       // 2 sub-dimensions * 3 max each
} as const;

/** Minimum composite score required for simulation promotion. */
export const PROMOTION_THRESHOLD = 0.60;

// -- Types --

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type LensName = "technical" | "adoption" | "value";

export interface SubDimensionScore {
  name: string;
  score: number;    // 0-3 integer
  reason: string;   // 1-2 sentences
}

export interface LensScore {
  lens: LensName;
  subDimensions: SubDimensionScore[];
  total: number;        // sum of sub-dimension scores
  maxPossible: number;  // 9, 12, or 6
  normalized: number;   // total / maxPossible (0.0-1.0)
  confidence: ConfidenceLevel;
}

export interface CompositeResult {
  technical: { total: number; normalized: number };
  adoption: { total: number; normalized: number };
  value: { total: number; normalized: number };
  composite: number;
  promotedToSimulation: boolean;
}

export interface ScoringResult {
  /** Skill ID from the JSON export */
  skillId: string;
  /** Skill name -- the exact name users see in the Aera app */
  skillName: string;
  /** Parent L4 activity name */
  l4Name: string;
  /** L3 category (kept for grouping/reporting) */
  l3Name: string;
  l2Name: string;
  l1Name: string;
  /** Archetype from the skill's own archetype field (authoritative) */
  archetype: LeadArchetype;
  lenses: {
    technical: LensScore;
    adoption: LensScore;
    value: LensScore;
  };
  composite: number;
  overallConfidence: ConfidenceLevel;
  promotedToSimulation: boolean;
  scoringDurationMs: number;
}
