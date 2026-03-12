/**
 * Adoption Realism lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: decision_density, financial_gravity, impact_proximity, confidence_signal
 *
 * @version 2.0 — 2026-03-12
 * @changelog
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, tightened rubrics.
 *   decision_density rubric redesigned to assess decision QUALITY not just presence.
 * - v1.0: Initial implementation with basic rubrics.
 */

import type { L3Opportunity, L4Activity, LeadArchetype } from "../../types/hierarchy.js";

// -- Archetype-specific emphasis --

const ARCHETYPE_EMPHASIS: Record<LeadArchetype, string> = {
  DETERMINISTIC:
    "This is a DETERMINISTIC archetype opportunity. Weight 'decision_density' highest. " +
    "Deterministic skills automate clear decisions -- high decision density is critical for adoption. " +
    "Look for L4s with decision_exists=true and clear decision_articulation.",
  AGENTIC:
    "This is an AGENTIC archetype opportunity. Weight 'confidence_signal' highest. " +
    "Agentic skills require trust from users -- high rating confidence signals organizational readiness. " +
    "Look for L4s with HIGH rating_confidence and clear value propositions.",
  GENERATIVE:
    "This is a GENERATIVE archetype opportunity. Weight 'impact_proximity' highest. " +
    "Generative skills must demonstrate visible value quickly -- FIRST-order impact drives adoption. " +
    "Look for L4s with FIRST impact_order and measurable outcomes.",
};

const DEFAULT_EMPHASIS =
  "The archetype is unknown. Evaluate all four dimensions equally without bias toward any particular pattern.";

// -- Types --

interface ChatMessage {
  role: string;
  content: string;
}

// -- Public API --

/**
 * Build the Adoption Realism lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export function buildAdoptionPrompt(
  opp: L3Opportunity,
  l4s: L4Activity[],
  archetypeHint: LeadArchetype | null,
): ChatMessage[] {
  const emphasis = archetypeHint
    ? ARCHETYPE_EMPHASIS[archetypeHint]
    : DEFAULT_EMPHASIS;

  const systemMessage = `You are an Aera platform adoption realism assessor. Your task is to evaluate how likely an opportunity is to be adopted by real users in production. You are scoring opportunities within a large enterprise portfolio. Scores should discriminate meaningfully: a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria.

Score each dimension as an integer from 0 to 3:

**decision_density:**
- 0 = No automated decisions identified; no L4 activities have decision_exists=true
- 1 = Decisions exist but lack articulation: decision_exists=true but decision_articulation is missing, vague, or generic for >50% of L4s. Decisions are named but not operationally defined.
- 2 = Decisions are articulated with measurable triggers: majority of L4s have specific decision_articulation text that names a trigger condition, threshold, or business rule. However, decision flows may overlap or have unclear sequencing.
- 3 = Decisions are fully articulated with clear trigger-action-outcome chains: >75% of L4s have specific, non-overlapping decision_articulation with quantifiable thresholds. Decision flows compose into a coherent end-to-end automation sequence.

**financial_gravity:**
- 0 = All LOW financial ratings; no financial urgency to adopt
- 1 = Mixed ratings with majority LOW; weak financial case
- 2 = Majority MEDIUM or mix of HIGH/MEDIUM; reasonable financial case
- 3 = Majority HIGH financial ratings with FIRST-order impact; strong financial urgency

**impact_proximity:**
- 0 = Only SECOND-order impact; benefits require multi-step causal chains to realize
- 1 = Mostly SECOND-order with some FIRST-order signals; value realization > 6 months
- 2 = Mix of FIRST and SECOND-order impact; some KPIs improve within 3-6 months
- 3 = FIRST-order impact on measurable KPIs; value visible within 90 days of deployment

**confidence_signal:**
- 0 = Majority LOW rating_confidence; high uncertainty in assessments
- 1 = Mixed confidence with many LOW signals
- 2 = Majority MEDIUM confidence; reasonable certainty
- 3 = Majority HIGH rating_confidence; strong certainty in assessments

WORKED EXAMPLES (for calibration):

Example 1 — Strong adoption: "Capacity Planning & Optimization" (Plan > Production Planning)
- decision_density: 3 — L4s have specific decision_articulation with quantifiable triggers (e.g., capacity utilization thresholds, constraint violation rules) composing into a coherent planning sequence.
- financial_gravity: 3 — Majority HIGH financial ratings with FIRST-order impact on production throughput.
- impact_proximity: 3 — Capacity decisions directly affect production scheduling; value visible within weeks.
- confidence_signal: 2 — Most L4s have MEDIUM rating_confidence; some uncertainty in constraint modeling.

Example 2 — Weak adoption: "Technology & Innovation Scouting" (Procure > Commodity Management)
- decision_density: 1 — L4s have decision_exists=true but decision_articulation is vague (e.g., "evaluate new technologies") with no specific triggers or thresholds.
- financial_gravity: 1 — Mixed financial ratings, mostly LOW; innovation scouting has indirect financial impact.
- impact_proximity: 0 — Only SECOND-order impact; benefits require multi-year technology adoption cycles.
- confidence_signal: 1 — Mixed confidence with several LOW signals; assessments are speculative.

Example 3 — Mid-range: "Paint Material Management" (Make > Paint Operations)
- decision_density: 2 — L4s have specific decision_articulation about material thresholds and quality checks, but some overlap in exception handling flows.
- financial_gravity: 2 — Mix of HIGH and MEDIUM financial ratings; material costs are significant but not dominant.
- impact_proximity: 2 — Some FIRST-order impact on material waste reduction; other benefits are SECOND-order process improvements.
- confidence_signal: 2 — Majority MEDIUM confidence; paint operations are well-understood but data integration is uncertain.

CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the opportunity.
- HIGH: You have clear, specific evidence from the L4 data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions — sparse L4 data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set. If you find yourself rating everything HIGH, you are likely not being critical enough about your evidence quality.

CONSTRAINTS:
- Do NOT score decision_density based solely on decision_exists=true counts. Evaluate the quality and specificity of decision_articulation text.
- Do NOT default to 3 on any sub-dimension without specific evidence. If >50% of L4s lack detailed decision_articulation, decision_density cannot be 3.
- Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score — they measure different things.
- If fewer than 3 L4 activities are present, flag confidence as LOW in all reason fields.
- If L4 signals are contradictory (e.g., decision_exists=true but decision_articulation is N/A for >50% of L4s), note the conflict and score conservatively.

${emphasis}

Return your assessment as a JSON object with this exact structure:
{
  "decision_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "financial_gravity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "impact_proximity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence_signal": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

  const l4Summary = l4s
    .map((l4) => {
      const articulation = l4.decision_articulation
        ? l4.decision_articulation.length > 150
          ? l4.decision_articulation.slice(0, 150) + "..."
          : l4.decision_articulation
        : "N/A";
      return `- ${l4.name} | decision_exists=${l4.decision_exists} | financial_rating=${l4.financial_rating} | impact_order=${l4.impact_order} | rating_confidence=${l4.rating_confidence} | decision_articulation: ${articulation}`;
    })
    .join("\n");

  const userMessage = `Score this opportunity for Adoption Realism:

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
