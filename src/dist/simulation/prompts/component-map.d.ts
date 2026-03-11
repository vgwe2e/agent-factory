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
export declare function buildComponentMapPrompt(input: SimulationInput, pbNodeNames: string[], uiComponentNames: string[], integrationPatternNames: string[]): Array<{
    role: string;
    content: string;
}>;
