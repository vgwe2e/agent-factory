/**
 * Lens scorer functions.
 *
 * Three async functions that call Ollama (via injected chatFn) to score
 * opportunities on Technical Feasibility, Adoption Realism, and Value & Efficiency.
 *
 * Each scorer:
 * 1. Builds a prompt via the corresponding prompt builder
 * 2. Calls scoreWithRetry with the Zod schema and ollamaChat bound with JSON schema
 * 3. Maps validated output to LensScore
 * 4. Attaches algorithmic confidence
 *
 * chatFn parameter enables dependency injection for testing (defaults to ollamaChat).
 */
import { MAX_SCORES } from "../types/scoring.js";
import { ollamaChat, scoreWithRetry } from "./ollama-client.js";
import { TechnicalLensSchema, AdoptionLensSchema, ValueLensSchema, technicalJsonSchema, adoptionJsonSchema, valueJsonSchema, } from "./schemas.js";
import { buildTechnicalPrompt } from "./prompts/technical.js";
import { buildAdoptionPrompt } from "./prompts/adoption.js";
import { buildValuePrompt } from "./prompts/value.js";
import { computeTechnicalConfidence, computeAdoptionConfidence, computeValueConfidence } from "./confidence.js";
// -- Helpers --
/**
 * Map Zod-validated schema output fields to SubDimensionScore array.
 */
function mapToSubDimensions(output, fieldNames) {
    return fieldNames.map((name) => ({
        name,
        score: output[name].score,
        reason: output[name].reason,
    }));
}
// -- Public API --
/**
 * Score an opportunity on Technical Feasibility (3 sub-dimensions, max 9).
 */
export async function scoreTechnical(opp, l4s, knowledgeContext, archetypeHint, chatFn = ollamaChat) {
    const messages = buildTechnicalPrompt(opp, l4s, knowledgeContext, archetypeHint);
    const result = await scoreWithRetry(TechnicalLensSchema, async () => {
        const chatResult = await chatFn(messages, technicalJsonSchema);
        if (!chatResult.success)
            throw new Error(chatResult.error);
        return chatResult.content;
    });
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const data = result.data;
    const fieldNames = ["data_readiness", "aera_platform_fit", "archetype_confidence"];
    const subDimensions = mapToSubDimensions(data, fieldNames);
    const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
    const confidence = computeTechnicalConfidence(opp, l4s);
    return {
        success: true,
        score: {
            lens: "technical",
            subDimensions,
            total,
            maxPossible: MAX_SCORES.technical,
            normalized: total / MAX_SCORES.technical,
            confidence,
        },
    };
}
/**
 * Score an opportunity on Adoption Realism (4 sub-dimensions, max 12).
 */
export async function scoreAdoption(opp, l4s, archetypeHint, chatFn = ollamaChat) {
    const messages = buildAdoptionPrompt(opp, l4s, archetypeHint);
    const result = await scoreWithRetry(AdoptionLensSchema, async () => {
        const chatResult = await chatFn(messages, adoptionJsonSchema);
        if (!chatResult.success)
            throw new Error(chatResult.error);
        return chatResult.content;
    });
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const data = result.data;
    const fieldNames = ["decision_density", "financial_gravity", "impact_proximity", "confidence_signal"];
    const subDimensions = mapToSubDimensions(data, fieldNames);
    const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
    const confidence = computeAdoptionConfidence(l4s);
    return {
        success: true,
        score: {
            lens: "adoption",
            subDimensions,
            total,
            maxPossible: MAX_SCORES.adoption,
            normalized: total / MAX_SCORES.adoption,
            confidence,
        },
    };
}
/**
 * Score an opportunity on Value & Efficiency (2 sub-dimensions, max 6).
 */
export async function scoreValue(opp, l4s, company, archetypeHint, chatFn = ollamaChat) {
    const messages = buildValuePrompt(opp, l4s, company, archetypeHint);
    const result = await scoreWithRetry(ValueLensSchema, async () => {
        const chatResult = await chatFn(messages, valueJsonSchema);
        if (!chatResult.success)
            throw new Error(chatResult.error);
        return chatResult.content;
    });
    if (!result.success) {
        return { success: false, error: result.error };
    }
    const data = result.data;
    const fieldNames = ["value_density", "simulation_viability"];
    const subDimensions = mapToSubDimensions(data, fieldNames);
    const total = subDimensions.reduce((sum, sd) => sum + sd.score, 0);
    const confidence = computeValueConfidence(opp, company);
    return {
        success: true,
        score: {
            lens: "value",
            subDimensions,
            total,
            maxPossible: MAX_SCORES.value,
            normalized: total / MAX_SCORES.value,
            confidence,
        },
    };
}
