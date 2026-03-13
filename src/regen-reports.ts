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
import yaml from "js-yaml";
import { parseExport } from "./ingestion/parse-export.js";
import { triageOpportunities } from "./triage/triage-pipeline.js";
import { writeEvaluation } from "./output/write-evaluation.js";
import { writeFinalReports } from "./output/write-final-reports.js";
import { assessSimulation } from "./simulation/assessment.js";
import type { ScoringResult } from "./types/scoring.js";
import type { SimulationResult } from "./types/simulation.js";
import type { SimulationPipelineResult } from "./simulation/simulation-pipeline.js";
import { slugify } from "./simulation/utils.js";
import { buildKnowledgeIndex, enforceKnowledgeConfidence, validateComponentMap } from "./simulation/validators/knowledge-validator.js";
import { validateMermaidFlowchart } from "./simulation/validators/mermaid-validator.js";

const INPUT = process.argv[2] || "../.planning/ford_hierarchy_v3_export.json";
const OUTPUT_DIR = process.argv[3] || "./evaluation";

async function loadScoringOverrides(
  outputDir: string,
): Promise<Map<string, {
  l1Name: string;
  l2Name: string;
  archetype: ScoringResult["archetype"];
  composite: number;
  overallConfidence: ScoringResult["overallConfidence"];
  promotedToSimulation: boolean;
}>> {
  const scoresPath = path.join(outputDir, "evaluation", "feasibility-scores.tsv");
  try {
    const raw = await fs.readFile(scoresPath, "utf-8");
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) return new Map();
    const headers = lines[0].split("\t");
    const overrides = new Map<string, {
      l1Name: string;
      l2Name: string;
      archetype: ScoringResult["archetype"];
      composite: number;
      overallConfidence: ScoringResult["overallConfidence"];
      promotedToSimulation: boolean;
    }>();

    for (const line of lines.slice(1)) {
      const cols = line.split("\t");
      const row = Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? ""]));
      overrides.set(row.l3_name, {
        l1Name: row.l1_name,
        l2Name: row.l2_name,
        archetype: row.archetype as ScoringResult["archetype"],
        composite: Number.parseFloat(row.composite),
        overallConfidence: row.confidence as ScoringResult["overallConfidence"],
        promotedToSimulation: row.promotes_to_sim?.trim().toUpperCase() === "Y",
      });
    }

    return overrides;
  } catch {
    return new Map();
  }
}

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

  const scoringOverrides = await loadScoringOverrides(OUTPUT_DIR);
  if (scoringOverrides.size > 0) {
    for (const sr of scoredResults) {
      const override = scoringOverrides.get(sr.l3Name);
      if (!override) continue;
      sr.l1Name = override.l1Name || sr.l1Name;
      sr.l2Name = override.l2Name || sr.l2Name;
      sr.archetype = override.archetype || sr.archetype;
      sr.composite = Number.isFinite(override.composite) ? override.composite : sr.composite;
      sr.overallConfidence = override.overallConfidence || sr.overallConfidence;
      sr.promotedToSimulation = override.promotedToSimulation;
    }
    console.log(`Applied scoring overrides from feasibility-scores.tsv for ${scoringOverrides.size} opportunities`);
  }

  // 2. Re-run triage to get TriageResult[]
  const parseResult = await parseExport(INPUT);
  if (!parseResult.success) {
    console.error("Failed to parse export:", parseResult.error);
    process.exit(1);
  }

  const { company_context, l3_opportunities } = parseResult.data;
  const triageResults = triageOpportunities(parseResult.data);
  console.log(`Triaged ${triageResults.length} opportunities`);

  // Backfill skillId/skillName for checkpoints written before skill-level scoring
  // (legacy checkpoints may lack these fields)
  for (const sr of scoredResults) {
    if (!sr.skillId) {
      (sr as any).skillId = sr.l3Name;
    }
    if (!sr.skillName) {
      (sr as any).skillName = sr.l3Name;
    }
    if (!sr.l4Name) {
      (sr as any).l4Name = "";
    }
  }

  // 3. Load existing simulation results from disk
  // Build slug→l3Name lookup from scored results so we can reverse the slug
  const slugToL3 = new Map<string, string>();
  for (const sr of scoredResults) {
    slugToL3.set(slugify(sr.l3Name), sr.l3Name);
  }

  const simDir = path.join(OUTPUT_DIR, "evaluation", "simulations");
  let simResults: SimulationPipelineResult = {
    results: [],
    totalSimulated: 0,
    totalFailed: 0,
    totalConfirmed: 0,
    totalInferred: 0,
  };

  try {
    const knowledgeIndex = buildKnowledgeIndex();
    const simDirs = await fs.readdir(simDir);
    const simResultEntries: SimulationResult[] = [];
    for (const dir of simDirs) {
      const dirPath = path.join(simDir, dir);
      const stat = await fs.stat(dirPath);
      if (stat.isDirectory()) {
        const l3Name = slugToL3.get(dir) ?? dir;
        // Load artifacts from disk so writeFinalReports can round-trip them
        const readFile = async (name: string) => {
          try { return await fs.readFile(path.join(dirPath, name), "utf-8"); }
          catch { return ""; }
        };
        const decisionFlow = await readFile("decision-flow.mmd");
        const componentMap = yaml.load(await readFile("component-map.yaml")) as any ?? { streams: [], cortex: [], process_builder: [], agent_teams: [], ui: [] };
        const mockTest = yaml.load(await readFile("mock-test.yaml")) as any ?? { decision: "", input: { financial_context: {}, trigger: "" }, expected_output: { action: "", outcome: "" }, rationale: "" };
        const integrationSurface = yaml.load(await readFile("integration-surface.yaml")) as any ?? { source_systems: [], aera_ingestion: [], processing: [], ui_surface: [] };
        const scenarioSpec = yaml.load(await readFile("scenario-spec.yaml")) as any ?? undefined;
        const assessmentFile = yaml.load(await readFile("simulation-assessment.yaml")) as any ?? undefined;

        enforceKnowledgeConfidence(componentMap, knowledgeIndex);
        const validation = validateComponentMap(componentMap, knowledgeIndex);
        const confirmedCount = validation.filter((item) => item.status === "confirmed").length;
        const inferredCount = validation.filter((item) => item.status === "inferred").length;
        const mermaidValid = validateMermaidFlowchart(decisionFlow).ok;
        const assessment = assessmentFile ?? assessSimulation({
          scenarioSpec,
          mockTest,
          integrationSurface,
          confirmedCount,
          inferredCount,
          mermaidValid,
        });

        simResultEntries.push({
          l3Name,
          slug: dir,
          scenarioSpec,
          assessment,
          artifacts: { decisionFlow, componentMap, mockTest, integrationSurface },
          validationSummary: {
            confirmedCount,
            inferredCount,
            mermaidValid,
          },
        });
      }
    }
    simResults.results = simResultEntries;
    simResults.totalSimulated = simResultEntries.length;
    simResults.totalConfirmed = simResultEntries.reduce((sum, result) => sum + result.validationSummary.confirmedCount, 0);
    simResults.totalInferred = simResultEntries.reduce((sum, result) => sum + result.validationSummary.inferredCount, 0);
    console.log(`Found ${simResultEntries.length} existing simulations`);
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
