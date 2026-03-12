import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeContext } from "./knowledge-context.js";

describe("buildKnowledgeContext", () => {
  const ctx = buildKnowledgeContext();

  it("returns an object with components, processBuilder, and capabilities strings", () => {
    assert.equal(typeof ctx.components, "string");
    assert.equal(typeof ctx.processBuilder, "string");
    assert.equal(typeof ctx.capabilities, "string");
  });

  it("components string is non-empty", () => {
    assert.ok(ctx.components.length > 0, "components string should not be empty");
  });

  it("processBuilder string is non-empty", () => {
    assert.ok(ctx.processBuilder.length > 0, "processBuilder string should not be empty");
  });

  it("components string contains at least 21 entries", () => {
    const lines = ctx.components.split("\n").filter((l) => l.startsWith("- "));
    assert.ok(
      lines.length >= 21,
      `Expected at least 21 component entries, got ${lines.length}`,
    );
  });

  it("processBuilder string contains at least 22 entries", () => {
    const lines = ctx.processBuilder.split("\n").filter((l) => l.startsWith("- "));
    assert.ok(
      lines.length >= 22,
      `Expected at least 22 PB node entries, got ${lines.length}`,
    );
  });

  it("components string contains known component names", () => {
    assert.ok(ctx.components.includes("table"), "Should contain table");
    assert.ok(ctx.components.includes("dashboard"), "Should contain dashboard");
    assert.ok(ctx.components.includes("chart"), "Should contain chart");
  });

  it("processBuilder string contains known PB node names", () => {
    assert.ok(ctx.processBuilder.includes("Interface"), "Should contain Interface");
    assert.ok(ctx.processBuilder.includes("IF"), "Should contain IF");
  });

  it("capabilities string is non-empty", () => {
    assert.ok(ctx.capabilities.length > 0, "capabilities string should not be empty");
  });

  it("capabilities string contains platform capability names", () => {
    assert.ok(ctx.capabilities.includes("Cortex Auto Forecast"), "Should contain Cortex Auto Forecast");
    assert.ok(ctx.capabilities.includes("RCA Service"), "Should contain RCA Service");
    assert.ok(ctx.capabilities.includes("Safety Stock Service"), "Should contain Safety Stock Service");
    assert.ok(ctx.capabilities.includes("CWB Lifecycle"), "Should contain CWB Lifecycle");
    assert.ok(ctx.capabilities.includes("Process Builder"), "Should contain Process Builder");
  });

  it("capabilities string contains use case mappings", () => {
    assert.ok(ctx.capabilities.includes("Demand Forecasting"), "Should contain Demand Forecasting use case");
    assert.ok(ctx.capabilities.includes("Exception Approval Workflow"), "Should contain Exception Approval Workflow use case");
  });

  it("capabilities string contains keyword classifications", () => {
    assert.ok(ctx.capabilities.includes("AI/ML signals:"), "Should contain AI/ML signals");
    assert.ok(ctx.capabilities.includes("Rule-Based signals:"), "Should contain Rule-Based signals");
    assert.ok(ctx.capabilities.includes("Hybrid signals:"), "Should contain Hybrid signals");
  });

  it("capabilities string contains pillar section headers", () => {
    assert.ok(ctx.capabilities.includes("[Data Foundation]"), "Should contain Data Foundation pillar");
    assert.ok(ctx.capabilities.includes("[Intelligence Layer]"), "Should contain Intelligence Layer pillar");
    assert.ok(ctx.capabilities.includes("[Decision & Action]"), "Should contain Decision & Action pillar");
    assert.ok(ctx.capabilities.includes("[Orchestration]"), "Should contain Orchestration pillar");
  });

  it("total knowledge context is under estimated 4000 tokens", () => {
    // Rough estimate: 1 token ~= 4 chars for English text
    const totalChars = ctx.components.length + ctx.processBuilder.length + ctx.capabilities.length;
    const estimatedTokens = totalChars / 4;
    assert.ok(
      estimatedTokens < 4000,
      `Estimated ${Math.round(estimatedTokens)} tokens exceeds 4000 budget`,
    );
  });
});
