/**
 * Zod schemas for validating LLM-generated YAML simulation artifacts.
 *
 * Validates three YAML artifact types: component maps, mock tests,
 * and integration surfaces. Provides a generic parseAndValidateYaml
 * helper that strips code fences, parses YAML, and validates against
 * a Zod schema.
 */
import { z } from "zod";
export declare const ComponentMapSchema: z.ZodObject<{
    streams: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        confidence: z.ZodEnum<["confirmed", "inferred"]>;
    } & {
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "inferred" | "confirmed";
        type?: string | undefined;
        purpose?: string | undefined;
    }, {
        name: string;
        confidence: "inferred" | "confirmed";
        type?: string | undefined;
        purpose?: string | undefined;
    }>, "many">>;
    cortex: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        confidence: z.ZodEnum<["confirmed", "inferred"]>;
    } & {
        capability: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        capability?: string | undefined;
    }, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        capability?: string | undefined;
    }>, "many">>;
    process_builder: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        confidence: z.ZodEnum<["confirmed", "inferred"]>;
    } & {
        node_type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        node_type?: string | undefined;
    }, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        node_type?: string | undefined;
    }>, "many">>;
    agent_teams: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        confidence: z.ZodEnum<["confirmed", "inferred"]>;
    } & {
        role: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        role?: string | undefined;
    }, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        role?: string | undefined;
    }>, "many">>;
    ui: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        confidence: z.ZodEnum<["confirmed", "inferred"]>;
    } & {
        component_type: z.ZodOptional<z.ZodString>;
        properties: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        component_type?: string | undefined;
        properties?: string[] | undefined;
    }, {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        component_type?: string | undefined;
        properties?: string[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    cortex: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        capability?: string | undefined;
    }[];
    streams: {
        name: string;
        confidence: "inferred" | "confirmed";
        type?: string | undefined;
        purpose?: string | undefined;
    }[];
    process_builder: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        node_type?: string | undefined;
    }[];
    agent_teams: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        role?: string | undefined;
    }[];
    ui: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        component_type?: string | undefined;
        properties?: string[] | undefined;
    }[];
}, {
    cortex?: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        capability?: string | undefined;
    }[] | undefined;
    streams?: {
        name: string;
        confidence: "inferred" | "confirmed";
        type?: string | undefined;
        purpose?: string | undefined;
    }[] | undefined;
    process_builder?: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        node_type?: string | undefined;
    }[] | undefined;
    agent_teams?: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        role?: string | undefined;
    }[] | undefined;
    ui?: {
        name: string;
        confidence: "inferred" | "confirmed";
        purpose?: string | undefined;
        component_type?: string | undefined;
        properties?: string[] | undefined;
    }[] | undefined;
}>;
export declare const MockTestSchema: z.ZodObject<{
    decision: z.ZodString;
    input: z.ZodObject<{
        financial_context: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        trigger: z.ZodString;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        financial_context: Record<string, unknown>;
        trigger: string;
        parameters?: Record<string, unknown> | undefined;
    }, {
        financial_context: Record<string, unknown>;
        trigger: string;
        parameters?: Record<string, unknown> | undefined;
    }>;
    expected_output: z.ZodObject<{
        action: z.ZodString;
        outcome: z.ZodString;
        affected_components: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        outcome: string;
        affected_components?: string[] | undefined;
    }, {
        action: string;
        outcome: string;
        affected_components?: string[] | undefined;
    }>;
    rationale: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rationale: string;
    input: {
        financial_context: Record<string, unknown>;
        trigger: string;
        parameters?: Record<string, unknown> | undefined;
    };
    decision: string;
    expected_output: {
        action: string;
        outcome: string;
        affected_components?: string[] | undefined;
    };
}, {
    rationale: string;
    input: {
        financial_context: Record<string, unknown>;
        trigger: string;
        parameters?: Record<string, unknown> | undefined;
    };
    decision: string;
    expected_output: {
        action: string;
        outcome: string;
        affected_components?: string[] | undefined;
    };
}>;
export declare const IntegrationSurfaceSchema: z.ZodObject<{
    source_systems: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["identified", "tbd"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "identified" | "tbd";
        name: string;
        type?: string | undefined;
    }, {
        name: string;
        type?: string | undefined;
        status?: "identified" | "tbd" | undefined;
    }>, "many">;
    aera_ingestion: z.ZodArray<z.ZodObject<{
        stream_name: z.ZodString;
        stream_type: z.ZodOptional<z.ZodString>;
        source: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        stream_name: string;
        source: string;
        stream_type?: string | undefined;
    }, {
        stream_name: string;
        source: string;
        stream_type?: string | undefined;
    }>, "many">;
    processing: z.ZodArray<z.ZodObject<{
        component: z.ZodString;
        type: z.ZodString;
        function: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        function: string;
        type: string;
        component: string;
    }, {
        function: string;
        type: string;
        component: string;
    }>, "many">;
    ui_surface: z.ZodArray<z.ZodObject<{
        component: z.ZodString;
        screen: z.ZodOptional<z.ZodString>;
        purpose: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        purpose: string;
        component: string;
        screen?: string | undefined;
    }, {
        purpose: string;
        component: string;
        screen?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    source_systems: {
        status: "identified" | "tbd";
        name: string;
        type?: string | undefined;
    }[];
    aera_ingestion: {
        stream_name: string;
        source: string;
        stream_type?: string | undefined;
    }[];
    processing: {
        function: string;
        type: string;
        component: string;
    }[];
    ui_surface: {
        purpose: string;
        component: string;
        screen?: string | undefined;
    }[];
}, {
    source_systems: {
        name: string;
        type?: string | undefined;
        status?: "identified" | "tbd" | undefined;
    }[];
    aera_ingestion: {
        stream_name: string;
        source: string;
        stream_type?: string | undefined;
    }[];
    processing: {
        function: string;
        type: string;
        component: string;
    }[];
    ui_surface: {
        purpose: string;
        component: string;
        screen?: string | undefined;
    }[];
}>;
/**
 * Strips code fences from raw LLM output, parses YAML, and validates
 * the parsed object against the provided Zod schema.
 */
export declare function parseAndValidateYaml<T>(raw: string, schema: z.ZodSchema<T>): Promise<{
    success: true;
    data: T;
} | {
    success: false;
    error: string;
}>;
