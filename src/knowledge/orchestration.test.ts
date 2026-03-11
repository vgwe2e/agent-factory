import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRouteForArchetype,
  getDecisionCriteria,
  getAllScenarios,
  getScenariosByRoute,
  getIntegrationPatterns,
  getIntegrationPattern,
  matchCriteria,
  getDecisionGuide,
} from "./orchestration.js";

describe("orchestration query module", () => {
  describe("getRouteForArchetype", () => {
    it("returns process route for DETERMINISTIC archetype", () => {
      const result = getRouteForArchetype("DETERMINISTIC");
      assert.equal(result.primary_route, "process");
      assert.equal(result.secondary_route, "hybrid");
      assert.equal(typeof result.rationale, "string");
      assert.ok(result.rationale.length > 0);
    });

    it("returns agentic_ai route for AGENTIC archetype", () => {
      const result = getRouteForArchetype("AGENTIC");
      assert.equal(result.primary_route, "agentic_ai");
      assert.equal(result.secondary_route, "hybrid");
    });

    it("returns agentic_ai route for GENERATIVE archetype", () => {
      const result = getRouteForArchetype("GENERATIVE");
      assert.equal(result.primary_route, "agentic_ai");
      assert.equal(result.secondary_route, "hybrid");
    });
  });

  describe("getDecisionCriteria", () => {
    it("returns 6 criteria for process route", () => {
      const criteria = getDecisionCriteria("process");
      assert.equal(criteria.length, 6);
    });

    it("returns 6 criteria for agentic_ai route", () => {
      const criteria = getDecisionCriteria("agentic_ai");
      assert.equal(criteria.length, 6);
    });

    it("returns 5 criteria for hybrid route", () => {
      const criteria = getDecisionCriteria("hybrid");
      assert.equal(criteria.length, 5);
    });

    it("each criterion has required fields", () => {
      const criteria = getDecisionCriteria("process");
      for (const c of criteria) {
        assert.equal(typeof c.criterion, "string");
        assert.equal(typeof c.description, "string");
        assert.equal(typeof c.example, "string");
      }
    });
  });

  describe("getAllScenarios", () => {
    it("returns 8 scenarios", () => {
      const scenarios = getAllScenarios();
      assert.equal(scenarios.length, 8);
    });
  });

  describe("getScenariosByRoute", () => {
    it("returns 3 process scenarios", () => {
      const scenarios = getScenariosByRoute("process");
      assert.equal(scenarios.length, 3);
      const names = scenarios.map((s) => s.name);
      assert.ok(names.includes("ETL Pipeline"));
      assert.ok(names.includes("CWB Approval Workflow"));
      assert.ok(names.includes("Performance-Critical Batch Processing"));
    });

    it("returns 2 hybrid scenarios", () => {
      const scenarios = getScenariosByRoute("hybrid");
      assert.equal(scenarios.length, 2);
      const names = scenarios.map((s) => s.name);
      assert.ok(names.includes("Chat-Based Reporting"));
      assert.ok(names.includes("CWB with Exception Analysis"));
    });

    it("returns 3 agentic_ai scenarios", () => {
      const scenarios = getScenariosByRoute("agentic_ai");
      assert.equal(scenarios.length, 3);
    });
  });

  describe("getIntegrationPatterns", () => {
    it("returns 4 patterns", () => {
      const patterns = getIntegrationPatterns();
      assert.equal(patterns.length, 4);
    });
  });

  describe("getIntegrationPattern", () => {
    it("returns pattern by name", () => {
      const pattern = getIntegrationPattern("Agent Function Wraps Process");
      assert.ok(pattern);
      assert.equal(typeof pattern.flow, "string");
      assert.ok(pattern.flow.length > 0);
    });

    it("returns undefined for unknown pattern", () => {
      const pattern = getIntegrationPattern("Nonexistent Pattern");
      assert.equal(pattern, undefined);
    });
  });

  describe("matchCriteria", () => {
    it("finds transaction_control in process route", () => {
      const match = matchCriteria("transaction_control");
      assert.ok(match);
      assert.equal(match.route, "process");
      assert.equal(match.criterion.criterion, "transaction_control");
      assert.equal(typeof match.criterion.description, "string");
    });

    it("finds natural_language in agentic_ai route", () => {
      const match = matchCriteria("natural_language");
      assert.ok(match);
      assert.equal(match.route, "agentic_ai");
    });

    it("finds llm_orchestrates_procedural in hybrid route", () => {
      const match = matchCriteria("llm_orchestrates_procedural");
      assert.ok(match);
      assert.equal(match.route, "hybrid");
    });

    it("returns undefined for unknown criterion", () => {
      const match = matchCriteria("nonexistent_criterion");
      assert.equal(match, undefined);
    });
  });

  describe("getDecisionGuide", () => {
    it("returns the full decision guide", () => {
      const guide = getDecisionGuide();
      assert.equal(guide.version, "1.0");
      assert.equal(guide.routes.length, 3);
      assert.equal(guide.scenarios.length, 8);
      assert.equal(guide.integration_patterns.length, 4);
      assert.ok(guide.archetype_mapping.DETERMINISTIC);
      assert.ok(guide.archetype_mapping.AGENTIC);
      assert.ok(guide.archetype_mapping.GENERATIVE);
    });
  });

  describe("archetype-hierarchy type alignment", () => {
    it("all three LeadArchetype values have mappings", () => {
      const archetypes = ["DETERMINISTIC", "AGENTIC", "GENERATIVE"] as const;
      for (const a of archetypes) {
        const mapping = getRouteForArchetype(a);
        assert.ok(mapping, `Missing mapping for ${a}`);
        assert.ok(
          ["process", "agentic_ai", "hybrid"].includes(mapping.primary_route),
          `Invalid primary_route for ${a}`,
        );
      }
    });
  });
});
