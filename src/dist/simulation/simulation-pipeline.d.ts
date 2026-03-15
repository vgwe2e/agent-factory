/**
 * Simulation pipeline orchestrator.
 *
 * Wires all four generators (decision flow, component map, mock test,
 * integration surface) into a sequential pipeline that processes
 * promoted opportunities by composite score descending.
 *
 * Writes output files to evaluation/simulations/<slug>/ with:
 *   - decision-flow.mmd (Mermaid diagram)
 *   - component-map.yaml (YAML)
 *   - mock-test.yaml (YAML)
 *   - integration-surface.yaml (YAML)
 *
 * Handles partial failures: if one generator fails, the others
 * still produce output. Knowledge index is built once and reused
 * across all opportunities.
 */
import type { SimulationInput, SimulationResult, ScenarioSpec } from "../types/simulation.js";
import type { SimulationLlmTarget } from "./llm-client.js";
export interface SimulationPipelineResult {
    results: SimulationResult[];
    totalSimulated: number;
    totalFailed: number;
    totalConfirmed: number;
    totalInferred: number;
}
/** Dependency injection interface for testing. */
export interface PipelineDeps {
    generateScenarioSpec: (input: SimulationInput, llmTarget?: SimulationLlmTarget, signal?: AbortSignal) => Promise<{
        success: true;
        data: {
            scenarioSpec: ScenarioSpec;
            attempts: number;
        };
    } | {
        success: false;
        error: string;
    }>;
    buildKnowledgeIndex: () => Map<string, string>;
}
/** Options for simulation pipeline behavior. */
export interface SimulationPipelineOptions {
    /** Per-opportunity timeout in milliseconds. When set, each opportunity's
     *  4-generator sequence is wrapped in withTimeout. When omitted,
     *  simulations run unbounded (current behavior preserved). */
    timeoutMs?: number;
}
/**
 * Run the simulation pipeline for a set of promoted opportunities.
 *
 * @param inputs - Pre-filtered SimulationInput array (composite >= 0.60)
 * @param outputDir - Root directory for output files (e.g., evaluation/simulations)
 * @param llmTarget - Optional simulation backend config or legacy Ollama URL override
 * @param deps - Optional dependency injection for testing
 * @param options - Optional pipeline options (e.g., timeoutMs)
 */
export declare function runSimulationPipeline(inputs: SimulationInput[], outputDir: string, llmTarget?: SimulationLlmTarget, deps?: PipelineDeps, options?: SimulationPipelineOptions): Promise<SimulationPipelineResult>;
