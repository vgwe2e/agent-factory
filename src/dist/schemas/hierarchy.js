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
    skills: z.array(z.unknown()),
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
export const hierarchyExportSchema = z
    .object({
    meta: metaSchema,
    company_context: companyContextSchema,
    hierarchy: z.array(l4ActivitySchema),
    l3_opportunities: z.array(l3OpportunitySchema),
})
    .passthrough();
