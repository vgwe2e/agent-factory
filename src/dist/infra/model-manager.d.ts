/**
 * Ollama model lifecycle manager.
 *
 * Manages loading and unloading of Ollama models via the keep_alive parameter.
 * Ensures only one model is loaded at a time on memory-constrained Apple Silicon.
 * Includes a configurable delay between unload and load for memory reclaim.
 */
import type { Logger } from "./logger.js";
export interface ModelManagerConfig {
    triageModel: string;
    scoringModel: string;
    timeoutMs: number;
}
export declare class ModelManager {
    private currentModel;
    private readonly config;
    private readonly logger;
    private readonly fetchFn;
    private readonly switchDelayMs;
    /**
     * @param config - Model names and timeout configuration
     * @param logger - Pino logger instance
     * @param fetchFn - Fetch function (default: globalThis.fetch). Inject for testing.
     * @param switchDelayMs - Delay in ms between unload and load (default: 3000). Set to 0 in tests.
     */
    constructor(config: ModelManagerConfig, logger: Logger, fetchFn?: typeof globalThis.fetch, switchDelayMs?: number);
    /**
     * Switch to a target model. No-op if already loaded.
     * Unloads current model first (keep_alive=0), waits for memory reclaim,
     * then loads target (keep_alive="30m").
     */
    switchTo(model: string): Promise<void>;
    /** Load the triage model (e.g., qwen2.5:7b). */
    ensureTriageModel(): Promise<void>;
    /** Load the scoring model (e.g., qwen2.5:32b). */
    ensureScoringModel(): Promise<void>;
    /** Unload the current model and reset state. */
    unloadAll(): Promise<void>;
}
