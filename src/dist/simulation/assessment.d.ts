import type { IntegrationSurface, MockTest, ScenarioSpec, SimulationAssessment, SimulationFilterVerdict } from "../types/simulation.js";
interface AssessmentInput {
    scenarioSpec?: ScenarioSpec;
    mockTest: MockTest;
    integrationSurface: IntegrationSurface;
    confirmedCount: number;
    inferredCount: number;
    mermaidValid: boolean;
}
export declare function assessSimulation({ scenarioSpec, mockTest, integrationSurface, confirmedCount, inferredCount, mermaidValid, }: AssessmentInput): SimulationAssessment;
export declare function countAssessmentVerdicts(assessments: Array<SimulationAssessment | undefined>): Record<SimulationFilterVerdict, number>;
export {};
