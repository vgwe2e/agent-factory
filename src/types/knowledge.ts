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

// -- Orchestration types (implemented in 02-03) --

export interface OrchestrationScenario {
  name: string;
  recommendation: "process" | "agentic_ai" | "hybrid";
  reason: string;
}
