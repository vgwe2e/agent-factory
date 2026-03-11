/**
 * TypeScript types for the orchestration decision guide.
 *
 * These types describe the structured decision framework for routing
 * opportunities to Process Builder, Agentic AI, or Hybrid orchestration.
 * The decision-guide.json data file conforms to these types.
 */
export type OrchestrationRoute = "process" | "agentic_ai" | "hybrid";
export interface DecisionCriterion {
    criterion: string;
    description: string;
    example: string;
}
export interface DecisionScenario {
    name: string;
    recommendation: OrchestrationRoute;
    reason: string;
    components: string[];
}
export interface IntegrationPattern {
    name: string;
    flow: string;
    use_case: string;
}
export interface ArchetypeMapping {
    primary_route: OrchestrationRoute;
    secondary_route: OrchestrationRoute;
    rationale: string;
}
export type LeadArchetype = "DETERMINISTIC" | "AGENTIC" | "GENERATIVE";
export interface DecisionGuide {
    version: string;
    routes: OrchestrationRoute[];
    decision_criteria: Record<OrchestrationRoute, DecisionCriterion[]>;
    scenarios: DecisionScenario[];
    integration_patterns: IntegrationPattern[];
    archetype_mapping: Record<LeadArchetype, ArchetypeMapping>;
}
