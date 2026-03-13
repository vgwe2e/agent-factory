/**
 * Zod schemas for validating hierarchy JSON exports.
 *
 * These schemas validate the structure of hierarchy export files and produce
 * typed output via z.infer. The top-level schema uses .passthrough() to
 * accept extra keys (industry_analysis, domain_references, etc.) without
 * stripping them.
 */

import { z } from "zod";

// -- Enum schemas --

export const skillArchetypeSchema = z.enum(["DETERMINISTIC", "AGENTIC", "GENERATIVE"]);

export const financialRatingSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const aiSuitabilitySchema = z.enum([
  "HIGH",
  "MEDIUM",
  "LOW",
  "NOT_APPLICABLE",
]);

export const impactOrderSchema = z.enum(["FIRST", "SECOND"]);

export const ratingConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const leadArchetypeSchema = z.enum([
  "DETERMINISTIC",
  "AGENTIC",
  "GENERATIVE",
]);

export const implementationComplexitySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

// -- Object schemas --

export const metaSchema = z.object({
  project_name: z.string(),
  version_date: z.string(),
  created_date: z.string(),
  exported_by: z.string().nullable(),
  description: z.string(),
});

export const companyContextSchema = z.object({
  industry: z.string(),
  company_name: z.string(),
  annual_revenue: z.number().nullable(),
  cogs: z.number().nullable(),
  sga: z.number().nullable(),
  ebitda: z.number().nullable(),
  working_capital: z.number().nullable(),
  inventory_value: z.number().nullable(),
  annual_hires: z.number().nullable(),
  employee_count: z.number().nullable(),
  geographic_scope: z.string(),
  notes: z.string(),
  business_exclusions: z.string(),
  enterprise_applications: z.array(z.string()),
  detected_applications: z.array(z.string()),
  pptx_template: z.unknown(),
  industry_specifics: z.unknown(),
  raw_context: z.string(),
  enriched_context: z.record(z.unknown()),
  enrichment_applied_at: z.string(),
  existing_systems: z.array(z.unknown()),
  hard_exclusions: z.array(z.unknown()),
  filtered_skills: z.array(z.unknown()),
});

// -- Skill sub-object schemas --

export const skillActionSchema = z.object({
  action_type: z.string().nullable(),
  action_name: z.string().nullable(),
  description: z.string().nullable(),
  typical_triggers: z.array(z.string()).optional(),
  target_system: z.string().nullable().optional(),
}).passthrough();

export const skillConstraintSchema = z.object({
  constraint_type: z.string().nullable(),
  constraint_name: z.string().nullable(),
  description: z.string().nullable(),
  data_source: z.string().nullable().optional(),
}).passthrough();

export const skillExecutionSchema = z.object({
  target_systems: z.array(z.string()),
  write_back_actions: z.array(z.string()),
  execution_trigger: z.string().nullable(),
  execution_frequency: z.string().nullable(),
  autonomy_level: z.string().nullable(),
  approval_required: z.boolean().nullable(),
  approval_threshold: z.string().nullable(),
  rollback_strategy: z.string().nullable(),
}).passthrough();

export const skillProblemStatementSchema = z.object({
  current_state: z.string(),
  quantified_pain: z.string(),
  root_cause: z.string(),
  falsifiability_check: z.string(),
  outcome: z.string(),
}).passthrough();

// -- Skill schema --

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  archetype: skillArchetypeSchema,
  max_value: z.number(),
  slider_percent: z.number().nullable(),
  overlap_group: z.string().nullable(),
  value_metric: z.string().nullable(),
  decision_made: z.string().nullable(),
  aera_skill_pattern: z.string().nullable(),
  is_actual: z.boolean(),
  source: z.string().nullable(),
  loe: z.string().nullable(),
  savings_type: z.string().nullable(),
  actions: z.array(skillActionSchema),
  constraints: z.array(skillConstraintSchema),
  execution: skillExecutionSchema.nullable(),
  problem_statement: skillProblemStatementSchema.nullable(),
  differentiation: z.string().nullable(),
  generated_at: z.string().nullable(),
  prompt_version: z.string().nullable(),
  is_cross_functional: z.boolean().nullable(),
  cross_functional_scope: z.string().nullable(),
  operational_flow: z.array(z.unknown()),
  walkthrough_decision: z.string().nullable(),
  walkthrough_actions: z.array(z.unknown()),
  walkthrough_narrative: z.string().nullable(),
  program_focus_ids: z.array(z.string()).optional(),
}).passthrough();

// -- L4 / L3 schemas --

export const l4ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  l1: z.string(),
  l2: z.string(),
  l3: z.string(),
  financial_rating: financialRatingSchema,
  value_metric: z.string(),
  impact_order: impactOrderSchema,
  rating_confidence: ratingConfidenceSchema,
  ai_suitability: aiSuitabilitySchema.nullable(),
  decision_exists: z.boolean(),
  decision_articulation: z.string().nullable(),
  escalation_flag: z.string().nullable(),
  skills: z.array(skillSchema),
});

export const l3OpportunitySchema = z.object({
  l3_name: z.string(),
  l2_name: z.string(),
  l1_name: z.string(),
  opportunity_exists: z.boolean(),
  opportunity_name: z.string().nullable(),
  opportunity_summary: z.string().nullable(),
  lead_archetype: leadArchetypeSchema.nullable(),
  supporting_archetypes: z.array(z.string()),
  combined_max_value: z.number().nullable(),
  implementation_complexity: implementationComplexitySchema.nullable(),
  quick_win: z.boolean(),
  competitive_positioning: z.string().nullable(),
  aera_differentiators: z.array(z.string()),
  l4_count: z.number(),
  high_value_l4_count: z.number(),
  rationale: z.string(),
});

/** Inner project data (what downstream consumers use). */
export const projectDataSchema = z
  .object({
    meta: metaSchema,
    company_context: companyContextSchema,
    hierarchy: z.array(l4ActivitySchema),
    l3_opportunities: z.array(l3OpportunitySchema),
  })
  .passthrough();

export const exportMetaSchema = z.object({
  exported_at: z.string(),
  exported_by: z.string().nullable(),
  export_version: z.string(),
  schema_version: z.string(),
  analysis_type: z.string(),
  requires_validation: z.boolean(),
});

export const disclaimerSchema = z.object({
  type: z.string(),
  message: z.string(),
  enterprise_applications: z.array(z.string()),
  overlap_notice: z.string(),
});

/** Top-level v3 export envelope. */
export const hierarchyExportSchema = z.object({
  export_meta: exportMetaSchema,
  disclaimer: disclaimerSchema,
  project: projectDataSchema,
  summary: z.record(z.unknown()),
});

// -- Inferred types (alternative to importing from types/hierarchy.ts) --

export type MetaSchema = z.infer<typeof metaSchema>;
export type CompanyContextSchema = z.infer<typeof companyContextSchema>;
export type SkillSchema = z.infer<typeof skillSchema>;
export type SkillActionSchema = z.infer<typeof skillActionSchema>;
export type SkillConstraintSchema = z.infer<typeof skillConstraintSchema>;
export type SkillExecutionSchema = z.infer<typeof skillExecutionSchema>;
export type SkillProblemStatementSchema = z.infer<typeof skillProblemStatementSchema>;
export type L4ActivitySchema = z.infer<typeof l4ActivitySchema>;
export type L3OpportunitySchema = z.infer<typeof l3OpportunitySchema>;
export type ProjectDataSchema = z.infer<typeof projectDataSchema>;
export type HierarchyExportSchema = z.infer<typeof hierarchyExportSchema>;
