/**
 * Backend factory: creates the appropriate ChatFn + config based on
 * the selected scoring backend (ollama or vllm).
 *
 * For the vLLM path, runs pre-flight schema validation before creating
 * the client to catch incompatibilities early (VLLM-04).
 *
 * When backend is "vllm" and no vllmUrl is provided but a RunPod API key
 * is available, auto-provisions a cloud H100 endpoint via RunPod GraphQL.
 */

import type { ChatResult } from "../scoring/ollama-client.js";
import { ollamaChat } from "../scoring/ollama-client.js";
import { createVllmChatFn } from "../scoring/vllm-client.js";
import { validateScoringSchemas } from "../scoring/schema-translator.js";
import { createCloudProvider } from "./cloud-provider.js";
import { createCostTracker } from "./cost-tracker.js";
import type { CostTracker } from "./cost-tracker.js";

// -- Types --

export type Backend = "ollama" | "vllm";

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export interface VllmBackendOptions {
  vllmUrl?: string;        // If omitted and runpodApiKey set, auto-provision
  vllmModel?: string;
  runpodApiKey?: string;   // From RUNPOD_API_KEY env var
}

export interface BackendConfig {
  chatFn: ChatFn;
  backend: Backend;
  cleanup?: () => Promise<void>;  // teardown for cloud resources
  costTracker?: CostTracker;      // GPU cost tracking (cloud only)
  endpointId?: string;            // RunPod endpoint ID (cloud only)
}

// -- Constants --

const DEFAULT_VLLM_MODEL = "Qwen/Qwen2.5-32B-Instruct";

// -- Public API --

/**
 * Create a backend configuration with the appropriate ChatFn.
 *
 * @param backend - "ollama" or "vllm"
 * @param options - Required for vllm backend (vllmUrl or runpodApiKey)
 * @returns BackendConfig with chatFn, backend identifier, and optional cloud resources
 * @throws If backend is invalid, neither vllmUrl nor runpodApiKey provided for vllm, or schema validation fails
 */
export async function createBackend(
  backend: Backend,
  options?: VllmBackendOptions,
): Promise<BackendConfig> {
  switch (backend) {
    case "ollama":
      return { chatFn: ollamaChat, backend: "ollama" };

    case "vllm": {
      // Pre-flight schema validation (VLLM-04)
      const result = validateScoringSchemas();
      if (!result.valid) {
        const details = result.errors
          .map((e) => `  - ${e.schema}: ${e.reason}`)
          .join("\n");
        throw new Error(`vLLM schema validation failed:\n${details}`);
      }

      const model = options?.vllmModel ?? DEFAULT_VLLM_MODEL;

      // Path 1: User-managed vLLM instance
      if (options?.vllmUrl) {
        const chatFn = createVllmChatFn(options.vllmUrl, model);
        return { chatFn, backend: "vllm" };
      }

      // Path 2: Auto-provision via RunPod
      if (options?.runpodApiKey) {
        const provider = createCloudProvider({ apiKey: options.runpodApiKey });
        const endpoint = await provider.provision();
        console.log(`RunPod endpoint: ${endpoint.endpointId}`);

        const costTracker = createCostTracker();

        const cleanup = async () => {
          try {
            await provider.teardown(endpoint);
          } catch {
            // Swallow errors -- teardown is best-effort
          }
        };

        const chatFn = createVllmChatFn(endpoint.baseUrl, model);
        return { chatFn, backend: "vllm", cleanup, costTracker, endpointId: endpoint.endpointId };
      }

      // Path 3: Neither provided
      throw new Error(
        "Either --vllm-url or RUNPOD_API_KEY is required when backend is 'vllm'",
      );
    }

    default:
      throw new Error(`Unknown backend: ${backend as string}`);
  }
}
