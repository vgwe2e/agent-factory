/**
 * TypeScript types for the Aera hierarchy JSON export (v3 envelope format).
 *
 * The v3 export wraps project data in an envelope with export_meta, disclaimer,
 * project, and summary. HierarchyExport represents the inner project data that
 * downstream consumers work with. Zod schemas in schemas/hierarchy.ts validate
 * the full envelope at runtime; parseExport unwraps the project data.
 */

// -- Enums --

export type FinancialRating = "HIGH" | "MEDIUM" | "LOW";

export type AiSuitability = "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE";

export type ImpactOrder = "FIRST" | "SECOND";

export type RatingConfidence = "HIGH" | "MEDIUM" | "LOW";

export type LeadArchetype = "DETERMINISTIC" | "AGENTIC" | "GENERATIVE";

export type ImplementationComplexity = "LOW" | "MEDIUM" | "HIGH";

export interface CrossFunctionalScope {
  l1_domains?: string[];
  primary_l4_ids?: string[];
  coordination_points?: string[];
  [key: string]: unknown;
}

// -- Skill sub-types --

export interface SkillAction {
  action_type: string | null;
  action_name: string | null;
  description: string | null;
  typical_triggers?: string[];
  target_system?: string | null;
  [key: string]: unknown;
}

export interface SkillConstraint {
  constraint_type: string | null;
  constraint_name: string | null;
  description: string | null;
  data_source?: string | null;
  [key: string]: unknown;
}

export interface SkillExecution {
  target_systems: string[];
  write_back_actions: string[];
  execution_trigger: string | null;
  execution_frequency: string | null;
  autonomy_level: string | null;
  approval_required: boolean | null;
  approval_threshold: string | null;
  rollback_strategy: string | null;
  [key: string]: unknown;
}

export interface SkillProblemStatement {
  current_state: string;
  quantified_pain: string;
  root_cause: string;
  falsifiability_check: string;
  outcome: string;
  [key: string]: unknown;
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  archetype: LeadArchetype;
  max_value: number;
  slider_percent: number | null;
  overlap_group: string | null;
  value_metric: string | null;
  decision_made: string | null;
  aera_skill_pattern: string | null;
  is_actual: boolean;
  source: string | null;
  loe: string | null;
  savings_type: string | null;
  actions: SkillAction[];
  constraints: SkillConstraint[];
  execution: SkillExecution | null;
  problem_statement: SkillProblemStatement | null;
  differentiation: string | null;
  generated_at: string | null;
  prompt_version: string | null;
  is_cross_functional: boolean | null;
  cross_functional_scope: string | CrossFunctionalScope | null;
  operational_flow: unknown[];
  walkthrough_decision: string | null;
  walkthrough_actions: unknown[];
  walkthrough_narrative: string | null;
  program_focus_ids?: string[];
  [key: string]: unknown;
}

/**
 * Skill enriched with parent L4 activity context.
 * Used as the unit of scoring throughout the pipeline.
 * Guarantees non-null execution and problem_statement (defaults applied during extraction).
 */
export interface SkillWithContext extends Skill {
  /** Non-null execution (defaults applied during extraction) */
  execution: SkillExecution;
  /** Non-null problem_statement (defaults applied during extraction) */
  problem_statement: SkillProblemStatement;
  /** Parent L4 activity name */
  l4Name: string;
  /** Parent L4 activity ID */
  l4Id: string;
  /** L3 category (for grouping/reporting) */
  l3Name: string;
  /** L2 domain */
  l2Name: string;
  /** L1 area */
  l1Name: string;
  /** Parent L4 financial rating */
  financialRating: FinancialRating;
  /** Parent L4 AI suitability */
  aiSuitability: AiSuitability | null;
  /** Parent L4 impact order */
  impactOrder: ImpactOrder;
  /** Parent L4 rating confidence */
  ratingConfidence: RatingConfidence;
  /** Parent L4 decision exists flag */
  decisionExists: boolean;
  /** Parent L4 decision articulation */
  decisionArticulation: string | null;
}

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
  decision_articulation: string | null;
  escalation_flag: string | null;
  skills: Skill[];
}

export interface L3Opportunity {
  l3_name: string;
  l2_name: string;
  l1_name: string;
  opportunity_exists: boolean;
  opportunity_name: string | null;
  opportunity_summary: string | null;
  lead_archetype: LeadArchetype | null;
  supporting_archetypes: string[];
  combined_max_value: number | null;
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
  cross_functional_skills?: Skill[];
  /** Extra top-level keys (industry_analysis, domain_references, etc.) are preserved via passthrough */
  [key: string]: unknown;
}
