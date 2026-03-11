import { describe, it } from "node:test";
import assert from "node:assert/strict";
import yaml from "js-yaml";
import { ComponentMapSchema, MockTestSchema, IntegrationSurfaceSchema, parseAndValidateYaml, } from "./schemas.js";
describe("ComponentMapSchema", () => {
    it("parses valid component map YAML with all 5 sections and confidence flags", () => {
        const raw = `
streams:
  - name: Invoice Events
    type: Event Stream
    confidence: confirmed
cortex:
  - name: Anomaly Detection
    capability: pattern recognition
    confidence: inferred
process_builder:
  - name: IF
    node_type: control_flow
    purpose: Route approvals
    confidence: confirmed
agent_teams:
  - name: Procurement Agent
    role: Monitor spend
    confidence: inferred
ui:
  - name: Table
    component_type: display
    properties:
      - columns
      - rows
    confidence: confirmed
`;
        const result = ComponentMapSchema.parse(yaml.load(raw));
        assert.equal(result.streams.length, 1);
        assert.equal(result.streams[0].confidence, "confirmed");
        assert.equal(result.cortex.length, 1);
        assert.equal(result.process_builder.length, 1);
        assert.equal(result.agent_teams.length, 1);
        assert.equal(result.ui.length, 1);
        assert.deepEqual(result.ui[0].properties, ["columns", "rows"]);
    });
    it("rejects component map with missing confidence field", () => {
        const raw = `
streams:
  - name: Invoice Events
    type: Event Stream
`;
        assert.throws(() => {
            ComponentMapSchema.parse(yaml.load(raw));
        });
    });
    it("passes with empty sections (defaults to [])", () => {
        const result = ComponentMapSchema.parse({});
        assert.deepEqual(result.streams, []);
        assert.deepEqual(result.cortex, []);
        assert.deepEqual(result.process_builder, []);
        assert.deepEqual(result.agent_teams, []);
        assert.deepEqual(result.ui, []);
    });
});
describe("MockTestSchema", () => {
    it("parses valid mock test YAML", () => {
        const raw = `
decision: Should we approve this purchase order?
input:
  financial_context:
    annual_revenue: 50000000
    cogs: 30000000
  trigger: PO received for $150,000
expected_output:
  action: Auto-approve
  outcome: PO processed within SLA
  affected_components:
    - Approval Gate
    - Notification
rationale: High-value PO within threshold triggers auto-approval per policy
`;
        const result = MockTestSchema.parse(yaml.load(raw));
        assert.equal(result.decision, "Should we approve this purchase order?");
        assert.equal(result.rationale.length > 0, true);
        assert.equal(result.input.trigger, "PO received for $150,000");
    });
    it("rejects mock test missing rationale field", () => {
        const obj = {
            decision: "Test decision",
            input: {
                financial_context: { revenue: 100 },
                trigger: "test trigger",
            },
            expected_output: {
                action: "approve",
                outcome: "processed",
            },
        };
        assert.throws(() => {
            MockTestSchema.parse(obj);
        });
    });
});
describe("IntegrationSurfaceSchema", () => {
    it("parses valid integration surface YAML with 4 sections", () => {
        const raw = `
source_systems:
  - name: SAP ERP
    type: ERP
    status: identified
aera_ingestion:
  - stream_name: Purchase Orders
    stream_type: Event Stream
    source: SAP ERP
processing:
  - component: Approval Flow
    type: process_builder
    function: Route approvals based on amount
ui_surface:
  - component: Table
    screen: Procurement Dashboard
    purpose: Display pending approvals
`;
        const result = IntegrationSurfaceSchema.parse(yaml.load(raw));
        assert.equal(result.source_systems.length, 1);
        assert.equal(result.aera_ingestion.length, 1);
        assert.equal(result.processing.length, 1);
        assert.equal(result.ui_surface.length, 1);
    });
    it("accepts status 'tbd' and rejects unknown status", () => {
        // tbd accepted
        const validRaw = `
source_systems:
  - name: Unknown System
    status: tbd
aera_ingestion: []
processing: []
ui_surface: []
`;
        const result = IntegrationSurfaceSchema.parse(yaml.load(validRaw));
        assert.equal(result.source_systems[0].status, "tbd");
        // unknown status rejected
        const invalidObj = {
            source_systems: [{ name: "X", status: "unknown" }],
            aera_ingestion: [],
            processing: [],
            ui_surface: [],
        };
        assert.throws(() => {
            IntegrationSurfaceSchema.parse(invalidObj);
        });
    });
});
describe("parseAndValidateYaml", () => {
    it("strips code fences and validates against schema", async () => {
        const raw = "```yaml\nstreams: []\ncortex: []\nprocess_builder: []\nagent_teams: []\nui: []\n```";
        const result = await parseAndValidateYaml(raw, ComponentMapSchema);
        assert.equal(result.success, true);
        if (result.success) {
            assert.deepEqual(result.data.streams, []);
        }
    });
    it("returns error for invalid YAML", async () => {
        const raw = "not: [valid: yaml: here";
        const result = await parseAndValidateYaml(raw, ComponentMapSchema);
        assert.equal(result.success, false);
    });
});
