/**
 * Technical Feasibility lens prompt builder.
 *
 * Pure function: takes typed inputs, returns system + user message pair.
 * No I/O inside -- prompt construction only.
 *
 * Sub-dimensions: data_readiness, aera_platform_fit, archetype_confidence
 */
// -- Archetype-specific emphasis --
const ARCHETYPE_EMPHASIS = {
    DETERMINISTIC: "This is a DETERMINISTIC archetype opportunity. Weight 'aera_platform_fit' toward Process Builder capabilities. " +
        "Look for clear rule-based decision flows that map to PB nodes (If, Data View, Transaction). " +
        "Strong PB fit with clear automation paths should score highest.",
    AGENTIC: "This is an AGENTIC archetype opportunity. Weight 'archetype_confidence' toward agent team patterns. " +
        "Look for multi-step decision support workflows that benefit from AI-assisted reasoning. " +
        "Strong agent orchestration patterns with clear human-in-the-loop should score highest.",
    GENERATIVE: "This is a GENERATIVE archetype opportunity. Weight 'data_readiness' highest. " +
        "Look for rich structured data sources that can fuel content/insight generation. " +
        "Strong data availability with clear generation use cases should score highest.",
};
const DEFAULT_EMPHASIS = "The archetype is unknown. Evaluate all three dimensions equally without bias toward any particular pattern.";
// -- Public API --
/**
 * Build the Technical Feasibility lens prompt.
 *
 * @param opp - The L3 opportunity being scored
 * @param l4s - Constituent L4 activities for this opportunity
 * @param knowledgeContext - Pre-formatted string of Aera component summaries and PB node summaries
 * @param archetypeHint - Resolved archetype (may differ from opp.lead_archetype if inferred)
 */
export function buildTechnicalPrompt(opp, l4s, knowledgeContext, archetypeHint) {
    const emphasis = archetypeHint
        ? ARCHETYPE_EMPHASIS[archetypeHint]
        : DEFAULT_EMPHASIS;
    const systemMessage = `You are an Aera platform technical feasibility assessor. Your task is to evaluate an opportunity for implementation on the Aera Decision Intelligence platform.

Score each dimension as an integer from 0 to 3:

**data_readiness:**
- 0 = No structured data signals; L4 activities lack measurable inputs or data references
- 1 = Sparse data signals; few L4s reference structured data or metrics
- 2 = Moderate data signals; multiple L4s reference structured data with some decision points
- 3 = Rich structured data with clear decision points; majority of L4s have quantifiable inputs

**aera_platform_fit:**
- 0 = No matching Aera components; opportunity has no clear mapping to UI components or PB nodes
- 1 = Weak fit; only basic components applicable (labels, paragraphs)
- 2 = Moderate fit; several relevant components and PB nodes identified
- 3 = Multiple matching components with clear implementation path; strong alignment with Aera capabilities

**archetype_confidence:**
- 0 = Archetype unclear or mismatched; L4 patterns do not support the assigned archetype
- 1 = Weak archetype support; few L4s align with the archetype pattern
- 2 = Moderate archetype support; majority of L4s show patterns consistent with the archetype
- 3 = Archetype strongly supported by L4 patterns; clear and consistent alignment

${emphasis}

Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: data_readiness, aera_platform_fit, archetype_confidence.

Available Aera platform knowledge:
${knowledgeContext}`;
    // Build L4 summary based on count
    let l4Summary;
    if (l4s.length > 8) {
        // Compact format for large L4 sets
        l4Summary = l4s
            .map((l4) => `- ${l4.name} | financial_rating=${l4.financial_rating} | decision_exists=${l4.decision_exists} | ai_suitability=${l4.ai_suitability ?? "N/A"} | rating_confidence=${l4.rating_confidence}`)
            .join("\n");
    }
    else {
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
