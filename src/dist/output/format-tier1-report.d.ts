/**
 * Tier 1 deep analysis markdown report formatter.
 *
 * Pure function: takes ScoringResult[] with a set of Tier 1 l3_names,
 * filters and sorts by composite DESC, and returns a narrative markdown
 * report with per-dimension reason strings as analysis paragraphs.
 * Produces evaluation/tier1-report.md content.
 */
import type { ScoringResult } from "../types/scoring.js";
export declare function formatTier1Report(scored: ScoringResult[], tier1Names: Set<string>, companyName: string, date?: string): string;
