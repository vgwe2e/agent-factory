/**
 * Decision flow diagram generator with retry logic.
 *
 * Calls Ollama 32B to generate a Mermaid flowchart, extracts the diagram
 * from LLM output (stripping code fences), validates structural correctness,
 * and retries with error context on failure.
 */

import type { SimulationInput } from "../../types/simulation.js";
import { buildDecisionFlowPrompt } from "../prompts/decision-flow.js";
import { extractMermaidBlock } from "../utils.js";
import { validateMermaidFlowchart } from "../validators/mermaid-validator.js";
import { getAllPBNodes, getWorkflowPatterns } from "../../knowledge/process-builder.js";

// -- Constants --

const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5:32b";
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 180_000; // 3 minutes for complex diagram generation

// -- Types --

type DecisionFlowResult =
  | { success: true; data: { mermaid: string; attempts: number } }
  | { success: false; error: string };

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
}

// -- Generator --

/**
 * Generate a Mermaid decision flow diagram for an opportunity.
 *
 * Flow: build prompt -> call Ollama -> extract Mermaid -> validate -> retry on failure.
 *
 * @param input - Simulation context
 * @param ollamaUrl - Override Ollama API URL (for testing)
 * @returns Result with Mermaid string and attempt count, or error
 */
export async function generateDecisionFlow(
  input: SimulationInput,
  ollamaUrl: string = OLLAMA_CHAT_API,
): Promise<DecisionFlowResult> {
  const pbNodeNames = getAllPBNodes().map((n) => n.name);
  const workflowPatternNames = getWorkflowPatterns().map((p) => p.name);

  const messages = buildDecisionFlowPrompt(input, pbNodeNames, workflowPatternNames);
  const conversationMessages = [...messages];
  const errors: string[] = [];

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

      const data = (await response.json()) as OllamaChatResponse;
      const rawContent = data.message.content;
      const mermaid = extractMermaidBlock(rawContent);
      const validation = validateMermaidFlowchart(mermaid);

      if (validation.ok) {
        return { success: true, data: { mermaid, attempts: attempt } };
      }

      // Validation failed -- add repair context for retry
      errors.push(`Attempt ${attempt}: ${validation.error}`);
      conversationMessages.push(
        { role: "assistant", content: rawContent },
        {
          role: "user",
          content: `The Mermaid output has a structural issue: ${validation.error}\n\nPlease fix the diagram. Output only the corrected Mermaid flowchart, starting with "flowchart TD".`,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Attempt ${attempt}: ${message}`);
    }
  }

  return {
    success: false,
    error: `Failed after ${MAX_ATTEMPTS} attempts. Errors: ${errors.join("; ")}`,
  };
}
