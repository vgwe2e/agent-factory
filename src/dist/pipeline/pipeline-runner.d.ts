/**
 * End-to-end pipeline runner.
 *
 * Orchestrates: ingestion -> triage -> model switch -> scoring -> archive -> unload.
 * Processes opportunities in tier-priority order (Tier 1 first).
 * Catches per-opportunity scoring errors and continues to the next.
 * Archives intermediate results to disk every N opportunities to prevent
 * memory accumulation during long overnight runs.
 */
import type { Logger } from "../infra/logger.js";
import type { ChatResult } from "../scoring/ollama-client.js";
import type { ParseResult } from "../ingestion/parse-export.js";
import type { CostTracker, CostSummary } from "../infra/cost-tracker.js";
import { runSimulationPipeline as defaultRunSimulationPipeline } from "../simulation/simulation-pipeline.js";
import type { SimulationLlmTarget } from "../simulation/llm-client.js";
import type { OpenAiBatchConfig } from "../infra/openai-batch-client.js";
import { runTwoPassScoringOpenAiBatch as defaultRunTwoPassScoringOpenAiBatch } from "../scoring/two-pass-openai-batch.js";
import { runOpenAiBatchSimulation as defaultRunOpenAiBatchSimulation } from "../simulation/openai-batch-pipeline.js";
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export interface PipelineOptions {
    outputDir: string;
    logLevel?: string;
    archiveThreshold?: number;
    models?: {
        triage: string;
        scoring: string;
    };
    chatFn?: ChatFn;
    fetchFn?: typeof globalThis.fetch;
    /** Inject parseExport for testing (avoids file I/O in tests). */
    parseExportFn?: (path: string) => Promise<ParseResult>;
    /** Enable git auto-commit after pipeline completes (default true) */
    gitCommit?: boolean;
    /** Inject runSimulationPipeline for testing (avoids LLM calls in tests). */
    runSimulationPipelineFn?: typeof defaultRunSimulationPipeline;
    /** Inject OpenAI Batch scoring for testing. */
    runTwoPassScoringOpenAiBatchFn?: typeof defaultRunTwoPassScoringOpenAiBatch;
    /** Inject OpenAI Batch simulation for testing. */
    runOpenAiBatchSimulationFn?: typeof defaultRunOpenAiBatchSimulation;
    /** Scoring backend -- when not "ollama", skips local model management. Default: "ollama". */
    backend?: "ollama" | "vllm" | "openai-batch";
    /** Number of opportunities to score in parallel (default: 1 = sequential). */
    concurrency?: number;
    /**
     * Per-request timeout in ms for scoring calls.
     *
     * Default: 1,500,000 (25 min). This wraps all three lens calls (which run
     * concurrently via Promise.all in scoreOneOpportunity), so it only needs to
     * be as long as the slowest single lens. The 30B MoE model on Apple Silicon
     * can take up to 18 minutes for complex prompts; 25 min provides headroom.
     */
    requestTimeoutMs?: number;
    /** Only score opportunities up to this tier (1, 2, or 3). Default: 3. */
    maxTier?: number;
    /** Cost tracker for cloud GPU usage (injected from BackendConfig). */
    costTracker?: CostTracker;
    /** Skip the simulation phase entirely (scoring only). */
    skipSim?: boolean;
    /** Per-opportunity simulation timeout in milliseconds. */
    simTimeoutMs?: number;
    /** Simulation backend target. Defaults to local Ollama when omitted. */
    simulationLlmTarget?: SimulationLlmTarget;
    /** Scoring pipeline mode. Default: "two-pass". */
    scoringMode?: "two-pass" | "three-lens";
    /** Number of top-scoring L4 candidates for two-pass LLM scoring. Default: 50. */
    topN?: number;
    /** OpenAI Batch configuration when backend is openai-batch. */
    openAiBatchConfig?: OpenAiBatchConfig;
}
export interface PipelineResult {
    triageCount: number;
    scoredCount: number;
    promotedCount: number;
    skippedCount: number;
    errorCount: number;
    resumedCount: number;
    simulatedCount: number;
    simErrorCount: number;
    totalDurationMs: number;
    concurrency: number;
    avgPerOppMs: number;
    errors: string[];
    costSummary?: CostSummary;
    /** Scoring mode used for this run. */
    scoringMode?: "two-pass" | "three-lens";
    /** Two-pass specific: total L4s pre-scored. */
    preScoredCount?: number;
    /** Two-pass specific: survivors after top-N filter. */
    survivorCount?: number;
    /** Two-pass specific: cutoff composite score. */
    cutoffScore?: number;
}
/**
 * Run the full evaluation pipeline end-to-end.
 *
 * @param inputPath - Path to hierarchy JSON export
 * @param options - Pipeline configuration
 * @param logger - Pino logger instance
 * @returns Pipeline result with counts and timing
 */
export declare function runPipeline(inputPath: string, options: PipelineOptions, logger: Logger): Promise<PipelineResult>;
export {};
