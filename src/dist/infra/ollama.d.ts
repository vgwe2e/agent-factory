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
/**
 * Check Ollama connectivity and model availability.
 *
 * @param requiredModels - Model names to check for (default: qwen3:8b, qwen3:30b)
 * @returns OllamaStatus with connection state and model information
 */
export declare function checkOllama(requiredModels?: string[]): Promise<OllamaStatus>;
/**
 * Quick connectivity probe — returns true if Ollama responds within timeout.
 * Use for mid-run health checks to distinguish "model is slow" from "Ollama crashed".
 */
export declare function isOllamaHealthy(timeoutMs?: number): Promise<boolean>;
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
export declare function warmUpModel(model?: string, timeoutMs?: number): Promise<{
    success: boolean;
    durationMs: number;
    error?: string;
}>;
/**
 * Format OllamaStatus into a human-readable string for CLI output.
 */
export declare function formatOllamaStatus(status: OllamaStatus): string;
