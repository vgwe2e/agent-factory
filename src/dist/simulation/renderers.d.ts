import type { ScenarioSpec, SimulationArtifacts, SimulationInput } from "../types/simulation.js";
import { type ValidationResult } from "./validators/knowledge-validator.js";
export interface RenderedScenarioArtifacts {
    artifacts: SimulationArtifacts;
    validation: ValidationResult[];
    mermaidValid: boolean;
}
export declare function renderScenarioArtifacts(input: SimulationInput, scenarioSpec: ScenarioSpec, knowledgeIndex: Map<string, string>): RenderedScenarioArtifacts;
