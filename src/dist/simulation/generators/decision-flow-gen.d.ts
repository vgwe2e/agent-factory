/**
 * Decision flow diagram generator with retry logic.
 *
 * Calls Ollama 32B to generate a Mermaid flowchart, extracts the diagram
 * from LLM output (stripping code fences), validates structural correctness,
 * and retries with error context on failure.
 */
import type { SimulationInput } from "../../types/simulation.js";
import { type SimulationLlmTarget } from "../llm-client.js";
type DecisionFlowResult = {
    success: true;
    data: {
        mermaid: string;
        attempts: number;
    };
} | {
    success: false;
    error: string;
};
/**
 * Generate a Mermaid decision flow diagram for an opportunity.
 *
 * Flow: build prompt -> call Ollama -> extract Mermaid -> validate -> retry on failure.
 *
 * @param input - Simulation context
 * @param llmTarget - Override simulation backend target (legacy string or backend config)
 * @returns Result with Mermaid string and attempt count, or error
 */
export declare function generateDecisionFlow(input: SimulationInput, llmTarget?: SimulationLlmTarget, signal?: AbortSignal): Promise<DecisionFlowResult>;
export {};
