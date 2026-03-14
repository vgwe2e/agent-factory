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
import type { EvaluationContext } from "./context-tracker.js";
import type { TriageResult } from "../types/triage.js";
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
import { loadCheckpoint, getCompletedNames, createCheckpointWriter, loadCheckpointForMode, getCompletedL4Ids, createCheckpointV2Writer } from "../infra/checkpoint.js";
import { checkOllama, warmUpModel, isOllamaHealthy } from "../infra/ollama.js";
import type { Checkpoint, CheckpointV2 } from "../infra/checkpoint.js";
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
import { toSimulationInputs, toL4SimulationInputs } from "./scoring-to-simulation.js";
import { preScoreAll } from "../scoring/deterministic/pre-scorer.js";
import { scoreConsolidated } from "../scoring/consolidated-scorer.js";
import type { FilterResult, FilterStats, PreScoreResult } from "../types/scoring.js";
import { formatPreScoreTsv } from "../output/format-pre-score-tsv.js";
import type { L4Activity } from "../types/hierarchy.js";
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

// -- Internal scoring helpers --

/**
 * Three-lens scoring loop (v1.2 code path).
 *
 * Extracted verbatim from runPipeline for clean branching between
 * three-lens and two-pass scoring modes. Contains the exact existing
 * code with no behavioral changes.
 */
async function runThreeLensScoring(
  processable: TriageResult[],
  allSkills: SkillWithContext[],
  skillMap: Map<string, SkillWithContext>,
  completed: Set<string>,
  checkpoint: Checkpoint,
  data: HierarchyExport,
  knowledgeContext: string,
  options: PipelineOptions,
  logger: Logger,
  ctx: EvaluationContext,
  isRealOllama: boolean,
  triageModel: string,
): Promise<{ scored: ScoringResult[]; errors: string[]; scoredCount: number; promotedCount: number }> {
  const scored: ScoringResult[] = [];
  const errors: string[] = [];
  let scoredCount = 0;
  let promotedCount = 0;

  const concurrency = options.concurrency ?? 1;
  const requestTimeoutMs = options.requestTimeoutMs ?? 1_500_000;
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
            schema: z.any(),
            label: skillName,
            maxRetries: 1,
          }),
          requestTimeoutMs,
        );

        if (resilient.result.success) {
          const sr = resilient.result.data as unknown as ScoringResult;
          addResult(ctx, sr);
          scored.push(sr);
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

  return { scored, errors, scoredCount, promotedCount };
}

/**
 * Two-pass scoring loop (v1.3 code path).
 *
 * Flow: deterministic pre-score all L4s -> top-N filter -> LLM score survivors
 * with consolidated single-call scorer -> build ScoringResult from results.
 *
 * Uses the same semaphore/timeout/retry infrastructure as three-lens.
 */
async function runTwoPassScoring(
  hierarchy: L4Activity[],
  allSkills: SkillWithContext[],
  completed: Set<string>,
  checkpoint: CheckpointV2,
  data: HierarchyExport,
  knowledgeContext: string,
  options: PipelineOptions,
  logger: Logger,
  ctx: EvaluationContext,
): Promise<{ scored: ScoringResult[]; errors: string[]; scoredCount: number; promotedCount: number; filterResult: FilterResult }> {
  const scored: ScoringResult[] = [];
  const errors: string[] = [];
  let scoredCount = 0;
  let promotedCount = 0;

  // Step 1: Deterministic pre-score all L4s
  const topN = options.topN ?? 50;
  logger.info({ l4Count: hierarchy.length, topN }, "Pre-scoring all L4 activities (deterministic)");
  const filterResult = preScoreAll(hierarchy, topN);
  logger.info(
    {
      totalCandidates: filterResult.stats.totalCandidates,
      survivors: filterResult.stats.actualSurvivors,
      eliminated: filterResult.stats.eliminated,
      cutoffScore: filterResult.stats.cutoffScore,
    },
    "Pre-scoring complete",
  );

  // Step 2: Write pre-score TSV (two-pass only)
  const evalDir = path.join(options.outputDir, "evaluation");
  try {
    await fs.mkdir(evalDir, { recursive: true });
    const allPreScores = [...filterResult.survivors, ...filterResult.eliminated];
    const tsvContent = formatPreScoreTsv(allPreScores);
    await fs.writeFile(path.join(evalDir, "pre-scores.tsv"), tsvContent, "utf-8");
    logger.info("Pre-score TSV written");
  } catch (err) {
    logger.warn({ error: err instanceof Error ? err.message : String(err) }, "Failed to write pre-score TSV (non-fatal)");
  }

  // Step 3: Get survivors for LLM scoring
  const survivors = filterResult.survivors;
  if (survivors.length === 0) {
    logger.info("No survivors from pre-scoring filter");
    return { scored, errors, scoredCount, promotedCount, filterResult };
  }

  // Step 4: Build skill lookup by L4 name for consolidated scorer
  const skillByL4 = new Map<string, SkillWithContext>();
  for (const skill of allSkills) {
    // First skill per L4 wins (consolidated scorer only needs one skill per L4)
    if (!skillByL4.has(skill.l4Name)) {
      skillByL4.set(skill.l4Name, skill);
    }
  }

  // Step 5: Score each survivor via semaphore
  const concurrency = options.concurrency ?? 1;
  const requestTimeoutMs = options.requestTimeoutMs ?? 1_500_000;
  const semaphore = new Semaphore(concurrency);
  const writer = createCheckpointV2Writer(options.outputDir, checkpoint);
  const cleanupSignalHandlers = writer.installSignalHandlers();
  const progress = createProgressTracker(survivors.length, logger);
  const progressInterval = setInterval(() => progress.report(), 5000);

  try {
    const tasks = survivors.map((preScore) => semaphore.run(async () => {
      const l4Id = preScore.l4Id;
      const l4Name = preScore.l4Name;

      // Skip already-completed L4s (resume support)
      if (completed.has(l4Id)) {
        logger.info({ l4Id, l4Name }, "Skipping (already completed in previous run)");
        return;
      }

      const childLog = logger.child({ l4Id, l4Name, composite: preScore.composite.toFixed(4) });
      childLog.info("Scoring survivor (consolidated)");
      progress.start(l4Name);

      // Find a skill for the consolidated scorer
      let skill = skillByL4.get(l4Name);
      if (!skill) {
        // Try to create a minimal SkillWithContext from the L4 activity data
        const l4 = data.hierarchy.find(h => h.id === l4Id);
        if (!l4 || l4.skills.length === 0) {
          // L4 has no skills -- cannot be LLM-scored. Skip silently.
          childLog.info("Skipping (no skills under this L4)");
          progress.complete(l4Name);
          return;
        }
        // Use extractScoringSkills pattern for the first skill
        const rawSkill = l4.skills[0];
        skill = {
          ...rawSkill,
          execution: rawSkill.execution ?? { target_systems: [], write_back_actions: [], execution_trigger: null, execution_frequency: null, autonomy_level: null, approval_required: null, approval_threshold: null, rollback_strategy: null },
          problem_statement: rawSkill.problem_statement ?? { current_state: "", quantified_pain: "", root_cause: "", falsifiability_check: "", outcome: "" },
          l4Name: l4.name,
          l4Id: l4.id,
          l3Name: l4.l3,
          l2Name: l4.l2,
          l1Name: l4.l1,
          financialRating: l4.financial_rating,
          aiSuitability: l4.ai_suitability,
          impactOrder: l4.impact_order,
          ratingConfidence: l4.rating_confidence,
          decisionExists: l4.decision_exists,
          decisionArticulation: l4.decision_articulation,
        };
      }

      const chatFn = options.chatFn;
      if (!chatFn) {
        const msg = `No chatFn available for two-pass scoring of ${l4Name}`;
        addError(ctx, l4Id, "scoring", msg);
        errors.push(msg);
        progress.error(l4Name);
        return;
      }

      try {
        // scoreConsolidated handles retry internally via scoreWithRetry.
        // We wrap in withTimeout for stuck-request protection.
        const result = await withTimeout(
          (_signal) => scoreConsolidated(skill!, knowledgeContext, preScore, chatFn),
          requestTimeoutMs,
        );

        if (result.success) {
          // Build ScoringResult from ConsolidatedScorerResult
          const sr: ScoringResult = {
            skillId: skill!.id,
            skillName: skill!.name,
            l4Name: preScore.l4Name,
            l3Name: preScore.l3Name,
            l2Name: preScore.l2Name,
            l1Name: preScore.l1Name,
            archetype: skill!.archetype as import("../types/hierarchy.js").LeadArchetype,
            lenses: result.lenses,
            composite: result.composite,
            overallConfidence: result.overallConfidence,
            promotedToSimulation: result.promotedToSimulation,
            scoringDurationMs: result.scoringDurationMs,
            sanityVerdict: result.sanityVerdict,
            sanityJustification: result.sanityJustification,
            preScore: result.preScore,
          };

          addResult(ctx, sr);
          scored.push(sr);
          scoredCount++;
          if (sr.promotedToSimulation) promotedCount++;
          childLog.info(
            { composite: sr.composite.toFixed(2), promoted: sr.promotedToSimulation },
            "Scored (consolidated)",
          );
          progress.complete(l4Name);

          // V2 checkpoint entry
          writer.enqueue({
            l4Id,
            completedAt: new Date().toISOString(),
            status: "scored",
          } as never);
        } else {
          addError(ctx, l4Id, "scoring", result.error);
          errors.push(result.error);
          childLog.warn({ error: result.error }, "Scoring failed");
          progress.error(l4Name);

          writer.enqueue({
            l4Id,
            completedAt: new Date().toISOString(),
            status: "error",
          } as never);
        }
      } catch (err) {
        if (err instanceof TimeoutError) {
          const msg = `Scoring timed out after ${err.timeoutMs}ms for ${l4Name}`;
          addError(ctx, l4Id, "scoring", msg);
          errors.push(msg);
          childLog.warn({ timeoutMs: err.timeoutMs }, "Scoring timed out");
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          addError(ctx, l4Id, "scoring", msg);
          errors.push(msg);
          childLog.warn({ error: msg }, "Scoring failed unexpectedly");
        }
        progress.error(l4Name);

        writer.enqueue({
          l4Id,
          completedAt: new Date().toISOString(),
          status: "error",
        } as never);
      }
    }));

    await Promise.allSettled(tasks);
  } finally {
    clearInterval(progressInterval);
    cleanupSignalHandlers();
  }

  writer.flush();
  progress.report();

  return { scored, errors, scoredCount, promotedCount, filterResult };
}

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

  // 9. Score each skill via the appropriate scoring path
  const scoringMode = options.scoringMode ?? "three-lens";
  const concurrency = options.concurrency ?? 1;
  let filterStats: FilterStats | undefined;

  if (scoringMode === "two-pass") {
    // Two-pass: pre-score -> filter -> consolidated LLM scoring
    const { checkpoint: ckpt, backedUp } = loadCheckpointForMode(options.outputDir, "two-pass");
    if (backedUp) logger.info("Backed up v1.2 checkpoint as .checkpoint.v12.bak");
    const twoPassCheckpoint: CheckpointV2 = (ckpt as CheckpointV2) ?? {
      version: 2 as const,
      scoringMode: "two-pass" as const,
      inputFile: resolvedInput,
      startedAt: new Date().toISOString(),
      entries: [],
    };
    const completedL4s = getCompletedL4Ids((ckpt as CheckpointV2) ?? null);

    const twoPassResult = await runTwoPassScoring(
      data.hierarchy,
      allSkills,
      completedL4s,
      twoPassCheckpoint,
      data,
      knowledgeContext,
      options,
      logger,
      ctx,
    );
    allScoredResults.push(...twoPassResult.scored);
    errors.push(...twoPassResult.errors);
    scoredCount += twoPassResult.scoredCount;
    promotedCount += twoPassResult.promotedCount;
    filterStats = twoPassResult.filterResult.stats;
  } else {
    // Three-lens scoring (v1.2 code path)
    const threeLensResult = await runThreeLensScoring(
      processable,
      allSkills,
      skillMap,
      completed,
      checkpoint,
      data,
      knowledgeContext,
      options,
      logger,
      ctx,
      isRealOllama,
      triageModel,
    );
    allScoredResults.push(...threeLensResult.scored);
    errors.push(...threeLensResult.errors);
    scoredCount += threeLensResult.scoredCount;
    promotedCount += threeLensResult.promotedCount;
  }

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
  let simInputs;
  if (scoringMode === "two-pass") {
    // Build per-L4 name lookup for toL4SimulationInputs
    const l4ByName = new Map<string, L4Activity>();
    for (const l4 of data.hierarchy) {
      l4ByName.set(l4.name, l4);
    }
    simInputs = toL4SimulationInputs(promoted, l4ByName, l3Map, data.company_context);
  } else {
    simInputs = toSimulationInputs(promoted, l3Map, l4Map, data.company_context);
  }
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
    scoringMode,
    // Two-pass specific stats
    ...(filterStats && {
      preScoredCount: filterStats.totalCandidates,
      survivorCount: filterStats.actualSurvivors,
      cutoffScore: filterStats.cutoffScore,
    }),
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
