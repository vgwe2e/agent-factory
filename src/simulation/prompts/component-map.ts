/**
 * Prompt builder for YAML component maps.
 *
 * Constructs system + user messages for the Ollama 32B model to generate
 * a YAML component map mapping an opportunity to Aera platform components.
 * Includes PB node names, UI component names, and integration patterns
 * as a reference glossary for the LLM.
 */

import type { SimulationInput } from "../../types/simulation.js";

/**
 * Build a chat message array for generating a YAML component map.
 *
 * @param input - Simulation context
 * @param pbNodeNames - All 22 Process Builder node names
 * @param uiComponentNames - All 21 UI component names
 * @param integrationPatternNames - Integration pattern names
 * @returns Array of {role, content} messages for Ollama chat API
 */
export function buildComponentMapPrompt(
  input: SimulationInput,
  pbNodeNames: string[],
  uiComponentNames: string[],
  integrationPatternNames: string[],
): Array<{ role: string; content: string }> {
  const systemPrompt = `You are an Aera platform solutions engineer mapping opportunities to Aera components.

Generate a YAML component map following these rules:
- Output valid YAML format (no code fences)
- Include exactly 5 sections: streams, cortex, process_builder, agent_teams, ui
- For each component entry include: name, purpose, and confidence (confirmed or inferred)
- Drill down to specific components and properties
- List components only (no counts or sizing)
- Set confidence to "confirmed" for components you are certain exist in Aera
- Set confidence to "inferred" for components you believe would be needed but cannot confirm

Component Reference Glossary:

Process Builder Nodes (22): ${pbNodeNames.join(", ")}

UI Components (21): ${uiComponentNames.join(", ")}

${integrationPatternNames.length > 0 ? `Integration Patterns: ${integrationPatternNames.join(", ")}` : ""}

Use these exact names when referencing known components. If a component is needed but not in the glossary, use a descriptive name and set confidence to "inferred".`;

  const l4Activities = input.l4s
    .map((l4) => {
      const parts = [`- ${l4.name}`];
      if (l4.decision_articulation) parts.push(`  Decision: ${l4.decision_articulation}`);
      if (l4.description) parts.push(`  Description: ${l4.description}`);
      return parts.join("\n");
    })
    .join("\n");

  const userPrompt = `Map the following opportunity to Aera platform components:

Opportunity: ${input.opportunity.l3_name}
Summary: ${input.opportunity.opportunity_summary ?? input.opportunity.rationale ?? "No summary"}
Archetype: ${input.archetype}
Orchestration Route: ${input.archetypeRoute}
Composite Score: ${input.composite}

L4 Activities:
${l4Activities || "None specified"}

Output only the YAML content with the 5 sections (streams, cortex, process_builder, agent_teams, ui).`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
