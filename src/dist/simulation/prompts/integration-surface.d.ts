/**
 * Prompt builder for integration surface YAML generation.
 *
 * Constructs LLM messages that produce a structural integration surface
 * mapping source systems from enterprise_applications, Aera ingestion
 * streams, processing components, and UI surfaces.
 */
import type { SimulationInput } from "../../types/simulation.js";
/**
 * Build prompt messages for generating an integration surface YAML.
 *
 * Maps enterprise_applications to source systems, instructs TBD marking
 * for unmatched sources, and provides integration pattern names as reference.
 * Structural connections only -- no timing or freshness estimates.
 */
export declare function buildIntegrationSurfacePrompt(input: SimulationInput, integrationPatternNames?: string[]): Array<{
    role: string;
    content: string;
}>;
