import type { SimulationInput } from "../../types/simulation.js";
import { getSimulationPromptContext } from "../prompt-context.js";

/**
 * Build prompt messages for generating one compact scenario spec per opportunity.
 *
 * The spec is intentionally smaller than the old four-artifact design so the
 * pipeline can derive downstream files deterministically in-process.
 */
export function buildScenarioSpecPrompt(
  input: SimulationInput,
  pbNodeNames: string[],
  uiComponentNames: string[],
  integrationPatternNames: string[],
  capabilitiesContext?: string,
  outputFormat: "yaml" | "json" = "yaml",
): Array<{ role: string; content: string }> {
  const { subjectName, subjectSummary, implementationComplexity } = getSimulationPromptContext(input);
  const enterpriseApps = input.companyContext.enterprise_applications.length > 0
    ? input.companyContext.enterprise_applications.map((app) => `- ${app}`).join("\n")
    : "- No enterprise applications listed";

  const l4Details = input.l4s
    .map((l4) => {
      const parts = [`- ${l4.name}`];
      if (l4.decision_articulation) parts.push(`  Decision: ${l4.decision_articulation}`);
      if (l4.description) parts.push(`  Description: ${l4.description}`);
      return parts.join("\n");
    })
    .join("\n");

  const formatLabel = outputFormat.toUpperCase();
  const systemPrompt = `You are an Aera platform solutions engineer producing a compact scenario spec.

Output ${formatLabel} only. Do not use code fences.

The YAML must contain exactly these top-level fields:
- objective
- trigger
- decision
- expected_action
- expected_outcome
- rationale
- source_systems
- key_inputs
- happy_path
- branches

Schema guidance:
- source_systems: array of { name, type?, status } where status is identified or tbd
- key_inputs: array of { name, source, purpose, preferred_stream_type? }
- happy_path: 4-6 concise steps, each { step, stage, component, purpose }
- stage must be one of: ingest, analyze, decide, act, review, notify, surface
- branches: 0-3 concise entries, each { condition, response, outcome }
- For optional nested fields, include null when the value is unknown instead of omitting the key

Design rules:
- Use exact known Aera names when possible for component values
- Prefer concise, reusable components over bespoke ones
- Keep the happy path linear and practical
- Branches should capture alternative outcomes at the main decision point
- Favor Process Builder and Cortex for route "${input.archetypeRoute}"
- Only mark source systems as identified when they are grounded in the enterprise applications list

Known Process Builder nodes:
${pbNodeNames.join(", ")}

Known UI components:
${uiComponentNames.join(", ")}

${integrationPatternNames.length > 0 ? `Reference integration patterns: ${integrationPatternNames.join(", ")}` : ""}
${capabilitiesContext ? `\nPlatform capabilities reference:\n${capabilitiesContext}` : ""}`;

  const userPrompt = `Generate a compact scenario spec for:

Opportunity: ${subjectName}
Summary: ${subjectSummary}
Archetype: ${input.archetype}
Primary Route: ${input.archetypeRoute}
Composite Score: ${input.composite}
Implementation Complexity: ${implementationComplexity}

Enterprise Applications:
${enterpriseApps}

L4 Activities:
${l4Details || "None specified"}

Return ${formatLabel} only.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
