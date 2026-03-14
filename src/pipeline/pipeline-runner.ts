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
import type { HierarchyExport, SkillWithContext } from "../types/hierarchy.js";
import type { ChatResult } from "../scoring/ollama-client.js";
import type { ScoringResult } from "../types/scoring.js";
import type { ParseResult } from "../ingestion/parse-export.js";
import type { CostTracker, CostSummary } from "../infra/cost-tracker.js";

import { z } from "zod";
import { parseExport } from "../ingestion/parse-export.js";
import { triageOpportunities } from "../triage/triage-pipeline.js";
import { scoreOneSkill } from "../scoring/scoring-pipeline.js";
import { ModelManager } from "../infra/model-manager.js";
import {
  createContext,
  addResult,
  addError,
  setStage,
  archiveAndReset,
} from "./context-tracker.js";
import { ollamaChat } from "../scoring/ollama-client.js";
import { buildKnowledgeContext } from "../scoring/knowledge-context.js";
import { groupL4sByL3 } from "../triage/red-flags.js";
import { extractScoringSkills } from "./extract-skills.js";
import { loadCheckpoint, getCompletedNames, createCheckpointWriter } from "../infra/checkpoint.js";
import { checkOllama, warmUpModel, isOllamaHealthy } from "../infra/ollama.js";
import type { Checkpoint } from "../infra/checkpoint.js";
import { Semaphore } from "../infra/semaphore.js";
import { withTimeout, TimeoutError } from "../infra/timeout.js";
import { callWithResilience } from "../infra/retry-policy.js";
import { createProgressTracker } from "./progress.js";
import { autoCommitEvaluation } from "../infra/git-commit.js";
import { writeFinalReports } from "../output/write-final-reports.js";
import { writeEvaluation } from "../output/write-evaluation.js";
import { loadArchivedScores } from "./load-archived-scores.js";
import { runSimulationPipeline as defaultRunSimulationPipeline } from "../simulation/simulation-pipeline.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { SimulationLlmTarget } from "../simulation/llm-client.js";
import { toSimulationInputs } from "./scoring-to-simulation.js";
import fs from "node:fs/promises";
import path from "node:path";

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
  /** Inject runSimulationPipeline for testing (avoids LLM calls in tests). */
  runSimulationPipelineFn?: typeof defaultRunSimulationPipeline;
  /** Scoring backend -- when "vllm", skips Ollama model management. Default: "ollama". */
  backend?: "ollama" | "vllm";
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

// -- Defaults --

const DEFAULT_ARCHIVE_THRESHOLD = 25;
const DEFAULT_TRIAGE_MODEL = "qwen3:8b";
const DEFAULT_SCORING_MODEL = "qwen3:30b";
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
  const allScoredResults: ScoringResult[] = [];
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
  // Extract skills from hierarchy
  const allSkills = extractScoringSkills(data.hierarchy);

  logger.info(
    {
      l3Count: data.l3_opportunities.length,
      l4Count: data.hierarchy.length,
      skillCount: allSkills.length,
    },
    "Export parsed",
  );

  // 1b. Load checkpoint for resume support
  const resolvedInput = path.resolve(inputPath);
  const existingCheckpoint = loadCheckpoint(options.outputDir);
  const isStale = !existingCheckpoint || path.resolve(existingCheckpoint.inputFile) !== resolvedInput;
  const checkpoint: Checkpoint = isStale
    ? { version: 1, inputFile: resolvedInput, startedAt: new Date().toISOString(), entries: [] }
    : existingCheckpoint;
  const completed = isStale ? new Set<string>() : getCompletedNames(existingCheckpoint);

  if (completed.size > 0) {
    const scoredFromCheckpoint = checkpoint.entries.filter((e) => e.status === 'scored').length;
    const errorsFromCheckpoint = checkpoint.entries.filter((e) => e.status === 'error').length;
    logger.info(
      { resuming: completed.size, scored: scoredFromCheckpoint, errors: errorsFromCheckpoint },
      `Resuming from checkpoint: ${scoredFromCheckpoint} scored, ${errorsFromCheckpoint} errors, ${completed.size} total completed`,
    );
  }

  const resumedCount = completed.size;

  // 1c. Load previously-scored results from archive so reports include ALL scores
  if (completed.size > 0) {
    const archived = await loadArchivedScores(options.outputDir);
    for (const sr of archived) {
      // Only include scores for skills we're skipping (already completed)
      // Current-session scores will be added during scoring below
      const key = sr.skillId ?? sr.l3Name;
      if (completed.has(key)) {
        allScoredResults.push(sr);
      }
    }
    logger.info(
      { archivedScoresLoaded: allScoredResults.length },
      `Loaded ${allScoredResults.length} archived scoring results for report generation`,
    );
  }

  // 2. Triage (pure function, no model needed)
  logger.info("Running triage");
  const triageResults = triageOpportunities(data);

  const maxTier = options.maxTier ?? 3;
  const processable = triageResults.filter(
    (t) => t.action === "process" && t.tier <= maxTier,
  );
  const skipped = triageResults.filter(
    (t) => t.action === "skip" || t.action === "demote" || (t.action === "process" && t.tier > maxTier),
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

  // 3. Create ModelManager and switch to scoring model (only for local Ollama backend)
  const useLocalModels = options.backend !== "vllm"; // explicit vllm backend skips local model management

  // Health check and warm-up only for real Ollama runs (no chatFn/fetchFn injection)
  const isRealOllama = useLocalModels && !options.chatFn && !options.fetchFn;
  if (isRealOllama) {
    // Verify Ollama is running and required models are available before starting
    logger.info("Checking Ollama connectivity and model availability");
    const ollamaStatus = await checkOllama([scoringModel]);
    if (!ollamaStatus.connected) {
      throw new Error(
        `Ollama is not running. Start it with: ollama serve`,
      );
    }
    if (ollamaStatus.missingModels.length > 0) {
      throw new Error(
        `Required Ollama model(s) not found: ${ollamaStatus.missingModels.join(", ")}. ` +
        `Pull with: ${ollamaStatus.missingModels.map((m) => `ollama pull ${m}`).join("; ")}`,
      );
    }
    logger.info({ models: ollamaStatus.models.length }, "Ollama health check passed");
  }

  const modelManager = useLocalModels
    ? new ModelManager(
        { triageModel, scoringModel, timeoutMs: MODEL_TIMEOUT_MS },
        logger,
        options.fetchFn,
        0, // no delay in pipeline (caller controls this)
      )
    : null;
  if (modelManager) {
    await modelManager.ensureScoringModel();

    // Warm up the scoring model to avoid cold-start latency on first opportunity
    // (skip in tests where chatFn or fetchFn is injected)
    if (isRealOllama) {
      logger.info({ model: scoringModel }, "Warming up scoring model");
      const warmUp = await warmUpModel(scoringModel);
      if (warmUp.success) {
        logger.info({ durationMs: warmUp.durationMs }, "Scoring model warm-up complete");
      } else {
        logger.warn({ error: warmUp.error, durationMs: warmUp.durationMs }, "Scoring model warm-up failed (non-fatal, proceeding)");
      }
    }
  }

  // 4. Create evaluation context
  const ctx = createContext();
  setStage(ctx, "scoring");

  // 5. Load knowledge context
  const knowledgeContext = buildKnowledgeContext();

  // 6. Group L4s by L3 for lookup (needed for simulation)
  const l4Map = groupL4sByL3(data.hierarchy);

  // 7. Build L3 lookup (needed for simulation)
  const l3Map = new Map(
    data.l3_opportunities.map((opp) => [opp.l3_name, opp]),
  );

  // 7b. Build skill lookup from triage results (skillId -> SkillWithContext)
  const skillMap = new Map<string, SkillWithContext>();
  for (const skill of allSkills) {
    skillMap.set(skill.id, skill);
  }

  // 8. Sort processable by tier (1 first)
  processable.sort((a, b) => a.tier - b.tier);

  // 9. Score each skill (concurrently via semaphore)
  //
  // Thread-safety note: addResult/addError mutate EvaluationContext (Set, Map, Array).
  // In Node.js single-threaded event loop, these mutations are safe even with concurrent
  // promises because each mutation runs to completion within its microtask. No mutex needed.
  const concurrency = options.concurrency ?? 1;
  const requestTimeoutMs = options.requestTimeoutMs ?? 1_500_000; // 25 min — matches SCORING_TIMEOUT_MS
  const semaphore = new Semaphore(concurrency);
  const writer = createCheckpointWriter(options.outputDir, checkpoint);
  const cleanupSignalHandlers = writer.installSignalHandlers();
  const progress = createProgressTracker(processable.length, logger);
  const progressInterval = setInterval(() => progress.report(), 5000);

  try {
    const tasks = processable.map((triage) => semaphore.run(async () => {
      const skillId = triage.skillId;
      const skillName = triage.skillName ?? triage.l3Name;
      const skill = skillId ? skillMap.get(skillId) : undefined;
      if (!skill) {
        const msg = `Skill not found: ${skillName} (${skillId})`;
        addError(ctx, skillId ?? triage.l3Name, "scoring", msg);
        errors.push(msg);
        logger.warn({ skillId, skillName }, msg);
        return;
      }

      const childLog = logger.child({ skillId, skillName, tier: triage.tier });

      // Skip already-completed skills (resume support)
      if (completed.has(skillId ?? triage.l3Name)) {
        childLog.info("Skipping (already completed in previous run)");
        return;
      }

      childLog.info("Scoring skill");
      progress.start(skillName);

      // Use 8B model for Tier 3 (faster, acceptable quality for low-priority skills)
      const tierChatFn = options.chatFn ?? (triage.tier >= 3
        ? (msgs: Array<{ role: string; content: string }>, fmt: Record<string, unknown>) => ollamaChat(msgs, fmt, triageModel)
        : undefined);

      try {
        // Use callWithResilience wrapped in withTimeout for stuck request protection
        const resilient = await withTimeout(
          (_signal) => callWithResilience({
            primaryCall: async () => {
              const r = await scoreOneSkill(skill, data.company_context, knowledgeContext, tierChatFn);
              if ("error" in r) throw new Error(r.error);
              return JSON.stringify(r);
            },
            schema: z.any(),  // We validate via scoreOneSkill internally; this is a pass-through wrapper
            label: skillName,
            maxRetries: 1,  // scoreOneSkill already has internal retries via scoreWithRetry
          }),
          requestTimeoutMs,
        );

        if (resilient.result.success) {
          const sr = resilient.result.data as unknown as ScoringResult;
          addResult(ctx, sr);
          allScoredResults.push(sr);
          scoredCount++;
          if (sr.promotedToSimulation) promotedCount++;
          childLog.info(
            { composite: sr.composite.toFixed(2), promoted: sr.promotedToSimulation, resolvedVia: resilient.resolvedVia },
            "Scored",
          );
          progress.complete(skillName);
        } else {
          addError(ctx, skillId ?? triage.l3Name, "scoring", resilient.skipReason ?? resilient.result.error);
          errors.push(resilient.skipReason ?? resilient.result.error);
          childLog.warn({ error: resilient.skipReason, resolvedVia: "skipped" }, "Scoring skipped");
          progress.error(skillName);
        }

        // Enqueue checkpoint entry (atomic writer handles debounced disk writes)
        writer.enqueue({
          skillId: skillId,
          completedAt: new Date().toISOString(),
          status: resilient.result.success ? "scored" : "error",
        });
      } catch (err) {
        // Handle timeout specifically
        if (err instanceof TimeoutError) {
          const msg = `Scoring timed out after ${err.timeoutMs}ms for ${skillName}`;
          addError(ctx, skillId ?? triage.l3Name, "scoring", msg);
          errors.push(msg);
          childLog.warn({ timeoutMs: err.timeoutMs }, "Scoring timed out");

          // Mid-run health check: is Ollama still alive, or did it crash?
          if (isRealOllama) {
            const healthy = await isOllamaHealthy(5000);
            if (!healthy) {
              childLog.error("Ollama is unresponsive after timeout — it may have crashed. Aborting pipeline.");
              throw new Error("Ollama became unresponsive during scoring. Check `ollama serve` and system memory.");
            }
          }
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          addError(ctx, skillId ?? triage.l3Name, "scoring", msg);
          errors.push(msg);
          childLog.warn({ error: msg }, "Scoring failed unexpectedly");
        }
        progress.error(skillName);

        writer.enqueue({
          skillId: skillId,
          completedAt: new Date().toISOString(),
          status: "error",
        });
      }
    }));

    await Promise.allSettled(tasks);
  } finally {
    clearInterval(progressInterval);
    cleanupSignalHandlers();
  }

  // Flush checkpoint and log final progress
  writer.flush();
  progress.report();

  // Archive all results in a single batch after concurrent scoring completes
  if (ctx.results.size > 0) {
    await archiveAndReset(ctx, options.outputDir);
    logger.info("Archived scoring results");
  }

  // 10. Final archive flush
  await archiveAndReset(ctx, options.outputDir);

  // 10-dedup. Deduplicate allScoredResults: current session scores override archived scores
  const deduped = new Map<string, ScoringResult>();
  for (const sr of allScoredResults) {
    const key = sr.skillId ?? sr.l3Name;
    deduped.set(key, sr); // later entries (current session) overwrite earlier (archived)
  }
  const finalScoredResults = [...deduped.values()];

  // 10a. Write evaluation output files
  const companyName = data.company_context.company_name;
  const evalResult = await writeEvaluation(
    options.outputDir,
    finalScoredResults,
    triageResults,
    companyName,
  );
  if (evalResult.success) {
    logger.info({ files: evalResult.files.length }, "Evaluation files written");
  } else {
    logger.warn({ error: evalResult.error }, "Evaluation files failed (non-fatal)");
  }

  // 10b. Run simulation pipeline for promoted opportunities
  const promoted = finalScoredResults.filter((sr) => sr.promotedToSimulation);
  const simInputs = toSimulationInputs(promoted, l3Map, l4Map, data.company_context);
  const simDir = path.join(options.outputDir, "evaluation", "simulations");

  let simResult: SimulationPipelineResult;
  if (!options.skipSim) {
    try {
      const runSim = options.runSimulationPipelineFn ?? defaultRunSimulationPipeline;
      simResult = await runSim(
        simInputs,
        simDir,
        options.simulationLlmTarget,
        undefined,
        options.simTimeoutMs ? { timeoutMs: options.simTimeoutMs } : undefined,
      );
      logger.info(
        { simulated: simResult.totalSimulated, failed: simResult.totalFailed },
        "Simulation pipeline complete",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ error: msg }, "Simulation pipeline failed (non-fatal)");
      simResult = {
        results: [],
        totalSimulated: 0,
        totalFailed: 0,
        totalConfirmed: 0,
        totalInferred: 0,
      };
    }
  } else {
    logger.info("Simulation phase skipped (--skip-sim)");
    simResult = {
      results: [],
      totalSimulated: 0,
      totalFailed: 0,
      totalConfirmed: 0,
      totalInferred: 0,
    };
  }

  // 10c. Auto-commit evaluation artifacts (after simulation so artifacts are included)
  const gitResult = autoCommitEvaluation({
    outputDir: options.outputDir,
    enabled: options.gitCommit !== false,
  });
  if (gitResult.committed) {
    logger.info("Evaluation artifacts committed to git");
  } else if (gitResult.error) {
    logger.warn({ error: gitResult.error }, "Git auto-commit failed (non-fatal)");
  }

  // 10d. Write final reports (summary, dead-zones, meta-reflection)
  const reportResult = await writeFinalReports(
    options.outputDir,
    finalScoredResults,
    triageResults,
    simResult,
    companyName,
    undefined,
    options.skipSim,
  );
  if (reportResult.success) {
    logger.info({ files: reportResult.files.length }, "Final reports written");
  } else {
    logger.warn({ error: reportResult.error }, "Final reports failed (non-fatal)");
  }

  // 11. Unload models (only for local Ollama backend)
  if (modelManager) {
    await modelManager.unloadAll();
    logger.info("Models unloaded");
  }

  // 12. Build result
  const totalDurationMs = Date.now() - startMs;

  // Cost tracking (cloud backends only)
  const costSummary = options.costTracker?.summary();
  if (costSummary) {
    logger.info({ costSummary }, "Cloud GPU cost summary");

    // Write cloud cost artifact to evaluation directory
    const evalDir = path.join(options.outputDir, "evaluation");
    const costPath = path.join(evalDir, "cloud-cost.json");
    try {
      await fs.mkdir(evalDir, { recursive: true });
      await fs.writeFile(costPath, JSON.stringify(costSummary, null, 2), "utf-8");
      logger.info({ path: costPath }, "Cloud cost artifact written");
    } catch (err) {
      logger.warn({ error: err instanceof Error ? err.message : String(err) }, "Failed to write cloud cost artifact (non-fatal)");
    }
  }

  const pipelineResult: PipelineResult = {
    triageCount: triageResults.length,
    scoredCount,
    promotedCount,
    skippedCount: skipped.length,
    errorCount: errors.length,
    resumedCount,
    simulatedCount: simResult.totalSimulated,
    simErrorCount: simResult.totalFailed,
    totalDurationMs,
    concurrency,
    avgPerOppMs: scoredCount > 0 ? Math.round(totalDurationMs / scoredCount) : 0,
    errors,
    costSummary,
    scoringMode: options.scoringMode ?? "three-lens",
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
