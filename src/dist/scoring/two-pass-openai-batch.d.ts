import type { L4Activity, SkillWithContext } from "../types/hierarchy.js";
import type { FilterResult, ScoringResult } from "../types/scoring.js";
import type { KnowledgeContext } from "./knowledge-context.js";
import type { OpenAiBatchConfig } from "../infra/openai-batch-client.js";
export interface TwoPassOpenAiBatchArgs {
    hierarchy: L4Activity[];
    allSkills: SkillWithContext[];
    knowledgeContext: KnowledgeContext;
    outputDir: string;
    batchConfig: OpenAiBatchConfig;
    topN?: number;
}
export interface TwoPassOpenAiBatchResult {
    scored: ScoringResult[];
    errors: string[];
    scoredCount: number;
    promotedCount: number;
    filterResult: FilterResult;
}
export declare function runTwoPassScoringOpenAiBatch(args: TwoPassOpenAiBatchArgs): Promise<TwoPassOpenAiBatchResult>;
