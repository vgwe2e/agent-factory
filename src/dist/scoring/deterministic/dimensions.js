/**
 * Deterministic dimension scorers for L4 activities.
 *
 * Each function is a pure scorer: takes an L4Activity, returns a 0-1 number.
 * No I/O, no side effects. Used in the pre-scoring pass before LLM assessment.
 */
/** Maximum number of action+constraint signals used for richness normalization. */
export const MAX_SIGNALS = 20;
// -- Financial Signal --
const FINANCIAL_MAP = {
    HIGH: 1.0,
    MEDIUM: 0.5,
    LOW: 0.0,
};
/** Categorical financial rating score. HIGH=1.0, MEDIUM=0.5, LOW=0.0. */
export function scoreFinancialSignal(l4) {
    return FINANCIAL_MAP[l4.financial_rating] ?? 0.0;
}
// -- AI Suitability --
const AI_MAP = {
    HIGH: 1.0,
    MEDIUM: 0.5,
    LOW: 0.25,
    NOT_APPLICABLE: 0.0,
};
/** AI suitability score. Null treated as 0.0 (unknown = no signal). */
export function scoreAiSuitability(l4) {
    if (l4.ai_suitability === null)
        return 0.0;
    return AI_MAP[l4.ai_suitability] ?? 0.0;
}
// -- Decision Density --
/**
 * Decision density: decision_exists gives 0.5 base, plus skill richness bonus.
 * Richness = sum(actions.length + constraints.length) / MAX_SIGNALS, capped at 1.0, * 0.5.
 */
export function scoreDecisionDensity(l4) {
    const base = l4.decision_exists ? 0.5 : 0.0;
    let totalSignals = 0;
    for (const skill of l4.skills) {
        totalSignals += skill.actions.length + skill.constraints.length;
    }
    const richness = Math.min(totalSignals / MAX_SIGNALS, 1.0) * 0.5;
    return base + richness;
}
// -- Impact Order --
/** FIRST=1.0, SECOND=0.25. */
export function scoreImpactOrder(l4) {
    return l4.impact_order === "FIRST" ? 1.0 : 0.25;
}
// -- Rating Confidence --
const CONFIDENCE_MAP = {
    HIGH: 1.0,
    MEDIUM: 0.6,
    LOW: 0.2,
};
/** Rating confidence score. HIGH=1.0, MEDIUM=0.6, LOW=0.2. */
export function scoreRatingConfidence(l4) {
    return CONFIDENCE_MAP[l4.rating_confidence] ?? 0.0;
}
// -- Archetype Completeness --
/**
 * Measures how completely skills are specified across 7 fields:
 * execution.target_systems.length>0, execution_trigger, execution_frequency,
 * autonomy_level, approval_required, problem_statement.quantified_pain.length>0,
 * aera_skill_pattern.
 *
 * Null execution counts as 5 unpopulated fields.
 * Averages across all skills. Empty skills array returns 0.0.
 */
export function scoreArchetypeCompleteness(l4) {
    if (l4.skills.length === 0)
        return 0.0;
    const FIELDS_PER_SKILL = 7;
    let totalPopulated = 0;
    let totalFields = 0;
    for (const skill of l4.skills) {
        totalFields += FIELDS_PER_SKILL;
        // execution fields (5)
        if (skill.execution !== null) {
            if (skill.execution.target_systems.length > 0)
                totalPopulated++;
            if (skill.execution.execution_trigger !== null)
                totalPopulated++;
            if (skill.execution.execution_frequency !== null)
                totalPopulated++;
            if (skill.execution.autonomy_level !== null)
                totalPopulated++;
            if (skill.execution.approval_required !== null)
                totalPopulated++;
        }
        // else: 5 fields remain unpopulated (0 added)
        // problem_statement.quantified_pain (1)
        if (skill.problem_statement !== null && skill.problem_statement.quantified_pain.length > 0) {
            totalPopulated++;
        }
        // aera_skill_pattern (1)
        if (skill.aera_skill_pattern !== null) {
            totalPopulated++;
        }
    }
    return totalPopulated / totalFields;
}
