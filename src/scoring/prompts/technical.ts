/**
 * Technical Feasibility lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: data_readiness, aera_platform_fit, archetype_confidence
 *
 * @version 2.0 — 2026-03-12
 * @changelog
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, tightened rubrics.
 * - v1.0: Initial implementation with basic rubrics.
 */

import type { L3Opportunity, L4Activity, LeadArchetype } from "../../types/hierarchy.js";

// -- Archetype-specific emphasis --

const ARCHETYPE_EMPHASIS: Record<LeadArchetype, string> = {
  DETERMINISTIC:
    "This is a DETERMINISTIC archetype opportunity. Weight 'aera_platform_fit' toward Process Builder capabilities. " +
    "Look for clear rule-based decision flows that map to PB nodes (If, Data View, Transaction). " +
    "Strong PB fit with clear automation paths should score highest.",
  AGENTIC:
    "This is an AGENTIC archetype opportunity. Weight 'archetype_confidence' toward agent team patterns. " +
    "Look for multi-step decision support workflows that benefit from AI-assisted reasoning. " +
    "Strong agent orchestration patterns with clear human-in-the-loop should score highest.",
  GENERATIVE:
    "This is a GENERATIVE archetype opportunity. Weight 'data_readiness' highest. " +
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
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export function buildTechnicalPrompt(
  opp: L3Opportunity,
  l4s: L4Activity[],
  knowledgeContext: string,
  archetypeHint: LeadArchetype | null,
): ChatMessage[] {
  const emphasis = archetypeHint
    ? ARCHETYPE_EMPHASIS[archetypeHint]
    : DEFAULT_EMPHASIS;

  const systemMessage = `You are an Aera platform technical feasibility assessor. Your task is to evaluate an opportunity for implementation on the Aera Decision Intelligence platform. An opportunity is a business process improvement candidate identified from enterprise hierarchy analysis. Your scores feed into a composite feasibility score (technical weight: 30%) that determines whether the opportunity advances to simulation.

Available Aera platform knowledge:
${knowledgeContext}

Score each dimension as an integer from 0 to 3:

**data_readiness:**
- 0 = No structured data signals; L4 activities lack measurable inputs or data references
- 1 = Sparse data signals; few L4s reference structured data or metrics
- 2 = Moderate data signals; multiple L4s reference structured data with some decision points
- 3 = Rich structured data with clear decision points; majority of L4s have quantifiable inputs

**aera_platform_fit:**
- 0 = No matching capabilities or components; opportunity has no clear mapping to any Aera platform capability, or requires systems Aera is NOT (see Platform Boundaries in knowledge context)
- 1 = Weak fit; opportunity aligns with 1 capability pillar but no specific component match
- 2 = Moderate fit; maps to at least 2 specific Aera capabilities or components by name (e.g., forecasting -> Cortex Auto Forecast, exception management -> CWB Lifecycle). You must cite the specific capabilities.
- 3 = Strong fit; clear capability match with specific named components AND an implementation pattern (e.g., demand forecasting -> Cortex Auto Forecast + STREAMS + Subject Areas). You must cite the pattern.

**archetype_confidence:**
- 0 = Archetype unclear or mismatched; L4 patterns do not support the assigned archetype
- 1 = Weak archetype support; few L4s align with the archetype pattern
- 2 = Moderate archetype support; majority of L4s show patterns consistent with the archetype
- 3 = Archetype strongly supported by L4 patterns; clear and consistent alignment

WORKED EXAMPLES (for calibration):

Example 1 — Strong fit: "Warehouse & Inventory Management" (Move & Fulfill > Inbound Logistics)
- data_readiness: 3 — Multiple L4s reference inventory levels, receipts, and stock movements with quantifiable metrics.
- aera_platform_fit: 2 — Maps to Safety Stock Service for inventory optimization and STREAMS for data integration, but full implementation pattern depends on WMS integration scope.
- archetype_confidence: 3 — DETERMINISTIC archetype strongly supported: clear rule-based replenishment and exception flows across L4s.

Example 2 — Weak fit: "Technology & Innovation Scouting" (Procure > Commodity Management)
- data_readiness: 1 — L4s reference qualitative assessments and market intelligence with few structured data signals.
- aera_platform_fit: 0 — Innovation scouting requires unstructured research and strategic evaluation outside Aera's analytical decision scope.
- archetype_confidence: 1 — Archetype assignment is weak; scouting activities do not follow deterministic or agentic decision patterns.

Example 3 — Mid-range: "Supplier Identification & Pre-Qualification" (Procure > Strategic Sourcing)
- data_readiness: 2 — Some L4s reference supplier scorecards and qualification metrics, but others are qualitative assessments.
- aera_platform_fit: 1 — Aligns with Decision & Action pillar broadly but no single Aera capability directly addresses supplier pre-qualification workflows.
- archetype_confidence: 2 — Moderate DETERMINISTIC support: qualification criteria are rule-based but initial identification phase is less structured.

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the opportunity.
- HIGH: You have clear, specific evidence from the L4 data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions — sparse L4 data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set. If you find yourself rating everything HIGH, you are likely not being critical enough about your evidence quality.

CONSTRAINTS:
- Do NOT score platform_fit >= 2 based on generic keyword overlap alone. Cite specific Aera capabilities.
- Do NOT assume all supply chain problems fit Aera. Score 0 for platform_fit if the opportunity requires capabilities outside Aera's scope (see "not for" entries in the knowledge context).
- Do NOT give identical scores to all sub-dimensions. If data_readiness is 3, that does not automatically mean platform_fit is also 3.
- When uncertain between two score levels, always choose the lower score. It is better to under-estimate feasibility than to over-promise.
- If the opportunity has zero L4 activities, score all dimensions 0 with reason "No L4 activities to evaluate."

${emphasis}

Return your assessment as a JSON object with this exact structure:
{
  "data_readiness": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "aera_platform_fit": { "score": <0-3>, "reason": "<1-2 sentences citing specific Aera capabilities>" },
  "archetype_confidence": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

  // Build L4 summary based on count
  let l4Summary: string;
  if (l4s.length > 8) {
    // Compact format for large L4 sets — include truncated description
    l4Summary = l4s
      .map((l4) => {
        const desc = l4.description
          ? l4.description.length > 80
            ? l4.description.slice(0, 80) + "..."
            : l4.description
          : "";
        return `- ${l4.name}${desc ? ": " + desc : ""} | ai_suitability=${l4.ai_suitability ?? "N/A"} | decision_exists=${l4.decision_exists}`;
      })
      .join("\n");
  } else {
    // Full format with descriptions
    l4Summary = l4s
      .map((l4) => {
        const desc = l4.description.length > 200
          ? l4.description.slice(0, 200) + "..."
          : l4.description;
        return `- ${l4.name}: ${desc}\n  ai_suitability=${l4.ai_suitability ?? "N/A"} | decision_exists=${l4.decision_exists}`;
      })
      .join("\n");
  }

  const userMessage = `Score this opportunity for Technical Feasibility:

Opportunity: ${opp.l3_name}
Summary: ${opp.opportunity_summary ?? "N/A"}
Lead Archetype: ${opp.lead_archetype ?? "UNKNOWN"}
L4 Activity Count: ${l4s.length}

L4 Activities:
${l4Summary}`;

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}
