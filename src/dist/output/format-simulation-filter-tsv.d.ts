import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { ScoringResult } from "../types/scoring.js";
export declare function formatSimulationFilterTsv(scored: ScoringResult[], simResults: SimulationPipelineResult, scoringMode?: "two-pass" | "three-lens"): string;
