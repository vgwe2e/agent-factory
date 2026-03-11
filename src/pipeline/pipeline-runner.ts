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
}

export interface PipelineResult {
  triageCount: number;
  scoredCount: number;
  promotedCount: number;
  skippedCount: number;
  errorCount: number;
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

    childLog.info("Scoring opportunity");

    try {
      const result = await scoreOneOpportunity(
        opp,
        l4s,
        data.company_context,
        knowledgeContext,
        options.chatFn,
      );

      if ("composite" in result) {
        const sr = result as ScoringResult;
        addResult(ctx, sr);
        scoredCount++;
        if (sr.promotedToSimulation) promotedCount++;
        childLog.info(
          {
            composite: sr.composite.toFixed(2),
            promoted: sr.promotedToSimulation,
          },
          "Scored",
        );
      } else {
        // Error result from scoreOneOpportunity
        const errResult = result as { error: string; l3Name: string };
        addError(ctx, errResult.l3Name, "scoring", errResult.error);
        errors.push(errResult.error);
        childLog.warn({ error: errResult.error }, "Scoring error");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err);
      addError(ctx, triage.l3Name, "scoring", msg);
      errors.push(msg);
      childLog.error({ error: msg }, "Scoring exception");
    }

    sinceLastArchive++;
    if (sinceLastArchive >= archiveThreshold) {
      await archiveAndReset(ctx, options.outputDir);
      sinceLastArchive = 0;
      logger.info("Archived intermediate results");
    }
  }

  // 10. Final archive flush
  await archiveAndReset(ctx, options.outputDir);

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
