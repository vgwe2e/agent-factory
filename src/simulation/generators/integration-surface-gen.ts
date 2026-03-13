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
import {
  generateSimulationText,
  type SimulationLlmTarget,
} from "../llm-client.js";

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
  llmTarget?: SimulationLlmTarget,
  signal?: AbortSignal,
): Promise<IntegrationSurfaceResult> {
  const baseMessages = buildIntegrationSurfacePrompt(input);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    throwIfAborted(signal);

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
      const response = await generateSimulationText(messages, llmTarget, {
        temperature: TEMPERATURE,
        timeoutMs: TIMEOUT_MS,
        signal,
      });

      if (!response.success) {
        throwIfAborted(signal);
        errors.push(response.error);
        continue;
      }

      const raw = response.content;

      const validated = await parseAndValidateYaml(raw, IntegrationSurfaceSchema);
      if (validated.success) {
        return {
          success: true,
          data: { integrationSurface: validated.data as IntegrationSurface, attempts: attempt },
        };
      }

      errors.push(validated.error);
    } catch (err) {
      if (signal?.aborted) {
        throw abortError(signal);
      }
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
    }
  }

  return {
    success: false,
    error: `Integration surface generation failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
  };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw abortError(signal);
  }
}

function abortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error(String(signal.reason ?? "Operation aborted"));
}
