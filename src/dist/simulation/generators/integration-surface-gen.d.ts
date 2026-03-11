/**
 * Integration surface generator with retry logic.
 *
 * Calls Ollama to generate YAML for an integration surface,
 * validates against IntegrationSurfaceSchema, retries up to 3 times
 * on parse/validation failure with error context.
 */
import type { SimulationInput } from "../../types/simulation.js";
import type { IntegrationSurface } from "../../types/simulation.js";
type IntegrationSurfaceResult = {
    success: true;
    data: {
        integrationSurface: IntegrationSurface;
        attempts: number;
    };
} | {
    success: false;
    error: string;
};
/**
 * Generate a validated integration surface YAML via Ollama.
 *
 * Retries up to 3 times on YAML parse or Zod validation failure,
 * including the validation error in the retry prompt for self-correction.
 */
export declare function generateIntegrationSurface(input: SimulationInput, ollamaUrl?: string): Promise<IntegrationSurfaceResult>;
export {};
