/**
 * Adoption Realism lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: decision_density, financial_gravity, impact_proximity, confidence_signal
 */
// -- Archetype-specific emphasis --
const ARCHETYPE_EMPHASIS = {
    DETERMINISTIC: "This is a DETERMINISTIC archetype opportunity. Weight 'decision_density' highest. " +
        "Deterministic skills automate clear decisions -- high decision density is critical for adoption. " +
        "Look for L4s with decision_exists=true and clear decision_articulation.",
    AGENTIC: "This is an AGENTIC archetype opportunity. Weight 'confidence_signal' highest. " +
        "Agentic skills require trust from users -- high rating confidence signals organizational readiness. " +
        "Look for L4s with HIGH rating_confidence and clear value propositions.",
    GENERATIVE: "This is a GENERATIVE archetype opportunity. Weight 'impact_proximity' highest. " +
        "Generative skills must demonstrate visible value quickly -- FIRST-order impact drives adoption. " +
        "Look for L4s with FIRST impact_order and measurable outcomes.",
};
const DEFAULT_EMPHASIS = "The archetype is unknown. Evaluate all four dimensions equally without bias toward any particular pattern.";
// -- Public API --
/**
 * Build the Adoption Realism lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export function buildAdoptionPrompt(opp, l4s, archetypeHint) {
    const emphasis = archetypeHint
        ? ARCHETYPE_EMPHASIS[archetypeHint]
        : DEFAULT_EMPHASIS;
    const systemMessage = `You are an Aera platform adoption realism assessor. Your task is to evaluate how likely an opportunity is to be adopted by real users in production.

Score each dimension as an integer from 0 to 3:

**decision_density:**
- 0 = No automated decisions identified; no L4 activities have decision_exists=true
- 1 = Low decision density; <25% of L4s have identifiable decisions
- 2 = Moderate decision density; 25-75% of L4s have decision_exists=true
- 3 = High decision density; >75% of L4s have decision_exists=true with clear articulation

**financial_gravity:**
- 0 = All LOW financial ratings; no financial urgency to adopt
- 1 = Mixed ratings with majority LOW; weak financial case
- 2 = Majority MEDIUM or mix of HIGH/MEDIUM; reasonable financial case
- 3 = Majority HIGH financial ratings with FIRST-order impact; strong financial urgency

**impact_proximity:**
- 0 = Only SECOND-order impact; benefits are indirect and hard to measure
- 1 = Mostly SECOND-order with some FIRST-order signals
- 2 = Mix of FIRST and SECOND-order impact with measurable KPIs
- 3 = FIRST-order impact on measurable KPIs; direct, visible business outcomes

**confidence_signal:**
- 0 = Majority LOW rating_confidence; high uncertainty in assessments
- 1 = Mixed confidence with many LOW signals
- 2 = Majority MEDIUM confidence; reasonable certainty
- 3 = Majority HIGH rating_confidence; strong certainty in assessments

${emphasis}

Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: decision_density, financial_gravity, impact_proximity, confidence_signal.`;
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
