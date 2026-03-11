/**
 * Prompt builder for integration surface YAML generation.
 *
 * Constructs LLM messages that produce a structural integration surface
 * mapping source systems from enterprise_applications, Aera ingestion
 * streams, processing components, and UI surfaces.
 */
/**
 * Build prompt messages for generating an integration surface YAML.
 *
 * Maps enterprise_applications to source systems, instructs TBD marking
 * for unmatched sources, and provides integration pattern names as reference.
 * Structural connections only -- no timing or freshness estimates.
 */
export function buildIntegrationSurfacePrompt(input, integrationPatternNames = []) {
    const { opportunity, l4s, companyContext } = input;
    const enterpriseApps = companyContext.enterprise_applications.length > 0
        ? companyContext.enterprise_applications.map((app) => `- ${app}`).join("\n")
        : "- No enterprise applications listed";
    const l4Names = l4s.map((l4) => `- ${l4.name}`).join("\n");
    const patternRef = integrationPatternNames.length > 0
        ? `\nReference integration patterns: ${integrationPatternNames.join(", ")}`
        : "";
    const systemPrompt = `You are an Aera platform solutions engineer mapping integration surfaces.

Rules:
- Output YAML format only
- The YAML must have exactly 4 top-level sections: source_systems, aera_ingestion, processing, ui_surface
- source_systems: array of objects with name (string), type (string, optional), status ("identified" or "tbd")
- aera_ingestion: array of objects with stream_name (string), stream_type (string, optional), source (string)
- processing: array of objects with component (string), type (string), function (string)
- ui_surface: array of objects with component (string), screen (string, optional), purpose (string)
- Map source systems from the enterprise_applications list provided below
- For any source system not in the enterprise_applications list, mark status as "tbd" with a note
- Map to Aera Stream types where identifiable (Event Stream, Reference Stream, etc.)
- Structural connections only -- do not estimate timing, freshness, or latency
- Do not wrap output in code fences. Output YAML only.`;
    const userPrompt = `Generate an integration surface for the following opportunity:

Opportunity: ${opportunity.opportunity_name ?? opportunity.l3_name}
Summary: ${opportunity.opportunity_summary ?? "N/A"}
Archetype: ${input.archetype}
Route: ${input.archetypeRoute}

Enterprise Applications (known source systems):
${enterpriseApps}

L4 Activities:
${l4Names}
${patternRef}

Generate YAML mapping the integration surface.`;
    return [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];
}
