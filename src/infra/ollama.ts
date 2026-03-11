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
