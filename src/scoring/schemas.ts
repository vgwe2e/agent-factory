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

// -- Inferred types --

export type TechnicalLensOutput = z.infer<typeof TechnicalLensSchema>;
export type AdoptionLensOutput = z.infer<typeof AdoptionLensSchema>;
export type ValueLensOutput = z.infer<typeof ValueLensSchema>;

// -- JSON Schema conversions for Ollama format parameter --

export const technicalJsonSchema = zodToJsonSchema(TechnicalLensSchema);
export const adoptionJsonSchema = zodToJsonSchema(AdoptionLensSchema);
export const valueJsonSchema = zodToJsonSchema(ValueLensSchema);
