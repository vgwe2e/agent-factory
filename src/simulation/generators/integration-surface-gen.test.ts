/**
 * Tests for integration surface generator.
 *
 * Validates that generateIntegrationSurface:
 * - Produces validated IntegrationSurface from LLM YAML output
 * - Accepts source systems with both "identified" and "tbd" status
 * - Strips code fences from LLM output
 * - Retries on YAML parse/validation failure
 * - Fails after 3 unsuccessful attempts
 */

import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { generateIntegrationSurface } from "./integration-surface-gen.js";
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
  opportunity_summary: "Automatically evaluate supplier early-payment discounts against cost of capital.",
  lead_archetype: "DETERMINISTIC",
  supporting_archetypes: [],
  combined_max_value: 25_000_000,
  implementation_complexity: "MEDIUM",
  quick_win: false,
  competitive_positioning: null,
  aera_differentiators: [],
  l4_count: 2,
  high_value_l4_count: 1,
  rationale: "Strong financial case.",
};

const mockL4s: L4Activity[] = [
  {
    id: "l4-001",
    name: "Evaluate Early Payment Discount",
    description: "Assess discount NPV",
    l1: "Supply Chain",
    l2: "Procurement",
    l3: "Optimize Supplier Payment Terms",
    financial_rating: "HIGH",
    value_metric: "$15M",
    impact_order: "FIRST",
    rating_confidence: "HIGH",
    ai_suitability: "HIGH",
    decision_exists: true,
    decision_articulation: "When discount rate exceeds WACC by 2%, authorize early payment",
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

const VALID_INTEGRATION_SURFACE_YAML = `source_systems:
  - name: "SAP S/4HANA"
    type: "ERP"
    status: "identified"
  - name: "Oracle EBS"
    type: "ERP"
    status: "identified"
  - name: "Internal Treasury System"
    type: "Treasury"
    status: "tbd"
aera_ingestion:
  - stream_name: "supplier-invoices"
    stream_type: "Event Stream"
    source: "SAP S/4HANA"
  - stream_name: "payment-terms"
    stream_type: "Reference Stream"
    source: "SAP S/4HANA"
processing:
  - component: "discount-evaluator"
    type: "Cortex Model"
    function: "Calculate NPV of early payment discount vs WACC"
  - component: "payment-authorization"
    type: "Process Builder"
    function: "Route discount decisions based on threshold rules"
ui_surface:
  - component: "discount-dashboard"
    screen: "Procurement Overview"
    purpose: "Display pending discount opportunities and approval status"
  - component: "payment-action"
    purpose: "Enable one-click approval of recommended early payments"`;

const VALID_YAML_IN_FENCES = "```yaml\n" + VALID_INTEGRATION_SURFACE_YAML + "\n```";

const INVALID_YAML = `source_systems:
  - name: "SAP"
aera_ingestion: "not an array"`;

// -- Helpers --

function makeOllamaResponse(content: string): string {
  return JSON.stringify({
    message: { role: "assistant", content },
    done: true,
    total_duration: 5_000_000_000,
  });
}

// -- Tests --

describe("generateIntegrationSurface", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns success with valid YAML containing identified and tbd sources", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_INTEGRATION_SURFACE_YAML), { status: 200 })) as typeof fetch;

    const result = await generateIntegrationSurface(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 1);

    const surface = result.data.integrationSurface;
    assert.ok(surface.source_systems.length >= 2);
    assert.ok(surface.aera_ingestion.length >= 1);
    assert.ok(surface.processing.length >= 1);
    assert.ok(surface.ui_surface.length >= 1);

    // Check identified and tbd statuses
    const identified = surface.source_systems.filter((s) => s.status === "identified");
    const tbd = surface.source_systems.filter((s) => s.status === "tbd");
    assert.ok(identified.length >= 1);
    assert.ok(tbd.length >= 1);
  });

  it("accepts source system with status tbd", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_INTEGRATION_SURFACE_YAML), { status: 200 })) as typeof fetch;

    const result = await generateIntegrationSurface(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;

    const tbdSystem = result.data.integrationSurface.source_systems.find((s) => s.status === "tbd");
    assert.ok(tbdSystem, "Expected at least one TBD source system");
    assert.equal(tbdSystem.status, "tbd");
  });

  it("strips code fences from YAML output", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(VALID_YAML_IN_FENCES), { status: 200 })) as typeof fetch;

    const result = await generateIntegrationSurface(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 1);
    assert.ok(result.data.integrationSurface.source_systems.length >= 1);
  });

  it("retries on invalid YAML and succeeds on second attempt", async () => {
    let callCount = 0;
    globalThis.fetch = mock.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(makeOllamaResponse(INVALID_YAML), { status: 200 });
      }
      return new Response(makeOllamaResponse(VALID_INTEGRATION_SURFACE_YAML), { status: 200 });
    }) as typeof fetch;

    const result = await generateIntegrationSurface(mockInput, "http://localhost:11434");
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.attempts, 2);
  });

  it("returns error after 3 failed attempts", async () => {
    globalThis.fetch = mock.fn(async () => new Response(makeOllamaResponse(INVALID_YAML), { status: 200 })) as typeof fetch;

    const result = await generateIntegrationSurface(mockInput, "http://localhost:11434");
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.includes("3"));
  });
});
