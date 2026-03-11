/**
 * Orchestration decision query module.
 *
 * Provides typed query functions for routing opportunities to
 * Process Builder, Agentic AI, or Hybrid orchestration based on
 * the bundled decision guide data.
 */

import type {
  OrchestrationRoute,
  DecisionCriterion,
  DecisionScenario,
  IntegrationPattern,
  ArchetypeMapping,
  LeadArchetype,
  DecisionGuide,
} from "../types/orchestration.js";

import guideData from "../data/orchestration/decision-guide.json" with { type: "json" };

// Cast the imported JSON to our typed structure
const guide = guideData as unknown as DecisionGuide;

// -- Internal lookup structures --

const archetypeMap = new Map<LeadArchetype, ArchetypeMapping>(
  (Object.entries(guide.archetype_mapping) as [LeadArchetype, ArchetypeMapping][]).map(
    ([k, v]) => [k, v],
  ),
);

const criteriaByRoute = new Map<OrchestrationRoute, DecisionCriterion[]>(
  (Object.entries(guide.decision_criteria) as [OrchestrationRoute, DecisionCriterion[]][]).map(
    ([k, v]) => [k, v],
  ),
);

const criterionReverseLookup = new Map<string, { route: OrchestrationRoute; criterion: DecisionCriterion }>();
for (const [route, criteria] of criteriaByRoute) {
  for (const criterion of criteria) {
    criterionReverseLookup.set(criterion.criterion, { route, criterion });
  }
}

const patternByName = new Map<string, IntegrationPattern>(
  guide.integration_patterns.map((p) => [p.name, p]),
);

// -- Public query functions --

/**
 * Maps an archetype (from hierarchy export) to recommended orchestration routes.
 */
export function getRouteForArchetype(archetype: LeadArchetype): ArchetypeMapping {
  const mapping = archetypeMap.get(archetype);
  if (!mapping) {
    throw new Error(`Unknown archetype: ${archetype}`);
  }
  return mapping;
}

/**
 * Returns decision criteria for a given orchestration route.
 */
export function getDecisionCriteria(route: OrchestrationRoute): DecisionCriterion[] {
  return criteriaByRoute.get(route) ?? [];
}

/**
 * Returns all 8 reference scenarios from the decision guide.
 */
export function getAllScenarios(): DecisionScenario[] {
  return guide.scenarios;
}

/**
 * Filters scenarios by their recommended orchestration route.
 */
export function getScenariosByRoute(route: OrchestrationRoute): DecisionScenario[] {
  return guide.scenarios.filter((s) => s.recommendation === route);
}

/**
 * Returns all 4 integration patterns.
 */
export function getIntegrationPatterns(): IntegrationPattern[] {
  return guide.integration_patterns;
}

/**
 * Looks up a specific integration pattern by name.
 */
export function getIntegrationPattern(name: string): IntegrationPattern | undefined {
  return patternByName.get(name);
}

/**
 * Reverse lookup: given a criterion name, find which route it belongs to
 * and return the full criterion details.
 */
export function matchCriteria(
  criterion: string,
): { route: OrchestrationRoute; criterion: DecisionCriterion } | undefined {
  return criterionReverseLookup.get(criterion);
}

/**
 * Returns the full decision guide for LLM prompt inclusion.
 */
export function getDecisionGuide(): DecisionGuide {
  return guide;
}
