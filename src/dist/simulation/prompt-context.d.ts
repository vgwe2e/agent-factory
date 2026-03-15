import type { SimulationInput } from "../types/simulation.js";
export interface SimulationPromptContext {
    subjectName: string;
    subjectSummary: string;
    implementationComplexity: string;
}
export declare function getSimulationPromptContext(input: SimulationInput): SimulationPromptContext;
