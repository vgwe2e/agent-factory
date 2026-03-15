/**
 * Zod schemas for LLM scoring output validation.
 *
 * Each lens has a Zod schema defining the expected JSON structure
 * from the LLM. These schemas are also converted to JSON Schema
 * for use with Ollama's `format` parameter.
 */
import { z } from "zod";
/** Technical Feasibility: 3 sub-dimensions, max 9 */
export declare const TechnicalLensSchema: z.ZodObject<{
    data_readiness: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    aera_platform_fit: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    archetype_confidence: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
}, "strip", z.ZodTypeAny, {
    data_readiness: {
        score: number;
        reason: string;
    };
    aera_platform_fit: {
        score: number;
        reason: string;
    };
    archetype_confidence: {
        score: number;
        reason: string;
    };
}, {
    data_readiness: {
        score: number;
        reason: string;
    };
    aera_platform_fit: {
        score: number;
        reason: string;
    };
    archetype_confidence: {
        score: number;
        reason: string;
    };
}>;
/** Adoption Realism: 4 sub-dimensions, max 12 */
export declare const AdoptionLensSchema: z.ZodObject<{
    decision_density: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    financial_gravity: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    impact_proximity: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    confidence_signal: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
}, "strip", z.ZodTypeAny, {
    decision_density: {
        score: number;
        reason: string;
    };
    financial_gravity: {
        score: number;
        reason: string;
    };
    impact_proximity: {
        score: number;
        reason: string;
    };
    confidence_signal: {
        score: number;
        reason: string;
    };
}, {
    decision_density: {
        score: number;
        reason: string;
    };
    financial_gravity: {
        score: number;
        reason: string;
    };
    impact_proximity: {
        score: number;
        reason: string;
    };
    confidence_signal: {
        score: number;
        reason: string;
    };
}>;
/** Value & Efficiency: 2 sub-dimensions, max 6 */
export declare const ValueLensSchema: z.ZodObject<{
    value_density: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    simulation_viability: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
}, "strip", z.ZodTypeAny, {
    value_density: {
        score: number;
        reason: string;
    };
    simulation_viability: {
        score: number;
        reason: string;
    };
}, {
    value_density: {
        score: number;
        reason: string;
    };
    simulation_viability: {
        score: number;
        reason: string;
    };
}>;
/** Consolidated LLM Scorer: platform fit + sanity check (v1.3) */
export declare const ConsolidatedLensSchema: z.ZodObject<{
    platform_fit: z.ZodObject<{
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        score: number;
        reason: string;
    }, {
        score: number;
        reason: string;
    }>;
    sanity_verdict: z.ZodEnum<["AGREE", "DISAGREE", "PARTIAL"]>;
    sanity_justification: z.ZodString;
    flagged_dimensions: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
}, "strip", z.ZodTypeAny, {
    platform_fit: {
        score: number;
        reason: string;
    };
    sanity_verdict: "AGREE" | "DISAGREE" | "PARTIAL";
    sanity_justification: string;
    flagged_dimensions: string[];
    confidence: "HIGH" | "MEDIUM" | "LOW";
}, {
    platform_fit: {
        score: number;
        reason: string;
    };
    sanity_verdict: "AGREE" | "DISAGREE" | "PARTIAL";
    sanity_justification: string;
    flagged_dimensions: string[];
    confidence: "HIGH" | "MEDIUM" | "LOW";
}>;
export type TechnicalLensOutput = z.infer<typeof TechnicalLensSchema>;
export type AdoptionLensOutput = z.infer<typeof AdoptionLensSchema>;
export type ValueLensOutput = z.infer<typeof ValueLensSchema>;
export type ConsolidatedLensOutput = z.infer<typeof ConsolidatedLensSchema>;
export declare const technicalJsonSchema: Record<string, unknown>;
export declare const adoptionJsonSchema: Record<string, unknown>;
export declare const valueJsonSchema: Record<string, unknown>;
export declare const consolidatedJsonSchema: Record<string, unknown>;
