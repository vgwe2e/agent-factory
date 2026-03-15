import type { SimulationInput } from "../../types/simulation.js";
/**
 * Build prompt messages for generating one compact scenario spec per opportunity.
 *
 * The spec is intentionally smaller than the old four-artifact design so the
 * pipeline can derive downstream files deterministically in-process.
 */
export declare function buildScenarioSpecPrompt(input: SimulationInput, pbNodeNames: string[], uiComponentNames: string[], integrationPatternNames: string[], capabilitiesContext?: string, outputFormat?: "yaml" | "json"): Array<{
    role: string;
    content: string;
}>;
