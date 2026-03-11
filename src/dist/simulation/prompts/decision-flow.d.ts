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
export declare function buildDecisionFlowPrompt(input: SimulationInput, pbNodeNames: string[], workflowPatterns: string[]): Array<{
    role: string;
    content: string;
}>;
