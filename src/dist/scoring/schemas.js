/**
 * Zod schemas for LLM scoring output validation.
 *
 * Each lens has a Zod schema defining the expected JSON structure
 * from the LLM. These schemas are also converted to JSON Schema
 * for use with Ollama's `format` parameter.
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
// -- Sub-dimension shape (reusable) --
const SubDimensionShape = z.object({
    score: z.number().int().min(0).max(3),
    reason: z.string(),
});
// -- Lens schemas --
/** Technical Feasibility: 3 sub-dimensions, max 9 */
export const TechnicalLensSchema = z.object({
    data_readiness: SubDimensionShape,
    aera_platform_fit: SubDimensionShape,
    archetype_confidence: SubDimensionShape,
});
/** Adoption Realism: 4 sub-dimensions, max 12 */
export const AdoptionLensSchema = z.object({
    decision_density: SubDimensionShape,
    financial_gravity: SubDimensionShape,
    impact_proximity: SubDimensionShape,
    confidence_signal: SubDimensionShape,
});
/** Value & Efficiency: 2 sub-dimensions, max 6 */
export const ValueLensSchema = z.object({
    value_density: SubDimensionShape,
    simulation_viability: SubDimensionShape,
});
/** Consolidated LLM Scorer: platform fit + sanity check (v1.3) */
export const ConsolidatedLensSchema = z.object({
    platform_fit: SubDimensionShape,
    sanity_verdict: z.enum(["AGREE", "DISAGREE", "PARTIAL"]),
    sanity_justification: z.string(),
    flagged_dimensions: z.array(z.string()),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});
// -- JSON Schema conversions for Ollama format parameter --
// Note: type assertions needed due to Zod 3.25.x / zod-to-json-schema type mismatch
export const technicalJsonSchema = zodToJsonSchema(TechnicalLensSchema);
export const adoptionJsonSchema = zodToJsonSchema(AdoptionLensSchema);
export const valueJsonSchema = zodToJsonSchema(ValueLensSchema);
export const consolidatedJsonSchema = zodToJsonSchema(ConsolidatedLensSchema);
