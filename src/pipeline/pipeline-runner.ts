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
import type { HierarchyExport } from "../types/hierarchy.js";
import type { ChatResult } from "../scoring/ollama-client.js";
import type { ScoringResult } from "../types/scoring.js";
import type { ParseResult } from "../ingestion/parse-export.js";

import { z } from "zod";
import { parseExport } from "../ingestion/parse-export.js";
import { triageOpportunities } from "../triage/triage-pipeline.js";
import { scoreOneOpportunity } from "../scoring/scoring-pipeline.js";
import { ModelManager } from "../infra/model-manager.js";
import {
  createContext,
  addResult,
  addError,
  setStage,
  archiveAndReset,
} from "./context-tracker.js";
import { buildKnowledgeContext } from "../scoring/knowledge-context.js";
import { groupL4sByL3 } from "../triage/red-flags.js";
import { loadCheckpoint, saveCheckpoint, getCompletedNames } from "../infra/checkpoint.js";
import type { Checkpoint } from "../infra/checkpoint.js";
import { callWithResilience } from "../infra/retry-policy.js";
import { autoCommitEvaluation } from "../infra/git-commit.js";

// -- Types --

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export interface PipelineOptions {
  outputDir: string;
  logLevel?: string;
  archiveThreshold?: number;
  models?: { triage: string; scoring: string };
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

// -- Defaults --

const DEFAULT_ARCHIVE_THRESHOLD = 25;
const DEFAULT_TRIAGE_MODEL = "qwen2.5:7b";
const DEFAULT_SCORING_MODEL = "qwen2.5:32b";
const MODEL_TIMEOUT_MS = 120_000;

// -- Public API --

/**
 * Run the full evaluation pipeline end-to-end.
 *
 * @param inputPath - Path to hierarchy JSON export
 * @param options - Pipeline configuration
 * @param logger - Pino logger instance
 * @returns Pipeline result with counts and timing
 */
export async function runPipeline(
  inputPath: string,
  options: PipelineOptions,
  logger: Logger,
): Promise<PipelineResult> {
  const startMs = Date.now();
  const archiveThreshold =
    options.archiveThreshold ?? DEFAULT_ARCHIVE_THRESHOLD;
  const triageModel = options.models?.triage ?? DEFAULT_TRIAGE_MODEL;
  const scoringModel = options.models?.scoring ?? DEFAULT_SCORING_MODEL;
  const parseFn = options.parseExportFn ?? parseExport;

  const errors: string[] = [];
  let scoredCount = 0;
  let promotedCount = 0;

  logger.info({ inputPath }, "Pipeline starting");

  // 1. Parse export
  logger.info("Parsing hierarchy export");
  const parseResult = await parseFn(inputPath);
  if (!parseResult.success) {
    throw new Error(`Failed to parse export: ${parseResult.error}`);
  }
  const data: HierarchyExport = parseResult.data;
  logger.info(
    {
      l3Count: data.l3_opportunities.length,
      l4Count: data.hierarchy.length,
    },
    "Export parsed",
  );

  // 1b. Load checkpoint for resume support
  const existingCheckpoint = loadCheckpoint(options.outputDir);
  const completed = getCompletedNames(existingCheckpoint);
  const checkpoint: Checkpoint = existingCheckpoint && existingCheckpoint.inputFile === inputPath
    ? existingCheckpoint
    : { version: 1, inputFile: inputPath, startedAt: new Date().toISOString(), entries: [] };

  if (completed.size > 0) {
    logger.info({ resuming: completed.size }, "Resuming from checkpoint");
  }

  const resumedCount = completed.size;

  // 2. Triage (pure function, no model needed)
  logger.info("Running triage");
  const triageResults = triageOpportunities(data);

  const processable = triageResults.filter((t) => t.action === "process");
  const skipped = triageResults.filter(
    (t) => t.action === "skip" || t.action === "demote",
  );

  const tier1 = processable.filter((t) => t.tier === 1).length;
  const tier2 = processable.filter((t) => t.tier === 2).length;
  const tier3 = processable.filter((t) => t.tier === 3).length;

  logger.info(
    {
      total: triageResults.length,
      processable: processable.length,
      skipped: skipped.length,
      tier1,
      tier2,
      tier3,
    },
    "Triage complete",
  );

  // 3. Create ModelManager and switch to scoring model
  const modelManager = new ModelManager(
    { triageModel, scoringModel, timeoutMs: MODEL_TIMEOUT_MS },
    logger,
    options.fetchFn,
    0, // no delay in pipeline (caller controls this)
  );
  await modelManager.ensureScoringModel();

  // 4. Create evaluation context
  const ctx = createContext();
  setStage(ctx, "scoring");

  // 5. Load knowledge context
  const knowledgeContext = buildKnowledgeContext();

  // 6. Group L4s by L3 for lookup
  const l4Map = groupL4sByL3(data.hierarchy);

  // 7. Build L3 lookup
  const l3Map = new Map(
    data.l3_opportunities.map((opp) => [opp.l3_name, opp]),
  );

  // 8. Sort processable by tier (1 first)
  processable.sort((a, b) => a.tier - b.tier);

  // 9. Score each opportunity
  let sinceLastArchive = 0;

  for (const triage of processable) {
    const opp = l3Map.get(triage.l3Name);
    if (!opp) {
      const msg = `L3 opportunity not found: ${triage.l3Name}`;
      addError(ctx, triage.l3Name, "scoring", msg);
      errors.push(msg);
      logger.warn({ oppId: triage.l3Name }, msg);
      continue;
    }

    const l4s = l4Map.get(triage.l3Name) ?? [];
    const childLog = logger.child({ oppId: triage.l3Name, tier: triage.tier });

    // Skip already-completed opportunities (resume support)
    if (completed.has(triage.l3Name)) {
      childLog.info("Skipping (already completed in previous run)");
      continue;
    }

    childLog.info("Scoring opportunity");

    // Use callWithResilience for three-tier error handling
    const resilient = await callWithResilience({
      primaryCall: async () => {
        const r = await scoreOneOpportunity(opp, l4s, data.company_context, knowledgeContext, options.chatFn);
        if ("error" in r) throw new Error(r.error);
        return JSON.stringify(r);
      },
      schema: z.any(),  // We validate via scoreOneOpportunity internally; this is a pass-through wrapper
      label: triage.l3Name,
      maxRetries: 1,  // scoreOneOpportunity already has internal retries via scoreWithRetry
    });

    if (resilient.result.success) {
      const sr = resilient.result.data as unknown as ScoringResult;
      addResult(ctx, sr);
      scoredCount++;
      if (sr.promotedToSimulation) promotedCount++;
      childLog.info(
        { composite: sr.composite.toFixed(2), promoted: sr.promotedToSimulation, resolvedVia: resilient.resolvedVia },
        "Scored",
      );
    } else {
      addError(ctx, triage.l3Name, "scoring", resilient.skipReason ?? resilient.result.error);
      errors.push(resilient.skipReason ?? resilient.result.error);
      childLog.warn({ error: resilient.skipReason, resolvedVia: "skipped" }, "Scoring skipped");
    }

    // Save checkpoint after each opportunity
    checkpoint.entries.push({
      l3Name: triage.l3Name,
      completedAt: new Date().toISOString(),
      status: resilient.result.success ? "scored" : "error",
    });
    saveCheckpoint(options.outputDir, checkpoint);

    sinceLastArchive++;
    if (sinceLastArchive >= archiveThreshold) {
      await archiveAndReset(ctx, options.outputDir);
      sinceLastArchive = 0;
      logger.info("Archived intermediate results");
    }
  }

  // 10. Final archive flush
  await archiveAndReset(ctx, options.outputDir);

  // 10b. Auto-commit evaluation artifacts
  const gitResult = autoCommitEvaluation({
    outputDir: options.outputDir,
    enabled: options.gitCommit !== false,
  });
  if (gitResult.committed) {
    logger.info("Evaluation artifacts committed to git");
  } else if (gitResult.error) {
    logger.warn({ error: gitResult.error }, "Git auto-commit failed (non-fatal)");
  }

  // 11. Unload models
  await modelManager.unloadAll();
  logger.info("Models unloaded");

  // 12. Build result
  const totalDurationMs = Date.now() - startMs;

  const pipelineResult: PipelineResult = {
    triageCount: triageResults.length,
    scoredCount,
    promotedCount,
    skippedCount: skipped.length,
    errorCount: errors.length,
    resumedCount,
    totalDurationMs,
    errors,
  };

  logger.info(
    {
      scored: scoredCount,
      promoted: promotedCount,
      errors: errors.length,
      durationMs: totalDurationMs,
    },
    "Pipeline complete",
  );

  return pipelineResult;
}
