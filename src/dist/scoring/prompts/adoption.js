/**
 * Adoption Realism lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: decision_density, financial_gravity, impact_proximity, confidence_signal
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses execution.autonomy_level,
 *   execution.approval_required, loe, and problem_statement for realistic adoption scoring.
 * - v2.0: Hardened from audit findings.
 * - v1.0: Initial implementation with basic rubrics.
 */
// -- Archetype-specific emphasis --
const ARCHETYPE_EMPHASIS = {
    DETERMINISTIC: "This is a DETERMINISTIC archetype skill. Weight 'decision_density' highest. " +
        "Deterministic skills automate clear decisions -- high decision density is critical for adoption. " +
        "Look for specific decision_made articulation and well-defined actions.",
    AGENTIC: "This is an AGENTIC archetype skill. Weight 'confidence_signal' highest. " +
        "Agentic skills require trust from users -- clear execution patterns and approval flows signal organizational readiness. " +
        "Look for defined autonomy levels and approval thresholds.",
    GENERATIVE: "This is a GENERATIVE archetype skill. Weight 'impact_proximity' highest. " +
        "Generative skills must demonstrate visible value quickly -- FIRST-order impact drives adoption. " +
        "Look for measurable outcomes in the problem statement.",
};
const DEFAULT_EMPHASIS = "The archetype is unknown. Evaluate all four dimensions equally without bias toward any particular pattern.";
// -- Public API --
/**
 * Build the Adoption Realism lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export function buildAdoptionPrompt(skill, archetypeHint) {
    const emphasis = archetypeHint
        ? ARCHETYPE_EMPHASIS[archetypeHint]
        : DEFAULT_EMPHASIS;
    const systemMessage = `You are an Aera platform adoption realism assessor. Your task is to evaluate how likely a specific SKILL is to be adopted by real users in production. You are scoring skills within a large enterprise portfolio. Scores should discriminate meaningfully: a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria.

Score each dimension as an integer from 0 to 3:

**decision_density:**
- 0 = No automated decisions identified; no decision_made articulation and no defined actions
- 1 = Decision exists but lacks specificity: decision_made is vague or generic, actions are named but triggers are not operationally defined
- 2 = Decisions are articulated with measurable triggers: specific decision_made text that names a trigger condition, actions have typical_triggers defined
- 3 = Decisions are fully articulated with clear trigger-action-outcome chains: specific, well-defined actions with quantifiable triggers, clear execution pattern, and approval thresholds

**financial_gravity:**
- 0 = No financial urgency; LOW financial rating on parent L4 with no quantified pain
- 1 = Weak financial case; low max_value or vague quantified_pain
- 2 = Reasonable financial case; meaningful max_value with some quantified pain articulation
- 3 = Strong financial urgency; high max_value with clear quantified pain and FIRST-order impact on parent L4

**impact_proximity:**
- 0 = Only indirect, second-order benefits; value realization requires multi-step causal chains
- 1 = Mostly indirect benefits with some direct signals; value realization > 6 months
- 2 = Mix of direct and indirect benefits; some outcomes visible within 3-6 months
- 3 = Direct, measurable outcomes; value visible within 90 days with clear write-back actions

**confidence_signal:**
- 0 = High uncertainty; sparse skill data, no execution pattern, no constraints defined
- 1 = Mixed signals; some execution detail but missing key elements (autonomy level, approval, rollback)
- 2 = Reasonable certainty; execution pattern defined with autonomy level and approval requirements
- 3 = Strong certainty; complete execution pattern with triggers, approval thresholds, rollback strategy, and well-defined constraints

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the skill.
- HIGH: You have clear, specific evidence from the skill data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions -- sparse skill data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse skill set.

CONSTRAINTS:
- Do NOT score decision_density based solely on the presence of actions. Evaluate the quality and specificity of triggers and outcomes.
- Do NOT default to 3 on any sub-dimension without specific evidence.
- Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score -- they measure different things.
- If the skill has no actions and no constraints, flag confidence as LOW.

${emphasis}

Return your assessment as a JSON object with this exact structure:
{
  "decision_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "financial_gravity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "impact_proximity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence_signal": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;
    const writeBackStr = skill.execution.write_back_actions.length > 0
        ? skill.execution.write_back_actions.join("; ")
        : "N/A";
    const actionsStr = skill.actions.length > 0
        ? skill.actions.map(a => {
            const triggers = a.typical_triggers && a.typical_triggers.length > 0
                ? ` | Triggers: ${a.typical_triggers.join("; ")}`
                : "";
            return `  - ${a.action_name ?? "?"} (${a.action_type ?? "?"}): ${(a.description ?? "").slice(0, 120)}${(a.description ?? "").length > 120 ? "..." : ""}${triggers}`;
        }).join("\n")
        : "  None specified";
    const userMessage = `Score this skill for Adoption Realism:

Skill: ${skill.name}
Description: ${skill.description}
Archetype: ${skill.archetype}
LOE: ${skill.loe ?? "N/A"}
Max Value: $${(skill.max_value / 1_000_000).toFixed(1)}M
Savings Type: ${skill.savings_type ?? "N/A"}

Hierarchy: ${skill.l1Name} > ${skill.l2Name} > ${skill.l3Name} > ${skill.l4Name}
Parent L4 Financial Rating: ${skill.financialRating}
Parent L4 Impact Order: ${skill.impactOrder}
Parent L4 Rating Confidence: ${skill.ratingConfidence}
Parent L4 Decision Exists: ${skill.decisionExists}

Decision Made: ${skill.decision_made ?? "N/A"}

Execution:
  Autonomy Level: ${skill.execution.autonomy_level ?? "N/A"}
  Approval Required: ${skill.execution.approval_required ?? "N/A"}
  Approval Threshold: ${skill.execution.approval_threshold ?? "N/A"}
  Execution Trigger: ${skill.execution.execution_trigger ?? "N/A"}
  Rollback Strategy: ${skill.execution.rollback_strategy ?? "N/A"}
  Write-Back Actions: ${writeBackStr}

Actions:
${actionsStr}

Problem Statement:
  Current State: ${skill.problem_statement.current_state}
  Quantified Pain: ${skill.problem_statement.quantified_pain}
  Outcome: ${skill.problem_statement.outcome}`;
    return [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
    ];
}
