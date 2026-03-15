/**
 * Final reports output orchestrator.
 *
 * Creates the evaluation/ directory and writes Phase 9 output files:
 * summary.md, dead-zones.md, meta-reflection.md, plus simulation
 * artifact subdirectories under evaluation/simulations/.
 *
 * Designed to be called alongside writeEvaluation from the Phase 7
 * pipeline runner. Does NOT replace writeEvaluation.
 */

import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { formatSummary } from "./format-summary.js";
import { formatDeadZones } from "./format-dead-zones.js";
import { formatMetaReflection } from "./format-meta-reflection.js";
import { formatSimulationFilterTsv } from "./format-simulation-filter-tsv.js";
import { formatImplementationShortlistTsv } from "./format-implementation-shortlist-tsv.js";
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";

type WriteResult =
  | { success: true; files: string[] }
  | { success: false; error: string };

export async function writeFinalReports(
  outputDir: string,
  scored: ScoringResult[],
  triaged: TriageResult[],
  simResults: SimulationPipelineResult,
  companyName: string,
  date?: string,
  simSkipped?: boolean,
  scoringMode?: "two-pass" | "three-lens",
): Promise<WriteResult> {
  try {
    const evalDir = path.join(outputDir, "evaluation");
    const simDir = path.join(evalDir, "simulations");
    await fs.mkdir(simDir, { recursive: true });

    // Scoring mode header annotation
    const modeHeader = scoringMode ? `Scoring Mode: ${scoringMode}\n\n` : "";

    // Generate content from formatters
    const summaryMd = modeHeader + formatSummary(scored, triaged, simResults, companyName, date, simSkipped, scoringMode);
    const deadZonesMd = modeHeader + formatDeadZones(triaged, scored, date);
    const metaReflectionMd = modeHeader + formatMetaReflection(triaged, scored, simResults, date, simSkipped);
    const simulationFilterTsv = formatSimulationFilterTsv(scored, simResults, scoringMode);
    const implementationShortlistTsv = formatImplementationShortlistTsv(scored, simResults, ["ADVANCE"], scoringMode);
    const manualReviewQueueTsv = formatImplementationShortlistTsv(scored, simResults, ["REVIEW", "HOLD"], scoringMode);

    // Define markdown output files
    const mdFiles: { name: string; content: string }[] = [
      { name: "summary.md", content: summaryMd },
      { name: "dead-zones.md", content: deadZonesMd },
      { name: "meta-reflection.md", content: metaReflectionMd },
    ];

    // Write markdown files
    const writtenPaths: string[] = [];
    for (const file of mdFiles) {
      const filePath = path.join(evalDir, file.name);
      await fs.writeFile(filePath, file.content, "utf-8");
      writtenPaths.push(filePath);
    }

    const simulationFilterPath = path.join(evalDir, "simulation-filter.tsv");
    await fs.writeFile(simulationFilterPath, simulationFilterTsv, "utf-8");
    writtenPaths.push(simulationFilterPath);

    const shortlistPath = path.join(evalDir, "implementation-shortlist.tsv");
    await fs.writeFile(shortlistPath, implementationShortlistTsv, "utf-8");
    writtenPaths.push(shortlistPath);

    const reviewQueuePath = path.join(evalDir, "manual-review-queue.tsv");
    await fs.writeFile(reviewQueuePath, manualReviewQueueTsv, "utf-8");
    writtenPaths.push(reviewQueuePath);

    // Write simulation artifact files per opportunity
    for (const result of simResults.results) {
      const oppDir = path.join(simDir, result.slug);
      await fs.mkdir(oppDir, { recursive: true });

      const artifacts: { name: string; content: string }[] = [
        { name: "decision-flow.mmd", content: result.artifacts.decisionFlow },
        { name: "component-map.yaml", content: yaml.dump(result.artifacts.componentMap) },
        { name: "mock-test.yaml", content: yaml.dump(result.artifacts.mockTest) },
        { name: "integration-surface.yaml", content: yaml.dump(result.artifacts.integrationSurface) },
      ];
      if (result.assessment) {
        artifacts.push({
          name: "simulation-assessment.yaml",
          content: yaml.dump(result.assessment),
        });
      }

      for (const artifact of artifacts) {
        const filePath = path.join(oppDir, artifact.name);
        await fs.writeFile(filePath, artifact.content, "utf-8");
        writtenPaths.push(filePath);
      }
    }

    return { success: true, files: writtenPaths };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
