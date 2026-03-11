import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildKnowledgeContext } from "./knowledge-context.js";

describe("buildKnowledgeContext", () => {
  const ctx = buildKnowledgeContext();

  it("returns an object with components and processBuilder strings", () => {
    assert.equal(typeof ctx.components, "string");
    assert.equal(typeof ctx.processBuilder, "string");
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
});
