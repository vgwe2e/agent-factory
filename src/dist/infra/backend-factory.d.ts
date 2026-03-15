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
import type { CostTracker } from "./cost-tracker.js";
import type { SimulationLlmConfig } from "../simulation/llm-client.js";
import type { OpenAiBatchConfig } from "./openai-batch-client.js";
export type Backend = "ollama" | "vllm" | "openai-batch";
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export interface BackendOptions {
    vllmUrl?: string;
    vllmModel?: string;
    vllmApiKey?: string;
    runpodApiKey?: string;
    runpodGpuType?: string;
    networkVolumeId?: string;
    hfToken?: string;
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
    cleanup?: () => Promise<void>;
    costTracker?: CostTracker;
    podId?: string;
    simulationConfig?: SimulationLlmConfig;
    openAiBatchConfig?: OpenAiBatchConfig;
}
/**
 * Create a backend configuration with the appropriate ChatFn.
 *
 * @param backend - "ollama" or "vllm"
 * @param options - Required for vllm backend (vllmUrl or runpodApiKey)
 * @returns BackendConfig with chatFn, backend identifier, and optional cloud resources
 * @throws If backend is invalid, neither vllmUrl nor runpodApiKey provided for vllm, or schema validation fails
 */
export declare function createBackend(backend: Backend, options?: BackendOptions): Promise<BackendConfig>;
export {};
