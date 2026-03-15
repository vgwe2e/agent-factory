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
export declare const DEFAULT_SIMULATION_OLLAMA_BASE_URL = "http://localhost:11434";
export declare const DEFAULT_SIMULATION_OLLAMA_MODEL = "qwen3:30b";
export declare function resolveSimulationLlmConfig(target?: SimulationLlmTarget): SimulationLlmConfig;
export declare function generateSimulationText(messages: Array<{
    role: string;
    content: string;
}>, target: SimulationLlmTarget | undefined, options?: {
    temperature?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
}): Promise<SimulationLlmResult | SimulationLlmError>;
