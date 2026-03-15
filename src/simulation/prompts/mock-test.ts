/**
 * Prompt builder for mock decision test YAML generation.
 *
 * Constructs LLM messages that produce a single happy-path mock test
 * grounded in actual client financials and decision_articulation text.
 */

import type { SimulationInput } from "../../types/simulation.js";
import { getSimulationPromptContext } from "../prompt-context.js";

/**
 * Build prompt messages for generating a mock decision test YAML.
 *
 * Uses decision_articulation from the first L4 that has one.
 * Falls back to generating from opportunity summary if none available.
 * Includes company financials for realistic test input grounding.
 */
export function buildMockTestPrompt(
  input: SimulationInput,
): Array<{ role: string; content: string }> {
  const { l4s, companyContext } = input;
  const { subjectName, subjectSummary } = getSimulationPromptContext(input);

  // Find first L4 with decision_articulation
  const decisionL4 = l4s.find((l4) => l4.decision_articulation != null);
  const decisionInstruction = decisionL4
    ? `Use this decision_articulation as the decision being tested: "${decisionL4.decision_articulation}"`
    : `Generate decision from opportunity summary: "${subjectSummary}"`;

  // Format L4 details
  const l4Details = l4s
    .map((l4) => {
      const parts = [`- ${l4.name} (financial_rating: ${l4.financial_rating})`];
      if (l4.decision_articulation) {
        parts.push(`  decision_articulation: "${l4.decision_articulation}"`);
      }
      return parts.join("\n");
    })
    .join("\n");

  const systemPrompt = `You are an Aera platform solutions engineer creating mock decision tests.

Rules:
- Output YAML format only
- The YAML must have exactly 4 top-level fields: decision, input, expected_output, rationale
- input must contain: financial_context (object), trigger (string), and optionally parameters (object)
- expected_output must contain: action (string), outcome (string), and optionally affected_components (string array)
- Generate exactly 1 happy-path test case (not 3 or 5)
- Input values MUST be derived from actual client financials provided below, not synthetic placeholder data
- ${decisionInstruction}
- Do not wrap output in code fences. Output YAML only.`;

  const userPrompt = `Generate a mock decision test for the following opportunity:

Opportunity: ${subjectName}
Summary: ${subjectSummary}
Archetype: ${input.archetype}

Company Financial Context:
- Annual Revenue: ${companyContext.annual_revenue ?? "unknown"}
- COGS: ${companyContext.cogs ?? "unknown"}
- EBITDA: ${companyContext.ebitda ?? "unknown"}
- Working Capital: ${companyContext.working_capital ?? "unknown"}
- Inventory Value: ${companyContext.inventory_value ?? "unknown"}

L4 Activities:
${l4Details}

Generate YAML for 1 happy-path mock decision test.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}
