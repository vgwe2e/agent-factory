/**
 * Mock test generator with retry logic.
 *
 * Calls Ollama to generate YAML for a mock decision test,
 * validates against MockTestSchema, retries up to 3 times
 * on parse/validation failure with error context.
 */

import { MockTestSchema, parseAndValidateYaml } from "../schemas.js";
import { buildMockTestPrompt } from "../prompts/mock-test.js";
import type { SimulationInput } from "../../types/simulation.js";
import type { MockTest } from "../../types/simulation.js";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen3:30b";
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;

type MockTestResult =
  | { success: true; data: { mockTest: MockTest; attempts: number } }
  | { success: false; error: string };

/**
 * Generate a validated mock decision test YAML via Ollama.
 *
 * Retries up to 3 times on YAML parse or Zod validation failure,
 * including the validation error in the retry prompt for self-correction.
 */
export async function generateMockTest(
  input: SimulationInput,
  ollamaUrl: string = DEFAULT_OLLAMA_URL,
): Promise<MockTestResult> {
  const baseMessages = buildMockTestPrompt(input);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Build messages with retry context if not first attempt
    const messages = attempt === 1
      ? baseMessages
      : [
          ...baseMessages,
          {
            role: "user",
            content: `Your previous YAML output had a validation error: ${errors[errors.length - 1]}\n\nPlease fix and output valid YAML only.`,
          },
        ];

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
          options: { temperature: TEMPERATURE },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        errors.push(`Ollama HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      const data = (await response.json()) as { message: { content: string } };
      const raw = data.message.content;

      const validated = await parseAndValidateYaml(raw, MockTestSchema);
      if (validated.success) {
        return {
          success: true,
          data: { mockTest: validated.data, attempts: attempt },
        };
      }

      errors.push(validated.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
    }
  }

  return {
    success: false,
    error: `Mock test generation failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
  };
}
