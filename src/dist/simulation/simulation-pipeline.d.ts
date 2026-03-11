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
import type { SimulationInput, SimulationResult, ComponentMap, MockTest, IntegrationSurface } from "../types/simulation.js";
import type { ValidationResult } from "./validators/knowledge-validator.js";
export interface SimulationPipelineResult {
    results: SimulationResult[];
    totalSimulated: number;
    totalFailed: number;
    totalConfirmed: number;
    totalInferred: number;
}
/** Dependency injection interface for testing. */
export interface PipelineDeps {
    generateDecisionFlow: (input: SimulationInput, ollamaUrl?: string) => Promise<{
        success: true;
        data: {
            mermaid: string;
            attempts: number;
        };
    } | {
        success: false;
        error: string;
    }>;
    generateComponentMap: (input: SimulationInput, knowledgeIndex: Map<string, string>, ollamaUrl?: string) => Promise<{
        success: true;
        data: {
            componentMap: ComponentMap;
            validation: ValidationResult[];
            attempts: number;
        };
    } | {
        success: false;
        error: string;
    }>;
    generateMockTest: (input: SimulationInput, ollamaUrl?: string) => Promise<{
        success: true;
        data: {
            mockTest: MockTest;
            attempts: number;
        };
    } | {
        success: false;
        error: string;
    }>;
    generateIntegrationSurface: (input: SimulationInput, ollamaUrl?: string) => Promise<{
        success: true;
        data: {
            integrationSurface: IntegrationSurface;
            attempts: number;
        };
    } | {
        success: false;
        error: string;
    }>;
    buildKnowledgeIndex: () => Map<string, string>;
}
/**
 * Run the simulation pipeline for a set of promoted opportunities.
 *
 * @param inputs - Pre-filtered SimulationInput array (composite >= 0.60)
 * @param outputDir - Root directory for output files (e.g., evaluation/simulations)
 * @param ollamaUrl - Optional Ollama API URL override
 * @param deps - Optional dependency injection for testing
 */
export declare function runSimulationPipeline(inputs: SimulationInput[], outputDir: string, ollamaUrl?: string, deps?: PipelineDeps): Promise<SimulationPipelineResult>;
