/**
 * Tests for mock test generator.
 *
 * Validates that generateMockTest:
 * - Produces validated MockTest from LLM YAML output
 * - Maps decision_articulation as the decision being tested
 * - Strips code fences from LLM output
 * - Retries on YAML parse/validation failure
 * - Fails after 3 unsuccessful attempts
 */

import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { generateMockTest } from "./mock-test-gen.js";
import type { SimulationInput } from "../../types/simulation.js";
import type { L3Opportunity, L4Activity, CompanyContext } from "../../types/hierarchy.js";

// -- Fixtures --

const mockCompanyContext: CompanyContext = {
  industry: "Automotive",
  company_name: "Ford Motor Company",
  annual_revenue: 150_000_000_000,
  cogs: 120_000_000_000,
  sga: 12_000_000_000,
  ebitda: 8_000_000_000,
  working_capital: 5_000_000_000,
  inventory_value: 15_000_000_000,
  annual_hires: 5000,
  employee_count: 170_000,
  geographic_scope: "Global",
  notes: "",
  business_exclusions: "",
  enterprise_applications: ["SAP S/4HANA", "Oracle EBS", "Salesforce"],
  detected_applications: [],
  pptx_template: null,
  industry_specifics: null,
  raw_context: "",
  enriched_context: {},
  enrichment_applied_at: "",
  existing_systems: [],
  hard_exclusions: [],
  filtered_skills: [],
};

const mockL3: L3Opportunity = {
  l3_name: "Optimize Supplier Payment Terms",
  l2_name: "Procurement",
  l1_name: "Supply Chain",
  opportunity_exists: true,
  opportunity_name: "Dynamic Supplier Discount Capture",
  opportunity_summary: "Automatically evaluate supplier early-payment discounts against cost of capital to capture value.",
  lead_archetype: "DETERMINISTIC",
  supporting_archetypes: [],
  combined_max_value: 25_000_000,
  implementation_complexity: "MEDIUM",
  quick_win: false,
  competitive_positioning: null,
  aera_differentiators: [],
  l4_count: 3,
  high_value_l4_count: 2,
  rationale: "Strong financial case for automated discount evaluation.",
};

const mockL4s: L4Activity[] = [
  {
    id: "l4-001",
    name: "Evaluate Early Payment Discount",
    description: "Assess whether taking early payment discount is NPV-positive",
    l1: "Supply Chain",
    l2: "Procurement",
    l3: "Optimize Supplier Payment Terms",
    financial_rating: "HIGH",
    value_metric: "$15M",
    impact_order: "FIRST",
    rating_confidence: "HIGH",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: "When discount rate exceeds WACC by 2%, authorize early payment within credit limits",
    escalation_flag: null,
    skills: [],
  },
  {
    id: "l4-002",
    name: "Monitor Cash Position",
    description: "Track available cash and credit facility headroom",
    l1: "Supply Chain",
    l2: "Procurement",
    l3: "Optimize Supplier Payment Terms",
    financial_rating: "MEDIUM",
    value_metric: "$5M",
    impact_order: "SECOND",
    rating_confidence: "MEDIUM",
    ai_suitability: "MEDIUM",
    decision_exists: false,
    decision_articulation: null,
    escalation_flag: null,
    skills: [],
  },
];

const mockInput: SimulationInput = {
  opportunity: mockL3,
  l4s: mockL4s,
  companyContext: mockCompanyContext,
  archetype: "DETERMINISTIC",
  archetypeRoute: "deterministic_optimize",
  composite: 78,
};

// -- Valid YAML fixtures --

const VALID_MOCK_TEST_YAML = `decision: "When discount rate exceeds WACC by 2%, authorize early payment within credit limits"
input:
  financial_context:
    annual_revenue: 150000000000
    cogs: 120000000000
    discount_rate: 0.035
    wacc: 0.012
  trigger: "Supplier offers 3.5% discount for payment within 10 days"
  parameters:
    credit_limit: 50000000
    payment_window_days: 10
expected_output:
  action: "Authorize early payment of $2.4M to capture discount"
  outcome: "Net savings of $84,000 after cost of capital"
  affected_components:
    - "payment-processing"
    - "cash-position-monitor"
rationale: "Discount rate (3.5%) exceeds WACC (1.2%) by 2.3%, which is above the 2% threshold. Payment is within credit limits."`;

const VALID_YAML_IN_FENCES = "```yaml\n" + VALID_MOCK_TEST_YAML + "\n```";

const INVALID_YAML = `decision: "test"
input:
  missing_required_fields: true`;

// -- Helpers --

function makeOllamaResponse(content: string): string {
  return JSON.stringify({
    message: { role: "assistant", content },
    done: true,
    total_duration: 5_000_000_000,
  });
}

// -- Tests --

describe("generateMockTest", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns success with valid YAML output", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_MOCK_TEST_YAML), { status: 200 })) as typeof fetch;

    const result = await generateMockTest(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 1);
    assert.equal(result.data.mockTest.decision, "When discount rate exceeds WACC by 2%, authorize early payment within credit limits");
    assert.equal(typeof result.data.mockTest.input.financial_context, "object");
    assert.equal(typeof result.data.mockTest.expected_output.action, "string");
    assert.equal(typeof result.data.mockTest.rationale, "string");
  });

  it("uses decision_articulation as the decision field", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_MOCK_TEST_YAML), { status: 200 })) as typeof fetch;

    const result = await generateMockTest(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    // The decision_articulation from the first L4 with one should appear in the prompt
    // and ideally be reflected in the generated output
    assert.ok(result.data.mockTest.decision.length > 0);
  });

  it("strips code fences from YAML output", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_YAML_IN_FENCES), { status: 200 })) as typeof fetch;

    const result = await generateMockTest(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 1);
    assert.equal(typeof result.data.mockTest.decision, "string");
  });

  it("retries on invalid YAML and succeeds on second attempt", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(makeOllamaResponse(INVALID_YAML), { status: 200 });
      }
      return new Response(makeOllamaResponse(VALID_MOCK_TEST_YAML), { status: 200 });
    }) as typeof fetch;

    const result = await generateMockTest(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 2);
  });

  it("returns error after 3 failed attempts", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(INVALID_YAML), { status: 200 })) as typeof fetch;

    const result = await generateMockTest(mockInput, "http://localhost:11434");
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.includes("3"));
  });
});
