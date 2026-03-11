/**
 * Per-lens algorithmic confidence computation.
 *
 * Confidence is derived from data signals (field presence, distributions),
 * NOT from LLM self-assessment. This keeps confidence reproducible and
 * independent of model behavior.
 */
import type { L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";
import type { ConfidenceLevel } from "../types/scoring.js";
/**
 * Technical Feasibility confidence.
 *
 * HIGH: lead_archetype present AND >75% of L4s have ai_suitability not null and not NOT_APPLICABLE
 * LOW: lead_archetype null OR >50% of L4s have null ai_suitability OR empty L4 array
 * MEDIUM: everything else
 */
export declare function computeTechnicalConfidence(opp: L3Opportunity, l4s: L4Activity[]): ConfidenceLevel;
/**
 * Adoption Realism confidence.
 *
 * HIGH: >60% L4s have decision_exists AND >50% have financial_rating !== "LOW"
 * LOW: <25% L4s have decision_exists OR >75% have rating_confidence = "LOW" OR empty L4 array
 * MEDIUM: everything else
 */
export declare function computeAdoptionConfidence(l4s: L4Activity[]): ConfidenceLevel;
/**
 * Value & Efficiency confidence.
 *
 * HIGH: combined_max_value not null AND annual_revenue not null
 * LOW: combined_max_value null OR (annual_revenue null AND cogs null)
 * MEDIUM: everything else
 */
export declare function computeValueConfidence(opp: L3Opportunity, company: CompanyContext): ConfidenceLevel;
/**
 * Overall confidence = lowest of the three lens confidences.
 */
export declare function computeOverallConfidence(technical: ConfidenceLevel, adoption: ConfidenceLevel, value: ConfidenceLevel): ConfidenceLevel;
