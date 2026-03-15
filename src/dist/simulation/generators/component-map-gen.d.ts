/**
 * Component map generator with retry and KNOW-04 knowledge validation.
 *
 * Calls Ollama 32B to generate a YAML component map, parses with js-yaml,
 * validates with Zod schema, then enforces KNOW-04 by checking each component
 * reference against the knowledge base index. Retries on parse/schema failures
 * but NOT on knowledge validation (inferred is acceptable).
 */
import type { SimulationInput } from "../../types/simulation.js";
import type { ComponentMap } from "../../types/simulation.js";
import type { ValidationResult } from "../validators/knowledge-validator.js";
import { type SimulationLlmTarget } from "../llm-client.js";
type ComponentMapResult = {
    success: true;
    data: {
        componentMap: ComponentMap;
        validation: ValidationResult[];
        attempts: number;
    };
} | {
    success: false;
    error: string;
};
/**
 * Generate a component map for an opportunity with KNOW-04 enforcement.
 *
 * Flow: build prompt -> call Ollama -> extract YAML -> parse + validate with Zod ->
 * knowledge-validate each entry (override confidence flags) -> return.
 *
 * Retries on YAML parse or Zod validation failure (up to 3 attempts).
 * Does NOT retry on knowledge validation (inferred is acceptable, not an error).
 *
 * @param input - Simulation context
 * @param knowledgeIndex - Pre-built knowledge base index from buildKnowledgeIndex()
 * @param llmTarget - Override simulation backend target (legacy string or backend config)
 * @returns Result with ComponentMap, validation results, and attempt count
 */
export declare function generateComponentMap(input: SimulationInput, knowledgeIndex: Map<string, string>, llmTarget?: SimulationLlmTarget, signal?: AbortSignal): Promise<ComponentMapResult>;
export {};
