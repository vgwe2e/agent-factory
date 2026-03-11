/**
 * TypeScript types for the Aera hierarchy JSON export.
 *
 * These types describe the full structure of a hierarchy export file
 * (e.g., ford_hierarchy_v2_export.json). Zod schemas in schemas/hierarchy.ts
 * validate at runtime and produce these types via z.infer.
 */

// -- Enums --

export type FinancialRating = "HIGH" | "MEDIUM" | "LOW";

export type AiSuitability = "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE";

export type ImpactOrder = "FIRST" | "SECOND";

export type RatingConfidence = "HIGH" | "MEDIUM" | "LOW";

export type LeadArchetype = "DETERMINISTIC" | "AGENTIC" | "GENERATIVE";

export type ImplementationComplexity = "LOW" | "MEDIUM" | "HIGH";

// -- Sub-types --

export interface Meta {
  project_name: string;
  version_date: string;
  created_date: string;
  exported_by: string | null;
  description: string;
}

export interface CompanyContext {
  industry: string;
  company_name: string;
  annual_revenue: number | null;
  cogs: number | null;
  sga: number | null;
  ebitda: number | null;
  working_capital: number | null;
  inventory_value: number | null;
  annual_hires: number | null;
  employee_count: number | null;
  geographic_scope: string;
  notes: string;
  business_exclusions: string;
  enterprise_applications: string[];
  detected_applications: string[];
  pptx_template: unknown;
  industry_specifics: unknown;
  raw_context: string;
  enriched_context: Record<string, unknown>;
  enrichment_applied_at: string;
  existing_systems: unknown[];
  hard_exclusions: unknown[];
  filtered_skills: unknown[];
}

export interface L4Activity {
  id: string;
  name: string;
  description: string;
  l1: string;
  l2: string;
  l3: string;
  financial_rating: FinancialRating;
  value_metric: string;
  impact_order: ImpactOrder;
  rating_confidence: RatingConfidence;
  ai_suitability: AiSuitability | null;
  decision_exists: boolean;
  decision_articulation: string;
  escalation_flag: string | null;
  skills: unknown[];
}

export interface L3Opportunity {
  l3_name: string;
  l2_name: string;
  l1_name: string;
  opportunity_exists: boolean;
  opportunity_name: string;
  opportunity_summary: string;
  lead_archetype: LeadArchetype | null;
  supporting_archetypes: string[];
  combined_max_value: number;
  implementation_complexity: ImplementationComplexity | null;
  quick_win: boolean;
  competitive_positioning: string | null;
  aera_differentiators: string[];
  l4_count: number;
  high_value_l4_count: number;
  rationale: string;
}

export interface HierarchyExport {
  meta: Meta;
  company_context: CompanyContext;
  hierarchy: L4Activity[];
  l3_opportunities: L3Opportunity[];
  /** Extra top-level keys (industry_analysis, domain_references, etc.) are preserved via passthrough */
  [key: string]: unknown;
}
