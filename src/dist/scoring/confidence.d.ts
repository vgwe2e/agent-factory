/**
 * Per-lens algorithmic confidence computation.
 *
 * Confidence is derived from data signals (field presence, distributions),
 * NOT from LLM self-assessment. This keeps confidence reproducible and
 * independent of model behavior.
 *
 * Skill-level confidence functions use the rich skill data (problem_statement,
 * execution, actions, constraints) for more accurate confidence assessment.
 */
import type { SkillWithContext, CompanyContext } from "../types/hierarchy.js";
import type { ConfidenceLevel } from "../types/scoring.js";
/**
 * Technical Feasibility confidence for a skill.
 *
 * HIGH: archetype is declared AND execution.target_systems has entries AND
 *       aera_skill_pattern is present AND ai_suitability is not null/NOT_APPLICABLE
 * LOW: aiSuitability is null or NOT_APPLICABLE AND no execution target_systems
 * MEDIUM: everything else
 */
export declare function computeSkillTechnicalConfidence(skill: SkillWithContext): ConfidenceLevel;
/**
 * Adoption Realism confidence for a skill.
 *
 * HIGH: execution.autonomy_level is defined AND execution.approval_required is defined
 *       AND problem_statement has quantified_pain AND decisionExists on parent L4
 * LOW: no decision_made AND no actions AND no constraints
 * MEDIUM: everything else
 */
export declare function computeSkillAdoptionConfidence(skill: SkillWithContext): ConfidenceLevel;
/**
 * Value & Efficiency confidence for a skill.
 *
 * HIGH: max_value > 0 AND annual_revenue not null AND value_metric is present
 * LOW: max_value === 0 OR (annual_revenue null AND cogs null)
 * MEDIUM: everything else
 */
export declare function computeSkillValueConfidence(skill: SkillWithContext, company: CompanyContext): ConfidenceLevel;
/**
 * Overall confidence = lowest of the three lens confidences.
 */
export declare function computeOverallConfidence(technical: ConfidenceLevel, adoption: ConfidenceLevel, value: ConfidenceLevel): ConfidenceLevel;
