import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import {
  hierarchyExportSchema,
  projectDataSchema,
  metaSchema,
  companyContextSchema,
  l4ActivitySchema,
  l3OpportunitySchema,
} from "./hierarchy.js";

// Minimal valid fixtures

const validMeta = {
  project_name: "test_project",
  version_date: "2026-03-10T21:16:41.356766",
  created_date: "2026-03-10T18:16:38.933238",
  exported_by: null,
  description: "Test export",
};

const validCompanyContext = {
  industry: "Automotive",
  company_name: "Ford",
  annual_revenue: 184992000001,
  cogs: null,
  sga: null,
  ebitda: null,
  working_capital: null,
  inventory_value: null,
  annual_hires: null,
  employee_count: null,
  geographic_scope: "Global",
  notes: "",
  business_exclusions: "",
  enterprise_applications: ["SAP"],
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

const validL4: object = {
  id: "abc123",
  name: "Test Activity",
  description: "Test description",
  l1: "Plan",
  l2: "Demand Forecasting",
  l3: "Market Intelligence",
  financial_rating: "HIGH",
  value_metric: "WORKING_CAPITAL",
  impact_order: "FIRST",
  rating_confidence: "MEDIUM",
  ai_suitability: "HIGH",
  decision_exists: true,
  decision_articulation: "Some decision",
  escalation_flag: null,
  skills: [],
};

const validL3: object = {
  l3_name: "Market Intelligence",
  l2_name: "Demand Forecasting",
  l1_name: "Plan",
  opportunity_exists: true,
  opportunity_name: "Test Opportunity",
  opportunity_summary: "Summary",
  lead_archetype: "AGENTIC",
  supporting_archetypes: ["DETERMINISTIC"],
  combined_max_value: 38000000,
  implementation_complexity: "MEDIUM",
  quick_win: false,
  competitive_positioning: null,
  aera_differentiators: [],
  l4_count: 5,
  high_value_l4_count: 2,
  rationale: "Test rationale",
};

const validProjectData = {
  meta: validMeta,
  company_context: validCompanyContext,
  hierarchy: [validL4],
  l3_opportunities: [validL3],
};

const validExportMeta = {
  exported_at: "2026-03-13T01:30:22.179581",
  exported_by: null,
  export_version: "1.0",
  schema_version: "aera-di-portfolio-v1",
  analysis_type: "discovery",
  requires_validation: true,
};

const validDisclaimer = {
  type: "Art of the Possible - Discovery Analysis",
  message: "This analysis identifies potential opportunities.",
  enterprise_applications: ["SAP S/4HANA"],
  overlap_notice: "Integration analysis is recommended.",
};

const validEnvelope = {
  export_meta: validExportMeta,
  disclaimer: validDisclaimer,
  project: validProjectData,
  summary: { l4_nodes: 1 },
};

describe("projectDataSchema", () => {
  it("parses valid project data successfully", () => {
    const result = projectDataSchema.parse(validProjectData);
    assert.equal(result.meta.project_name, "test_project");
    assert.equal(result.hierarchy.length, 1);
    assert.equal(result.l3_opportunities.length, 1);
  });

  it("passes through extra top-level keys in project data", () => {
    const withExtra = {
      ...validProjectData,
      industry_analysis: { some: "data" },
      domain_references: [1, 2, 3],
    };
    const result = projectDataSchema.parse(withExtra);
    assert.deepEqual((result as Record<string, unknown>).industry_analysis, {
      some: "data",
    });
  });
});

describe("hierarchyExportSchema (v3 envelope)", () => {
  it("parses valid v3 envelope successfully", () => {
    const result = hierarchyExportSchema.parse(validEnvelope);
    assert.equal(result.project.meta.project_name, "test_project");
    assert.equal(result.project.hierarchy.length, 1);
    assert.equal(result.project.l3_opportunities.length, 1);
    assert.equal(result.export_meta.schema_version, "aera-di-portfolio-v1");
  });

  it("accepts empty hierarchy array in project", () => {
    const result = hierarchyExportSchema.parse({
      ...validEnvelope,
      project: {
        ...validProjectData,
        hierarchy: [],
        l3_opportunities: [],
      },
    });
    assert.equal(result.project.hierarchy.length, 0);
    assert.equal(result.project.l3_opportunities.length, 0);
  });

  it("rejects missing required field with clear path", () => {
    const invalid = {
      ...validEnvelope,
      project: {
        ...validProjectData,
        meta: { ...validMeta, project_name: undefined },
      },
    };
    try {
      hierarchyExportSchema.parse(invalid);
      assert.fail("Should have thrown ZodError");
    } catch (err) {
      assert.ok(err instanceof ZodError);
      const issue = err.issues[0];
      assert.ok(
        issue.path.includes("project_name") || issue.path.includes("meta") || issue.path.includes("project"),
        `Expected path to contain 'project', 'meta', or 'project_name', got: ${JSON.stringify(issue.path)}`
      );
    }
  });

  it("rejects missing export_meta", () => {
    const { export_meta, ...invalid } = validEnvelope;
    try {
      hierarchyExportSchema.parse(invalid);
      assert.fail("Should have thrown ZodError");
    } catch (err) {
      assert.ok(err instanceof ZodError);
    }
  });
});

describe("l4ActivitySchema", () => {
  it("rejects invalid financial_rating enum value", () => {
    const invalid = { ...validL4, financial_rating: "ULTRA_HIGH" };
    try {
      l4ActivitySchema.parse(invalid);
      assert.fail("Should have thrown ZodError");
    } catch (err) {
      assert.ok(err instanceof ZodError);
      const issue = err.issues[0];
      assert.ok(
        issue.path.includes("financial_rating"),
        `Expected path to contain 'financial_rating', got: ${JSON.stringify(issue.path)}`
      );
    }
  });

  it("accepts null ai_suitability", () => {
    const withNull = { ...validL4, ai_suitability: null };
    const result = l4ActivitySchema.parse(withNull);
    assert.equal(result.ai_suitability, null);
  });

  it("accepts NOT_APPLICABLE ai_suitability", () => {
    const withNA = { ...validL4, ai_suitability: "NOT_APPLICABLE" };
    const result = l4ActivitySchema.parse(withNA);
    assert.equal(result.ai_suitability, "NOT_APPLICABLE");
  });
});

describe("l3OpportunitySchema", () => {
  it("rejects missing lead_archetype", () => {
    const { lead_archetype, ...invalid } = validL3 as Record<string, unknown>;
    try {
      l3OpportunitySchema.parse(invalid);
      assert.fail("Should have thrown ZodError");
    } catch (err) {
      assert.ok(err instanceof ZodError);
      const issue = err.issues[0];
      assert.ok(
        issue.path.includes("lead_archetype"),
        `Expected path to contain 'lead_archetype', got: ${JSON.stringify(issue.path)}`
      );
    }
  });

  it("accepts null lead_archetype", () => {
    const withNull = { ...validL3, lead_archetype: null };
    const result = l3OpportunitySchema.parse(withNull);
    assert.equal(result.lead_archetype, null);
  });

  it("accepts null implementation_complexity", () => {
    const withNull = { ...validL3, implementation_complexity: null };
    const result = l3OpportunitySchema.parse(withNull);
    assert.equal(result.implementation_complexity, null);
  });
});

describe("companyContextSchema", () => {
  it("accepts null numeric fields", () => {
    const result = companyContextSchema.parse(validCompanyContext);
    assert.equal(result.annual_revenue, 184992000001);
    assert.equal(result.cogs, null);
    assert.equal(result.sga, null);
  });
});
