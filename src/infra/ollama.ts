/**
 * Ollama connectivity check and model availability verification.
 *
 * Connects to local Ollama instance at localhost:11434 to verify
 * the service is running and required models are available.
 * Makes zero cloud API calls.
 */

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface OllamaStatus {
  connected: boolean;
  models: OllamaModel[];
  missingModels: string[];
  error?: string;
}

const OLLAMA_API = "http://localhost:11434/api/tags";
const DEFAULT_REQUIRED_MODELS = ["qwen3:8b", "qwen3:30b"];
const TIMEOUT_MS = 5000;

/**
 * Check Ollama connectivity and model availability.
 *
 * @param requiredModels - Model names to check for (default: qwen3:8b, qwen3:30b)
 * @returns OllamaStatus with connection state and model information
 */
export async function checkOllama(
  requiredModels: string[] = DEFAULT_REQUIRED_MODELS,
): Promise<OllamaStatus> {
  try {
    const response = await fetch(OLLAMA_API, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = (await response.json()) as {
      models: Array<{ name: string; size: number; modified_at: string }>;
    };

    const models: OllamaModel[] = data.models.map((m) => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
    }));

    const availableNames = models.map((m) => m.name);

    const missingModels = requiredModels.filter(
      (required) =>
        !availableNames.some((available) => available.startsWith(required)),
    );

    return { connected: true, models, missingModels };
  } catch {
    return {
      connected: false,
      models: [],
      missingModels: requiredModels,
      error: "Ollama is not running. Start it with: ollama serve",
    };
  }
}

/**
 * Quick connectivity probe — returns true if Ollama responds within timeout.
 * Use for mid-run health checks to distinguish "model is slow" from "Ollama crashed".
 */
export async function isOllamaHealthy(timeoutMs: number = 5000): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a trivial prompt to warm up the scoring model in GPU memory.
 *
 * Ollama may evict large models under memory pressure. This forces
 * the model to be fully loaded before the first real scoring call,
 * converting a ~60-90 second cold-start penalty from the first real
 * opportunity into an explicit warm-up step.
 *
 * @param model - Model to warm up (default: qwen3:30b)
 * @param timeoutMs - Warm-up timeout (default: 180_000 = 3 min). First load can be slow.
 * @returns success/error result
 */
export async function warmUpModel(
  model: string = "qwen3:30b",
  timeoutMs: number = 180_000,
): Promise<{ success: boolean; durationMs: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with exactly: ready" }],
        stream: false,
        options: { temperature: 0, num_predict: 10 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        durationMs: Date.now() - start,
        error: `Warm-up got HTTP ${response.status}`,
      };
    }

    // Consume the response body to ensure the model is fully loaded
    await response.json();
    return { success: true, durationMs: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

/**
 * Format OllamaStatus into a human-readable string for CLI output.
 */
export function formatOllamaStatus(status: OllamaStatus): string {
  if (!status.connected) {
    return `${RED}Ollama: NOT CONNECTED -- ${status.error}${RESET}`;
  }

  const lines: string[] = [];

  if (status.missingModels.length === 0) {
    lines.push(
      `${GREEN}Ollama: Connected (${status.models.length} models available)${RESET}`,
    );
  } else {
    lines.push(
      `${YELLOW}Ollama: Connected but missing models: ${status.missingModels.join(", ")}${RESET}`,
    );
  }

  for (const model of status.models) {
    const sizeGB = (model.size / 1_000_000_000).toFixed(1);
    lines.push(`  - ${model.name} (${sizeGB} GB)`);
  }

  if (status.missingModels.length > 0) {
    for (const missing of status.missingModels) {
      lines.push(`  ${YELLOW}Run: ollama pull ${missing}${RESET}`);
    }
  }

  return lines.join("\n");
}
