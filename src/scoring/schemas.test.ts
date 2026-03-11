/**
 * Schema validation tests for LLM output shapes.
 *
 * Verifies that the Zod schemas correctly parse valid LLM-like output
 * and reject invalid data. Also validates JSON schema conversion for
 * Ollama's format parameter.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TechnicalLensSchema,
  AdoptionLensSchema,
  ValueLensSchema,
  technicalJsonSchema,
  adoptionJsonSchema,
  valueJsonSchema,
} from "./schemas.js";

// -- Fixtures: valid LLM-like output --

const validTechnical = {
  data_readiness: { score: 2, reason: "Multiple L4s reference structured financial data." },
  aera_platform_fit: { score: 3, reason: "Strong alignment with Dashboard, Table, and Chart components." },
  archetype_confidence: { score: 1, reason: "Archetype support is weak with mixed L4 patterns." },
};

const validAdoption = {
  decision_density: { score: 3, reason: "Over 80% of L4s have decision_exists=true." },
  financial_gravity: { score: 2, reason: "Mix of HIGH and MEDIUM financial ratings." },
  impact_proximity: { score: 2, reason: "Both FIRST and SECOND order impacts present." },
  confidence_signal: { score: 1, reason: "Many L4s have LOW rating_confidence." },
};

const validValue = {
  value_density: { score: 3, reason: "Combined max value exceeds 2% of annual revenue." },
  simulation_viability: { score: 2, reason: "Clear decision flows exist but dependencies are complex." },
};

// -- Tests --

describe("TechnicalLensSchema", () => {
  it("should parse valid technical output", () => {
    const result = TechnicalLensSchema.parse(validTechnical);
    assert.equal(result.data_readiness.score, 2);
    assert.equal(result.aera_platform_fit.score, 3);
    assert.equal(result.archetype_confidence.score, 1);
    assert.equal(typeof result.data_readiness.reason, "string");
  });

  it("should reject missing fields", () => {
    const incomplete = {
      data_readiness: { score: 2, reason: "ok" },
      aera_platform_fit: { score: 1, reason: "ok" },
      // archetype_confidence missing
    };
    assert.throws(() => TechnicalLensSchema.parse(incomplete));
  });

  it("should reject score out of range (too high)", () => {
    const badScore = {
      ...validTechnical,
      data_readiness: { score: 4, reason: "invalid" },
    };
    assert.throws(() => TechnicalLensSchema.parse(badScore));
  });

  it("should reject score out of range (negative)", () => {
    const badScore = {
      ...validTechnical,
      archetype_confidence: { score: -1, reason: "invalid" },
    };
    assert.throws(() => TechnicalLensSchema.parse(badScore));
  });

  it("should strip extra fields", () => {
    const withExtra = {
      ...validTechnical,
      unexpected_field: "should be stripped",
    };
    const result = TechnicalLensSchema.parse(withExtra);
    assert.equal("unexpected_field" in result, false);
  });
});

describe("AdoptionLensSchema", () => {
  it("should parse valid adoption output", () => {
    const result = AdoptionLensSchema.parse(validAdoption);
    assert.equal(result.decision_density.score, 3);
    assert.equal(result.financial_gravity.score, 2);
    assert.equal(result.impact_proximity.score, 2);
    assert.equal(result.confidence_signal.score, 1);
  });

  it("should reject missing fields", () => {
    const incomplete = {
      decision_density: { score: 1, reason: "ok" },
      // missing other fields
    };
    assert.throws(() => AdoptionLensSchema.parse(incomplete));
  });

  it("should reject non-integer score", () => {
    const badScore = {
      ...validAdoption,
      decision_density: { score: 1.5, reason: "fractional" },
    };
    assert.throws(() => AdoptionLensSchema.parse(badScore));
  });

  it("should reject score out of range", () => {
    const badScore = {
      ...validAdoption,
      financial_gravity: { score: 4, reason: "too high" },
    };
    assert.throws(() => AdoptionLensSchema.parse(badScore));
  });
});

describe("ValueLensSchema", () => {
  it("should parse valid value output", () => {
    const result = ValueLensSchema.parse(validValue);
    assert.equal(result.value_density.score, 3);
    assert.equal(result.simulation_viability.score, 2);
  });

  it("should reject missing fields", () => {
    const incomplete = {
      value_density: { score: 2, reason: "ok" },
      // simulation_viability missing
    };
    assert.throws(() => ValueLensSchema.parse(incomplete));
  });

  it("should reject score out of range", () => {
    const badScore = {
      ...validValue,
      simulation_viability: { score: -1, reason: "negative" },
    };
    assert.throws(() => ValueLensSchema.parse(badScore));
  });

  it("should strip extra fields", () => {
    const withExtra = {
      ...validValue,
      bonus_dimension: { score: 1, reason: "extra" },
    };
    const result = ValueLensSchema.parse(withExtra);
    assert.equal("bonus_dimension" in result, false);
  });
});

describe("JSON Schema conversion", () => {
  it("should produce valid technical JSON schema", () => {
    assert.equal(typeof technicalJsonSchema, "object");
    assert.ok(technicalJsonSchema !== null);
    // Should have type: "object" (may be nested under properties or at top level)
    const schema = technicalJsonSchema as Record<string, unknown>;
    assert.equal(schema.type, "object");
    const props = schema.properties as Record<string, unknown> | undefined;
    assert.ok(props !== undefined);
    assert.ok("data_readiness" in props);
    assert.ok("aera_platform_fit" in props);
    assert.ok("archetype_confidence" in props);
  });

  it("should produce valid adoption JSON schema", () => {
    const schema = adoptionJsonSchema as Record<string, unknown>;
    assert.equal(schema.type, "object");
    const props = schema.properties as Record<string, unknown> | undefined;
    assert.ok(props !== undefined);
    assert.ok("decision_density" in props);
    assert.ok("financial_gravity" in props);
    assert.ok("impact_proximity" in props);
    assert.ok("confidence_signal" in props);
  });

  it("should produce valid value JSON schema", () => {
    const schema = valueJsonSchema as Record<string, unknown>;
    assert.equal(schema.type, "object");
    const props = schema.properties as Record<string, unknown> | undefined;
    assert.ok(props !== undefined);
    assert.ok("value_density" in props);
    assert.ok("simulation_viability" in props);
  });

  it("should have required fields in technical schema", () => {
    const schema = technicalJsonSchema as Record<string, unknown>;
    const required = schema.required as string[] | undefined;
    assert.ok(required !== undefined);
    assert.ok(required.includes("data_readiness"));
    assert.ok(required.includes("aera_platform_fit"));
    assert.ok(required.includes("archetype_confidence"));
  });

  it("should have required fields in adoption schema", () => {
    const schema = adoptionJsonSchema as Record<string, unknown>;
    const required = schema.required as string[] | undefined;
    assert.ok(required !== undefined);
    assert.ok(required.includes("decision_density"));
    assert.ok(required.includes("financial_gravity"));
    assert.ok(required.includes("impact_proximity"));
    assert.ok(required.includes("confidence_signal"));
  });

  it("should have required fields in value schema", () => {
    const schema = valueJsonSchema as Record<string, unknown>;
    const required = schema.required as string[] | undefined;
    assert.ok(required !== undefined);
    assert.ok(required.includes("value_density"));
    assert.ok(required.includes("simulation_viability"));
  });
});
