/**
 * Prompt builder for Mermaid decision flow diagrams.
 *
 * Constructs system + user messages for the Ollama 32B model to generate
 * a Mermaid flowchart showing the decision flow for an Aera opportunity.
 * Includes PB node names, orchestration route, and L4 decision articulations.
 */
import { getSimulationPromptContext } from "../prompt-context.js";
/**
 * Build a chat message array for generating a Mermaid decision flow diagram.
 *
 * @param input - Simulation context (opportunity, L4s, archetype, route)
 * @param pbNodeNames - All 22 Process Builder node names for reference
 * @param workflowPatterns - Workflow pattern names for reference
 * @returns Array of {role, content} messages for Ollama chat API
 */
export function buildDecisionFlowPrompt(input, pbNodeNames, workflowPatterns) {
    const { subjectName, subjectSummary, implementationComplexity } = getSimulationPromptContext(input);
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
    const decisionArticulations = input.l4s
        .filter((l4) => l4.decision_articulation !== null && l4.decision_articulation !== undefined)
        .map((l4) => `- ${l4.name}: ${l4.decision_articulation}`);
    const l4Section = decisionArticulations.length > 0
        ? `L4 Decision Articulations:\n${decisionArticulations.join("\n")}`
        : "No L4 decision articulations available -- infer decision points from the opportunity summary above.";
    const userPrompt = `Generate a Mermaid decision flow diagram for:

Opportunity: ${subjectName}
Summary: ${subjectSummary}
Archetype: ${input.archetype}
Orchestration Route: ${input.archetypeRoute}
Complexity: ${implementationComplexity}
Composite Score: ${input.composite}

${l4Section}

Output only the Mermaid flowchart content, starting with "flowchart TD".`;
    return [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];
}
