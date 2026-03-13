#!/usr/bin/env npx tsx
/**
 * Regenerate evaluation reports from archived checkpoint data.
 *
 * Reads .pipeline/checkpoint-*.json files to reconstruct ScoringResult[],
 * re-runs triage for TriageResult[], then calls writeEvaluation + writeFinalReports.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { parseExport } from "./ingestion/parse-export.js";
import { triageOpportunities } from "./triage/triage-pipeline.js";
import { writeEvaluation } from "./output/write-evaluation.js";
import { writeFinalReports } from "./output/write-final-reports.js";
import type { ScoringResult } from "./types/scoring.js";
import type { SimulationPipelineResult } from "./simulation/simulation-pipeline.js";

const INPUT = process.argv[2] || "../.planning/ford_hierarchy_v3_export.json";
const OUTPUT_DIR = process.argv[3] || "./evaluation";

async function main() {
  // 1. Load scored results from archived checkpoints
  const pipelineDir = path.join(OUTPUT_DIR, ".pipeline");
  const files = (await fs.readdir(pipelineDir)).filter(f => f.startsWith("checkpoint-")).sort();

  const allScored: Map<string, ScoringResult> = new Map();
  for (const file of files) {
    const raw = JSON.parse(await fs.readFile(path.join(pipelineDir, file), "utf-8"));
    for (const [key, value] of Object.entries(raw)) {
      allScored.set(key, value as ScoringResult);
    }
  }

  const scoredResults = [...allScored.values()];
  console.log(`Loaded ${scoredResults.length} scored results from ${files.length} checkpoint files`);

  // 2. Re-run triage to get TriageResult[]
  const parseResult = await parseExport(INPUT);
  if (!parseResult.success) {
    console.error("Failed to parse export:", parseResult.error);
    process.exit(1);
  }

  const { company_context } = parseResult.data;
  const triageResults = triageOpportunities(parseResult.data);
  console.log(`Triaged ${triageResults.length} opportunities`);

  // 3. Load existing simulation results from disk
  const simDir = path.join(OUTPUT_DIR, "evaluation", "simulations");
  let simResults: SimulationPipelineResult = {
    results: [],
    totalSimulated: 0,
    totalFailed: 0,
    totalConfirmed: 0,
    totalInferred: 0,
  };

  try {
    const simDirs = await fs.readdir(simDir);
    const validSims = [];
    for (const dir of simDirs) {
      const dirPath = path.join(simDir, dir);
      const stat = await fs.stat(dirPath);
      if (stat.isDirectory()) {
        validSims.push(dir);
      }
    }
    simResults.totalSimulated = validSims.length;
    console.log(`Found ${validSims.length} existing simulations`);
  } catch {
    console.log("No existing simulations found");
  }

  // 4. Write evaluation reports
  const evalResult = await writeEvaluation(
    OUTPUT_DIR,
    scoredResults,
    triageResults,
    company_context.company_name,
  );

  if (evalResult.success) {
    console.log(`Wrote ${evalResult.files.length} evaluation files`);
  } else {
    console.error("writeEvaluation failed:", evalResult.error);
  }

  // 5. Write final reports
  const finalResult = await writeFinalReports(
    OUTPUT_DIR,
    scoredResults,
    triageResults,
    simResults,
    company_context.company_name,
  );

  if (finalResult.success) {
    console.log(`Wrote ${finalResult.files.length} final report files`);
  } else {
    console.error("writeFinalReports failed:", finalResult.error);
  }

  console.log("\nDone! Reports regenerated in", path.join(OUTPUT_DIR, "evaluation"));
}

main().catch(console.error);
