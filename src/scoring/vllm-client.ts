/**
 * vLLM client adapter: ChatFn-compatible wrapper for vLLM's
 * OpenAI-compatible /v1/chat/completions endpoint.
 *
 * Drop-in replacement for ollamaChat -- same ChatResult return type,
 * same message/format parameters. Translates Ollama-style JSON schema
 * format to vLLM's response_format via schema-translator.
 *
 * Never throws -- all errors channeled through ChatResult union.
 */

import type { ChatResult } from "./ollama-client.js";
import { translateToResponseFormat } from "./schema-translator.js";

// -- Constants --

export const VLLM_TIMEOUT_MS = 300_000; // 5 minutes per request
export const VLLM_TEMPERATURE = 0;

// -- Types --

/** ChatFn signature used throughout the scoring pipeline. */
type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

interface VllmChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

// -- Public API --

/**
 * Create a ChatFn that calls a vLLM server's OpenAI-compatible API.
 *
 * @param baseUrl - vLLM server base URL (e.g., "http://localhost:8000")
 * @param model - Model name/path loaded in vLLM
 * @returns ChatFn-compatible async function
 */
export function createVllmChatFn(baseUrl: string, model: string): ChatFn {
  const endpoint = `${baseUrl}/v1/chat/completions`;

  return async (
    messages: Array<{ role: string; content: string }>,
    format: Record<string, unknown>,
  ): Promise<ChatResult> => {
    const startMs = performance.now();

    try {
      const responseFormat = translateToResponseFormat(format);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          temperature: VLLM_TEMPERATURE,
          response_format: responseFormat,
        }),
        signal: AbortSignal.timeout(VLLM_TIMEOUT_MS),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `vLLM HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as VllmChatResponse;
      const content = data.choices[0].message.content;
      const durationMs = Math.round(performance.now() - startMs);

      return { success: true, content, durationMs };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `vLLM chat failed: ${message}` };
    }
  };
}
