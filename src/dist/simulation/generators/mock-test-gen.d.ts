/**
 * Mock test generator with retry logic.
 *
 * Calls Ollama to generate YAML for a mock decision test,
 * validates against MockTestSchema, retries up to 3 times
 * on parse/validation failure with error context.
 */
import type { SimulationInput } from "../../types/simulation.js";
import type { MockTest } from "../../types/simulation.js";
import { type SimulationLlmTarget } from "../llm-client.js";
type MockTestResult = {
    success: true;
    data: {
        mockTest: MockTest;
        attempts: number;
    };
} | {
    success: false;
    error: string;
};
/**
 * Generate a validated mock decision test YAML via Ollama.
 *
 * Retries up to 3 times on YAML parse or Zod validation failure,
 * including the validation error in the retry prompt for self-correction.
 */
export declare function generateMockTest(input: SimulationInput, llmTarget?: SimulationLlmTarget, signal?: AbortSignal): Promise<MockTestResult>;
export {};
