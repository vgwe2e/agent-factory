#!/usr/bin/env node
/**
 * Aera Skill Feasibility Engine -- CLI entry point.
 *
 * Usage: npx tsx cli.ts --input <path-to-hierarchy-export.json>
 *        npx tsx cli.ts --input export.json --log-level debug --output-dir ./results
 *        npx tsx cli.ts --input export.json --backend vllm  (auto-provisions RunPod H100)
 */
import "dotenv/config";
import type { PipelineResult } from "./pipeline/pipeline-runner.js";
export declare function resolveOutputDir(explicitOutputDir: string | undefined, backend: string): string;
export interface LifecycleOptions {
    pipelineFn: () => Promise<PipelineResult>;
    clearCheckpointErrorsFn: (outputDir: string) => number;
    cleanupFn: () => Promise<void>;
    teardown: boolean;
    maxRetries: number;
    outputDir: string;
}
export interface LifecycleResult {
    exitCode: 0 | 1 | 2;
    lastResult?: PipelineResult;
    fatalError?: string;
}
/**
 * Run the pipeline with retry loop, teardown control, and structured exit codes.
 *
 * Exit codes:
 * - 0: all opportunities scored successfully
 * - 1: errors remain after all retries exhausted
 * - 2: fatal/thrown error (parse failure, infra down)
 */
export declare function runWithRetries(opts: LifecycleOptions): Promise<LifecycleResult>;
