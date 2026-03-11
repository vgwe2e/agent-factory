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
 * @param requiredModels - Model names to check for (default: qwen2.5:7b, qwen2.5:32b)
 * @returns OllamaStatus with connection state and model information
 */
export declare function checkOllama(requiredModels?: string[]): Promise<OllamaStatus>;
/**
 * Format OllamaStatus into a human-readable string for CLI output.
 */
export declare function formatOllamaStatus(status: OllamaStatus): string;
