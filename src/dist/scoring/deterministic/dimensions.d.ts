/**
 * Deterministic dimension scorers for L4 activities.
 *
 * Each function is a pure scorer: takes an L4Activity, returns a 0-1 number.
 * No I/O, no side effects. Used in the pre-scoring pass before LLM assessment.
 */
import type { L4Activity } from "../../types/hierarchy.js";
/** Maximum number of action+constraint signals used for richness normalization. */
export declare const MAX_SIGNALS = 20;
/** Categorical financial rating score. HIGH=1.0, MEDIUM=0.5, LOW=0.0. */
export declare function scoreFinancialSignal(l4: L4Activity): number;
/** AI suitability score. Null treated as 0.0 (unknown = no signal). */
export declare function scoreAiSuitability(l4: L4Activity): number;
/**
 * Decision density: decision_exists gives 0.5 base, plus skill richness bonus.
 * Richness = sum(actions.length + constraints.length) / MAX_SIGNALS, capped at 1.0, * 0.5.
 */
export declare function scoreDecisionDensity(l4: L4Activity): number;
/** FIRST=1.0, SECOND=0.25. */
export declare function scoreImpactOrder(l4: L4Activity): number;
/** Rating confidence score. HIGH=1.0, MEDIUM=0.6, LOW=0.2. */
export declare function scoreRatingConfidence(l4: L4Activity): number;
/**
 * Measures how completely skills are specified across 7 fields:
 * execution.target_systems.length>0, execution_trigger, execution_frequency,
 * autonomy_level, approval_required, problem_statement.quantified_pain.length>0,
 * aera_skill_pattern.
 *
 * Null execution counts as 5 unpopulated fields.
 * Averages across all skills. Empty skills array returns 0.0.
 */
export declare function scoreArchetypeCompleteness(l4: L4Activity): number;
