/**
 * Technical Feasibility lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: data_readiness, aera_platform_fit, archetype_confidence
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses skill's execution,
 *   actions, constraints, and aera_skill_pattern for precise assessment.
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, tightened rubrics.
 * - v1.0: Initial implementation with basic rubrics.
 */

import type { SkillWithContext, LeadArchetype } from "../../types/hierarchy.js";

// -- Archetype-specific emphasis --

const ARCHETYPE_EMPHASIS: Record<LeadArchetype, string> = {
  DETERMINISTIC:
    "This is a DETERMINISTIC archetype skill. Weight 'aera_platform_fit' toward Process Builder capabilities. " +
    "Look for clear rule-based decision flows that map to PB nodes (If, Data View, Transaction). " +
    "Strong PB fit with clear automation paths should score highest.",
  AGENTIC:
    "This is an AGENTIC archetype skill. Weight 'archetype_confidence' toward agent team patterns. " +
    "Look for multi-step decision support workflows that benefit from AI-assisted reasoning. " +
    "Strong agent orchestration patterns with clear human-in-the-loop should score highest.",
  GENERATIVE:
    "This is a GENERATIVE archetype skill. Weight 'data_readiness' highest. " +
    "Look for rich structured data sources that can fuel content/insight generation. " +
    "Strong data availability with clear generation use cases should score highest.",
};

const DEFAULT_EMPHASIS =
  "The archetype is unknown. Evaluate all three dimensions equally without bias toward any particular pattern.";

// -- Types --

interface ChatMessage {
  role: string;
  content: string;
}

// -- Public API --

/**
 * Build the Technical Feasibility lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export function buildTechnicalPrompt(
  skill: SkillWithContext,
  knowledgeContext: string,
  archetypeHint: LeadArchetype | null,
): ChatMessage[] {
  const emphasis = archetypeHint
    ? ARCHETYPE_EMPHASIS[archetypeHint]
    : DEFAULT_EMPHASIS;

  const systemMessage = `You are an Aera platform technical feasibility assessor. Your task is to evaluate an individual SKILL for implementation on the Aera Decision Intelligence platform. A skill is a specific automation capability identified from enterprise hierarchy analysis. Your scores feed into a composite feasibility score (technical weight: 30%) that determines whether the skill advances to simulation.

Available Aera platform knowledge:
${knowledgeContext}

Score each dimension as an integer from 0 to 3:

**data_readiness:**
- 0 = No structured data signals; skill lacks measurable inputs or data references
- 1 = Sparse data signals; execution targets vague systems with no clear data sources
- 2 = Moderate data signals; target systems identified with some structured data inputs
- 3 = Rich structured data with clear decision points; specific target systems, data sources in constraints, and quantifiable inputs

**aera_platform_fit:**
- 0 = No matching capabilities or components; skill has no clear mapping to any Aera platform capability, or requires systems Aera is NOT (see Platform Boundaries in knowledge context)
- 1 = Weak fit; skill aligns with 1 capability pillar but no specific component match
- 2 = Moderate fit; maps to at least 2 specific Aera capabilities or components by name (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle). You must cite the specific capabilities.
- 3 = Strong fit; clear capability match with specific named components AND an implementation pattern (e.g., demand forecasting -> Cortex Auto Forecast + STREAMS + Subject Areas). You must cite the pattern.

**archetype_confidence:**
- 0 = Archetype unclear or mismatched; execution pattern does not support the assigned archetype
- 1 = Weak archetype support; autonomy level and actions weakly align with the archetype pattern
- 2 = Moderate archetype support; execution trigger, autonomy level, and actions are consistent with the archetype
- 3 = Archetype strongly supported; clear and consistent alignment between archetype, execution pattern, approval requirements, and rollback strategy

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the skill.
- HIGH: You have clear, specific evidence from the skill data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions -- sparse skill data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse skill set.

CONSTRAINTS:
- Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities.
- Do NOT assume all supply chain problems fit Aera. Score 0 for platform_fit if the skill requires capabilities outside Aera's scope.
- Do NOT give identical scores to all sub-dimensions. Evaluate each independently.
- When uncertain between two score levels, always choose the lower score.

${emphasis}

Return your assessment as a JSON object with this exact structure:
{
  "data_readiness": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "aera_platform_fit": { "score": <0-3>, "reason": "<1-2 sentences citing specific Aera capabilities>" },
  "archetype_confidence": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

  // Build skill context for the user message
  const targetSystemsStr = skill.execution.target_systems.length > 0
    ? skill.execution.target_systems.join(", ")
    : "N/A";

  const actionsStr = skill.actions.length > 0
    ? skill.actions.map(a => `  - ${a.action_name ?? "?"} (${a.action_type ?? "?"}): ${(a.description ?? "").slice(0, 100)}${(a.description ?? "").length > 100 ? "..." : ""}${a.target_system ? ` [${a.target_system}]` : ""}`).join("\n")
    : "  None specified";

  const constraintsStr = skill.constraints.length > 0
    ? skill.constraints.map(c => `  - ${c.constraint_name ?? "?"} (${c.constraint_type ?? "?"}): ${(c.description ?? "").slice(0, 100)}${(c.description ?? "").length > 100 ? "..." : ""}${c.data_source ? ` [${c.data_source}]` : ""}`).join("\n")
    : "  None specified";

  const userMessage = `Score this skill for Technical Feasibility:

Skill: ${skill.name}
Description: ${skill.description}
Archetype: ${skill.archetype}
Aera Skill Pattern: ${skill.aera_skill_pattern ?? "N/A"}
LOE: ${skill.loe ?? "N/A"}

Hierarchy: ${skill.l1Name} > ${skill.l2Name} > ${skill.l3Name} > ${skill.l4Name}
Parent L4 AI Suitability: ${skill.aiSuitability ?? "N/A"}

Execution:
  Target Systems: ${targetSystemsStr}
  Trigger: ${skill.execution.execution_trigger ?? "N/A"}
  Autonomy Level: ${skill.execution.autonomy_level ?? "N/A"}
  Approval Required: ${skill.execution.approval_required ?? "N/A"}

Actions:
${actionsStr}

Constraints:
${constraintsStr}

Problem Statement:
  Current State: ${skill.problem_statement.current_state}
  Root Cause: ${skill.problem_statement.root_cause}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
