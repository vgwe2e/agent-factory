import type { ScoringResult } from "../types/scoring.js";
import type { SimulationPipelineResult } from "../simulation/simulation-pipeline.js";
import type { SimulationFilterVerdict } from "../types/simulation.js";
export declare function formatImplementationShortlistTsv(scored: ScoringResult[], simResults: SimulationPipelineResult, verdicts: SimulationFilterVerdict[], scoringMode?: "two-pass" | "three-lens"): string;
