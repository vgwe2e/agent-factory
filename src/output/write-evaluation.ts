/**
 * Evaluation output orchestrator.
 *
 * Creates the evaluation/ directory and writes all 4 output files:
 * triage.tsv, feasibility-scores.tsv, adoption-risk.md, tier1-report.md.
 *
 * Single entry point for the pipeline to produce all Phase 5 output artifacts.
 * Phase 7 (pipeline orchestration) will call this function.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { formatTriageTsv } from "./format-triage-tsv.js";
import { formatScoresTsv } from "./format-scores-tsv.js";
import { formatAdoptionRisk } from "./format-adoption-risk.js";
import { formatTier1Report } from "./format-tier1-report.js";
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";

type WriteResult =
  | { success: true; files: string[] }
  | { success: false; error: string };

export async function writeEvaluation(
  outputDir: string,
  scoredOpportunities: ScoringResult[],
  triagedOpportunities: TriageResult[],
  companyName: string,
  date?: string,
  scoringMode?: "two-pass" | "three-lens",
): Promise<WriteResult> {
  try {
    const evalDir = path.join(outputDir, "evaluation");
    await fs.mkdir(evalDir, { recursive: true });

    // Scoring mode header annotation
    const modeHeader = scoringMode ? `Scoring Mode: ${scoringMode}\n\n` : "";

    // Derive tier 1 names from triage data
    const tier1Names = new Set(
      triagedOpportunities
        .filter(o => o.tier === 1)
        .map(o => o.skillId ?? o.l3Name),
    );

    // Generate content from formatters
    const triageTsv = formatTriageTsv(triagedOpportunities);
    const scoresTsv = formatScoresTsv(scoredOpportunities, scoringMode);
    const adoptionRisk = modeHeader + formatAdoptionRisk(triagedOpportunities, {
      date,
      scored: scoredOpportunities,
    });
    const tier1Report = modeHeader + formatTier1Report(scoredOpportunities, tier1Names, companyName, date, scoringMode);

    // Define output files
    const files: { name: string; content: string }[] = [
      { name: "triage.tsv", content: triageTsv },
      { name: "feasibility-scores.tsv", content: scoresTsv },
      { name: "adoption-risk.md", content: adoptionRisk },
      { name: "tier1-report.md", content: tier1Report },
    ];

    // Write all files
    const writtenPaths: string[] = [];
    for (const file of files) {
      const filePath = path.join(evalDir, file.name);
      await fs.writeFile(filePath, file.content, "utf-8");
      writtenPaths.push(filePath);
    }

    return { success: true, files: writtenPaths };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
