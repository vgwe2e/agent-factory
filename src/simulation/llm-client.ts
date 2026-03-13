/**
 * Shared text-generation client for simulation artifacts.
 *
 * Supports the two backends used by this repo:
 * - local Ollama (`/api/chat`)
 * - OpenAI-compatible vLLM (`/v1/chat/completions`)
 *
 * Simulation generators produce Mermaid/YAML text, so this client does not
 * use schema-constrained output. It returns raw assistant text only.
 */

export interface SimulationLlmConfig {
  backend: "ollama" | "vllm";
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export type SimulationLlmTarget = string | SimulationLlmConfig;

export interface SimulationLlmResult {
  success: true;
  content: string;
  durationMs: number;
}

export interface SimulationLlmError {
  success: false;
  error: string;
}

export const DEFAULT_SIMULATION_OLLAMA_BASE_URL = "http://localhost:11434";
export const DEFAULT_SIMULATION_OLLAMA_MODEL = "qwen3:30b";

interface OllamaChatResponse {
  message?: { content?: string };
  total_duration?: number;
}

interface VllmChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

export function resolveSimulationLlmConfig(
  target?: SimulationLlmTarget,
): SimulationLlmConfig {
  if (target == null) {
    return {
      backend: "ollama",
      baseUrl: DEFAULT_SIMULATION_OLLAMA_BASE_URL,
      model: DEFAULT_SIMULATION_OLLAMA_MODEL,
    };
  }

  if (typeof target === "string") {
    return {
      backend: "ollama",
      baseUrl: normalizeOllamaBaseUrl(target),
      model: DEFAULT_SIMULATION_OLLAMA_MODEL,
    };
  }

  if (target.backend === "ollama") {
    return {
      ...target,
      baseUrl: normalizeOllamaBaseUrl(target.baseUrl),
    };
  }

  return {
    ...target,
    baseUrl: normalizeVllmBaseUrl(target.baseUrl),
  };
}

export async function generateSimulationText(
  messages: Array<{ role: string; content: string }>,
  target: SimulationLlmTarget | undefined,
  options?: { temperature?: number; timeoutMs?: number; signal?: AbortSignal },
): Promise<SimulationLlmResult | SimulationLlmError> {
  const config = resolveSimulationLlmConfig(target);
  const temperature = options?.temperature ?? 0.3;
  const timeoutMs = options?.timeoutMs ?? 180_000;
  const signal = buildSignal(timeoutMs, options?.signal);
  const startedAt = performance.now();

  try {
    if (config.backend === "ollama") {
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: false,
          options: { temperature },
        }),
        signal,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Ollama HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = (await response.json()) as OllamaChatResponse;
      const content = data.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        return { success: false, error: "Ollama returned no message content" };
      }

      const durationMs = data.total_duration != null
        ? Math.round(data.total_duration / 1_000_000)
        : Math.round(performance.now() - startedAt);

      return { success: true, content, durationMs };
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
      }),
      signal,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `vLLM HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as VllmChatResponse;
    const rawContent = data.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : rawContent
          ?.filter((item) => item.type === "text" && typeof item.text === "string")
          .map((item) => item.text)
          .join("\n");

    if (typeof content !== "string" || content.length === 0) {
      return { success: false, error: "vLLM returned no message content" };
    }

    return {
      success: true,
      content,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const label = config.backend === "ollama" ? "Ollama" : "vLLM";
    return { success: false, error: `${label} chat failed: ${message}` };
  }
}

function normalizeOllamaBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api/chat") ? trimmed.slice(0, -9) : trimmed;
}

function normalizeVllmBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed;
}

function buildSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;
}
