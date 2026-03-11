/**
 * Integration surface generator with retry logic.
 *
 * Calls Ollama to generate YAML for an integration surface,
 * validates against IntegrationSurfaceSchema, retries up to 3 times
 * on parse/validation failure with error context.
 */

import { IntegrationSurfaceSchema, parseAndValidateYaml } from "../schemas.js";
import { buildIntegrationSurfacePrompt } from "../prompts/integration-surface.js";
import type { SimulationInput } from "../../types/simulation.js";
import type { IntegrationSurface } from "../../types/simulation.js";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen3:30b";
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 120_000;

type IntegrationSurfaceResult =
  | { success: true; data: { integrationSurface: IntegrationSurface; attempts: number } }
  | { success: false; error: string };

/**
 * Generate a validated integration surface YAML via Ollama.
 *
 * Retries up to 3 times on YAML parse or Zod validation failure,
 * including the validation error in the retry prompt for self-correction.
 */
export async function generateIntegrationSurface(
  input: SimulationInput,
  ollamaUrl: string = DEFAULT_OLLAMA_URL,
): Promise<IntegrationSurfaceResult> {
  const baseMessages = buildIntegrationSurfacePrompt(input);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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

      const validated = await parseAndValidateYaml(raw, IntegrationSurfaceSchema);
      if (validated.success) {
        return {
          success: true,
          data: { integrationSurface: validated.data as IntegrationSurface, attempts: attempt },
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
    error: `Integration surface generation failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
  };
}
