// -- UI Component types --

export type ComponentCategory =
  | "layout"
  | "display"
  | "input"
  | "container"
  | "visualization"
  | "interaction";

export interface ComponentProperty {
  property: string;
  field: string;
  description: string;
  page: number;
}

export interface ComponentTab {
  properties: ComponentProperty[];
  property_count: number;
}

export interface UIComponent {
  name: string;
  category: ComponentCategory;
  description: string;
  pages: { start: number; end: number };
  tabs: {
    general?: ComponentTab;
    style?: ComponentTab;
    interaction?: ComponentTab;
    advanced?: ComponentTab;
  };
  priority?: string;
  complexity?: string;
  related_components?: string[];
}

export interface ComponentIndexCategory {
  description: string;
  components: string[];
}

export interface ComponentIndex {
  version: string;
  total_components: number;
  total_properties: number;
  categories: Record<ComponentCategory, ComponentIndexCategory>;
}

// -- Process Builder types (implemented in 02-02) --

export interface PBNode {
  name: string;
  purpose: string;
  documentation_file: string;
  category: string;
}

// -- Capability types (implemented in 005) --

export interface PlatformCapability {
  name: string;
  description: string;
  best_for: string[];
  not_for?: string[];
  keywords: string[];
}

export interface CapabilityPillar {
  name: string;
  capabilities: PlatformCapability[];
}

export interface PlatformBoundaries {
  aera_is: string;
  aera_is_not: string[];
}

export interface PlatformCapabilitiesData {
  version: string;
  pillars: CapabilityPillar[];
  platform_boundaries?: PlatformBoundaries;
}

export interface UseCaseMapping {
  use_case: string;
  primary_components: string[];
  supporting_components: string[];
  skill_type: "AI/ML" | "Rule-Based" | "Hybrid";
  keywords: string[];
}

export interface UseCaseMappingsData {
  version: string;
  mappings: UseCaseMapping[];
}

export interface CapabilityClassification {
  keywords: string[];
  components: string[];
}

export interface CapabilityKeywordsData {
  version: string;
  classifications: {
    ai_ml: CapabilityClassification;
    rule_based: CapabilityClassification;
    hybrid: CapabilityClassification;
  };
}

// -- Orchestration types (implemented in 02-03) --

export interface OrchestrationScenario {
  name: string;
  recommendation: "process" | "agentic_ai" | "hybrid";
  reason: string;
}
