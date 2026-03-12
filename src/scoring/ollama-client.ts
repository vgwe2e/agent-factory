/**
 * Ollama scoring client with retry-and-validate.
 *
 * Provides two functions:
 * - ollamaChat: thin wrapper around Ollama /api/chat with format parameter
 * - scoreWithRetry: generic retry wrapper with Zod validation and exponential backoff
 *
 * Follows project conventions: Result type (success/error union), no exceptions,
 * error strings include context.
 */

import type { ZodSchema } from "zod";
import type { Logger } from "../infra/logger.js";

// -- Constants --

export const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
export const SCORING_MODEL = "qwen3:30b";
export const SCORING_TIMEOUT_MS = 240_000; // 4 minutes per call (successful calls finish in ~3 min)
export const SCORING_TEMPERATURE = 0;

// -- Types --

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number; // nanoseconds
}

export type ChatResult =
  | { success: true; content: string; durationMs: number }
  | { success: false; error: string };

export type ValidatedResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- Functions --

/**
 * Send a chat request to Ollama /api/chat with schema-constrained JSON output.
 *
 * @param messages - Array of system/user message pairs
 * @param format - JSON schema object for Ollama's format parameter
 * @param model - Model name to use (default: SCORING_MODEL). Backward compatible.
 * @returns Result with response content and duration, or error string
 */
export async function ollamaChat(
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
  model: string = SCORING_MODEL,
): Promise<ChatResult> {
  try {
    const response = await fetch(OLLAMA_CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format,
        options: { temperature: SCORING_TEMPERATURE },
      }),
      signal: AbortSignal.timeout(SCORING_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Ollama returned HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as OllamaChatResponse;
    const durationMs = data.total_duration
      ? Math.round(data.total_duration / 1_000_000) // nanoseconds to ms
      : 0;

    return { success: true, content: data.message.content, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Ollama chat failed: ${message}` };
  }
}

/**
 * Generic retry wrapper: calls callFn, JSON.parse the result, validates with
 * Zod schema. Retries with exponential backoff on failure.
 *
 * @param schema - Zod schema to validate parsed JSON
 * @param callFn - Async function that returns raw JSON string from LLM
 * @param maxRetries - Maximum number of attempts (default 3)
 * @param logger - Optional pino logger. Falls back to console.error if not provided.
 * @returns Validated data or error string
 */
export async function scoreWithRetry<T>(
  schema: ZodSchema<T>,
  callFn: () => Promise<string>,
  maxRetries: number = 3,
  logger?: Logger,
): Promise<ValidatedResult<T>> {
  const errors: string[] = [];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const raw = await callFn();
      const parsed: unknown = JSON.parse(raw);
      const validated = schema.parse(parsed);
      return { success: true, data: validated };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Attempt ${attempt + 1}: ${message}`);
      const isTimeout = message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("aborted");
      if (logger) {
        logger.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
      } else {
        console.error(`[scoreWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${message}`);
      }

      // Don't retry timeouts — if the model hung once, it'll hang again
      if (isTimeout) {
        break;
      }

      if (attempt < maxRetries - 1) {
        const delayMs = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Errors: ${errors.join("; ")}`,
  };
}
