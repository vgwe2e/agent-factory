/**
 * TypeScript types for the simulation phase.
 *
 * Defines type contracts for LLM-generated simulation artifacts:
 * decision flow diagrams (Mermaid), component maps (YAML),
 * mock decision tests (YAML), and integration surfaces (YAML).
 *
 * These types are consumed by generators (Plan 02), the pipeline
 * orchestrator (Plan 03), and Phase 9 report generation.
 */
import type { L3Opportunity, L4Activity, CompanyContext, LeadArchetype } from "./hierarchy.js";
export interface SimulationInput {
    /** L3 opportunity (required in three-lens mode, optional metadata in two-pass). */
    opportunity?: L3Opportunity;
    /** Primary L4 subject for two-pass simulation. Absent in three-lens mode. */
    l4Activity?: L4Activity;
    l4s: L4Activity[];
    companyContext: CompanyContext;
    archetype: LeadArchetype;
    archetypeRoute: string;
    composite: number;
}
export interface ComponentMapEntry {
    name: string;
    purpose?: string;
    confidence: "confirmed" | "inferred";
}
export interface StreamEntry extends ComponentMapEntry {
    type?: string;
}
export interface CortexEntry extends ComponentMapEntry {
    capability?: string;
}
export interface ProcessBuilderEntry extends ComponentMapEntry {
    node_type?: string;
}
export interface AgentTeamEntry extends ComponentMapEntry {
    role?: string;
}
export interface UIEntry extends ComponentMapEntry {
    component_type?: string;
    properties?: string[];
}
export interface ComponentMap {
    streams: StreamEntry[];
    cortex: CortexEntry[];
    process_builder: ProcessBuilderEntry[];
    agent_teams: AgentTeamEntry[];
    ui: UIEntry[];
}
export interface MockTest {
    decision: string;
    input: {
        financial_context: Record<string, unknown>;
        trigger: string;
        parameters?: Record<string, unknown>;
    };
    expected_output: {
        action: string;
        outcome: string;
        affected_components?: string[];
    };
    rationale: string;
}
export interface IntegrationSurface {
    source_systems: Array<{
        name: string;
        type?: string;
        status: "identified" | "tbd";
    }>;
    aera_ingestion: Array<{
        stream_name: string;
        stream_type?: string;
        source: string;
    }>;
    processing: Array<{
        component: string;
        type: string;
        function: string;
    }>;
    ui_surface: Array<{
        component: string;
        screen?: string;
        purpose: string;
    }>;
}
export type ScenarioStepStage = "ingest" | "analyze" | "decide" | "act" | "review" | "notify" | "surface";
export interface ScenarioSourceSystem {
    name: string;
    type?: string;
    status: "identified" | "tbd";
}
export interface ScenarioKeyInput {
    name: string;
    source: string;
    purpose: string;
    preferred_stream_type?: string;
}
export interface ScenarioFlowStep {
    step: string;
    stage: ScenarioStepStage;
    component: string;
    purpose: string;
}
export interface ScenarioBranch {
    condition: string;
    response: string;
    outcome: string;
}
export interface ScenarioSpec {
    objective: string;
    trigger: string;
    decision: string;
    expected_action: string;
    expected_outcome: string;
    rationale: string;
    source_systems: ScenarioSourceSystem[];
    key_inputs: ScenarioKeyInput[];
    happy_path: ScenarioFlowStep[];
    branches: ScenarioBranch[];
}
export type SimulationFilterVerdict = "ADVANCE" | "REVIEW" | "HOLD";
export interface SimulationAssessment {
    groundednessScore: number;
    integrationConfidenceScore: number;
    ambiguityRiskScore: number;
    implementationReadinessScore: number;
    verdict: SimulationFilterVerdict;
    reasons: string[];
}
export interface SimulationArtifacts {
    decisionFlow: string;
    componentMap: ComponentMap;
    mockTest: MockTest;
    integrationSurface: IntegrationSurface;
}
export interface SimulationResult {
    l3Name: string;
    slug: string;
    artifacts: SimulationArtifacts;
    scenarioSpec?: ScenarioSpec;
    assessment?: SimulationAssessment;
    validationSummary: {
        confirmedCount: number;
        inferredCount: number;
        mermaidValid: boolean;
    };
}
