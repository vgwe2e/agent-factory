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
import { validateComponentMap, validateComponentRef } from "../validators/knowledge-validator.js";
import { getAllPBNodes } from "../../knowledge/process-builder.js";
import { getAllComponents } from "../../knowledge/components.js";
import { getIntegrationPatterns } from "../../knowledge/orchestration.js";
// -- Constants --
const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5:32b";
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
 * @param ollamaUrl - Override Ollama API URL (for testing)
 * @returns Result with ComponentMap, validation results, and attempt count
 */
export async function generateComponentMap(input, knowledgeIndex, ollamaUrl = OLLAMA_CHAT_API) {
    const pbNodeNames = getAllPBNodes().map((n) => n.name);
    const uiComponentNames = getAllComponents().map((c) => c.name);
    const integrationPatternNames = getIntegrationPatterns().map((p) => p.name);
    const messages = buildComponentMapPrompt(input, pbNodeNames, uiComponentNames, integrationPatternNames);
    const conversationMessages = [...messages];
    const errors = [];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(ollamaUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: MODEL,
                    messages: conversationMessages,
                    stream: false,
                    options: { temperature: TEMPERATURE },
                }),
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
            if (!response.ok) {
                errors.push(`Attempt ${attempt}: Ollama HTTP ${response.status}`);
                continue;
            }
            const data = (await response.json());
            const rawContent = data.message.content;
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
            const message = err instanceof Error ? err.message : String(err);
            errors.push(`Attempt ${attempt}: ${message}`);
        }
    }
    return {
        success: false,
        error: `Failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
    };
}
/**
 * Override confidence flags in a ComponentMap based on knowledge base validation.
 * Mutates the map in place -- sets confirmed for known components, inferred for unknown.
 */
function enforceKnowledgeConfidence(map, knowledgeIndex) {
    const sections = [
        map.streams,
        map.cortex,
        map.process_builder,
        map.agent_teams,
        map.ui,
    ];
    for (const entries of sections) {
        for (const entry of entries) {
            entry.confidence = validateComponentRef(entry.name, knowledgeIndex);
        }
    }
}
