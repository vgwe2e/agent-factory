/**
 * Progress tracker for concurrent pipeline execution.
 *
 * Tracks in-flight, completed, and errored opportunities with ETA
 * estimation. Logs structured progress lines via the provided logger.
 *
 * Key improvement: tracks per-opportunity start times and names so the
 * operator can distinguish "working on a slow opportunity" from "stalled"
 * during 15+ minute scoring calls on the 30B MoE model.
 */
import type { Logger } from "../infra/logger.js";
export interface ProgressSummary {
    completed: number;
    errors: number;
    totalMs: number;
}
export interface ProgressTracker {
    /** Mark an opportunity as started (in-flight). */
    start(id: string): void;
    /** Mark an opportunity as completed (decrements in-flight, increments completed). */
    complete(id: string): void;
    /** Mark an opportunity as errored (decrements in-flight, increments errors). */
    error(id: string): void;
    /** Log a structured progress line with current counts and ETA. */
    report(): void;
    /** Return final summary with completed count, error count, and total elapsed ms. */
    summary(): ProgressSummary;
}
/**
 * Create a progress tracker that reports pipeline scoring progress.
 *
 * @param total - Total number of opportunities to process
 * @param logger - Pino-compatible logger for structured output
 */
export declare function createProgressTracker(total: number, logger: Logger): ProgressTracker;
