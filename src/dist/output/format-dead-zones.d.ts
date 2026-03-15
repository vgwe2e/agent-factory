/**
 * Dead zones report markdown formatter.
 *
 * Pure function: takes triage results and scored results, filters
 * to opportunities with DEAD_ZONE, PHANTOM, or NO_STAKES flags,
 * groups by L1 domain, and produces a markdown report.
 */
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult } from "../types/scoring.js";
export declare function formatDeadZones(triaged: TriageResult[], scored: ScoringResult[], date?: string): string;
