/**
 * Prompt builder for Mermaid decision flow diagrams.
 *
 * Constructs system + user messages for the Ollama 32B model to generate
 * a Mermaid flowchart showing the decision flow for an Aera opportunity.
 * Includes PB node names, orchestration route, and L4 decision articulations.
 */

import type { SimulationInput } from "../../types/simulation.js";

/**
 * Build a chat message array for generating a Mermaid decision flow diagram.
 *
 * @param input - Simulation context (opportunity, L4s, archetype, route)
 * @param pbNodeNames - All 22 Process Builder node names for reference
 * @param workflowPatterns - Workflow pattern names for reference
 * @returns Array of {role, content} messages for Ollama chat API
 */
export function buildDecisionFlowPrompt(
  input: SimulationInput,
  pbNodeNames: string[],
  workflowPatterns: string[],
): Array<{ role: string; content: string }> {
  const systemPrompt = `You are an Aera platform solutions engineer generating decision flow diagrams.

Generate a Mermaid flowchart following these rules:
- Start with "flowchart TD"
- Use --> for all connections
- Use Aera component labels: PB: <node>, Cortex: <capability>, UI: <component>
- Include a happy path plus 2-3 decision branches
- Scope from trigger event to terminal outcome
- Capitalize "End" (never lowercase "end")
- Do NOT wrap output in code fences

Available Process Builder nodes: ${pbNodeNames.join(", ")}
${workflowPatterns.length > 0 ? `Available workflow patterns: ${workflowPatterns.join(", ")}` : ""}

The diagram should represent how Aera would orchestrate the decision flow for the given opportunity using the "${input.archetypeRoute}" orchestration route.`;

  const summary = input.opportunity.opportunity_summary
    ?? input.opportunity.decision_articulation
    ?? "No summary available";

  const decisionArticulations = input.l4s
    .filter((l4) => l4.decision_articulation !== null && l4.decision_articulation !== undefined)
    .map((l4) => `- ${l4.l4_name}: ${l4.decision_articulation}`);

  const l4Section = decisionArticulations.length > 0
    ? `L4 Decision Articulations:\n${decisionArticulations.join("\n")}`
    : "No L4 decision articulations available -- infer decision points from the opportunity summary above.";

  const userPrompt = `Generate a Mermaid decision flow diagram for:

Opportunity: ${input.opportunity.l3_name}
Summary: ${summary}
Archetype: ${input.archetype}
Orchestration Route: ${input.archetypeRoute}
Complexity: ${input.opportunity.implementation_complexity ?? "MEDIUM"}
Composite Score: ${input.composite}

${l4Section}

Output only the Mermaid flowchart content, starting with "flowchart TD".`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
