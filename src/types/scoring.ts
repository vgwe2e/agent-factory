/**
 * Scoring engine types.
 *
 * Defines all types for the three-lens scoring system:
 * Technical Feasibility, Adoption Realism, Value & Efficiency.
 * Consumed by scoring modules and downstream Phase 5 reports.
 */

import type { LeadArchetype } from "./hierarchy.js";
import type { RedFlag } from "./triage.js";

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

/** v1.3: Sanity check verdict from consolidated LLM scorer. */
export type SanityVerdict = "AGREE" | "DISAGREE" | "PARTIAL";

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
  /** v1.3: Sanity check verdict from consolidated LLM scorer. Absent in v1.2 results. */
  sanityVerdict?: SanityVerdict;
  /** v1.3: Sanity check justification text. Absent in v1.2 results. */
  sanityJustification?: string;
  /** v1.3: Deterministic pre-score composite (0-1). Absent in v1.2 results. */
  preScore?: number;
}

// -- Deterministic Pre-Scoring Types (v1.3) --

/** Locked dimension weights for deterministic pre-scoring. Adoption-heavy. */
export const DETERMINISTIC_WEIGHTS = {
  financial_signal: 0.25,
  ai_suitability: 0.15,
  decision_density: 0.20,
  impact_order: 0.10,
  rating_confidence: 0.10,
  archetype_completeness: 0.20,
} as const;

/** One of the 6 deterministic scoring dimensions. */
export type DeterministicDimension = keyof typeof DETERMINISTIC_WEIGHTS;

/** Raw 0-1 scores for each deterministic dimension. */
export interface DimensionScores {
  financial_signal: number;
  ai_suitability: number;
  decision_density: number;
  impact_order: number;
  rating_confidence: number;
  archetype_completeness: number;
}

/** Result of deterministic pre-scoring for a single L4 activity. */
export interface PreScoreResult {
  l4Id: string;
  l4Name: string;
  l3Name: string;
  l2Name: string;
  l1Name: string;
  dimensions: DimensionScores;
  /** 0-1 normalized weighted composite, rounded to 4 decimal places. */
  composite: number;
  /** Whether this L4 survived filtering (not eliminated by red flags). */
  survived: boolean;
  /** Reason for elimination, e.g. "DEAD_ZONE", "NO_STAKES". Null if survived. */
  eliminationReason: string | null;
  redFlags: RedFlag[];
  /** Number of skills under this L4. */
  skillCount: number;
  /** Sum of skill max_values, used for tiebreaking. */
  aggregatedMaxValue: number;
}

/** Statistics from the top-N filtering pass. */
export interface FilterStats {
  totalCandidates: number;
  requestedTopN: number;
  actualSurvivors: number;
  eliminated: number;
  cutoffScore: number;
  tiesAtBoundary: number;
}

/** Result of the deterministic filter pass. */
export interface FilterResult {
  survivors: PreScoreResult[];
  eliminated: PreScoreResult[];
  stats: FilterStats;
}
