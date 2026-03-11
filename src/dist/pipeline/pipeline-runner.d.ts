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
}
export interface PipelineResult {
    triageCount: number;
    scoredCount: number;
    promotedCount: number;
    skippedCount: number;
    errorCount: number;
    resumedCount: number;
    totalDurationMs: number;
    errors: string[];
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
