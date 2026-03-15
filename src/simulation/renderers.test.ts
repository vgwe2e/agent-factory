import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { SimulationInput, ScenarioSpec } from "../types/simulation.js";
import { renderScenarioArtifacts } from "./renderers.js";

function makeInput(): SimulationInput {
  return {
    opportunity: {
      l3_name: "Warehouse Inventory Management",
      opportunity_name: "Warehouse Inventory Management",
      opportunity_summary: "Optimize warehouse replenishment and exception handling.",
    } as SimulationInput["opportunity"],
    l4s: [],
    companyContext: {
      company_name: "Ford",
      industry: "Automotive",
      annual_revenue: 100,
      cogs: 50,
      ebitda: 10,
      working_capital: 5,
      inventory_value: 20,
      enterprise_applications: ["SAP S/4HANA", "Blue Yonder WMS"],
    } as SimulationInput["companyContext"],
    archetype: "DETERMINISTIC",
    archetypeRoute: "process",
    composite: 0.82,
  };
}

function makeSpec(): ScenarioSpec {
  return {
    objective: "Stabilize replenishment decisions",
    trigger: "Demand spike detected",
    decision: "Should the system recommend replenishment?",
    expected_action: "Create an Action Item for replenishment approval",
    expected_outcome: "Planner approves replenishment",
    rationale: "Demand and inventory risk justify the action.",
    source_systems: [
      { name: "SAP S/4HANA", type: "ERP", status: "identified" },
    ],
    key_inputs: [
      {
        name: "Demand Orders",
        source: "SAP S/4HANA",
        purpose: "Measure demand acceleration",
        preferred_stream_type: "Transaction Stream",
      },
    ],
    happy_path: [
      {
        step: "Ingest demand signal",
        stage: "ingest",
        component: "Event Stream",
        purpose: "Capture demand events",
      },
      {
        step: "Analyze inventory risk",
        stage: "analyze",
        component: "Demand Analysis",
        purpose: "Estimate stockout exposure",
      },
      {
        step: "Evaluate replenishment policy",
        stage: "decide",
        component: "If",
        purpose: "Compare the signal to threshold rules",
      },
      {
        step: "Create approval action item",
        stage: "act",
        component: "Action Item",
        purpose: "Route the recommendation for approval",
      },
      {
        step: "Display recommendation",
        stage: "surface",
        component: "Dashboard",
        purpose: "Present the recommendation to the planner",
      },
    ],
    branches: [
      {
        condition: "Threshold not met",
        response: "Send a notification for manual review",
        outcome: "Planner reviews the exception",
      },
    ],
  };
}

describe("renderScenarioArtifacts", () => {
  it("derives all four artifacts from a single scenario spec", () => {
    const rendered = renderScenarioArtifacts(
      makeInput(),
      makeSpec(),
      new Map([
        ["event stream", "Aera:event stream"],
        ["dashboard", "UI:Dashboard"],
        ["if", "PB:If"],
        ["action item", "PB:Action Item"],
      ]),
    );

    assert.ok(rendered.artifacts.decisionFlow.startsWith("flowchart TD"));
    assert.ok(rendered.artifacts.componentMap.streams.length >= 1);
    assert.ok(rendered.artifacts.componentMap.process_builder.length >= 2);
    assert.ok(rendered.artifacts.integrationSurface.source_systems.length >= 1);
    assert.ok(rendered.artifacts.mockTest.expected_output.action.length > 0);
    assert.equal(rendered.mermaidValid, true);
    assert.ok(rendered.validation.some((item) => item.status === "confirmed"));
  });
});
