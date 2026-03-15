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
import type { ScoringResult } from "../types/scoring.js";
/**
 * Load all archived ScoringResult objects from checkpoint archive files.
 *
 * @param outputDir - Pipeline output directory containing .pipeline/ subdirectory
 * @returns Deduplicated array of ScoringResult objects (later archive files win on duplicate l3Name)
 */
export declare function loadArchivedScores(outputDir: string): Promise<ScoringResult[]>;
