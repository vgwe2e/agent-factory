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
import { classifyArchetype } from "./archetype-router.js";
import { scoreTechnical, scoreAdoption, scoreValue } from "./lens-scorers.js";
import { computeComposite } from "./composite.js";
import { computeOverallConfidence } from "./confidence.js";
import { groupL4sByL3 } from "../triage/red-flags.js";
import type { ChatResult } from "./ollama-client.js";
import { ollamaChat } from "./ollama-client.js";

// -- Types --

type ChatFn = (
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
) => Promise<ChatResult>;

export interface ScoringPipelineInput {
  hierarchyExport: HierarchyExport;
  triageResults: TriageResult[];
  knowledgeContext: { components: string; processBuilder: string };
  chatFn?: ChatFn;
}

export type ScoringPipelineResult =
  | ScoringResult
  | { error: string; l3Name: string };

// -- Public API --

/**
 * Score a single opportunity across all three lenses.
 *
 * @returns Complete ScoringResult or error with l3Name for logging
 */
export async function scoreOneOpportunity(
  opp: L3Opportunity,
  l4s: L4Activity[],
  company: CompanyContext,
  knowledgeContext: { components: string; processBuilder: string },
  chatFn: ChatFn = ollamaChat,
): Promise<ScoringPipelineResult> {
  const startMs = Date.now();

  // Classify archetype
  const classification = classifyArchetype(opp, l4s);
  const archetypeHint = classification.archetype;

  // Build knowledge context string for technical prompt
  const knowledgeStr = `UI Components:\n${knowledgeContext.components}\n\nProcess Builder Nodes:\n${knowledgeContext.processBuilder}`;

  // Score all three lenses
  const [techResult, adoptResult, valueResult] = await Promise.all([
    scoreTechnical(opp, l4s, knowledgeStr, archetypeHint, chatFn),
    scoreAdoption(opp, l4s, archetypeHint, chatFn),
    scoreValue(opp, l4s, company, archetypeHint, chatFn),
  ]);

  // Check for failures
  if (!techResult.success) {
    return { error: `Technical lens failed: ${techResult.error}`, l3Name: opp.l3_name };
  }
  if (!adoptResult.success) {
    return { error: `Adoption lens failed: ${adoptResult.error}`, l3Name: opp.l3_name };
  }
  if (!valueResult.success) {
    return { error: `Value lens failed: ${valueResult.error}`, l3Name: opp.l3_name };
  }

  // Compute composite
  const compositeResult = computeComposite(
    techResult.score.total,
    adoptResult.score.total,
    valueResult.score.total,
  );

  // Compute overall confidence
  const overallConfidence = computeOverallConfidence(
    techResult.score.confidence,
    adoptResult.score.confidence,
    valueResult.score.confidence,
  );

  const durationMs = Date.now() - startMs;

  return {
    l3Name: opp.l3_name,
    l2Name: opp.l2_name,
    l1Name: opp.l1_name,
    archetype: classification.archetype,
    archetypeSource: classification.source,
    lenses: {
      technical: techResult.score,
      adoption: adoptResult.score,
      value: valueResult.score,
    },
    composite: compositeResult.composite,
    overallConfidence,
    promotedToSimulation: compositeResult.promotedToSimulation,
    scoringDurationMs: durationMs,
  };
}

/**
 * Score all triaged opportunities (async generator for incremental consumption).
 *
 * Filters to action === "process", sorts by tier priority, and yields results.
 */
export async function* scoreOpportunities(
  input: ScoringPipelineInput,
): AsyncGenerator<ScoringPipelineResult> {
  const { hierarchyExport, triageResults, knowledgeContext, chatFn = ollamaChat } = input;

  // Filter to processable opportunities only
  const processable = triageResults.filter((tr) => tr.action === "process");

  // Sort by tier (1 first, then 2, then 3)
  processable.sort((a, b) => a.tier - b.tier);

  // Group L4s by L3 name for efficient lookup
  const l4Map = groupL4sByL3(hierarchyExport.hierarchy);

  // Build L3 lookup by name
  const l3Map = new Map<string, L3Opportunity>();
  for (const opp of hierarchyExport.l3_opportunities) {
    l3Map.set(opp.l3_name, opp);
  }

  const company = hierarchyExport.company_context;

  for (const triage of processable) {
    const opp = l3Map.get(triage.l3Name);
    if (!opp) {
      yield { error: `L3 opportunity not found: ${triage.l3Name}`, l3Name: triage.l3Name };
      continue;
    }

    const l4s = l4Map.get(triage.l3Name) ?? [];

    const result = await scoreOneOpportunity(opp, l4s, company, knowledgeContext, chatFn);
    yield result;
  }
}
