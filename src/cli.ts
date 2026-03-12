#!/usr/bin/env node

/**
 * Aera Skill Feasibility Engine -- CLI entry point.
 *
 * Usage: npx tsx cli.ts --input <path-to-hierarchy-export.json>
 *        npx tsx cli.ts --input export.json --log-level debug --output-dir ./results
 *        npx tsx cli.ts --input export.json --backend vllm  (auto-provisions RunPod H100)
 */

import "dotenv/config";
import { Command, Option } from "commander";
import { parseExport } from "./ingestion/parse-export.js";
import { checkOllama, formatOllamaStatus } from "./infra/ollama.js";
import { createLogger } from "./infra/logger.js";
import { runPipeline } from "./pipeline/pipeline-runner.js";
import { createBackend } from "./infra/backend-factory.js";
import type { Backend, BackendConfig } from "./infra/backend-factory.js";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const LOG_LEVELS = ["silent", "fatal", "error", "warn", "info", "debug", "trace"] as const;

const program = new Command();

program
  .name("aera-evaluate")
  .description(
    "Aera Skill Feasibility Engine -- evaluate hierarchy exports",
  )
  .requiredOption("--input <path>", "Path to hierarchy JSON export file")
  .option(
    "--log-level <level>",
    `Structured log level (${LOG_LEVELS.join(", ")})`,
    "info",
  )
  .option(
    "--output-dir <path>",
    "Output directory for evaluation results",
    "./evaluation",
  )
  .addOption(
    new Option("--backend <backend>", "Scoring backend (ollama or vllm)")
      .choices(["ollama", "vllm"])
      .default("ollama"),
  )
  .option(
    "--vllm-url <url>",
    "vLLM server URL (required when --backend vllm without RUNPOD_API_KEY)",
  )
  .option(
    "--concurrency <n>",
    "Number of opportunities to score in parallel (default: 1)",
    "1",
  )
  .option(
    "--max-tier <n>",
    "Only score opportunities up to this tier (1, 2, or 3)",
    "3",
  )
  .option("--skip-sim", "Skip simulation phase (scoring only)")
  .option("--sim-timeout <ms>", "Per-opportunity simulation timeout in milliseconds")
  .action(async (opts: { input: string; logLevel: string; outputDir: string; backend: string; vllmUrl?: string; concurrency: string; maxTier: string; skipSim?: boolean; simTimeout?: string }) => {
    console.log(`${BOLD}Aera Skill Feasibility Engine v1.1.0${RESET}`);
    console.log(`Loading export: ${opts.input}...`);
    console.log();

    // Pre-flight: parse and display export info
    const result = await parseExport(opts.input);

    if (!result.success) {
      console.error(`${RED}Error: ${result.error}${RESET}`);
      process.exit(1);
    }

    const { meta, company_context, hierarchy, l3_opportunities } = result.data;

    // Format revenue
    const revenueStr =
      company_context.annual_revenue !== null
        ? "$" +
          new Intl.NumberFormat("en-US").format(company_context.annual_revenue)
        : "N/A";

    // Format employee count
    const employeeStr =
      company_context.employee_count !== null
        ? new Intl.NumberFormat("en-US").format(company_context.employee_count)
        : "N/A";

    // Get unique L1 domains from hierarchy
    const domains = [...new Set(hierarchy.map((h) => h.l1))].sort();

    console.log("=== Export Loaded ===");
    console.log(`Project:       ${meta.project_name}`);
    console.log(`Company:       ${company_context.company_name}`);
    console.log(`Industry:      ${company_context.industry}`);
    console.log(`Revenue:       ${revenueStr}`);
    console.log(`Employees:     ${employeeStr}`);
    console.log(
      `ERP Stack:     ${company_context.enterprise_applications.join(", ")}`,
    );
    console.log();
    console.log("=== Hierarchy ===");
    console.log(`L4 Activities: ${hierarchy.length}`);
    console.log(`L3 Opportunities: ${l3_opportunities.length}`);
    console.log(`Domains:       ${domains.join(", ")}`);
    console.log();

    // Validate concurrency
    const concurrency = parseInt(opts.concurrency, 10);
    if (isNaN(concurrency) || concurrency < 1) {
      console.error(`${RED}Error: --concurrency must be a positive integer${RESET}`);
      process.exit(1);
    }

    // Validate max-tier
    const maxTier = parseInt(opts.maxTier, 10);
    if (isNaN(maxTier) || maxTier < 1 || maxTier > 3) {
      console.error(`${RED}Error: --max-tier must be 1, 2, or 3${RESET}`);
      process.exit(1);
    }

    // Validate sim-timeout
    let simTimeoutMs: number | undefined;
    if (opts.simTimeout != null) {
      simTimeoutMs = parseInt(opts.simTimeout, 10);
      if (isNaN(simTimeoutMs) || simTimeoutMs < 1) {
        console.error(`${RED}Error: --sim-timeout must be a positive integer${RESET}`);
        process.exit(1);
      }
    }

    // Validate vLLM backend requirements
    const backend = opts.backend as Backend;
    if (backend === "vllm" && !opts.vllmUrl && !process.env.RUNPOD_API_KEY) {
      console.error(`${RED}Error: Either --vllm-url or RUNPOD_API_KEY environment variable is required when --backend is vllm${RESET}`);
      process.exit(1);
    }

    // Ollama connectivity check (only for ollama backend)
    if (backend === "ollama") {
      const ollamaStatus = await checkOllama();
      console.log("=== Ollama ===");
      console.log(formatOllamaStatus(ollamaStatus));
      console.log();
    }

    // Create backend (validates schemas for vLLM, auto-provisions cloud if needed)
    let backendConfig: BackendConfig;
    try {
      backendConfig = await createBackend(backend, {
        vllmUrl: opts.vllmUrl,
        vllmModel: undefined,
        runpodApiKey: process.env.RUNPOD_API_KEY,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${RED}${msg}${RESET}`);
      process.exit(1);
    }

    // Signal handler teardown for cloud resources
    let cleanedUp = false;
    const doCleanup = async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (backendConfig.cleanup) {
        console.log("\nTearing down cloud resources...");
        await backendConfig.cleanup();
        console.log("Cloud resources torn down.");
      }
    };

    process.on("SIGINT", async () => { await doCleanup(); process.exit(130); });
    process.on("SIGTERM", async () => { await doCleanup(); process.exit(143); });

    // --- Run full pipeline ---
    const logger = createLogger(opts.logLevel);

    console.log("=== Pipeline ===");
    if (backend === "vllm" && !opts.vllmUrl) {
      console.log(`Backend:     vllm (RunPod cloud)`);
      if (backendConfig.endpointId) {
        console.log(`Endpoint:    ${backendConfig.endpointId}`);
      }
    } else if (backend === "vllm") {
      console.log(`Backend:     vllm (user-managed)`);
      console.log(`vLLM URL:    ${opts.vllmUrl}`);
    } else {
      console.log(`Backend:     ollama (local)`);
    }
    console.log(`Concurrency: ${concurrency}`);
    if (maxTier < 3) {
      console.log(`Max tier:    ${maxTier} (skipping tier ${maxTier + 1}+)`);
    }
    console.log(`Log level:   ${opts.logLevel}`);
    console.log(`Output dir:  ${opts.outputDir}`);
    console.log();

    let pipelineResult;
    try {
      // Start cost tracking if cloud backend
      if (backendConfig.costTracker) {
        backendConfig.costTracker.start();
      }

      pipelineResult = await runPipeline(
        opts.input,
        {
          outputDir: opts.outputDir,
          logLevel: opts.logLevel,
          chatFn: backendConfig.chatFn,
          backend,
          concurrency,
          maxTier,
          skipSim: opts.skipSim ?? false,
          simTimeoutMs,
          costTracker: backendConfig.costTracker,
        },
        logger,
      );
    } finally {
      // Stop cost tracking
      if (backendConfig.costTracker) {
        backendConfig.costTracker.stop();
      }
      // Always tear down cloud resources
      await doCleanup();
    }

    // Print summary
    const durationSec = (pipelineResult.totalDurationMs / 1000).toFixed(1);
    console.log();
    console.log("=== Pipeline Complete ===");
    console.log(`Triaged:   ${pipelineResult.triageCount} opportunities`);
    console.log(`Skipped:   ${pipelineResult.skippedCount}`);
    console.log(`Scored:    ${pipelineResult.scoredCount}`);
    console.log(`Promoted:  ${pipelineResult.promotedCount} to simulation`);
    console.log(`Simulated: ${opts.skipSim ? "skipped" : pipelineResult.simulatedCount}`);
    if (pipelineResult.simErrorCount > 0) {
      console.log(`Sim errors: ${pipelineResult.simErrorCount}`);
    }
    console.log(`Errors:    ${pipelineResult.errorCount}`);
    console.log(`Duration:  ${durationSec}s`);

    // Cloud cost summary
    if (backendConfig.costTracker) {
      const cost = backendConfig.costTracker.summary();
      console.log();
      console.log("=== Cloud Cost ===");
      console.log(`GPU time:    ${cost.gpuHours}`);
      console.log(`Est. cost:   ${cost.estimatedCost}`);
      console.log(`Rate:        $${cost.ratePerHour}/hr`);
    }

    if (pipelineResult.errorCount > 0 && pipelineResult.scoredCount === 0) {
      console.error(`${RED}All opportunities errored. Check logs for details.${RESET}`);
      process.exit(1);
    }

    console.log(`${GREEN}Results written to ${opts.outputDir}${RESET}`);
  });

program.parse();
