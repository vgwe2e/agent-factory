/**
 * Zod schemas for validating LLM-generated YAML simulation artifacts.
 *
 * Validates three YAML artifact types: component maps, mock tests,
 * and integration surfaces. Provides a generic parseAndValidateYaml
 * helper that strips code fences, parses YAML, and validates against
 * a Zod schema.
 */
import { z } from "zod";
import yaml from "js-yaml";
import { zodToJsonSchema } from "zod-to-json-schema";
import { extractYamlBlock } from "./utils.js";
// -- Component Map Schema --
const ComponentRefSchema = z.object({
    name: z.string(),
    purpose: z.string().optional(),
    confidence: z.enum(["confirmed", "inferred"]),
});
export const ComponentMapSchema = z.object({
    streams: z.array(ComponentRefSchema.extend({
        type: z.string().optional(),
    })).default([]),
    cortex: z.array(ComponentRefSchema.extend({
        capability: z.string().optional(),
    })).default([]),
    process_builder: z.array(ComponentRefSchema.extend({
        node_type: z.string().optional(),
    })).default([]),
    agent_teams: z.array(ComponentRefSchema.extend({
        role: z.string().optional(),
    })).default([]),
    ui: z.array(ComponentRefSchema.extend({
        component_type: z.string().optional(),
        properties: z.array(z.string()).optional(),
    })).default([]),
});
// -- Mock Test Schema --
export const MockTestSchema = z.object({
    decision: z.string(),
    input: z.object({
        financial_context: z.record(z.unknown()),
        trigger: z.string(),
        parameters: z.record(z.unknown()).optional(),
    }),
    expected_output: z.object({
        action: z.string(),
        outcome: z.string(),
        affected_components: z.array(z.string()).optional(),
    }),
    rationale: z.string(),
});
// -- Integration Surface Schema --
export const IntegrationSurfaceSchema = z.object({
    source_systems: z.array(z.object({
        name: z.string(),
        type: z.string().optional(),
        status: z.enum(["identified", "tbd"]).default("identified"),
    })),
    aera_ingestion: z.array(z.object({
        stream_name: z.string(),
        stream_type: z.string().optional(),
        source: z.string(),
    })),
    processing: z.array(z.object({
        component: z.string(),
        type: z.string(),
        function: z.string(),
    })),
    ui_surface: z.array(z.object({
        component: z.string(),
        screen: z.string().optional(),
        purpose: z.string(),
    })),
});
// -- Scenario Spec Schema --
const ScenarioSourceSystemSchema = z.object({
    name: z.string(),
    type: z.string().optional(),
    status: z.enum(["identified", "tbd"]).default("identified"),
});
const ScenarioKeyInputSchema = z.object({
    name: z.string(),
    source: z.string(),
    purpose: z.string(),
    preferred_stream_type: z.string().optional(),
});
const ScenarioFlowStepSchema = z.object({
    step: z.string(),
    stage: z.enum(["ingest", "analyze", "decide", "act", "review", "notify", "surface"]),
    component: z.string(),
    purpose: z.string(),
});
const ScenarioBranchSchema = z.object({
    condition: z.string(),
    response: z.string(),
    outcome: z.string(),
});
export const ScenarioSpecSchema = z.object({
    objective: z.string(),
    trigger: z.string(),
    decision: z.string(),
    expected_action: z.string(),
    expected_outcome: z.string(),
    rationale: z.string(),
    source_systems: z.array(ScenarioSourceSystemSchema).min(1),
    key_inputs: z.array(ScenarioKeyInputSchema).min(1),
    happy_path: z.array(ScenarioFlowStepSchema).min(3),
    branches: z.array(ScenarioBranchSchema).max(3).default([]),
});
export const scenarioSpecJsonSchema = zodToJsonSchema(ScenarioSpecSchema);
// -- Generic YAML parse + validate helper --
/**
 * Strips code fences from raw LLM output, parses YAML, and validates
 * the parsed object against the provided Zod schema.
 */
export async function parseAndValidateYaml(raw, schema) {
    try {
        const yamlStr = extractYamlBlock(raw);
        const parsed = yaml.load(yamlStr);
        const validated = schema.parse(parsed);
        return { success: true, data: validated };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}
