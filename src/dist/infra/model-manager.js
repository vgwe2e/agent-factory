/**
 * Ollama model lifecycle manager.
 *
 * Manages loading and unloading of Ollama models via the keep_alive parameter.
 * Ensures only one model is loaded at a time on memory-constrained Apple Silicon.
 * Includes a configurable delay between unload and load for memory reclaim.
 */
const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
export class ModelManager {
    currentModel = null;
    config;
    logger;
    fetchFn;
    switchDelayMs;
    /**
     * @param config - Model names and timeout configuration
     * @param logger - Pino logger instance
     * @param fetchFn - Fetch function (default: globalThis.fetch). Inject for testing.
     * @param switchDelayMs - Delay in ms between unload and load (default: 3000). Set to 0 in tests.
     */
    constructor(config, logger, fetchFn = globalThis.fetch, switchDelayMs = 3000) {
        this.config = config;
        this.logger = logger;
        this.fetchFn = fetchFn;
        this.switchDelayMs = switchDelayMs;
    }
    /**
     * Switch to a target model. No-op if already loaded.
     * Unloads current model first (keep_alive=0), waits for memory reclaim,
     * then loads target (keep_alive="30m").
     */
    async switchTo(model) {
        if (this.currentModel === model) {
            this.logger.info({ model }, "Model already loaded, skipping switch");
            return;
        }
        // Unload current model if one is loaded
        if (this.currentModel !== null) {
            this.logger.info({ model: this.currentModel }, "Unloading model");
            await this.fetchFn(OLLAMA_CHAT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.currentModel,
                    messages: [],
                    keep_alive: 0,
                }),
            });
            // Wait for Apple Silicon memory reclaim
            if (this.switchDelayMs > 0) {
                await new Promise((r) => setTimeout(r, this.switchDelayMs));
            }
        }
        // Load target model
        this.logger.info({ model }, "Loading model");
        await this.fetchFn(OLLAMA_CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [],
                keep_alive: "30m",
            }),
            signal: AbortSignal.timeout(this.config.timeoutMs),
        });
        this.currentModel = model;
        this.logger.info({ model }, "Model loaded successfully");
    }
    /** Load the triage model (e.g., qwen3:8b). */
    async ensureTriageModel() {
        await this.switchTo(this.config.triageModel);
    }
    /** Load the scoring model (e.g., qwen3:30b). */
    async ensureScoringModel() {
        await this.switchTo(this.config.scoringModel);
    }
    /** Unload the current model and reset state. */
    async unloadAll() {
        if (this.currentModel === null) {
            return;
        }
        this.logger.info({ model: this.currentModel }, "Unloading all models");
        await this.fetchFn(OLLAMA_CHAT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.currentModel,
                messages: [],
                keep_alive: 0,
            }),
        });
        this.currentModel = null;
    }
}
