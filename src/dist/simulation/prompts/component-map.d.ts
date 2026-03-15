/**
 * Prompt builder for YAML component maps.
 *
 * Constructs system + user messages for the Ollama 32B model to generate
 * a YAML component map mapping an opportunity to Aera platform components.
 * Includes PB node names, UI component names, integration patterns, and
 * platform capability names as a reference glossary for the LLM.
 *
 * @version 2.0 — 2026-03-12
 * @changelog
 * - v2.0: Added capabilitiesContext parameter (SIM-01) so Cortex capabilities
 *   are included in the glossary instead of being hallucinated.
 * - v1.0: Initial implementation with PB nodes, UI components, and integration patterns.
 */
import type { SimulationInput } from "../../types/simulation.js";
/**
 * Build a chat message array for generating a YAML component map.
 *
 * @param input - Simulation context
 * @param pbNodeNames - All 22 Process Builder node names
 * @param uiComponentNames - All 21 UI component names
 * @param integrationPatternNames - Integration pattern names
 * @param capabilitiesContext - Optional enriched platform capabilities context string
 * @returns Array of {role, content} messages for Ollama chat API
 */
export declare function buildComponentMapPrompt(input: SimulationInput, pbNodeNames: string[], uiComponentNames: string[], integrationPatternNames: string[], capabilitiesContext?: string): Array<{
    role: string;
    content: string;
}>;
