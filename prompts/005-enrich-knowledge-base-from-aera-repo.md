<objective>
Pull Aera platform capability knowledge from the external reference repo at `/Users/vincent.wicker/Documents/area/reference/` into this repo's bundled knowledge base (`src/data/`), then wire it into the scoring pipeline's knowledge context builder so the Technical Feasibility prompt has capability-level grounding — not just component names.

This directly fixes the `aera_platform_fit = 0` failure across all 322 scored opportunities. The LLM currently only receives UI widget names and PB node names. It needs to know what business problems Aera solves.
</objective>

<context>
Read the CLAUDE.md for project conventions.

**Current knowledge pipeline (read these first):**
- `src/scoring/knowledge-context.ts` — Builds context strings from `getAllComponents()` and `getAllPBNodes()`
- `src/knowledge/components.ts` — Loads 21 UI components from `src/data/components/*.json`
- `src/knowledge/process-builder.ts` — Loads 22 PB nodes from `src/data/process-builder/nodes.json`
- `src/scoring/prompts/technical.ts` — Consumes `knowledgeContext` string in the system prompt, specifically for `aera_platform_fit` scoring
- `src/data/` — All bundled reference data lives here

**Source material in external Aera repo (read these to understand what to extract):**
1. `/Users/vincent.wicker/Documents/area/reference/platform-capabilities-map.md` — 4-pillar capability taxonomy with 20+ capabilities. Each capability has: name, description, best-for scenarios, not-for scenarios. Pillars: Data Foundation, Intelligence Layer, Decision & Action, Orchestration.
2. `/Users/vincent.wicker/Documents/area/reference/when-to-use-guide.md` — Decision trees mapping ~20 use cases to primary and supporting Aera components, with skill type classification (AI/ML, Rule-Based, Hybrid).
3. `/Users/vincent.wicker/Documents/area/reference/component-selection.yaml` — Maps classified features to specific Aera components: AI/ML (Cortex Auto Forecast, RCA Service, Safety Stock Service, AutoML, Cortex Monitoring), Rule-Based (STREAMS, Remote Functions, Subject Areas, Dimensions, DDM/Crawlers), Hybrid (Process Builder, CWB Lifecycle).
4. `/Users/vincent.wicker/Documents/area/reference/skill-classification.yaml` — Capability keywords (prediction, optimization, pattern_mining, business_rules, calculations, ETL, workflow) with classification engine.
5. `/Users/vincent.wicker/Documents/area/reference/orchestration-decision-guide.md` — When to use Process Builder vs Agentic AI vs Hybrid, with 5 scenario-based examples.

**Why this matters:** The technical prompt asks the LLM to score `aera_platform_fit` (0-3) but only provides widget-level knowledge ("Table: data display component"). The LLM cannot determine if "Warranty Performance Monitoring" maps to Aera without knowing Aera has Cortex Auto Forecast, RCA Service, CWB recommendation workflows, etc.
</context>

<requirements>

## Step 1: Create condensed capability data files in src/data/

Create new bundled JSON files under `src/data/capabilities/` that capture the essential capability-to-use-case mappings. These must be:
- **Condensed** — the full platform-capabilities-map.md is ~5,400 lines; the scoring prompt has a context budget. Target ~200-400 lines of structured JSON.
- **Structured for LLM consumption** — the format should make it easy for an LLM to match an opportunity description to Aera capabilities.
- **Self-contained** — no runtime dependency on the external Aera repo.

Create these files:

### `src/data/capabilities/platform-capabilities.json`
Extract from `platform-capabilities-map.md`. Structure:
```json
{
  "pillars": [
    {
      "name": "Data Foundation",
      "capabilities": [
        {
          "name": "STREAMS (ETL)",
          "description": "SQL-based data transformation and ingestion",
          "best_for": ["data integration", "ETL pipelines", "master data management"],
          "keywords": ["data", "integration", "ETL", "transformation", "ingestion"]
        }
      ]
    }
  ]
}
```

### `src/data/capabilities/use-case-mappings.json`
Extract from `when-to-use-guide.md` and `component-selection.yaml`. Structure:
```json
{
  "mappings": [
    {
      "use_case": "Demand Forecasting",
      "primary_components": ["Cortex Auto Forecast", "Subject Areas"],
      "supporting_components": ["Process Builder", "Dashboard"],
      "skill_type": "AI/ML",
      "keywords": ["forecast", "demand", "prediction", "time-series"]
    }
  ]
}
```

### `src/data/capabilities/capability-keywords.json`
Extract from `skill-classification.yaml`. Structure:
```json
{
  "classifications": {
    "ai_ml": {
      "keywords": ["prediction", "forecast", "optimization", "anomaly", "classification", "clustering", "pattern"],
      "components": ["Cortex Auto Forecast", "RCA Service", "Safety Stock Service", "AutoML", "Cortex Monitoring"]
    },
    "rule_based": {
      "keywords": ["validation", "calculation", "threshold", "workflow", "approval", "routing", "ETL"],
      "components": ["STREAMS", "Remote Functions", "Subject Areas", "Dimensions", "Process Builder"]
    },
    "hybrid": {
      "keywords": ["recommendation", "exception", "decision support", "cognitive"],
      "components": ["CWB Lifecycle", "Process Builder + Agent Teams", "Cortex + Process Builder"]
    }
  }
}
```

## Step 2: Create a capabilities knowledge module

Create `src/knowledge/capabilities.ts` following the same patterns as `components.ts` and `process-builder.ts`:
- Load from `src/data/capabilities/*.json` at module init
- Export typed query functions: `getAllCapabilities()`, `getUseCaseMappings()`, `getCapabilityKeywords()`
- Define TypeScript types for the data structures (in `src/types/knowledge.ts` or a new file)

## Step 3: Enrich the knowledge context builder

Update `src/scoring/knowledge-context.ts` to include capability knowledge in its output:
- Add a `capabilities` field to the `KnowledgeContext` interface
- Build a capabilities context string that includes:
  - Platform capability names with what they're best for
  - Use case → component mappings
  - Capability keyword groups
- The format should be dense but readable — the LLM needs to scan this quickly

## Step 4: Update the Technical Feasibility prompt

Update `src/scoring/prompts/technical.ts` to use the enriched knowledge context:
- Include the capabilities context in the system prompt, specifically in the section consumed by `aera_platform_fit` scoring
- Position the capability knowledge BEFORE the component/PB node lists so the LLM reads high-level capabilities first, then specific components
- Update the `aera_platform_fit` rubric to reference the new capability knowledge:
  - 0 = No matching capabilities or components
  - 1 = Weak fit; opportunity aligns with 1 capability pillar but no specific component match
  - 2 = Moderate fit; maps to specific capabilities with identified components
  - 3 = Strong fit; clear capability match with specific components and implementation pattern

## Step 5: Write tests

Write tests following existing patterns (Node.js `node:test` with `assert/strict`):
- `src/knowledge/capabilities.test.ts` — Verify data loads, query functions return expected shapes
- Update `src/scoring/knowledge-context.test.ts` if it exists — verify enriched context includes capability data
- Verify the knowledge context string is under a reasonable size limit (< 4000 tokens estimated)
</requirements>

<constraints>
- Do NOT modify the external Aera repo — only read from it, write into this repo
- Follow existing patterns: pure functions, no I/O side effects in scoring logic, Result type pattern
- Keep the condensed data faithful to the source — do not invent capabilities that aren't in the Aera docs
- The capability context must fit within the LLM's prompt budget alongside the existing component/PB context. Be aggressive about condensing — prioritize the most discriminating information
- Maintain backward compatibility: existing `KnowledgeContext` consumers should not break
- Use ES module imports, strict TypeScript, camelCase functions, PascalCase types per project conventions
</constraints>

<output>
New files:
- `src/data/capabilities/platform-capabilities.json`
- `src/data/capabilities/use-case-mappings.json`
- `src/data/capabilities/capability-keywords.json`
- `src/knowledge/capabilities.ts`
- `src/knowledge/capabilities.test.ts`

Modified files:
- `src/scoring/knowledge-context.ts` — Add capabilities to context builder
- `src/scoring/prompts/technical.ts` — Inject capability context, update platform_fit rubric
- `src/types/knowledge.ts` — Add capability types (if this file exists; otherwise create types inline)
</output>

<verification>
1. Run `npx tsx --test src/knowledge/capabilities.test.ts` — all tests pass
2. Run `npm test` from `src/` — no regressions
3. Manually inspect the built knowledge context string — it should include capability-level knowledge like "Cortex Auto Forecast: time-series demand forecasting" not just "Table: data display component"
4. The total knowledge context (components + PB nodes + capabilities) should be estimable at under ~4000 tokens
5. The `aera_platform_fit` rubric now references capabilities, not just component names
</verification>

<success_criteria>
After this change, re-running the evaluation pipeline should produce `aera_platform_fit` scores > 0 for the majority of opportunities, because the LLM now has the capability-level knowledge to match opportunities like "Warranty Performance Monitoring" to Aera capabilities like "Cortex Auto Forecast + CWB Lifecycle."
</success_criteria>
