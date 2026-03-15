/**
 * Skill extraction utility.
 *
 * Builds the scoring candidate hierarchy and flattens it into scorable
 * SkillWithContext objects by enriching each skill with parent L4 activity
 * context. Cross-functional skills are converted into synthetic L4 rows so
 * they can move through the same triage/scoring/simulation path as embedded
 * L4 skills.
 *
 * Pure function: no I/O, no side effects.
 */
/** Default execution object for skills missing execution data. */
const DEFAULT_EXECUTION = {
    target_systems: [],
    write_back_actions: [],
    execution_trigger: null,
    execution_frequency: null,
    autonomy_level: null,
    approval_required: null,
    approval_threshold: null,
    rollback_strategy: null,
};
/** Default problem statement for skills missing it. */
const DEFAULT_PROBLEM_STATEMENT = {
    current_state: "",
    quantified_pain: "",
    root_cause: "",
    falsifiability_check: "",
    outcome: "",
};
function formatSourceLabel(source) {
    if (!source) {
        return "Cross-Functional";
    }
    return source
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
function getCrossFunctionalDomains(skill) {
    const scope = skill.cross_functional_scope;
    if (scope && typeof scope === "object" && !Array.isArray(scope)) {
        const rawDomains = scope.l1_domains;
        if (Array.isArray(rawDomains)) {
            return rawDomains.filter((domain) => typeof domain === "string" && domain.length > 0);
        }
    }
    return [];
}
function deriveFinancialRating(maxValue) {
    if (maxValue >= 5_000_000)
        return "HIGH";
    if (maxValue >= 1_000_000)
        return "MEDIUM";
    return "LOW";
}
function deriveImpactOrder(maxValue) {
    return maxValue >= 5_000_000 ? "FIRST" : "SECOND";
}
function hasProblemSignal(skill) {
    const problem = skill.problem_statement;
    return Boolean(problem?.current_state ||
        problem?.quantified_pain ||
        problem?.root_cause ||
        problem?.outcome);
}
function hasExecutionSignal(skill) {
    const execution = skill.execution;
    return Boolean(execution &&
        (execution.target_systems.length > 0 ||
            execution.write_back_actions.length > 0 ||
            execution.execution_trigger ||
            execution.execution_frequency ||
            execution.autonomy_level ||
            execution.approval_required !== null ||
            execution.approval_threshold ||
            execution.rollback_strategy));
}
function deriveRatingConfidenceFromSkills(skills, options = {}) {
    let populatedSignals = 0;
    if (options.decisionExists)
        populatedSignals++;
    if (options.aiSuitability === "HIGH")
        populatedSignals++;
    if (skills.some((skill) => skill.decision_made || skill.walkthrough_decision || skill.walkthrough_narrative)) {
        populatedSignals++;
    }
    if (skills.some(hasProblemSignal))
        populatedSignals++;
    if (skills.some(hasExecutionSignal))
        populatedSignals++;
    if (skills.some((skill) => (skill.actions?.length ?? 0) + (skill.constraints?.length ?? 0) > 0)) {
        populatedSignals++;
    }
    if (populatedSignals >= 3)
        return "HIGH";
    if (populatedSignals >= 1)
        return "MEDIUM";
    return "LOW";
}
function deriveAiSuitability(skill) {
    if (!skill.decision_made && !skill.walkthrough_decision && !hasProblemSignal(skill)) {
        return "NOT_APPLICABLE";
    }
    if (skill.archetype === "AGENTIC" || skill.archetype === "GENERATIVE") {
        return "HIGH";
    }
    return "MEDIUM";
}
function toCrossFunctionalL4(skill) {
    const domains = getCrossFunctionalDomains(skill);
    const domainLabel = domains.length > 0 ? domains.join(" + ") : "Multi-Domain";
    return {
        id: skill.id,
        name: skill.name,
        description: skill.description ??
            skill.problem_statement?.current_state ??
            skill.decision_made ??
            skill.name,
        l1: "Cross-Functional",
        l2: formatSourceLabel(skill.source),
        l3: `Cross-Functional: ${domainLabel}`,
        financial_rating: deriveFinancialRating(skill.max_value),
        value_metric: skill.value_metric ?? "cross_functional_value",
        impact_order: deriveImpactOrder(skill.max_value),
        rating_confidence: deriveRatingConfidenceFromSkills([skill], {
            decisionExists: Boolean(skill.decision_made || skill.walkthrough_decision),
            aiSuitability: deriveAiSuitability(skill),
        }),
        ai_suitability: deriveAiSuitability(skill),
        decision_exists: Boolean(skill.decision_made || skill.walkthrough_decision),
        decision_articulation: skill.decision_made ??
            skill.walkthrough_decision ??
            skill.problem_statement?.outcome ??
            null,
        escalation_flag: "cross_functional",
        skills: [skill],
    };
}
function shouldBackfillEmbeddedConfidence(hierarchy) {
    return hierarchy.length > 0 && hierarchy.every((l4) => l4.rating_confidence === "LOW");
}
function normalizeEmbeddedL4(l4, backfillConfidence) {
    if (!backfillConfidence) {
        return l4;
    }
    return {
        ...l4,
        rating_confidence: deriveRatingConfidenceFromSkills(l4.skills, {
            decisionExists: l4.decision_exists,
            aiSuitability: l4.ai_suitability,
        }),
    };
}
export function buildScoringHierarchy(data) {
    const backfillEmbeddedConfidence = shouldBackfillEmbeddedConfidence(data.hierarchy);
    const normalizedHierarchy = data.hierarchy.map((l4) => normalizeEmbeddedL4(l4, backfillEmbeddedConfidence));
    const crossFunctionalSkills = data.cross_functional_skills ?? [];
    if (crossFunctionalSkills.length === 0) {
        return normalizedHierarchy;
    }
    return [
        ...normalizedHierarchy,
        ...crossFunctionalSkills.map(toCrossFunctionalL4),
    ];
}
/**
 * Extract all skills from the hierarchy with parent L4 context attached.
 *
 * @param hierarchy - Array of L4 activities from the hierarchy export
 * @returns Flat array of SkillWithContext objects ready for scoring
 */
export function extractScoringSkills(hierarchy) {
    const skills = [];
    for (const l4 of hierarchy) {
        if (!l4.skills || l4.skills.length === 0)
            continue;
        for (const skill of l4.skills) {
            skills.push({
                ...skill,
                execution: skill.execution ?? DEFAULT_EXECUTION,
                problem_statement: skill.problem_statement ?? DEFAULT_PROBLEM_STATEMENT,
                l4Name: l4.name,
                l4Id: l4.id,
                l3Name: l4.l3,
                l2Name: l4.l2,
                l1Name: l4.l1,
                financialRating: l4.financial_rating,
                aiSuitability: l4.ai_suitability,
                impactOrder: l4.impact_order,
                ratingConfidence: l4.rating_confidence,
                decisionExists: l4.decision_exists,
                decisionArticulation: l4.decision_articulation,
            });
        }
    }
    return skills;
}
