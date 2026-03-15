/**
 * Context tracker for pipeline evaluation state.
 *
 * Manages per-opportunity evaluation state, archives intermediate results
 * to disk, and resets in-memory buffers to prevent memory accumulation
 * during long runs processing hundreds of opportunities.
 */
import type { ScoringResult } from "../types/scoring.js";
export type PipelineStage = "triage" | "scoring" | "simulation" | "reporting";
export interface EvaluationContext {
    currentStage: PipelineStage;
    processed: Set<string>;
    results: Map<string, ScoringResult>;
    errors: Array<{
        oppId: string;
        stage: string;
        error: string;
    }>;
}
/** Create a fresh evaluation context with empty state. */
export declare function createContext(): EvaluationContext;
/** Add a scoring result and mark the skill as processed. */
export declare function addResult(ctx: EvaluationContext, result: ScoringResult): void;
/** Record an error for a specific opportunity and stage. */
export declare function addError(ctx: EvaluationContext, oppId: string, stage: string, error: string): void;
/** Update the current pipeline stage. */
export declare function setStage(ctx: EvaluationContext, stage: PipelineStage): void;
/**
 * Archive current results to disk and clear the in-memory results buffer.
 *
 * Writes results as JSON to `outputDir/.pipeline/checkpoint-{timestamp}.json`.
 * The processed Set is kept intact so the pipeline knows which opportunities
 * have already been handled. Returns the count of archived results.
 *
 * No-op (returns 0) if the results Map is empty.
 */
export declare function archiveAndReset(ctx: EvaluationContext, outputDir: string): Promise<number>;
/** Get summary statistics for the current context state. */
export declare function getStats(ctx: EvaluationContext): {
    processed: number;
    pending: number;
    errors: number;
};
