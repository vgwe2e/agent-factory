/**
 * Tests for component map generator.
 *
 * Uses mocked fetch to simulate Ollama responses.
 * Uses real knowledge base data for validation tests.
 */
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeIndex } from "../validators/knowledge-validator.js";
// -- Test fixtures --
/** Valid YAML with known PB/UI names from the real knowledge base. */
const VALID_YAML_KNOWN_NAMES = `streams:
  - name: "Event Stream"
    type: "transaction"
    purpose: "Capture demand signals"
    confidence: inferred
cortex:
  - name: "Demand Analysis"
    capability: "pattern recognition"
    purpose: "Analyze historical demand"
    confidence: inferred
process_builder:
  - name: "Interface"
    node_type: "core"
    purpose: "Receive demand data"
    confidence: inferred
  - name: "Action Item"
    node_type: "core"
    purpose: "Create purchase order"
    confidence: inferred
agent_teams:
  - name: "Demand Planning Agent"
    role: "forecaster"
    purpose: "Generate demand forecasts"
    confidence: inferred
ui:
  - name: "Dashboard"
    component_type: "display"
    purpose: "Show forecast results"
    confidence: inferred
  - name: "Table"
    component_type: "data"
    purpose: "Display demand data"
    confidence: inferred`;
/** Valid YAML with unknown/custom component names that won't substring-match knowledge base. */
const VALID_YAML_UNKNOWN_NAMES = `streams:
  - name: "Zylox Telemetry Feed"
    type: "reference"
    purpose: "Track zylox metrics"
    confidence: inferred
cortex:
  - name: "Zylox Cognition Module"
    capability: "zylox analysis"
    purpose: "Analyze zylox data"
    confidence: inferred
process_builder:
  - name: "Zylox Nexus Handler"
    node_type: "custom"
    purpose: "Handle zylox flows"
    confidence: inferred
agent_teams:
  - name: "Zylox Oversight Crew"
    role: "overseer"
    purpose: "Manage zylox tasks"
    confidence: inferred
ui:
  - name: "Zylox Viewport"
    component_type: "custom"
    purpose: "Display zylox data"
    confidence: inferred`;
const VALID_YAML_WITH_FENCES = "```yaml\n" + VALID_YAML_KNOWN_NAMES + "\n```";
const INVALID_YAML = `streams:
  - name: "Event Stream"
  this is not: valid: yaml: [broken`;
function makeOllamaResponse(content) {
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
function makeSimulationInput() {
    const opportunity = {
        l3_name: "Demand Forecasting Optimization",
        l2_name: "Supply Chain Planning",
        l1_name: "Supply Chain",
        opportunity_exists: true,
        opportunity_name: "Demand Forecasting",
        opportunity_summary: "Optimize demand forecasting using AI-driven analysis",
        lead_archetype: "DETERMINISTIC",
        supporting_archetypes: [],
        combined_max_value: 5000000,
        implementation_complexity: "MEDIUM",
        quick_win: true,
        competitive_positioning: null,
        aera_differentiators: [],
        l4_count: 1,
        high_value_l4_count: 1,
        rationale: "High-value demand forecasting opportunity",
    };
    const l4s = [
        {
            id: "L4-001",
            name: "Analyze historical demand",
            description: "Analyze past demand patterns",
            l1: "Supply Chain",
            l2: "Supply Chain Planning",
            l3: "Demand Forecasting Optimization",
            financial_rating: "HIGH",
            value_metric: "$5M",
            impact_order: "FIRST",
            rating_confidence: "HIGH",
            ai_suitability: "HIGH",
            decision_exists: true,
            decision_articulation: "Determine forecast accuracy threshold",
            escalation_flag: null,
            skills: [],
        },
    ];
    const companyContext = {
        company_name: "Ford Motor Company",
        industry: "Automotive",
    };
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
describe("generateComponentMap", () => {
    let originalFetch;
    const knowledgeIndex = buildKnowledgeIndex();
    beforeEach(() => {
        originalFetch = globalThis.fetch;
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });
    it("returns success with known PB/UI names set to confirmed", async () => {
        globalThis.fetch = mock.fn(async () => makeOllamaResponse(VALID_YAML_KNOWN_NAMES));
        const { generateComponentMap } = await import("./component-map-gen.js");
        const result = await generateComponentMap(makeSimulationInput(), knowledgeIndex);
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.attempts, 1);
            // Interface and Action Item are real PB nodes -- should be confirmed
            const pbEntries = result.data.componentMap.process_builder;
            const interfaceEntry = pbEntries.find((e) => e.name === "Interface");
            assert.ok(interfaceEntry);
            assert.equal(interfaceEntry.confidence, "confirmed");
            const actionItem = pbEntries.find((e) => e.name === "Action Item");
            assert.ok(actionItem);
            assert.equal(actionItem.confidence, "confirmed");
            // Dashboard and Table are real UI components -- should be confirmed
            const uiEntries = result.data.componentMap.ui;
            const dashboard = uiEntries.find((e) => e.name === "Dashboard");
            assert.ok(dashboard);
            assert.equal(dashboard.confidence, "confirmed");
            // Validation results should have confirmed entries
            const confirmedResults = result.data.validation.filter((v) => v.status === "confirmed");
            assert.ok(confirmedResults.length >= 4); // Interface, Action Item, Dashboard, Table, Event Stream
        }
    });
    it("returns success with unknown names set to inferred", async () => {
        globalThis.fetch = mock.fn(async () => makeOllamaResponse(VALID_YAML_UNKNOWN_NAMES));
        const { generateComponentMap } = await import("./component-map-gen.js");
        const result = await generateComponentMap(makeSimulationInput(), knowledgeIndex);
        assert.equal(result.success, true);
        if (result.success) {
            // Custom names should be inferred
            const pbEntries = result.data.componentMap.process_builder;
            const zyloxHandler = pbEntries.find((e) => e.name === "Zylox Nexus Handler");
            assert.ok(zyloxHandler);
            assert.equal(zyloxHandler.confidence, "inferred");
            // All validation results for unknowns should be inferred
            const inferredResults = result.data.validation.filter((v) => v.status === "inferred");
            assert.ok(inferredResults.length >= 3);
        }
    });
    it("strips code fences from YAML output", async () => {
        globalThis.fetch = mock.fn(async () => makeOllamaResponse(VALID_YAML_WITH_FENCES));
        const { generateComponentMap } = await import("./component-map-gen.js");
        const result = await generateComponentMap(makeSimulationInput(), knowledgeIndex);
        assert.equal(result.success, true);
        if (result.success) {
            assert.ok(result.data.componentMap.streams.length > 0);
        }
    });
    it("retries on invalid YAML and succeeds on second attempt", async () => {
        let callCount = 0;
        globalThis.fetch = mock.fn(async () => {
            callCount++;
            if (callCount === 1) {
                return makeOllamaResponse(INVALID_YAML);
            }
            return makeOllamaResponse(VALID_YAML_KNOWN_NAMES);
        });
        const { generateComponentMap } = await import("./component-map-gen.js");
        const result = await generateComponentMap(makeSimulationInput(), knowledgeIndex);
        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.data.attempts, 2);
        }
    });
    it("returns failure after 3 consecutive YAML parse failures", async () => {
        globalThis.fetch = mock.fn(async () => makeOllamaResponse(INVALID_YAML));
        const { generateComponentMap } = await import("./component-map-gen.js");
        const result = await generateComponentMap(makeSimulationInput(), knowledgeIndex);
        assert.equal(result.success, false);
        if (!result.success) {
            assert.ok(result.error.includes("3"));
        }
    });
});
describe("buildComponentMapPrompt", () => {
    it("includes PB node names, UI component names, and integration patterns", async () => {
        const { buildComponentMapPrompt } = await import("../prompts/component-map.js");
        const input = makeSimulationInput();
        const messages = buildComponentMapPrompt(input, ["Interface", "If", "Action Item"], ["Dashboard", "Table", "Chart"], ["ETL Pattern", "API Gateway"]);
        assert.ok(messages.length >= 2);
        const system = messages.find((m) => m.role === "system");
        assert.ok(system);
        assert.ok(system.content.includes("Interface"));
        assert.ok(system.content.includes("Dashboard"));
        assert.ok(system.content.includes("ETL Pattern"));
    });
});
