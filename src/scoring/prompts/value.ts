/**
 * Value & Efficiency lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: value_density, simulation_viability
 *
 * @version 3.0 — 2026-03-13
 * @changelog
 * - v3.0: Refactored to score at skill level. Uses max_value, value_metric,
 *   savings_type, and problem_statement.quantified_pain for grounded value assessment.
 * - v2.0: Hardened from audit findings.
 * - v1.0: Initial implementation with basic rubrics.
 */

import type {
  SkillWithContext,
  CompanyContext,
  LeadArchetype,
} from "../../types/hierarchy.js";

// -- Types --

interface ChatMessage {
  role: string;
  content: string;
}

// -- Public API --

/**
 * Build the Value & Efficiency lens prompt.
 *
 * @param skill - The skill being scored (with parent L4 context)
 * @param company - Company financial context
 * @param archetypeHint - Resolved archetype (from skill's own archetype field)
 */
export function buildValuePrompt(
  skill: SkillWithContext,
  company: CompanyContext,
  archetypeHint: LeadArchetype | null,
): ChatMessage[] {
  const revenueStr = company.annual_revenue != null
    ? `$${(company.annual_revenue / 1_000_000).toFixed(1)}M`
    : "N/A";
  const cogsStr = company.cogs != null
    ? `$${(company.cogs / 1_000_000).toFixed(1)}M`
    : "N/A";
  const maxValueStr = `$${(skill.max_value / 1_000_000).toFixed(1)}M`;

  // Revenue percentage for context
  let revenuePercentage = "N/A";
  if (company.annual_revenue != null && company.annual_revenue > 0) {
    revenuePercentage = `${((skill.max_value / company.annual_revenue) * 100).toFixed(3)}%`;
  }

  const systemMessage = `You are an Aera platform value and efficiency assessor. Your task is to evaluate the potential business value and simulation viability of a specific SKILL.

Score each dimension as an integer from 0 to 3:

**value_density:**
- 0 = No quantifiable value; max_value is negligible relative to company revenue
- 1 = Low value density; max_value <0.01% of annual revenue or value metrics are vague
- 2 = Moderate value density; max_value 0.01-0.1% of annual revenue with clear value metric and quantified pain
- 3 = High value density; max_value >0.1% of annual revenue with clear, specific value metrics and directly quantified business impact

**simulation_viability:**
- 0 = No concrete decision scenarios to simulate; no clear inputs/outputs for a simulation model
- 1 = Weak simulation potential: decision flows are vague, AND simplifying the execution pattern would remove the core decision logic
- 2 = Moderate simulation potential: execution pattern is defined with identifiable decision flows, but at least one of: (a) cross-system dependencies that require multi-source data orchestration, (b) execution sequences with feedback loops, (c) time-dependent logic
- 3 = Strong simulation potential: clear execution pattern with self-contained inputs/outputs from target systems, actions map to testable decision functions, constraints provide clear boundary conditions

IMPORTANT CONTEXT: The max_value figures provided have already been constrained by upstream methodology:
- Values are capped at percentage-of-COGS/working-capital tiers
- Conservative metric selection (COGS/working capital preferred over revenue as base)
These values represent deliberately conservative starting points.

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the skill.
- HIGH: You have clear, specific evidence from the skill data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions -- sparse skill data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse skill set.

CONSTRAINTS:
- Do NOT penalize low max_value -- values are deliberately capped by upstream methodology.
- Do NOT score simulation_viability >= 2 if the core decision logic depends on cross-system dependencies that cannot be isolated.
- Do NOT default to 2 on simulation_viability for every skill. Carefully assess whether the execution pattern can be tested.
- Do NOT infer value from skill names alone -- use only the provided financial metrics.

Return your assessment as a JSON object with this exact structure:
{
  "value_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "simulation_viability": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

  const constraintsStr = skill.constraints.length > 0
    ? skill.constraints.map(c => `  - ${c.constraint_name ?? "?"} (${c.constraint_type ?? "?"}): ${(c.description ?? "").slice(0, 80)}${(c.description ?? "").length > 80 ? "..." : ""}`).join("\n")
    : "  None specified";

  const userMessage = `Score this skill for Value & Efficiency:

Skill: ${skill.name}
Description: ${skill.description}
Archetype: ${archetypeHint ?? "Unknown"}
Max Value: ${maxValueStr} (${revenuePercentage} of annual revenue)
Value Metric: ${skill.value_metric ?? "N/A"}
Savings Type: ${skill.savings_type ?? "N/A"}

Company Financials:
- Company: ${company.company_name}
- Industry: ${company.industry}
- Annual Revenue: ${revenueStr}
- COGS: ${cogsStr}

Hierarchy: ${skill.l1Name} > ${skill.l2Name} > ${skill.l3Name} > ${skill.l4Name}

Problem Statement:
  Current State: ${skill.problem_statement.current_state}
  Quantified Pain: ${skill.problem_statement.quantified_pain}
  Outcome: ${skill.problem_statement.outcome}

Execution:
  Target Systems: ${skill.execution.target_systems.join(", ") || "N/A"}
  Write-Back Actions: ${skill.execution.write_back_actions.join("; ") || "N/A"}
  Trigger: ${skill.execution.execution_trigger ?? "N/A"}

Constraints:
${constraintsStr}

Differentiation: ${skill.differentiation ?? "N/A"}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
