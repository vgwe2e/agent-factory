/**
 * Single-call scenario spec generator.
 *
 * Produces a compact canonical spec that downstream renderers expand into the
 * existing artifact files. This replaces the old four-generation bottleneck.
 */
import type { ScenarioSpec, SimulationInput } from "../../types/simulation.js";
import { type SimulationLlmTarget } from "../llm-client.js";
export type ScenarioSpecResult = {
    success: true;
    data: {
        scenarioSpec: ScenarioSpec;
        attempts: number;
    };
} | {
    success: false;
    error: string;
};
export declare function generateScenarioSpec(input: SimulationInput, llmTarget?: SimulationLlmTarget, signal?: AbortSignal): Promise<ScenarioSpecResult>;
