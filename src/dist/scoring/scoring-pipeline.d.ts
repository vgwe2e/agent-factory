/**
 * Scoring pipeline orchestrator.
 *
 * Wires together: triage filtering, archetype classification, lens scoring,
 * composite computation, confidence aggregation, and threshold gating.
 *
 * Processes opportunities as an async generator for incremental consumption.
 * Uses dependency injection (chatFn) for testability.
 */
import type { HierarchyExport, L3Opportunity, L4Activity, CompanyContext } from "../types/hierarchy.js";
import type { TriageResult } from "../types/triage.js";
import type { ScoringResult } from "../types/scoring.js";
import type { ChatResult } from "./ollama-client.js";
type ChatFn = (messages: Array<{
    role: string;
    content: string;
}>, format: Record<string, unknown>) => Promise<ChatResult>;
export interface ScoringPipelineInput {
    hierarchyExport: HierarchyExport;
    triageResults: TriageResult[];
    knowledgeContext: {
        components: string;
        processBuilder: string;
    };
    chatFn?: ChatFn;
}
export type ScoringPipelineResult = ScoringResult | {
    error: string;
    l3Name: string;
};
/**
 * Score a single opportunity across all three lenses.
 *
 * @returns Complete ScoringResult or error with l3Name for logging
 */
export declare function scoreOneOpportunity(opp: L3Opportunity, l4s: L4Activity[], company: CompanyContext, knowledgeContext: {
    components: string;
    processBuilder: string;
}, chatFn?: ChatFn): Promise<ScoringPipelineResult>;
/**
 * Score all triaged opportunities (async generator for incremental consumption).
 *
 * Filters to action === "process", sorts by tier priority, and yields results.
 */
export declare function scoreOpportunities(input: ScoringPipelineInput): AsyncGenerator<ScoringPipelineResult>;
export {};
