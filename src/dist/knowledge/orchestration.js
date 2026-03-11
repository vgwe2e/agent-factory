/**
 * Orchestration decision query module.
 *
 * Provides typed query functions for routing opportunities to
 * Process Builder, Agentic AI, or Hybrid orchestration based on
 * the bundled decision guide data.
 */
import guideData from "../data/orchestration/decision-guide.json" with { type: "json" };
// Cast the imported JSON to our typed structure
const guide = guideData;
// -- Internal lookup structures --
const archetypeMap = new Map(Object.entries(guide.archetype_mapping).map(([k, v]) => [k, v]));
const criteriaByRoute = new Map(Object.entries(guide.decision_criteria).map(([k, v]) => [k, v]));
const criterionReverseLookup = new Map();
for (const [route, criteria] of criteriaByRoute) {
    for (const criterion of criteria) {
        criterionReverseLookup.set(criterion.criterion, { route, criterion });
    }
}
const patternByName = new Map(guide.integration_patterns.map((p) => [p.name, p]));
// -- Public query functions --
/**
 * Maps an archetype (from hierarchy export) to recommended orchestration routes.
 */
export function getRouteForArchetype(archetype) {
    const mapping = archetypeMap.get(archetype);
    if (!mapping) {
        throw new Error(`Unknown archetype: ${archetype}`);
    }
    return mapping;
}
/**
 * Returns decision criteria for a given orchestration route.
 */
export function getDecisionCriteria(route) {
    return criteriaByRoute.get(route) ?? [];
}
/**
 * Returns all 8 reference scenarios from the decision guide.
 */
export function getAllScenarios() {
    return guide.scenarios;
}
/**
 * Filters scenarios by their recommended orchestration route.
 */
export function getScenariosByRoute(route) {
    return guide.scenarios.filter((s) => s.recommendation === route);
}
/**
 * Returns all 4 integration patterns.
 */
export function getIntegrationPatterns() {
    return guide.integration_patterns;
}
/**
 * Looks up a specific integration pattern by name.
 */
export function getIntegrationPattern(name) {
    return patternByName.get(name);
}
/**
 * Reverse lookup: given a criterion name, find which route it belongs to
 * and return the full criterion details.
 */
export function matchCriteria(criterion) {
    return criterionReverseLookup.get(criterion);
}
/**
 * Returns the full decision guide for LLM prompt inclusion.
 */
export function getDecisionGuide() {
    return guide;
}
