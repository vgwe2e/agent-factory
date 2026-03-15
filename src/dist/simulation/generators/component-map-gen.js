/**
 * Component map generator with retry and KNOW-04 knowledge validation.
 *
 * Calls Ollama 32B to generate a YAML component map, parses with js-yaml,
 * validates with Zod schema, then enforces KNOW-04 by checking each component
 * reference against the knowledge base index. Retries on parse/schema failures
 * but NOT on knowledge validation (inferred is acceptable).
 */
import { buildComponentMapPrompt } from "../prompts/component-map.js";
import { parseAndValidateYaml, ComponentMapSchema } from "../schemas.js";
import { enforceKnowledgeConfidence, validateComponentMap, } from "../validators/knowledge-validator.js";
import { getAllPBNodes } from "../../knowledge/process-builder.js";
import { getAllComponents } from "../../knowledge/components.js";
import { getIntegrationPatterns } from "../../knowledge/orchestration.js";
import { buildKnowledgeContext } from "../../scoring/knowledge-context.js";
import { generateSimulationText, } from "../llm-client.js";
// -- Constants --
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 180_000;
// -- Generator --
/**
 * Generate a component map for an opportunity with KNOW-04 enforcement.
 *
 * Flow: build prompt -> call Ollama -> extract YAML -> parse + validate with Zod ->
 * knowledge-validate each entry (override confidence flags) -> return.
 *
 * Retries on YAML parse or Zod validation failure (up to 3 attempts).
 * Does NOT retry on knowledge validation (inferred is acceptable, not an error).
 *
 * @param input - Simulation context
 * @param knowledgeIndex - Pre-built knowledge base index from buildKnowledgeIndex()
 * @param llmTarget - Override simulation backend target (legacy string or backend config)
 * @returns Result with ComponentMap, validation results, and attempt count
 */
export async function generateComponentMap(input, knowledgeIndex, llmTarget, signal) {
    const pbNodeNames = getAllPBNodes().map((n) => n.name);
    const uiComponentNames = getAllComponents().map((c) => c.name);
    const integrationPatternNames = getIntegrationPatterns().map((p) => p.name);
    const knowledgeCtx = buildKnowledgeContext();
    const messages = buildComponentMapPrompt(input, pbNodeNames, uiComponentNames, integrationPatternNames, knowledgeCtx.capabilities);
    const conversationMessages = [...messages];
    const errors = [];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        throwIfAborted(signal);
        try {
            const response = await generateSimulationText(conversationMessages, llmTarget, {
                temperature: TEMPERATURE,
                timeoutMs: TIMEOUT_MS,
                signal,
            });
            if (!response.success) {
                throwIfAborted(signal);
                errors.push(`Attempt ${attempt}: ${response.error}`);
                continue;
            }
            const rawContent = response.content;
            // Parse YAML and validate with Zod schema
            const parseResult = await parseAndValidateYaml(rawContent, ComponentMapSchema);
            if (!parseResult.success) {
                errors.push(`Attempt ${attempt}: ${parseResult.error}`);
                conversationMessages.push({ role: "assistant", content: rawContent }, {
                    role: "user",
                    content: `The YAML output has a validation error: ${parseResult.error}\n\nPlease fix the YAML. Output only the corrected YAML with the 5 sections (streams, cortex, process_builder, agent_teams, ui).`,
                });
                continue;
            }
            // Knowledge validation -- override confidence flags (KNOW-04 enforcement)
            const componentMap = parseResult.data;
            enforceKnowledgeConfidence(componentMap, knowledgeIndex);
            const validation = validateComponentMap(componentMap, knowledgeIndex);
            return {
                success: true,
                data: { componentMap, validation, attempts: attempt },
            };
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
        error: `Failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
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
