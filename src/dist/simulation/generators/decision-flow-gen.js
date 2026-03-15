/**
 * Decision flow diagram generator with retry logic.
 *
 * Calls Ollama 32B to generate a Mermaid flowchart, extracts the diagram
 * from LLM output (stripping code fences), validates structural correctness,
 * and retries with error context on failure.
 */
import { buildDecisionFlowPrompt } from "../prompts/decision-flow.js";
import { extractMermaidBlock } from "../utils.js";
import { validateMermaidFlowchart } from "../validators/mermaid-validator.js";
import { getAllPBNodes, getWorkflowPatterns } from "../../knowledge/process-builder.js";
import { generateSimulationText, } from "../llm-client.js";
// -- Constants --
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 180_000; // 3 minutes for complex diagram generation
// -- Generator --
/**
 * Generate a Mermaid decision flow diagram for an opportunity.
 *
 * Flow: build prompt -> call Ollama -> extract Mermaid -> validate -> retry on failure.
 *
 * @param input - Simulation context
 * @param llmTarget - Override simulation backend target (legacy string or backend config)
 * @returns Result with Mermaid string and attempt count, or error
 */
export async function generateDecisionFlow(input, llmTarget, signal) {
    const pbNodeNames = getAllPBNodes().map((n) => n.name);
    const workflowPatternNames = getWorkflowPatterns().map((p) => p.name);
    const messages = buildDecisionFlowPrompt(input, pbNodeNames, workflowPatternNames);
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
            const mermaid = extractMermaidBlock(rawContent);
            const validation = validateMermaidFlowchart(mermaid);
            if (validation.ok) {
                return { success: true, data: { mermaid, attempts: attempt } };
            }
            // Validation failed -- add repair context for retry
            errors.push(`Attempt ${attempt}: ${validation.error}`);
            conversationMessages.push({ role: "assistant", content: rawContent }, {
                role: "user",
                content: `The Mermaid output has a structural issue: ${validation.error}\n\nPlease fix the diagram. Output only the corrected Mermaid flowchart, starting with "flowchart TD".`,
            });
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
