# Phase 6: Simulation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate concrete implementation artifacts for every opportunity with composite >= 0.60: decision flow diagrams (Mermaid), YAML component maps, mock decision tests, and integration surface maps. All component references must be grounded in the bundled Aera knowledge base from Phase 2. Output is consumed by Phase 9 (final reports) and organized into evaluation/simulations/<skill-name>/ directories.

</domain>

<decisions>
## Implementation Decisions

### Decision Flow Diagrams
- Mermaid diagrams with happy path + 2-3 key decision branches (not exhaustive edge cases)
- One diagram per L3 opportunity — no sub-flows
- Aera-specific node labels referencing actual knowledge base components (e.g., 'PB: Approval Gate', 'Cortex: Anomaly Detection')
- Full trigger-to-terminal scope: starts with data trigger event, ends with terminal action

### Component Maps
- YAML format organized by Aera product area: streams, cortex, process_builder, agent_teams, ui
- Drill to specific components + properties from the knowledge base (e.g., specific PB nodes, specific UI widget properties)
- List components only — no estimated counts or sizing
- Flag each mapping as "confirmed" (direct knowledge base match) or "inferred" (reasonable but not exact match)
- Validated against bundled knowledge base — KNOW-04 compliance

### Mock Decision Tests
- 1 happy-path test case per opportunity (not 3 or 5)
- YAML format with three fields: input, expected_output, rationale
- Input values derived from actual export financials (company_context, L4 financial_ratings) — not literal copy-paste, not synthetic
- Use L4 decision_articulation text as the decision being tested when available
- When no decision_articulation exists, generate from opportunity summary

### Integration Surfaces
- YAML document format (not Mermaid, not table)
- Sections: source_systems, aera_ingestion, processing, ui_surface
- Source systems inferred from company_context.enterprise_applications array; mark as "TBD — requires discovery" when no match
- Map to specific Aera Stream types where identifiable (Event Stream, Reference Stream, etc.)
- Structural connections only — no data freshness or timing estimates

### Claude's Discretion
- LLM prompt design for generating Mermaid syntax reliably from 32B model
- Retry/validation strategy for malformed Mermaid or YAML output
- How to handle opportunities where lead_archetype is null
- Ordering of simulation generation (by tier, by archetype, or by score)
- Exact YAML schema structure for component maps and integration surfaces

</decisions>

<specifics>
## Specific Ideas

- Decision flow nodes should feel actionable for SE teams — reference real Aera components they'll actually configure
- Component map confidence flags ("confirmed" vs "inferred") help SE teams know where to validate vs where to trust
- Mock tests grounded in decision_articulation text tie directly back to the client's actual business language
- Integration surfaces should read as "here's what you need to wire up" — practical, not theoretical

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/hierarchy.ts`: Full L3Opportunity and L4Activity types including decision_articulation, financial_rating, lead_archetype, enterprise_applications — all fields needed as simulation input
- `src/schemas/hierarchy.ts`: Zod validation pattern for runtime validation — reusable for validating LLM-generated YAML/Mermaid output
- Phase 2 knowledge base (planned): 21 UI components (209 properties), 22 PB nodes, orchestration guide — the ground truth for KNOW-04 validation

### Established Patterns
- Zod for runtime validation of LLM output (established in Phase 1, continued in Phase 4)
- TypeScript strict mode with no `any` types
- Error handling returns strings, never throws
- One LLM call per artifact type per opportunity (consistent with Phase 4's one-call-per-lens pattern)

### Integration Points
- Simulation receives: scored opportunities with composite >= 0.60 (from Phase 4) + knowledge base (from Phase 2) + full hierarchy export (from Phase 1)
- Simulation outputs: per-opportunity directories with decision-flow.mmd, component-map.yaml, mock-test.yaml, integration-surface.yaml
- Uses 32B Ollama model (Qwen 2.5 32B Q4) — same as scoring
- Output consumed by Phase 9 for bundling into evaluation/simulations/

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-simulation*
*Context gathered: 2026-03-10*
