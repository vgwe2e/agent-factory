/**
 * Context tracker for pipeline evaluation state.
 *
 * Manages per-opportunity evaluation state, archives intermediate results
 * to disk, and resets in-memory buffers to prevent memory accumulation
 * during long runs processing hundreds of opportunities.
 */

import fs from "node:fs";
import path from "node:path";

import type { ScoringResult } from "../types/scoring.js";

// -- Types --

export type PipelineStage = "triage" | "scoring" | "simulation" | "reporting";

export interface EvaluationContext {
  currentStage: PipelineStage;
  processed: Set<string>;
  results: Map<string, ScoringResult>;
  errors: Array<{ oppId: string; stage: string; error: string }>;
}

// -- Functions --

/** Create a fresh evaluation context with empty state. */
export function createContext(): EvaluationContext {
  return {
    currentStage: "triage",
    processed: new Set(),
    results: new Map(),
    errors: [],
  };
}

/** Add a scoring result and mark the opportunity as processed. */
export function addResult(ctx: EvaluationContext, result: ScoringResult): void {
  ctx.results.set(result.l3Name, result);
  ctx.processed.add(result.l3Name);
}

/** Record an error for a specific opportunity and stage. */
export function addError(
  ctx: EvaluationContext,
  oppId: string,
  stage: string,
  error: string,
): void {
  ctx.errors.push({ oppId, stage, error });
}

/** Update the current pipeline stage. */
export function setStage(ctx: EvaluationContext, stage: PipelineStage): void {
  ctx.currentStage = stage;
}

/**
 * Archive current results to disk and clear the in-memory results buffer.
 *
 * Writes results as JSON to `outputDir/.pipeline/checkpoint-{timestamp}.json`.
 * The processed Set is kept intact so the pipeline knows which opportunities
 * have already been handled. Returns the count of archived results.
 *
 * No-op (returns 0) if the results Map is empty.
 */
export async function archiveAndReset(
  ctx: EvaluationContext,
  outputDir: string,
): Promise<number> {
  const count = ctx.results.size;
  if (count === 0) return 0;

  const pipelineDir = path.join(outputDir, ".pipeline");
  fs.mkdirSync(pipelineDir, { recursive: true });

  const checkpoint: Record<string, ScoringResult> = {};
  for (const [key, value] of ctx.results) {
    checkpoint[key] = value;
  }

  const filename = `checkpoint-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(pipelineDir, filename),
    JSON.stringify(checkpoint, null, 2),
  );

  ctx.results.clear();
  return count;
}

/** Get summary statistics for the current context state. */
export function getStats(ctx: EvaluationContext): {
  processed: number;
  pending: number;
  errors: number;
} {
  return {
    processed: ctx.processed.size,
    pending: ctx.results.size,
    errors: ctx.errors.length,
  };
}
