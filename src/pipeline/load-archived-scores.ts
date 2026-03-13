/**
 * Load archived scoring results from checkpoint archive files.
 *
 * Reads .pipeline/checkpoint-*.json files (written by archiveAndReset in
 * context-tracker.ts) and returns a deduplicated array of ScoringResult
 * objects. Later files overwrite earlier entries for the same key (skillId
 * or l3Name for backward compat), matching the pattern used by regen-reports.ts.
 *
 * These archive files are DIFFERENT from .checkpoint.json (the resume
 * metadata file). Archive files contain full ScoringResult objects keyed
 * by skillId (or l3Name in older archives); the resume file only contains
 * entry metadata (status, etc.).
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { ScoringResult } from "../types/scoring.js";

/**
 * Load all archived ScoringResult objects from checkpoint archive files.
 *
 * @param outputDir - Pipeline output directory containing .pipeline/ subdirectory
 * @returns Deduplicated array of ScoringResult objects (later archive files win on duplicate l3Name)
 */
export async function loadArchivedScores(outputDir: string): Promise<ScoringResult[]> {
  const pipelineDir = path.join(outputDir, ".pipeline");

  // If directory doesn't exist, nothing to load
  let entries: string[];
  try {
    entries = await fs.readdir(pipelineDir);
  } catch {
    return [];
  }

  // Filter to checkpoint archive files, sort alphabetically (chronological by timestamp)
  const checkpointFiles = entries
    .filter((f) => f.startsWith("checkpoint-") && f.endsWith(".json"))
    .sort();

  if (checkpointFiles.length === 0) return [];

  // Merge into a Map for deduplication (later entries overwrite earlier)
  const allScored = new Map<string, ScoringResult>();

  for (const file of checkpointFiles) {
    try {
      const raw = await fs.readFile(path.join(pipelineDir, file), "utf-8");
      const parsed = JSON.parse(raw) as Record<string, ScoringResult>;
      for (const [key, value] of Object.entries(parsed)) {
        allScored.set(key, value);
      }
    } catch {
      // Skip malformed files gracefully -- one corrupt file shouldn't
      // prevent loading results from the rest.
      continue;
    }
  }

  return [...allScored.values()];
}
