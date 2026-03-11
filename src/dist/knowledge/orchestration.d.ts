/**
 * Orchestration decision query module.
 *
 * Provides typed query functions for routing opportunities to
 * Process Builder, Agentic AI, or Hybrid orchestration based on
 * the bundled decision guide data.
 */
import type { OrchestrationRoute, DecisionCriterion, DecisionScenario, IntegrationPattern, ArchetypeMapping, LeadArchetype, DecisionGuide } from "../types/orchestration.js";
/**
 * Maps an archetype (from hierarchy export) to recommended orchestration routes.
 */
export declare function getRouteForArchetype(archetype: LeadArchetype): ArchetypeMapping;
/**
 * Returns decision criteria for a given orchestration route.
 */
export declare function getDecisionCriteria(route: OrchestrationRoute): DecisionCriterion[];
/**
 * Returns all 8 reference scenarios from the decision guide.
 */
export declare function getAllScenarios(): DecisionScenario[];
/**
 * Filters scenarios by their recommended orchestration route.
 */
export declare function getScenariosByRoute(route: OrchestrationRoute): DecisionScenario[];
/**
 * Returns all 4 integration patterns.
 */
export declare function getIntegrationPatterns(): IntegrationPattern[];
/**
 * Looks up a specific integration pattern by name.
 */
export declare function getIntegrationPattern(name: string): IntegrationPattern | undefined;
/**
 * Reverse lookup: given a criterion name, find which route it belongs to
 * and return the full criterion details.
 */
export declare function matchCriteria(criterion: string): {
    route: OrchestrationRoute;
    criterion: DecisionCriterion;
} | undefined;
/**
 * Returns the full decision guide for LLM prompt inclusion.
 */
export declare function getDecisionGuide(): DecisionGuide;
