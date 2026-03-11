/**
 * Tests for decision flow diagram generator.
 *
 * Uses mocked fetch to simulate Ollama responses.
 * Validates retry logic, code fence stripping, and error handling.
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import type { SimulationInput } from "../../types/simulation.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../../types/hierarchy.js";

// -- Test fixtures --

const VALID_MERMAID = `flowchart TD
  Start[Trigger: Demand Signal Detected] --> A[PB: Interface - Receive demand data]
  A --> B{Cortex: Demand Analysis}
  B -->|High confidence| C[PB: Action Item - Create purchase order]
  B -->|Low confidence| D[PB: Notification - Alert planner]
  C --> E[UI: Dashboard - Display order status]
  D --> F[PB: If - Check manual override]
  F -->|Override| C
  F -->|Reject| End[End]
  E --> End`;

const VALID_MERMAID_WITH_FENCES = "```mermaid\n" + VALID_MERMAID + "\n```";

const INVALID_MERMAID_NO_DECLARATION = `Start --> A
A --> B
B --> End`;

const INVALID_MERMAID_LOWERCASE_END = `flowchart TD
  A --> B
  B --> end`;

function makeOllamaResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      message: { role: "assistant", content },
      done: true,
      total_duration: 5_000_000_000,
    }),
  };
}

function makeSimulationInput(): SimulationInput {
  const opportunity: L3Opportunity = {
    l3_name: "Demand Forecasting Optimization",
    l2_name: "Supply Chain Planning",
    l1_name: "Supply Chain",
    opportunity_exists: true,
    opportunity_name: "Demand Forecasting",
    opportunity_summary: "Optimize demand forecasting using AI-driven analysis of historical patterns",
    lead_archetype: "DETERMINISTIC",
    supporting_archetypes: [],
    combined_max_value: 5000000,
    implementation_complexity: "MEDIUM",
    quick_win: true,
    competitive_positioning: null,
    aera_differentiators: [],
    l4_count: 2,
    high_value_l4_count: 1,
    rationale: "High-value demand forecasting opportunity",
  };

  const l4s: L4Activity[] = [
    {
      id: "L4-001",
      name: "Analyze historical demand",
      description: "Analyze past demand patterns to forecast future needs",
      l1: "Supply Chain",
      l2: "Supply Chain Planning",
      l3: "Demand Forecasting Optimization",
      financial_rating: "HIGH",
      value_metric: "$5M",
      impact_order: "FIRST",
      rating_confidence: "HIGH",
      ai_suitability: "HIGH",
      decision_exists: true,
      decision_articulation: "Determine if demand signal warrants purchase order creation",
      escalation_flag: null,
      skills: [],
    },
    {
      id: "L4-002",
      name: "Generate forecast",
      description: "Generate demand forecast from analyzed data",
      l1: "Supply Chain",
      l2: "Supply Chain Planning",
      l3: "Demand Forecasting Optimization",
      financial_rating: "HIGH",
      value_metric: "$3M",
      impact_order: "FIRST",
      rating_confidence: "MEDIUM",
      ai_suitability: "HIGH",
      decision_exists: false,
      decision_articulation: null,
      escalation_flag: null,
      skills: [],
    },
  ];

  const companyContext = {
    company_name: "Ford Motor Company",
    industry: "Automotive",
  } as CompanyContext;

  return {
    opportunity,
    l4s,
    companyContext,
    archetype: "DETERMINISTIC",
    archetypeRoute: "process_builder",
    composite: 78,
  };
}

// -- Tests --

describe("generateDecisionFlow", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns success with valid Mermaid output on first attempt", async () => {
    globalThis.fetch = mock.fn(async () => makeOllamaResponse(VALID_MERMAID)) as unknown as typeof fetch;

    const { generateDecisionFlow } = await import("./decision-flow-gen.js");
    const result = await generateDecisionFlow(makeSimulationInput());

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.attempts, 1);
      assert.ok(result.data.mermaid.startsWith("flowchart TD"));
      assert.ok(result.data.mermaid.includes("-->"));
    }
  });

  it("strips code fences from LLM output", async () => {
    globalThis.fetch = mock.fn(async () => makeOllamaResponse(VALID_MERMAID_WITH_FENCES)) as unknown as typeof fetch;

    const { generateDecisionFlow } = await import("./decision-flow-gen.js");
    const result = await generateDecisionFlow(makeSimulationInput());

    assert.equal(result.success, true);
    if (result.success) {
      assert.ok(!result.data.mermaid.includes("```"));
      assert.ok(result.data.mermaid.startsWith("flowchart TD"));
    }
  });

  it("retries on invalid output and succeeds on second attempt", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return makeOllamaResponse(INVALID_MERMAID_NO_DECLARATION);
      }
      return makeOllamaResponse(VALID_MERMAID);
    }) as unknown as typeof fetch;

    const { generateDecisionFlow } = await import("./decision-flow-gen.js");
    const result = await generateDecisionFlow(makeSimulationInput());

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.attempts, 2);
    }
  });

  it("returns failure after 3 consecutive invalid outputs", async () => {
    globalThis.fetch = mock.fn(async () => makeOllamaResponse(INVALID_MERMAID_LOWERCASE_END)) as unknown as typeof fetch;

    const { generateDecisionFlow } = await import("./decision-flow-gen.js");
    const result = await generateDecisionFlow(makeSimulationInput());

    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.includes("3"));
    }
  });
});

describe("buildDecisionFlowPrompt", () => {
  it("includes PB node names and orchestration route in prompt", async () => {
    const { buildDecisionFlowPrompt } = await import("../prompts/decision-flow.js");
    const input = makeSimulationInput();
    const messages = buildDecisionFlowPrompt(input, ["Interface", "If", "Action Item"], ["ETL Pattern"]);

    assert.ok(messages.length >= 2);
    const system = messages.find((m) => m.role === "system");
    const user = messages.find((m) => m.role === "user");
    assert.ok(system);
    assert.ok(user);
    assert.ok(system.content.includes("Interface"));
    assert.ok(system.content.includes("If"));
    assert.ok(user.content.includes("Demand Forecasting"));
    assert.ok(user.content.includes("process_builder"));
  });

  it("uses 'infer from summary' when L4s have no decision_articulation", async () => {
    const { buildDecisionFlowPrompt } = await import("../prompts/decision-flow.js");
    const input = makeSimulationInput();
    // Remove all decision articulations
    input.l4s = input.l4s.map((l4) => ({ ...l4, decision_articulation: null }));
    const messages = buildDecisionFlowPrompt(input, ["Interface"], []);
    const user = messages.find((m) => m.role === "user");
    assert.ok(user);
    assert.ok(user.content.toLowerCase().includes("infer"));
  });
});
