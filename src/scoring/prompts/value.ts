/**
 * Value & Efficiency lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: value_density, simulation_viability
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
- 1 = Weak simulation potential; few decision flows identified, inputs/outputs unclear
- 2 = Moderate simulation potential; some decision flows with measurable inputs but complex dependencies
- 3 = Clear decision flows with measurable inputs and outputs; straightforward to model as a simulation

Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: value_density, simulation_viability.`;

  const l4ValueSummary = l4s
    .map((l4) =>
      `- ${l4.name} | value_metric: ${l4.value_metric} | financial_rating=${l4.financial_rating} | impact_order=${l4.impact_order}`,
    )
    .join("\n");

  const userMessage = `Score this opportunity for Value & Efficiency:

Opportunity: ${opp.l3_name}
Summary: ${opp.opportunity_summary ?? "N/A"}
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
