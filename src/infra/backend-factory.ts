/**
 * Backend factory: creates the appropriate ChatFn + config based on
 * the selected scoring backend (ollama, vllm, or openai-batch).
 *
 * For the vLLM path, runs pre-flight schema validation before creating
 * the client to catch incompatibilities early (VLLM-04).
 *
 * When backend is "vllm" and no vllmUrl is provided but a RunPod API key
 * is available, auto-provisions a dedicated RunPod vLLM pod.
 */

import type { ChatResult } from "../scoring/ollama-client.js";
import { ollamaChat } from "../scoring/ollama-client.js";
import { createVllmChatFn } from "../scoring/vllm-client.js";
import { validateScoringSchemas } from "../scoring/schema-translator.js";
import { createCostTracker } from "./cost-tracker.js";
import type { CostTracker } from "./cost-tracker.js";
import { createPodProvider } from "./pod-provider.js";
import type { SimulationLlmConfig } from "../simulation/llm-client.js";
import type { OpenAiBatchConfig } from "./openai-batch-client.js";

// -- Types --

export type Backend = "ollama" | "vllm" | "openai-batch";

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export interface BackendOptions {
  vllmUrl?: string;           // If omitted and runpodApiKey set, auto-provision
  vllmModel?: string;
  vllmApiKey?: string;        // Auth for a user-managed vLLM/OpenAI server
  runpodApiKey?: string;      // From RUNPOD_API_KEY env var
  runpodGpuType?: string;     // Optional RunPod GPU type override
  networkVolumeId?: string;   // RunPod network volume for model weight caching
  hfToken?: string;           // Optional Hugging Face token for gated/private models
  openAiApiKey?: string;
  openAiBaseUrl?: string;
  openAiScoringModel?: string;
  openAiSimulationModel?: string;
  openAiPollIntervalMs?: number;
  openAiTimeoutMs?: number;
}

export interface BackendConfig {
  chatFn: ChatFn;
  backend: Backend;
  cleanup?: () => Promise<void>;  // teardown for cloud resources
  costTracker?: CostTracker;      // GPU cost tracking (cloud only)
  podId?: string;                 // RunPod pod ID (cloud only)
  simulationConfig?: SimulationLlmConfig;
  openAiBatchConfig?: OpenAiBatchConfig;
}

// -- Constants --

const DEFAULT_VLLM_MODEL = "Qwen/Qwen2.5-32B-Instruct";
const DEFAULT_OLLAMA_MODEL = "qwen3:30b";
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OPENAI_SCORING_MODEL = "gpt-5-nano";
const DEFAULT_OPENAI_SIMULATION_MODEL = "gpt-5-mini";

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
  options?: BackendOptions,
): Promise<BackendConfig> {
  switch (backend) {
    case "ollama":
      return {
        chatFn: ollamaChat,
        backend: "ollama",
        simulationConfig: {
          backend: "ollama",
          baseUrl: DEFAULT_OLLAMA_BASE_URL,
          model: DEFAULT_OLLAMA_MODEL,
        },
      };

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
        const chatFn = createVllmChatFn(options.vllmUrl, model, options?.vllmApiKey);
        return {
          chatFn,
          backend: "vllm",
          simulationConfig: {
            backend: "vllm",
            baseUrl: options.vllmUrl,
            model,
            apiKey: options.vllmApiKey,
          },
        };
      }

      // Path 2: Auto-provision a dedicated RunPod pod
      if (options?.runpodApiKey) {
        const provider = createPodProvider({
          apiKey: options.runpodApiKey,
          gpuType: options.runpodGpuType,
          model,
          networkVolumeId: options.networkVolumeId,
          hfToken: options.hfToken,
        });
        const pod = await provider.provision();
        console.log(`RunPod pod: ${pod.podId}`);

        const costTracker = createCostTracker();

        const cleanup = async () => {
          try {
            await provider.teardown(pod);
          } catch {
            // Swallow errors -- teardown is best-effort
          }
        };

        const chatFn = createVllmChatFn(pod.baseUrl, model, pod.vllmApiKey);
        return {
          chatFn,
          backend: "vllm",
          cleanup,
          costTracker,
          podId: pod.podId,
          simulationConfig: {
            backend: "vllm",
            baseUrl: pod.baseUrl,
            model,
            apiKey: pod.vllmApiKey,
          },
        };
      }

      // Path 3: Neither provided
      throw new Error(
        "Either --vllm-url or RUNPOD_API_KEY is required when backend is 'vllm'",
      );
    }

    case "openai-batch": {
      if (!options?.openAiApiKey) {
        throw new Error(
          "OPENAI_API_KEY environment variable is required when backend is 'openai-batch'",
        );
      }

      return {
        chatFn: async () => ({
          success: false,
          error: "openai-batch does not expose a synchronous chatFn",
        }),
        backend: "openai-batch",
        openAiBatchConfig: {
          apiKey: options.openAiApiKey,
          baseUrl: options.openAiBaseUrl,
          scoringModel: options.openAiScoringModel ?? DEFAULT_OPENAI_SCORING_MODEL,
          simulationModel: options.openAiSimulationModel ?? DEFAULT_OPENAI_SIMULATION_MODEL,
          pollIntervalMs: options.openAiPollIntervalMs,
          timeoutMs: options.openAiTimeoutMs,
        },
      };
    }

    default:
      throw new Error(`Unknown backend: ${backend as string}`);
  }
}
