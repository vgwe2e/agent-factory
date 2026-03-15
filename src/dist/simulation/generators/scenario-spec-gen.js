/**
 * Single-call scenario spec generator.
 *
 * Produces a compact canonical spec that downstream renderers expand into the
 * existing artifact files. This replaces the old four-generation bottleneck.
 */
import { buildScenarioSpecPrompt } from "../prompts/scenario-spec.js";
import { ScenarioSpecSchema, parseAndValidateYaml } from "../schemas.js";
import { getAllPBNodes } from "../../knowledge/process-builder.js";
import { getAllComponents } from "../../knowledge/components.js";
import { getIntegrationPatterns } from "../../knowledge/orchestration.js";
import { buildKnowledgeContext } from "../../scoring/knowledge-context.js";
import { generateSimulationText, } from "../llm-client.js";
const TEMPERATURE = 0.2;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 180_000;
export async function generateScenarioSpec(input, llmTarget, signal) {
    const pbNodeNames = getAllPBNodes().map((node) => node.name);
    const uiComponentNames = getAllComponents().map((component) => component.name);
    const integrationPatternNames = getIntegrationPatterns().map((pattern) => pattern.name);
    const knowledgeCtx = buildKnowledgeContext();
    const baseMessages = buildScenarioSpecPrompt(input, pbNodeNames, uiComponentNames, integrationPatternNames, knowledgeCtx.capabilities);
    const errors = [];
    let messages = [...baseMessages];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        throwIfAborted(signal);
        try {
            const response = await generateSimulationText(messages, llmTarget, {
                temperature: TEMPERATURE,
                timeoutMs: TIMEOUT_MS,
                signal,
            });
            if (!response.success) {
                throwIfAborted(signal);
                errors.push(`Attempt ${attempt}: ${response.error}`);
                continue;
            }
            const parsed = await parseAndValidateYaml(response.content, ScenarioSpecSchema);
            if (parsed.success) {
                return {
                    success: true,
                    data: { scenarioSpec: parsed.data, attempts: attempt },
                };
            }
            errors.push(`Attempt ${attempt}: ${parsed.error}`);
            messages = [
                ...baseMessages,
                { role: "assistant", content: response.content },
                {
                    role: "user",
                    content: `Your previous YAML failed validation: ${parsed.error}\n\nReturn corrected YAML only with the exact required top-level fields.`,
                },
            ];
        }
        catch (err) {
            if (signal?.aborted) {
                throw abortError(signal);
            }
            const message = err instanceof Error ? err.message : String(err);
            errors.push(`Attempt ${attempt}: ${message}`);
        }
    }
    return {
        success: false,
        error: `Scenario spec generation failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
    };
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw abortError(signal);
    }
}
function abortError(signal) {
    return signal.reason instanceof Error
        ? signal.reason
        : new Error(String(signal.reason ?? "Operation aborted"));
}
