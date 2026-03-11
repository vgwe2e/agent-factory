/**
 * Meta-reflection markdown report formatter.
 *
 * Pure function: takes triage results, scoring results, and simulation
 * pipeline results. Computes catalog-level statistics and produces a
 * markdown report with archetype distribution, red flag frequency,
 * tier distribution, domain performance, knowledge coverage, and
 * key patterns.
 *
 * No LLM calls -- all analysis is pure computation on structured data.
 */
import type { ScoringResult } from "../types/scoring.js";
import type { TriageResult } from "../types/triage.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
export declare function formatMetaReflection(triaged: TriageResult[], scored: ScoringResult[], simResults: SimulationPipelineResult, date?: string): string;
