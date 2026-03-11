/**
 * Prompt builder for mock decision test YAML generation.
 *
 * Constructs LLM messages that produce a single happy-path mock test
 * grounded in actual client financials and decision_articulation text.
 */
import type { SimulationInput } from "../../types/simulation.js";
/**
 * Build prompt messages for generating a mock decision test YAML.
 *
 * Uses decision_articulation from the first L4 that has one.
 * Falls back to generating from opportunity summary if none available.
 * Includes company financials for realistic test input grounding.
 */
export declare function buildMockTestPrompt(input: SimulationInput): Array<{
    role: string;
    content: string;
}>;
