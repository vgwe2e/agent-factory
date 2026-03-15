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
// -- Confidence level ordering for min computation --
const LEVEL_ORDER = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
};
const ORDER_TO_LEVEL = ["LOW", "MEDIUM", "HIGH"];
/**
 * Technical Feasibility confidence for a skill.
 *
 * HIGH: archetype is declared AND execution.target_systems has entries AND
 *       aera_skill_pattern is present AND ai_suitability is not null/NOT_APPLICABLE
 * LOW: aiSuitability is null or NOT_APPLICABLE AND no execution target_systems
 * MEDIUM: everything else
 */
export function computeSkillTechnicalConfidence(skill) {
    const hasTargetSystems = skill.execution.target_systems.length > 0;
    const hasPattern = skill.aera_skill_pattern !== null;
    const aiUsable = skill.aiSuitability !== null && skill.aiSuitability !== "NOT_APPLICABLE";
    if (hasTargetSystems && hasPattern && aiUsable)
        return "HIGH";
    if (!aiUsable && !hasTargetSystems)
        return "LOW";
    return "MEDIUM";
}
/**
 * Adoption Realism confidence for a skill.
 *
 * HIGH: execution.autonomy_level is defined AND execution.approval_required is defined
 *       AND problem_statement has quantified_pain AND decisionExists on parent L4
 * LOW: no decision_made AND no actions AND no constraints
 * MEDIUM: everything else
 */
export function computeSkillAdoptionConfidence(skill) {
    const hasAutonomy = skill.execution.autonomy_level !== null;
    const hasApproval = skill.execution.approval_required !== null;
    const hasPain = skill.problem_statement.quantified_pain.length > 0;
    const hasDecision = skill.decisionExists;
    if (hasAutonomy && hasApproval && hasPain && hasDecision)
        return "HIGH";
    const noDecision = !skill.decision_made && skill.actions.length === 0 && skill.constraints.length === 0;
    if (noDecision)
        return "LOW";
    return "MEDIUM";
}
/**
 * Value & Efficiency confidence for a skill.
 *
 * HIGH: max_value > 0 AND annual_revenue not null AND value_metric is present
 * LOW: max_value === 0 OR (annual_revenue null AND cogs null)
 * MEDIUM: everything else
 */
export function computeSkillValueConfidence(skill, company) {
    if (skill.max_value === 0)
        return "LOW";
    if (company.annual_revenue === null && company.cogs === null)
        return "LOW";
    if (skill.max_value > 0 && company.annual_revenue !== null && skill.value_metric !== null)
        return "HIGH";
    return "MEDIUM";
}
/**
 * Overall confidence = lowest of the three lens confidences.
 */
export function computeOverallConfidence(technical, adoption, value) {
    const minOrder = Math.min(LEVEL_ORDER[technical], LEVEL_ORDER[adoption], LEVEL_ORDER[value]);
    return ORDER_TO_LEVEL[minOrder];
}
