/**
 * Zod schemas for validating hierarchy JSON exports.
 *
 * These schemas validate the structure of hierarchy export files and produce
 * typed output via z.infer. The top-level schema uses .passthrough() to
 * accept extra keys (industry_analysis, domain_references, etc.) without
 * stripping them.
 */
import { z } from "zod";
export declare const skillArchetypeSchema: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
export declare const financialRatingSchema: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
export declare const aiSuitabilitySchema: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>;
export declare const impactOrderSchema: z.ZodEnum<["FIRST", "SECOND"]>;
export declare const ratingConfidenceSchema: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
export declare const normalizedRatingConfidenceSchema: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
export declare const leadArchetypeSchema: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
export declare const implementationComplexitySchema: z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>;
export declare const metaSchema: z.ZodObject<{
    project_name: z.ZodString;
    version_date: z.ZodString;
    created_date: z.ZodString;
    exported_by: z.ZodNullable<z.ZodString>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    project_name: string;
    version_date: string;
    created_date: string;
    exported_by: string | null;
    description: string;
}, {
    project_name: string;
    version_date: string;
    created_date: string;
    exported_by: string | null;
    description: string;
}>;
export declare const companyContextSchema: z.ZodObject<{
    industry: z.ZodString;
    company_name: z.ZodString;
    annual_revenue: z.ZodNullable<z.ZodNumber>;
    cogs: z.ZodNullable<z.ZodNumber>;
    sga: z.ZodNullable<z.ZodNumber>;
    ebitda: z.ZodNullable<z.ZodNumber>;
    working_capital: z.ZodNullable<z.ZodNumber>;
    inventory_value: z.ZodNullable<z.ZodNumber>;
    annual_hires: z.ZodNullable<z.ZodNumber>;
    employee_count: z.ZodNullable<z.ZodNumber>;
    geographic_scope: z.ZodString;
    notes: z.ZodString;
    business_exclusions: z.ZodString;
    enterprise_applications: z.ZodArray<z.ZodString, "many">;
    detected_applications: z.ZodArray<z.ZodString, "many">;
    pptx_template: z.ZodUnknown;
    industry_specifics: z.ZodUnknown;
    raw_context: z.ZodString;
    enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    enrichment_applied_at: z.ZodString;
    existing_systems: z.ZodArray<z.ZodUnknown, "many">;
    hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
    filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
}, "strip", z.ZodTypeAny, {
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
    raw_context: string;
    enriched_context: Record<string, unknown>;
    enrichment_applied_at: string;
    existing_systems: unknown[];
    hard_exclusions: unknown[];
    filtered_skills: unknown[];
    pptx_template?: unknown;
    industry_specifics?: unknown;
}, {
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
    raw_context: string;
    enriched_context: Record<string, unknown>;
    enrichment_applied_at: string;
    existing_systems: unknown[];
    hard_exclusions: unknown[];
    filtered_skills: unknown[];
    pptx_template?: unknown;
    industry_specifics?: unknown;
}>;
export declare const skillActionSchema: z.ZodObject<{
    action_type: z.ZodNullable<z.ZodString>;
    action_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    action_type: z.ZodNullable<z.ZodString>;
    action_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    action_type: z.ZodNullable<z.ZodString>;
    action_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const skillConstraintSchema: z.ZodObject<{
    constraint_type: z.ZodNullable<z.ZodString>;
    constraint_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    constraint_type: z.ZodNullable<z.ZodString>;
    constraint_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    constraint_type: z.ZodNullable<z.ZodString>;
    constraint_name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const skillExecutionSchema: z.ZodObject<{
    target_systems: z.ZodArray<z.ZodString, "many">;
    write_back_actions: z.ZodArray<z.ZodString, "many">;
    execution_trigger: z.ZodNullable<z.ZodString>;
    execution_frequency: z.ZodNullable<z.ZodString>;
    autonomy_level: z.ZodNullable<z.ZodString>;
    approval_required: z.ZodNullable<z.ZodBoolean>;
    approval_threshold: z.ZodNullable<z.ZodString>;
    rollback_strategy: z.ZodNullable<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    target_systems: z.ZodArray<z.ZodString, "many">;
    write_back_actions: z.ZodArray<z.ZodString, "many">;
    execution_trigger: z.ZodNullable<z.ZodString>;
    execution_frequency: z.ZodNullable<z.ZodString>;
    autonomy_level: z.ZodNullable<z.ZodString>;
    approval_required: z.ZodNullable<z.ZodBoolean>;
    approval_threshold: z.ZodNullable<z.ZodString>;
    rollback_strategy: z.ZodNullable<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    target_systems: z.ZodArray<z.ZodString, "many">;
    write_back_actions: z.ZodArray<z.ZodString, "many">;
    execution_trigger: z.ZodNullable<z.ZodString>;
    execution_frequency: z.ZodNullable<z.ZodString>;
    autonomy_level: z.ZodNullable<z.ZodString>;
    approval_required: z.ZodNullable<z.ZodBoolean>;
    approval_threshold: z.ZodNullable<z.ZodString>;
    rollback_strategy: z.ZodNullable<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const skillProblemStatementSchema: z.ZodObject<{
    current_state: z.ZodString;
    quantified_pain: z.ZodString;
    root_cause: z.ZodString;
    falsifiability_check: z.ZodString;
    outcome: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    current_state: z.ZodString;
    quantified_pain: z.ZodString;
    root_cause: z.ZodString;
    falsifiability_check: z.ZodString;
    outcome: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    current_state: z.ZodString;
    quantified_pain: z.ZodString;
    root_cause: z.ZodString;
    falsifiability_check: z.ZodString;
    outcome: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const crossFunctionalScopeSchema: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>]>>;
export declare const skillSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
    max_value: z.ZodNumber;
    slider_percent: z.ZodNullable<z.ZodNumber>;
    overlap_group: z.ZodNullable<z.ZodString>;
    value_metric: z.ZodNullable<z.ZodString>;
    decision_made: z.ZodNullable<z.ZodString>;
    aera_skill_pattern: z.ZodNullable<z.ZodString>;
    is_actual: z.ZodBoolean;
    source: z.ZodNullable<z.ZodString>;
    loe: z.ZodNullable<z.ZodString>;
    savings_type: z.ZodNullable<z.ZodString>;
    actions: z.ZodArray<z.ZodObject<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    constraints: z.ZodArray<z.ZodObject<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    execution: z.ZodNullable<z.ZodObject<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    problem_statement: z.ZodNullable<z.ZodObject<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    differentiation: z.ZodNullable<z.ZodString>;
    generated_at: z.ZodNullable<z.ZodString>;
    prompt_version: z.ZodNullable<z.ZodString>;
    is_cross_functional: z.ZodNullable<z.ZodBoolean>;
    cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    operational_flow: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_decision: z.ZodNullable<z.ZodString>;
    walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_narrative: z.ZodNullable<z.ZodString>;
    program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
    max_value: z.ZodNumber;
    slider_percent: z.ZodNullable<z.ZodNumber>;
    overlap_group: z.ZodNullable<z.ZodString>;
    value_metric: z.ZodNullable<z.ZodString>;
    decision_made: z.ZodNullable<z.ZodString>;
    aera_skill_pattern: z.ZodNullable<z.ZodString>;
    is_actual: z.ZodBoolean;
    source: z.ZodNullable<z.ZodString>;
    loe: z.ZodNullable<z.ZodString>;
    savings_type: z.ZodNullable<z.ZodString>;
    actions: z.ZodArray<z.ZodObject<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    constraints: z.ZodArray<z.ZodObject<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    execution: z.ZodNullable<z.ZodObject<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    problem_statement: z.ZodNullable<z.ZodObject<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    differentiation: z.ZodNullable<z.ZodString>;
    generated_at: z.ZodNullable<z.ZodString>;
    prompt_version: z.ZodNullable<z.ZodString>;
    is_cross_functional: z.ZodNullable<z.ZodBoolean>;
    cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    operational_flow: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_decision: z.ZodNullable<z.ZodString>;
    walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_narrative: z.ZodNullable<z.ZodString>;
    program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
    max_value: z.ZodNumber;
    slider_percent: z.ZodNullable<z.ZodNumber>;
    overlap_group: z.ZodNullable<z.ZodString>;
    value_metric: z.ZodNullable<z.ZodString>;
    decision_made: z.ZodNullable<z.ZodString>;
    aera_skill_pattern: z.ZodNullable<z.ZodString>;
    is_actual: z.ZodBoolean;
    source: z.ZodNullable<z.ZodString>;
    loe: z.ZodNullable<z.ZodString>;
    savings_type: z.ZodNullable<z.ZodString>;
    actions: z.ZodArray<z.ZodObject<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        action_type: z.ZodNullable<z.ZodString>;
        action_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    constraints: z.ZodArray<z.ZodObject<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        constraint_type: z.ZodNullable<z.ZodString>;
        constraint_name: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
        data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    execution: z.ZodNullable<z.ZodObject<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        target_systems: z.ZodArray<z.ZodString, "many">;
        write_back_actions: z.ZodArray<z.ZodString, "many">;
        execution_trigger: z.ZodNullable<z.ZodString>;
        execution_frequency: z.ZodNullable<z.ZodString>;
        autonomy_level: z.ZodNullable<z.ZodString>;
        approval_required: z.ZodNullable<z.ZodBoolean>;
        approval_threshold: z.ZodNullable<z.ZodString>;
        rollback_strategy: z.ZodNullable<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    problem_statement: z.ZodNullable<z.ZodObject<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        current_state: z.ZodString;
        quantified_pain: z.ZodString;
        root_cause: z.ZodString;
        falsifiability_check: z.ZodString;
        outcome: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    differentiation: z.ZodNullable<z.ZodString>;
    generated_at: z.ZodNullable<z.ZodString>;
    prompt_version: z.ZodNullable<z.ZodString>;
    is_cross_functional: z.ZodNullable<z.ZodBoolean>;
    cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    operational_flow: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_decision: z.ZodNullable<z.ZodString>;
    walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
    walkthrough_narrative: z.ZodNullable<z.ZodString>;
    program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export declare const l4ActivitySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    l1: z.ZodString;
    l2: z.ZodString;
    l3: z.ZodString;
    financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
    value_metric: z.ZodString;
    impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
    rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
    ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
    decision_exists: z.ZodBoolean;
    decision_articulation: z.ZodNullable<z.ZodString>;
    escalation_flag: z.ZodNullable<z.ZodString>;
    skills: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    name: string;
    value_metric: string;
    l1: string;
    l2: string;
    l3: string;
    financial_rating: "HIGH" | "MEDIUM" | "LOW";
    impact_order: "FIRST" | "SECOND";
    rating_confidence: "HIGH" | "MEDIUM" | "LOW";
    ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
    decision_exists: boolean;
    decision_articulation: string | null;
    escalation_flag: string | null;
    skills: z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">[];
}, {
    description: string;
    id: string;
    name: string;
    value_metric: string;
    l1: string;
    l2: string;
    l3: string;
    financial_rating: "HIGH" | "MEDIUM" | "LOW";
    impact_order: "FIRST" | "SECOND";
    ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
    decision_exists: boolean;
    decision_articulation: string | null;
    escalation_flag: string | null;
    skills: z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">[];
    rating_confidence?: unknown;
}>;
export declare const l3OpportunitySchema: z.ZodObject<{
    l3_name: z.ZodString;
    l2_name: z.ZodString;
    l1_name: z.ZodString;
    opportunity_exists: z.ZodBoolean;
    opportunity_name: z.ZodNullable<z.ZodString>;
    opportunity_summary: z.ZodNullable<z.ZodString>;
    lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
    supporting_archetypes: z.ZodArray<z.ZodString, "many">;
    combined_max_value: z.ZodNullable<z.ZodNumber>;
    implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    quick_win: z.ZodBoolean;
    competitive_positioning: z.ZodNullable<z.ZodString>;
    aera_differentiators: z.ZodArray<z.ZodString, "many">;
    l4_count: z.ZodNumber;
    high_value_l4_count: z.ZodNumber;
    rationale: z.ZodString;
}, "strip", z.ZodTypeAny, {
    l3_name: string;
    l2_name: string;
    l1_name: string;
    opportunity_exists: boolean;
    opportunity_name: string | null;
    opportunity_summary: string | null;
    lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
    supporting_archetypes: string[];
    combined_max_value: number | null;
    implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
    quick_win: boolean;
    competitive_positioning: string | null;
    aera_differentiators: string[];
    l4_count: number;
    high_value_l4_count: number;
    rationale: string;
}, {
    l3_name: string;
    l2_name: string;
    l1_name: string;
    opportunity_exists: boolean;
    opportunity_name: string | null;
    opportunity_summary: string | null;
    lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
    supporting_archetypes: string[];
    combined_max_value: number | null;
    implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
    quick_win: boolean;
    competitive_positioning: string | null;
    aera_differentiators: string[];
    l4_count: number;
    high_value_l4_count: number;
    rationale: string;
}>;
/** Inner project data (what downstream consumers use). */
export declare const projectDataSchema: z.ZodObject<{
    meta: z.ZodObject<{
        project_name: z.ZodString;
        version_date: z.ZodString;
        created_date: z.ZodString;
        exported_by: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }>;
    company_context: z.ZodObject<{
        industry: z.ZodString;
        company_name: z.ZodString;
        annual_revenue: z.ZodNullable<z.ZodNumber>;
        cogs: z.ZodNullable<z.ZodNumber>;
        sga: z.ZodNullable<z.ZodNumber>;
        ebitda: z.ZodNullable<z.ZodNumber>;
        working_capital: z.ZodNullable<z.ZodNumber>;
        inventory_value: z.ZodNullable<z.ZodNumber>;
        annual_hires: z.ZodNullable<z.ZodNumber>;
        employee_count: z.ZodNullable<z.ZodNumber>;
        geographic_scope: z.ZodString;
        notes: z.ZodString;
        business_exclusions: z.ZodString;
        enterprise_applications: z.ZodArray<z.ZodString, "many">;
        detected_applications: z.ZodArray<z.ZodString, "many">;
        pptx_template: z.ZodUnknown;
        industry_specifics: z.ZodUnknown;
        raw_context: z.ZodString;
        enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        enrichment_applied_at: z.ZodString;
        existing_systems: z.ZodArray<z.ZodUnknown, "many">;
        hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
        filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
    }, "strip", z.ZodTypeAny, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }>;
    hierarchy: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        l1: z.ZodString;
        l2: z.ZodString;
        l3: z.ZodString;
        financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
        value_metric: z.ZodString;
        impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
        rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
        ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
        decision_exists: z.ZodBoolean;
        decision_articulation: z.ZodNullable<z.ZodString>;
        escalation_flag: z.ZodNullable<z.ZodString>;
        skills: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        rating_confidence: "HIGH" | "MEDIUM" | "LOW";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
    }, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
        rating_confidence?: unknown;
    }>, "many">;
    l3_opportunities: z.ZodArray<z.ZodObject<{
        l3_name: z.ZodString;
        l2_name: z.ZodString;
        l1_name: z.ZodString;
        opportunity_exists: z.ZodBoolean;
        opportunity_name: z.ZodNullable<z.ZodString>;
        opportunity_summary: z.ZodNullable<z.ZodString>;
        lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
        supporting_archetypes: z.ZodArray<z.ZodString, "many">;
        combined_max_value: z.ZodNullable<z.ZodNumber>;
        implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
        quick_win: z.ZodBoolean;
        competitive_positioning: z.ZodNullable<z.ZodString>;
        aera_differentiators: z.ZodArray<z.ZodString, "many">;
        l4_count: z.ZodNumber;
        high_value_l4_count: z.ZodNumber;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }>, "many">;
    cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    meta: z.ZodObject<{
        project_name: z.ZodString;
        version_date: z.ZodString;
        created_date: z.ZodString;
        exported_by: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }>;
    company_context: z.ZodObject<{
        industry: z.ZodString;
        company_name: z.ZodString;
        annual_revenue: z.ZodNullable<z.ZodNumber>;
        cogs: z.ZodNullable<z.ZodNumber>;
        sga: z.ZodNullable<z.ZodNumber>;
        ebitda: z.ZodNullable<z.ZodNumber>;
        working_capital: z.ZodNullable<z.ZodNumber>;
        inventory_value: z.ZodNullable<z.ZodNumber>;
        annual_hires: z.ZodNullable<z.ZodNumber>;
        employee_count: z.ZodNullable<z.ZodNumber>;
        geographic_scope: z.ZodString;
        notes: z.ZodString;
        business_exclusions: z.ZodString;
        enterprise_applications: z.ZodArray<z.ZodString, "many">;
        detected_applications: z.ZodArray<z.ZodString, "many">;
        pptx_template: z.ZodUnknown;
        industry_specifics: z.ZodUnknown;
        raw_context: z.ZodString;
        enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        enrichment_applied_at: z.ZodString;
        existing_systems: z.ZodArray<z.ZodUnknown, "many">;
        hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
        filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
    }, "strip", z.ZodTypeAny, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }>;
    hierarchy: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        l1: z.ZodString;
        l2: z.ZodString;
        l3: z.ZodString;
        financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
        value_metric: z.ZodString;
        impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
        rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
        ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
        decision_exists: z.ZodBoolean;
        decision_articulation: z.ZodNullable<z.ZodString>;
        escalation_flag: z.ZodNullable<z.ZodString>;
        skills: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        rating_confidence: "HIGH" | "MEDIUM" | "LOW";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
    }, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
        rating_confidence?: unknown;
    }>, "many">;
    l3_opportunities: z.ZodArray<z.ZodObject<{
        l3_name: z.ZodString;
        l2_name: z.ZodString;
        l1_name: z.ZodString;
        opportunity_exists: z.ZodBoolean;
        opportunity_name: z.ZodNullable<z.ZodString>;
        opportunity_summary: z.ZodNullable<z.ZodString>;
        lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
        supporting_archetypes: z.ZodArray<z.ZodString, "many">;
        combined_max_value: z.ZodNullable<z.ZodNumber>;
        implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
        quick_win: z.ZodBoolean;
        competitive_positioning: z.ZodNullable<z.ZodString>;
        aera_differentiators: z.ZodArray<z.ZodString, "many">;
        l4_count: z.ZodNumber;
        high_value_l4_count: z.ZodNumber;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }>, "many">;
    cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    meta: z.ZodObject<{
        project_name: z.ZodString;
        version_date: z.ZodString;
        created_date: z.ZodString;
        exported_by: z.ZodNullable<z.ZodString>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }, {
        project_name: string;
        version_date: string;
        created_date: string;
        exported_by: string | null;
        description: string;
    }>;
    company_context: z.ZodObject<{
        industry: z.ZodString;
        company_name: z.ZodString;
        annual_revenue: z.ZodNullable<z.ZodNumber>;
        cogs: z.ZodNullable<z.ZodNumber>;
        sga: z.ZodNullable<z.ZodNumber>;
        ebitda: z.ZodNullable<z.ZodNumber>;
        working_capital: z.ZodNullable<z.ZodNumber>;
        inventory_value: z.ZodNullable<z.ZodNumber>;
        annual_hires: z.ZodNullable<z.ZodNumber>;
        employee_count: z.ZodNullable<z.ZodNumber>;
        geographic_scope: z.ZodString;
        notes: z.ZodString;
        business_exclusions: z.ZodString;
        enterprise_applications: z.ZodArray<z.ZodString, "many">;
        detected_applications: z.ZodArray<z.ZodString, "many">;
        pptx_template: z.ZodUnknown;
        industry_specifics: z.ZodUnknown;
        raw_context: z.ZodString;
        enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        enrichment_applied_at: z.ZodString;
        existing_systems: z.ZodArray<z.ZodUnknown, "many">;
        hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
        filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
    }, "strip", z.ZodTypeAny, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }, {
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
        raw_context: string;
        enriched_context: Record<string, unknown>;
        enrichment_applied_at: string;
        existing_systems: unknown[];
        hard_exclusions: unknown[];
        filtered_skills: unknown[];
        pptx_template?: unknown;
        industry_specifics?: unknown;
    }>;
    hierarchy: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        l1: z.ZodString;
        l2: z.ZodString;
        l3: z.ZodString;
        financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
        value_metric: z.ZodString;
        impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
        rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
        ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
        decision_exists: z.ZodBoolean;
        decision_articulation: z.ZodNullable<z.ZodString>;
        escalation_flag: z.ZodNullable<z.ZodString>;
        skills: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        rating_confidence: "HIGH" | "MEDIUM" | "LOW";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
    }, {
        description: string;
        id: string;
        name: string;
        value_metric: string;
        l1: string;
        l2: string;
        l3: string;
        financial_rating: "HIGH" | "MEDIUM" | "LOW";
        impact_order: "FIRST" | "SECOND";
        ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
        decision_exists: boolean;
        decision_articulation: string | null;
        escalation_flag: string | null;
        skills: z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
        rating_confidence?: unknown;
    }>, "many">;
    l3_opportunities: z.ZodArray<z.ZodObject<{
        l3_name: z.ZodString;
        l2_name: z.ZodString;
        l1_name: z.ZodString;
        opportunity_exists: z.ZodBoolean;
        opportunity_name: z.ZodNullable<z.ZodString>;
        opportunity_summary: z.ZodNullable<z.ZodString>;
        lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
        supporting_archetypes: z.ZodArray<z.ZodString, "many">;
        combined_max_value: z.ZodNullable<z.ZodNumber>;
        implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
        quick_win: z.ZodBoolean;
        competitive_positioning: z.ZodNullable<z.ZodString>;
        aera_differentiators: z.ZodArray<z.ZodString, "many">;
        l4_count: z.ZodNumber;
        high_value_l4_count: z.ZodNumber;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }, {
        l3_name: string;
        l2_name: string;
        l1_name: string;
        opportunity_exists: boolean;
        opportunity_name: string | null;
        opportunity_summary: string | null;
        lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
        supporting_archetypes: string[];
        combined_max_value: number | null;
        implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
        quick_win: boolean;
        competitive_positioning: string | null;
        aera_differentiators: string[];
        l4_count: number;
        high_value_l4_count: number;
        rationale: string;
    }>, "many">;
    cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
        max_value: z.ZodNumber;
        slider_percent: z.ZodNullable<z.ZodNumber>;
        overlap_group: z.ZodNullable<z.ZodString>;
        value_metric: z.ZodNullable<z.ZodString>;
        decision_made: z.ZodNullable<z.ZodString>;
        aera_skill_pattern: z.ZodNullable<z.ZodString>;
        is_actual: z.ZodBoolean;
        source: z.ZodNullable<z.ZodString>;
        loe: z.ZodNullable<z.ZodString>;
        savings_type: z.ZodNullable<z.ZodString>;
        actions: z.ZodArray<z.ZodObject<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            action_type: z.ZodNullable<z.ZodString>;
            action_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        constraints: z.ZodArray<z.ZodObject<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            constraint_type: z.ZodNullable<z.ZodString>;
            constraint_name: z.ZodNullable<z.ZodString>;
            description: z.ZodNullable<z.ZodString>;
            data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        execution: z.ZodNullable<z.ZodObject<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            target_systems: z.ZodArray<z.ZodString, "many">;
            write_back_actions: z.ZodArray<z.ZodString, "many">;
            execution_trigger: z.ZodNullable<z.ZodString>;
            execution_frequency: z.ZodNullable<z.ZodString>;
            autonomy_level: z.ZodNullable<z.ZodString>;
            approval_required: z.ZodNullable<z.ZodBoolean>;
            approval_threshold: z.ZodNullable<z.ZodString>;
            rollback_strategy: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>;
        problem_statement: z.ZodNullable<z.ZodObject<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            current_state: z.ZodString;
            quantified_pain: z.ZodString;
            root_cause: z.ZodString;
            falsifiability_check: z.ZodString;
            outcome: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
        differentiation: z.ZodNullable<z.ZodString>;
        generated_at: z.ZodNullable<z.ZodString>;
        prompt_version: z.ZodNullable<z.ZodString>;
        is_cross_functional: z.ZodNullable<z.ZodBoolean>;
        cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>]>>;
        operational_flow: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_decision: z.ZodNullable<z.ZodString>;
        walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
        walkthrough_narrative: z.ZodNullable<z.ZodString>;
        program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const exportMetaSchema: z.ZodObject<{
    exported_at: z.ZodString;
    exported_by: z.ZodNullable<z.ZodString>;
    export_version: z.ZodString;
    schema_version: z.ZodString;
    analysis_type: z.ZodString;
    requires_validation: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    exported_by: string | null;
    exported_at: string;
    export_version: string;
    schema_version: string;
    analysis_type: string;
    requires_validation: boolean;
}, {
    exported_by: string | null;
    exported_at: string;
    export_version: string;
    schema_version: string;
    analysis_type: string;
    requires_validation: boolean;
}>;
export declare const disclaimerSchema: z.ZodObject<{
    type: z.ZodString;
    message: z.ZodString;
    enterprise_applications: z.ZodArray<z.ZodString, "many">;
    overlap_notice: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: string;
    enterprise_applications: string[];
    overlap_notice: string;
}, {
    message: string;
    type: string;
    enterprise_applications: string[];
    overlap_notice: string;
}>;
/** Top-level v3 export envelope. */
export declare const hierarchyExportSchema: z.ZodObject<{
    export_meta: z.ZodObject<{
        exported_at: z.ZodString;
        exported_by: z.ZodNullable<z.ZodString>;
        export_version: z.ZodString;
        schema_version: z.ZodString;
        analysis_type: z.ZodString;
        requires_validation: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        exported_by: string | null;
        exported_at: string;
        export_version: string;
        schema_version: string;
        analysis_type: string;
        requires_validation: boolean;
    }, {
        exported_by: string | null;
        exported_at: string;
        export_version: string;
        schema_version: string;
        analysis_type: string;
        requires_validation: boolean;
    }>;
    disclaimer: z.ZodObject<{
        type: z.ZodString;
        message: z.ZodString;
        enterprise_applications: z.ZodArray<z.ZodString, "many">;
        overlap_notice: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: string;
        enterprise_applications: string[];
        overlap_notice: string;
    }, {
        message: string;
        type: string;
        enterprise_applications: string[];
        overlap_notice: string;
    }>;
    project: z.ZodObject<{
        meta: z.ZodObject<{
            project_name: z.ZodString;
            version_date: z.ZodString;
            created_date: z.ZodString;
            exported_by: z.ZodNullable<z.ZodString>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }>;
        company_context: z.ZodObject<{
            industry: z.ZodString;
            company_name: z.ZodString;
            annual_revenue: z.ZodNullable<z.ZodNumber>;
            cogs: z.ZodNullable<z.ZodNumber>;
            sga: z.ZodNullable<z.ZodNumber>;
            ebitda: z.ZodNullable<z.ZodNumber>;
            working_capital: z.ZodNullable<z.ZodNumber>;
            inventory_value: z.ZodNullable<z.ZodNumber>;
            annual_hires: z.ZodNullable<z.ZodNumber>;
            employee_count: z.ZodNullable<z.ZodNumber>;
            geographic_scope: z.ZodString;
            notes: z.ZodString;
            business_exclusions: z.ZodString;
            enterprise_applications: z.ZodArray<z.ZodString, "many">;
            detected_applications: z.ZodArray<z.ZodString, "many">;
            pptx_template: z.ZodUnknown;
            industry_specifics: z.ZodUnknown;
            raw_context: z.ZodString;
            enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            enrichment_applied_at: z.ZodString;
            existing_systems: z.ZodArray<z.ZodUnknown, "many">;
            hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
            filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
        }, "strip", z.ZodTypeAny, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }>;
        hierarchy: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            l1: z.ZodString;
            l2: z.ZodString;
            l3: z.ZodString;
            financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
            value_metric: z.ZodString;
            impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
            rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
            ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
            decision_exists: z.ZodBoolean;
            decision_articulation: z.ZodNullable<z.ZodString>;
            escalation_flag: z.ZodNullable<z.ZodString>;
            skills: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            rating_confidence: "HIGH" | "MEDIUM" | "LOW";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
            rating_confidence?: unknown;
        }>, "many">;
        l3_opportunities: z.ZodArray<z.ZodObject<{
            l3_name: z.ZodString;
            l2_name: z.ZodString;
            l1_name: z.ZodString;
            opportunity_exists: z.ZodBoolean;
            opportunity_name: z.ZodNullable<z.ZodString>;
            opportunity_summary: z.ZodNullable<z.ZodString>;
            lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
            supporting_archetypes: z.ZodArray<z.ZodString, "many">;
            combined_max_value: z.ZodNullable<z.ZodNumber>;
            implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
            quick_win: z.ZodBoolean;
            competitive_positioning: z.ZodNullable<z.ZodString>;
            aera_differentiators: z.ZodArray<z.ZodString, "many">;
            l4_count: z.ZodNumber;
            high_value_l4_count: z.ZodNumber;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }>, "many">;
        cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        meta: z.ZodObject<{
            project_name: z.ZodString;
            version_date: z.ZodString;
            created_date: z.ZodString;
            exported_by: z.ZodNullable<z.ZodString>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }>;
        company_context: z.ZodObject<{
            industry: z.ZodString;
            company_name: z.ZodString;
            annual_revenue: z.ZodNullable<z.ZodNumber>;
            cogs: z.ZodNullable<z.ZodNumber>;
            sga: z.ZodNullable<z.ZodNumber>;
            ebitda: z.ZodNullable<z.ZodNumber>;
            working_capital: z.ZodNullable<z.ZodNumber>;
            inventory_value: z.ZodNullable<z.ZodNumber>;
            annual_hires: z.ZodNullable<z.ZodNumber>;
            employee_count: z.ZodNullable<z.ZodNumber>;
            geographic_scope: z.ZodString;
            notes: z.ZodString;
            business_exclusions: z.ZodString;
            enterprise_applications: z.ZodArray<z.ZodString, "many">;
            detected_applications: z.ZodArray<z.ZodString, "many">;
            pptx_template: z.ZodUnknown;
            industry_specifics: z.ZodUnknown;
            raw_context: z.ZodString;
            enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            enrichment_applied_at: z.ZodString;
            existing_systems: z.ZodArray<z.ZodUnknown, "many">;
            hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
            filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
        }, "strip", z.ZodTypeAny, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }>;
        hierarchy: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            l1: z.ZodString;
            l2: z.ZodString;
            l3: z.ZodString;
            financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
            value_metric: z.ZodString;
            impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
            rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
            ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
            decision_exists: z.ZodBoolean;
            decision_articulation: z.ZodNullable<z.ZodString>;
            escalation_flag: z.ZodNullable<z.ZodString>;
            skills: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            rating_confidence: "HIGH" | "MEDIUM" | "LOW";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
            rating_confidence?: unknown;
        }>, "many">;
        l3_opportunities: z.ZodArray<z.ZodObject<{
            l3_name: z.ZodString;
            l2_name: z.ZodString;
            l1_name: z.ZodString;
            opportunity_exists: z.ZodBoolean;
            opportunity_name: z.ZodNullable<z.ZodString>;
            opportunity_summary: z.ZodNullable<z.ZodString>;
            lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
            supporting_archetypes: z.ZodArray<z.ZodString, "many">;
            combined_max_value: z.ZodNullable<z.ZodNumber>;
            implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
            quick_win: z.ZodBoolean;
            competitive_positioning: z.ZodNullable<z.ZodString>;
            aera_differentiators: z.ZodArray<z.ZodString, "many">;
            l4_count: z.ZodNumber;
            high_value_l4_count: z.ZodNumber;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }>, "many">;
        cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        meta: z.ZodObject<{
            project_name: z.ZodString;
            version_date: z.ZodString;
            created_date: z.ZodString;
            exported_by: z.ZodNullable<z.ZodString>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }, {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        }>;
        company_context: z.ZodObject<{
            industry: z.ZodString;
            company_name: z.ZodString;
            annual_revenue: z.ZodNullable<z.ZodNumber>;
            cogs: z.ZodNullable<z.ZodNumber>;
            sga: z.ZodNullable<z.ZodNumber>;
            ebitda: z.ZodNullable<z.ZodNumber>;
            working_capital: z.ZodNullable<z.ZodNumber>;
            inventory_value: z.ZodNullable<z.ZodNumber>;
            annual_hires: z.ZodNullable<z.ZodNumber>;
            employee_count: z.ZodNullable<z.ZodNumber>;
            geographic_scope: z.ZodString;
            notes: z.ZodString;
            business_exclusions: z.ZodString;
            enterprise_applications: z.ZodArray<z.ZodString, "many">;
            detected_applications: z.ZodArray<z.ZodString, "many">;
            pptx_template: z.ZodUnknown;
            industry_specifics: z.ZodUnknown;
            raw_context: z.ZodString;
            enriched_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            enrichment_applied_at: z.ZodString;
            existing_systems: z.ZodArray<z.ZodUnknown, "many">;
            hard_exclusions: z.ZodArray<z.ZodUnknown, "many">;
            filtered_skills: z.ZodArray<z.ZodUnknown, "many">;
        }, "strip", z.ZodTypeAny, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }, {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        }>;
        hierarchy: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            l1: z.ZodString;
            l2: z.ZodString;
            l3: z.ZodString;
            financial_rating: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
            value_metric: z.ZodString;
            impact_order: z.ZodEnum<["FIRST", "SECOND"]>;
            rating_confidence: z.ZodEffects<z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>, "HIGH" | "MEDIUM" | "LOW", unknown>;
            ai_suitability: z.ZodNullable<z.ZodEnum<["HIGH", "MEDIUM", "LOW", "NOT_APPLICABLE"]>>;
            decision_exists: z.ZodBoolean;
            decision_articulation: z.ZodNullable<z.ZodString>;
            escalation_flag: z.ZodNullable<z.ZodString>;
            skills: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            rating_confidence: "HIGH" | "MEDIUM" | "LOW";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
            rating_confidence?: unknown;
        }>, "many">;
        l3_opportunities: z.ZodArray<z.ZodObject<{
            l3_name: z.ZodString;
            l2_name: z.ZodString;
            l1_name: z.ZodString;
            opportunity_exists: z.ZodBoolean;
            opportunity_name: z.ZodNullable<z.ZodString>;
            opportunity_summary: z.ZodNullable<z.ZodString>;
            lead_archetype: z.ZodNullable<z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>>;
            supporting_archetypes: z.ZodArray<z.ZodString, "many">;
            combined_max_value: z.ZodNullable<z.ZodNumber>;
            implementation_complexity: z.ZodNullable<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
            quick_win: z.ZodBoolean;
            competitive_positioning: z.ZodNullable<z.ZodString>;
            aera_differentiators: z.ZodArray<z.ZodString, "many">;
            l4_count: z.ZodNumber;
            high_value_l4_count: z.ZodNumber;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }, {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }>, "many">;
        cross_functional_skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
    }, z.ZodTypeAny, "passthrough">>;
    summary: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    export_meta: {
        exported_by: string | null;
        exported_at: string;
        export_version: string;
        schema_version: string;
        analysis_type: string;
        requires_validation: boolean;
    };
    disclaimer: {
        message: string;
        type: string;
        enterprise_applications: string[];
        overlap_notice: string;
    };
    project: {
        meta: {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        };
        company_context: {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        };
        hierarchy: {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            rating_confidence: "HIGH" | "MEDIUM" | "LOW";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectOutputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
        }[];
        l3_opportunities: {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }[];
        cross_functional_skills: z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[];
    } & {
        [k: string]: unknown;
    };
    summary: Record<string, unknown>;
}, {
    export_meta: {
        exported_by: string | null;
        exported_at: string;
        export_version: string;
        schema_version: string;
        analysis_type: string;
        requires_validation: boolean;
    };
    disclaimer: {
        message: string;
        type: string;
        enterprise_applications: string[];
        overlap_notice: string;
    };
    project: {
        meta: {
            project_name: string;
            version_date: string;
            created_date: string;
            exported_by: string | null;
            description: string;
        };
        company_context: {
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
            raw_context: string;
            enriched_context: Record<string, unknown>;
            enrichment_applied_at: string;
            existing_systems: unknown[];
            hard_exclusions: unknown[];
            filtered_skills: unknown[];
            pptx_template?: unknown;
            industry_specifics?: unknown;
        };
        hierarchy: {
            description: string;
            id: string;
            name: string;
            value_metric: string;
            l1: string;
            l2: string;
            l3: string;
            financial_rating: "HIGH" | "MEDIUM" | "LOW";
            impact_order: "FIRST" | "SECOND";
            ai_suitability: "HIGH" | "MEDIUM" | "LOW" | "NOT_APPLICABLE" | null;
            decision_exists: boolean;
            decision_articulation: string | null;
            escalation_flag: string | null;
            skills: z.objectInputType<{
                id: z.ZodString;
                name: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
                max_value: z.ZodNumber;
                slider_percent: z.ZodNullable<z.ZodNumber>;
                overlap_group: z.ZodNullable<z.ZodString>;
                value_metric: z.ZodNullable<z.ZodString>;
                decision_made: z.ZodNullable<z.ZodString>;
                aera_skill_pattern: z.ZodNullable<z.ZodString>;
                is_actual: z.ZodBoolean;
                source: z.ZodNullable<z.ZodString>;
                loe: z.ZodNullable<z.ZodString>;
                savings_type: z.ZodNullable<z.ZodString>;
                actions: z.ZodArray<z.ZodObject<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    action_type: z.ZodNullable<z.ZodString>;
                    action_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                constraints: z.ZodArray<z.ZodObject<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    constraint_type: z.ZodNullable<z.ZodString>;
                    constraint_name: z.ZodNullable<z.ZodString>;
                    description: z.ZodNullable<z.ZodString>;
                    data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.ZodTypeAny, "passthrough">>, "many">;
                execution: z.ZodNullable<z.ZodObject<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    target_systems: z.ZodArray<z.ZodString, "many">;
                    write_back_actions: z.ZodArray<z.ZodString, "many">;
                    execution_trigger: z.ZodNullable<z.ZodString>;
                    execution_frequency: z.ZodNullable<z.ZodString>;
                    autonomy_level: z.ZodNullable<z.ZodString>;
                    approval_required: z.ZodNullable<z.ZodBoolean>;
                    approval_threshold: z.ZodNullable<z.ZodString>;
                    rollback_strategy: z.ZodNullable<z.ZodString>;
                }, z.ZodTypeAny, "passthrough">>>;
                problem_statement: z.ZodNullable<z.ZodObject<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    current_state: z.ZodString;
                    quantified_pain: z.ZodString;
                    root_cause: z.ZodString;
                    falsifiability_check: z.ZodString;
                    outcome: z.ZodString;
                }, z.ZodTypeAny, "passthrough">>>;
                differentiation: z.ZodNullable<z.ZodString>;
                generated_at: z.ZodNullable<z.ZodString>;
                prompt_version: z.ZodNullable<z.ZodString>;
                is_cross_functional: z.ZodNullable<z.ZodBoolean>;
                cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                    l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, z.ZodTypeAny, "passthrough">>]>>;
                operational_flow: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_decision: z.ZodNullable<z.ZodString>;
                walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
                walkthrough_narrative: z.ZodNullable<z.ZodString>;
                program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">[];
            rating_confidence?: unknown;
        }[];
        l3_opportunities: {
            l3_name: string;
            l2_name: string;
            l1_name: string;
            opportunity_exists: boolean;
            opportunity_name: string | null;
            opportunity_summary: string | null;
            lead_archetype: "DETERMINISTIC" | "AGENTIC" | "GENERATIVE" | null;
            supporting_archetypes: string[];
            combined_max_value: number | null;
            implementation_complexity: "HIGH" | "MEDIUM" | "LOW" | null;
            quick_win: boolean;
            competitive_positioning: string | null;
            aera_differentiators: string[];
            l4_count: number;
            high_value_l4_count: number;
            rationale: string;
        }[];
        cross_functional_skills?: z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            archetype: z.ZodEnum<["DETERMINISTIC", "AGENTIC", "GENERATIVE"]>;
            max_value: z.ZodNumber;
            slider_percent: z.ZodNullable<z.ZodNumber>;
            overlap_group: z.ZodNullable<z.ZodString>;
            value_metric: z.ZodNullable<z.ZodString>;
            decision_made: z.ZodNullable<z.ZodString>;
            aera_skill_pattern: z.ZodNullable<z.ZodString>;
            is_actual: z.ZodBoolean;
            source: z.ZodNullable<z.ZodString>;
            loe: z.ZodNullable<z.ZodString>;
            savings_type: z.ZodNullable<z.ZodString>;
            actions: z.ZodArray<z.ZodObject<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                action_type: z.ZodNullable<z.ZodString>;
                action_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                typical_triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                target_system: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            constraints: z.ZodArray<z.ZodObject<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                constraint_type: z.ZodNullable<z.ZodString>;
                constraint_name: z.ZodNullable<z.ZodString>;
                description: z.ZodNullable<z.ZodString>;
                data_source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            execution: z.ZodNullable<z.ZodObject<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                target_systems: z.ZodArray<z.ZodString, "many">;
                write_back_actions: z.ZodArray<z.ZodString, "many">;
                execution_trigger: z.ZodNullable<z.ZodString>;
                execution_frequency: z.ZodNullable<z.ZodString>;
                autonomy_level: z.ZodNullable<z.ZodString>;
                approval_required: z.ZodNullable<z.ZodBoolean>;
                approval_threshold: z.ZodNullable<z.ZodString>;
                rollback_strategy: z.ZodNullable<z.ZodString>;
            }, z.ZodTypeAny, "passthrough">>>;
            problem_statement: z.ZodNullable<z.ZodObject<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                current_state: z.ZodString;
                quantified_pain: z.ZodString;
                root_cause: z.ZodString;
                falsifiability_check: z.ZodString;
                outcome: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>>;
            differentiation: z.ZodNullable<z.ZodString>;
            generated_at: z.ZodNullable<z.ZodString>;
            prompt_version: z.ZodNullable<z.ZodString>;
            is_cross_functional: z.ZodNullable<z.ZodBoolean>;
            cross_functional_scope: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodObject<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                l1_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                primary_l4_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                coordination_points: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, z.ZodTypeAny, "passthrough">>]>>;
            operational_flow: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_decision: z.ZodNullable<z.ZodString>;
            walkthrough_actions: z.ZodArray<z.ZodUnknown, "many">;
            walkthrough_narrative: z.ZodNullable<z.ZodString>;
            program_focus_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    summary: Record<string, unknown>;
}>;
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
