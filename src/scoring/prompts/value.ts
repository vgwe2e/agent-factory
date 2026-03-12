/**
 * Value & Efficiency lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: value_density, simulation_viability
 *
 * @version 2.0 — 2026-03-12
 * @changelog
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, COGS-cap methodology context,
 *   tightened simulation_viability rubric, wired archetypeHint into user message.
 * - v1.0: Initial implementation with basic rubrics.
 */

import type {
  L3Opportunity,
  L4Activity,
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
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param company - Company financial context
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export function buildValuePrompt(
  opp: L3Opportunity,
  l4s: L4Activity[],
  company: CompanyContext,
  archetypeHint: LeadArchetype | null,
): ChatMessage[] {
  const revenueStr = company.annual_revenue != null
    ? `$${(company.annual_revenue / 1_000_000).toFixed(1)}M`
    : "N/A";
  const cogsStr = company.cogs != null
    ? `$${(company.cogs / 1_000_000).toFixed(1)}M`
    : "N/A";
  const combinedValueStr = opp.combined_max_value != null
    ? `$${(opp.combined_max_value / 1_000_000).toFixed(1)}M`
    : "N/A";

  // Revenue percentage for context
  let revenuePercentage = "N/A";
  if (opp.combined_max_value != null && company.annual_revenue != null && company.annual_revenue > 0) {
    revenuePercentage = `${((opp.combined_max_value / company.annual_revenue) * 100).toFixed(2)}%`;
  }

  const systemMessage = `You are an Aera platform value and efficiency assessor. Your task is to evaluate the potential business value and simulation viability of an opportunity.

Score each dimension as an integer from 0 to 3:

**value_density:**
- 0 = No quantifiable value; combined_max_value is null or negligible relative to company revenue
- 1 = Low value density; combined_max_value <0.1% of annual revenue or value metrics are vague
- 2 = Moderate value density; combined_max_value 0.1-1% of annual revenue with some clear value metrics
- 3 = High value density; combined_max_value >1% of annual revenue with clear, specific value metrics across L4s

**simulation_viability:**
- 0 = No concrete decision scenarios to simulate; no clear inputs/outputs for a simulation model
- 1 = Weak simulation potential: fewer than 50% of decision flows are identifiable, AND simplifying the dependency chain would neuter the core decision logic (i.e., the dependencies ARE the value — removing them removes the point)
- 2 = Moderate simulation potential: majority of decision flows identifiable with measurable inputs, but at least one of: (a) cross-system dependencies that require multi-source data orchestration, (b) decision sequences with feedback loops that complicate isolated testing, (c) time-dependent logic where simulation accuracy depends on temporal ordering
- 3 = Strong simulation potential: clear decision flows with self-contained inputs/outputs, minimal cross-system dependencies, decision logic can be tested in isolation without losing fidelity, straightforward to model as a stateless decision function

IMPORTANT CONTEXT: The combined_max_value figures provided have already been constrained by upstream methodology:
- Values are capped at percentage-of-COGS/working-capital tiers (0.3% for L4, 0.5% for L3)
- A 20% synergy discount has been applied to remove double-counting across child activities
- Conservative metric selection (COGS/working capital preferred over revenue as base)
- $100K minimum floor per activity

These values represent deliberately conservative starting points. When scoring value_density, assess the capped value relative to company revenue — do not penalize for conservative estimates. A combined_max_value of $50M for a mega-cap company ($50B+ revenue) represents a 0.1% impact, which is meaningful but appropriately scoped.

WORKED EXAMPLES (for calibration):

Example 1 — Strong value: "Strategic Network Design & Optimization" (Plan > Supply Network Design)
- value_density: 3 — Combined max value >1% of revenue with clear, specific value metrics across L4s including network cost optimization and distribution efficiency.
- simulation_viability: 2 — Decision flows are identifiable (network allocation, node selection) but require cross-system data from multiple distribution centers and feedback loops between capacity and demand.

Example 2 — Weak value: "Packaging Exception & Issue Management" (Move & Fulfill > Packaging)
- value_density: 1 — Combined max value is <0.1% of revenue; value metrics are limited to exception cost avoidance.
- simulation_viability: 1 — Exception handling depends on real-time packaging line data and cross-system dependencies with WMS; simplifying would remove the core exception detection logic.

Example 3 — Mid-range: "Material Requirements Planning (MRP) Integration" (Plan > Production Planning)
- value_density: 1 — Combined max value <0.1% of revenue, though MRP integration has broad operational impact not fully captured in the capped figure.
- simulation_viability: 3 — Clear decision flows (requirements calculation, shortage detection, order generation) with self-contained inputs (BOM, demand, inventory) that can be tested in isolation.

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the opportunity.
- HIGH: You have clear, specific evidence from the L4 data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions — sparse L4 data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set. If you find yourself rating everything HIGH, you are likely not being critical enough about your evidence quality.

CONSTRAINTS:
- Do NOT penalize low combined_max_value — values are deliberately capped by upstream methodology.
- Do NOT score simulation_viability >= 2 if the core decision logic depends on cross-system dependencies that cannot be isolated.
- Do NOT default to 2 on simulation_viability for every opportunity. Carefully assess whether dependency simplification would neuter the decision logic.
- Do NOT infer value from opportunity names alone — use only the provided financial metrics.
- If combined_max_value is null AND fewer than 2 L4 activities have non-empty value_metrics, score value_density 0 and note insufficient data.

Return your assessment as a JSON object with this exact structure:
{
  "value_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "simulation_viability": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

  const l4ValueSummary = l4s
    .map((l4) =>
      `- ${l4.name} | value_metric: ${l4.value_metric} | financial_rating=${l4.financial_rating} | impact_order=${l4.impact_order}`,
    )
    .join("\n");

  const userMessage = `Score this opportunity for Value & Efficiency:

Opportunity: ${opp.l3_name}
Summary: ${opp.opportunity_summary ?? "N/A"}
Archetype: ${archetypeHint ?? "Unknown"}
Combined Max Value: ${combinedValueStr} (${revenuePercentage} of annual revenue)

Company Financials:
- Company: ${company.company_name}
- Industry: ${company.industry}
- Annual Revenue: ${revenueStr}
- COGS: ${cogsStr}

L4 Activity Count: ${l4s.length}

L4 Value Metrics:
${l4ValueSummary}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
