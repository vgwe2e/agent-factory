/**
 * Consolidated LLM scorer prompt builder (v1.3).
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Combines platform fit assessment (0-3 with Aera component citations)
 * with deterministic pre-score sanity checking (AGREE/DISAGREE/PARTIAL).
 *
 * Follows 4-layer /audit-prompt structure:
 *   Layer 1: Context/Role
 *   Layer 2: Rubric + Worked Examples
 *   Layer 3: Negative Constraints
 *   Layer 4: Confidence Calibration
 */
// -- Worked examples --
const WORKED_EXAMPLES = `
### Worked Examples

**Example 1 — Weak fit (score 1):**
\`\`\`json
{
  "platform_fit": { "score": 1, "reason": "Aligns with data ingestion capability pillar but no specific Aera component maps to the required real-time sensor integration." },
  "sanity_verdict": "AGREE",
  "sanity_justification": "Pre-scores are consistent with sparse data signals and limited platform alignment.",
  "flagged_dimensions": [],
  "confidence": "MEDIUM"
}
\`\`\`

**Example 2 — Moderate fit (score 2):**
\`\`\`json
{
  "platform_fit": { "score": 2, "reason": "Maps to Cortex Auto Forecast for demand prediction and CWB Lifecycle for exception management. Two specific components identified." },
  "sanity_verdict": "PARTIAL",
  "sanity_justification": "financial_signal appears overweighted given limited quantified pain data.",
  "flagged_dimensions": ["financial_signal"],
  "confidence": "HIGH"
}
\`\`\`

**Example 3 — Strong fit (score 3):**
\`\`\`json
{
  "platform_fit": { "score": 3, "reason": "Clear implementation pattern: Cortex Auto Forecast + STREAMS for data flow + Subject Areas for dimensional analysis + Process Builder If nodes for exception routing." },
  "sanity_verdict": "DISAGREE",
  "sanity_justification": "archetype_completeness score of 0.3 is too high — skill has null execution trigger and no rollback strategy, indicating incomplete archetype data.",
  "flagged_dimensions": ["archetype_completeness"],
  "confidence": "HIGH"
}
\`\`\``;
// -- Dimension descriptions for sanity check --
const DIMENSION_DESCRIPTIONS = {
    financial_signal: "Derived from financial_rating and aggregated max_value. Measures economic significance.",
    ai_suitability: "Derived from L4 ai_suitability field. Measures AI applicability.",
    decision_density: "Derived from decision_exists, action count, and constraint count. Measures automation potential.",
    impact_order: "Derived from impact_order field. FIRST order = direct impact (1.0), SECOND order = indirect (0.25).",
    rating_confidence: "Derived from rating_confidence field. HIGH=1.0, MEDIUM=0.6, LOW=0.2.",
    archetype_completeness: "Derived from archetype field richness (7 execution fields per skill). Measures data quality.",
};
// -- Public API --
/**
 * Build the consolidated LLM scorer prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param preScore - Deterministic pre-score result from Phase 21
 */
export function buildConsolidatedPrompt(skill, knowledgeContext, preScore) {
    // -- Layer 1: Context / Role --
    const layer1 = `You are an Aera platform implementation assessor. You evaluate whether L4 activities can be implemented using Aera's component library and sanity-check deterministic pre-scores.

Your assessment combines two tasks:
1. **Platform Fit Assessment:** Score how well this skill maps to specific Aera platform capabilities and components.
2. **Sanity Check:** Evaluate whether the deterministic pre-scores (computed from structured data fields) are reasonable given the full context of the skill.`;
    // -- Layer 2: Rubric + Worked Examples --
    const layer2 = `## Platform Fit Rubric

Score platform_fit as an integer from 0 to 3:

- 0 = No viable implementation path; skill has no clear mapping to any Aera platform capability, or requires systems outside Aera's scope
- 1 = Weak fit; skill aligns with 1 capability pillar but no specific component match. Generic overlap only.
- 2 = Moderate fit; maps to at least 2 specific Aera capabilities or components by name (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle). You MUST cite the specific capabilities.
- 3 = Strong fit; clear capability match with specific named components AND an implementation pattern (e.g., demand forecasting -> Cortex Auto Forecast + STREAMS + Subject Areas). You MUST cite the pattern.

## Sanity Check Instructions

Review each of the 6 deterministic dimension scores provided in the user message. For each dimension:
- Consider whether the score is reasonable given the skill's actual data
- If a dimension score seems miscalibrated (too high or too low), include it in flagged_dimensions

Set sanity_verdict:
- AGREE: All dimension scores are reasonable given the skill data
- PARTIAL: 1-2 dimensions appear miscalibrated but overall direction is correct
- DISAGREE: 3+ dimensions are miscalibrated, or the composite score is fundamentally misleading

Available Aera platform knowledge:
${knowledgeContext}
${WORKED_EXAMPLES}`;
    // -- Layer 3: Negative Constraints --
    const layer3 = `## Constraints

- Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities.
- Do NOT let sanity check override more than 2 dimensions. If more than 2 seem wrong, set verdict to DISAGREE and explain in justification.
- Do NOT assume all HIGH ai_suitability candidates deserve strong platform fit. Platform fit requires specific component mapping, not just AI applicability.
- If you DISAGREE with the pre-score, you MUST cite specific dimension(s) in flagged_dimensions.
- Do NOT give platform_fit = 0 solely because the skill is outside supply chain. Evaluate against ALL Aera capabilities (finance, HR, procurement, etc.).
- When uncertain between two score levels, choose the lower score.`;
    // -- Layer 4: Confidence Calibration --
    const layer4 = `## Confidence Calibration

Your confidence should reflect data quality:
- HIGH: Skill has rich archetype with execution details (trigger, autonomy, target systems, actions, constraints). You have clear evidence for your platform_fit score AND your sanity verdict.
- MEDIUM: Archetype exists but sparse. Some execution fields are populated but you had to infer from indirect signals for at least one assessment.
- LOW: No archetype or minimal data. Significant assumptions required for either platform_fit or sanity check.

Return your assessment as a JSON object with this exact structure:
{
  "platform_fit": { "score": <0-3>, "reason": "<1-2 sentences citing specific Aera capabilities>" },
  "sanity_verdict": "<AGREE|DISAGREE|PARTIAL>",
  "sanity_justification": "<1-3 sentences explaining your verdict>",
  "flagged_dimensions": ["<dimension_name>", ...],
  "confidence": "<HIGH|MEDIUM|LOW>"
}

Always include flagged_dimensions. Use an empty array when sanity_verdict is AGREE.`;
    const systemMessage = `${layer1}\n\n${layer2}\n\n${layer3}\n\n${layer4}`;
    // -- User message --
    const targetSystemsStr = skill.execution.target_systems.length > 0
        ? skill.execution.target_systems.join(", ")
        : "N/A";
    const actionsStr = skill.actions.length > 0
        ? skill.actions.map(a => `  - ${a.action_name ?? "?"} (${a.action_type ?? "?"}): ${(a.description ?? "").slice(0, 100)}${(a.description ?? "").length > 100 ? "..." : ""}${a.target_system ? ` [${a.target_system}]` : ""}`).join("\n")
        : "  None specified";
    const constraintsStr = skill.constraints.length > 0
        ? skill.constraints.map(c => `  - ${c.constraint_name ?? "?"} (${c.constraint_type ?? "?"}): ${(c.description ?? "").slice(0, 100)}${(c.description ?? "").length > 100 ? "..." : ""}${c.data_source ? ` [${c.data_source}]` : ""}`).join("\n")
        : "  None specified";
    // Build dimension breakdown with descriptions
    const dims = preScore.dimensions;
    const dimensionLines = Object.keys(DIMENSION_DESCRIPTIONS)
        .map(key => `  ${key}: ${dims[key]} — ${DIMENSION_DESCRIPTIONS[key]}`)
        .join("\n");
    const userMessage = `Assess this skill for platform fit and sanity-check its deterministic pre-scores:

## Skill Data

Skill: ${skill.name}
Description: ${skill.description}
Archetype: ${skill.archetype}
Aera Skill Pattern: ${skill.aera_skill_pattern ?? "N/A"}
LOE: ${skill.loe ?? "N/A"}

## Hierarchy

${skill.l1Name} > ${skill.l2Name} > ${skill.l3Name} > ${skill.l4Name}
Parent L4: ${preScore.l4Name}
AI Suitability: ${skill.aiSuitability ?? "N/A"}

## Execution

Target Systems: ${targetSystemsStr}
Trigger: ${skill.execution.execution_trigger ?? "N/A"}
Autonomy Level: ${skill.execution.autonomy_level ?? "N/A"}
Approval Required: ${skill.execution.approval_required ?? "N/A"}

## Actions

${actionsStr}

## Constraints

${constraintsStr}

## Problem Statement

Current State: ${skill.problem_statement.current_state}
Root Cause: ${skill.problem_statement.root_cause}

## DETERMINISTIC PRE-SCORE BREAKDOWN

${dimensionLines}

Composite Score: ${preScore.composite}
Survived Filtering: ${preScore.survived}
${preScore.eliminationReason ? `Elimination Reason: ${preScore.eliminationReason}` : ""}
Skill Count under L4: ${preScore.skillCount}

## Aera Knowledge Context

${knowledgeContext}`;
    return [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
    ];
}
