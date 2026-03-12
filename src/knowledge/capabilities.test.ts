import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAllCapabilities,
  getAllCapabilitiesFlat,
  getUseCaseMappings,
  getCapabilityKeywords,
} from "./capabilities.js";

describe("getAllCapabilities", () => {
  const pillars = getAllCapabilities();

  it("returns 4 capability pillars", () => {
    assert.equal(pillars.length, 4);
  });

  it("pillars have expected names", () => {
    const names = pillars.map((p) => p.name);
    assert.deepEqual(names, [
      "Data Foundation",
      "Intelligence Layer",
      "Decision & Action",
      "Orchestration",
    ]);
  });

  it("each pillar has at least 1 capability", () => {
    for (const pillar of pillars) {
      assert.ok(
        pillar.capabilities.length >= 1,
        `${pillar.name} should have at least 1 capability`,
      );
    }
  });

  it("each capability has required fields", () => {
    for (const pillar of pillars) {
      for (const cap of pillar.capabilities) {
        assert.ok(cap.name, "capability should have name");
        assert.ok(cap.description, "capability should have description");
        assert.ok(
          Array.isArray(cap.best_for) && cap.best_for.length > 0,
          `${cap.name} should have non-empty best_for array`,
        );
        assert.ok(
          Array.isArray(cap.keywords) && cap.keywords.length > 0,
          `${cap.name} should have non-empty keywords array`,
        );
      }
    }
  });
});

describe("getAllCapabilitiesFlat", () => {
  it("returns a flat array of all capabilities", () => {
    const flat = getAllCapabilitiesFlat();
    assert.ok(flat.length >= 16, `Expected at least 16 capabilities, got ${flat.length}`);
  });

  it("includes key Aera capabilities", () => {
    const names = getAllCapabilitiesFlat().map((c) => c.name);
    assert.ok(names.includes("Cortex Auto Forecast"), "Should include Cortex Auto Forecast");
    assert.ok(names.includes("RCA Service"), "Should include RCA Service");
    assert.ok(names.includes("Safety Stock Service"), "Should include Safety Stock Service");
    assert.ok(names.includes("CWB Lifecycle"), "Should include CWB Lifecycle");
    assert.ok(names.includes("Process Builder"), "Should include Process Builder");
    assert.ok(names.includes("STREAMS (ETL)"), "Should include STREAMS");
  });
});

describe("getUseCaseMappings", () => {
  const mappings = getUseCaseMappings();

  it("returns at least 15 use case mappings", () => {
    assert.ok(
      mappings.length >= 15,
      `Expected at least 15 mappings, got ${mappings.length}`,
    );
  });

  it("each mapping has required fields", () => {
    for (const m of mappings) {
      assert.ok(m.use_case, "mapping should have use_case");
      assert.ok(
        Array.isArray(m.primary_components) && m.primary_components.length > 0,
        `${m.use_case} should have non-empty primary_components`,
      );
      assert.ok(
        Array.isArray(m.supporting_components),
        `${m.use_case} should have supporting_components array`,
      );
      assert.ok(
        ["AI/ML", "Rule-Based", "Hybrid"].includes(m.skill_type),
        `${m.use_case} should have valid skill_type, got ${m.skill_type}`,
      );
      assert.ok(
        Array.isArray(m.keywords) && m.keywords.length > 0,
        `${m.use_case} should have non-empty keywords`,
      );
    }
  });

  it("includes key use cases", () => {
    const useCases = mappings.map((m) => m.use_case);
    assert.ok(useCases.includes("Demand Forecasting"), "Should include Demand Forecasting");
    assert.ok(useCases.includes("Safety Stock Optimization"), "Should include Safety Stock Optimization");
    assert.ok(useCases.includes("Exception Approval Workflow"), "Should include Exception Approval Workflow");
    assert.ok(useCases.includes("ETL Pipeline"), "Should include ETL Pipeline");
  });

  it("skill types cover all three categories", () => {
    const types = new Set(mappings.map((m) => m.skill_type));
    assert.ok(types.has("AI/ML"), "Should have AI/ML mappings");
    assert.ok(types.has("Rule-Based"), "Should have Rule-Based mappings");
    assert.ok(types.has("Hybrid"), "Should have Hybrid mappings");
  });
});

describe("getCapabilityKeywords", () => {
  const kw = getCapabilityKeywords();

  it("returns classifications with ai_ml, rule_based, hybrid", () => {
    assert.ok(kw.ai_ml, "Should have ai_ml classification");
    assert.ok(kw.rule_based, "Should have rule_based classification");
    assert.ok(kw.hybrid, "Should have hybrid classification");
  });

  it("each classification has keywords and components", () => {
    for (const [key, classification] of Object.entries(kw)) {
      assert.ok(
        Array.isArray(classification.keywords) && classification.keywords.length > 0,
        `${key} should have non-empty keywords`,
      );
      assert.ok(
        Array.isArray(classification.components) && classification.components.length > 0,
        `${key} should have non-empty components`,
      );
    }
  });

  it("ai_ml keywords include forecast and optimization", () => {
    assert.ok(kw.ai_ml.keywords.includes("forecast"), "AI/ML should include forecast");
    assert.ok(kw.ai_ml.keywords.includes("optimization"), "AI/ML should include optimization");
  });

  it("ai_ml components include Cortex Auto Forecast", () => {
    assert.ok(
      kw.ai_ml.components.includes("Cortex Auto Forecast"),
      "AI/ML components should include Cortex Auto Forecast",
    );
  });
});
