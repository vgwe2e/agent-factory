# Phase 4: Scoring Engine - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce calibrated, three-lens scores for every non-disqualified opportunity with adoption realism weighted highest. Classify archetypes and apply a threshold gate for simulation promotion. Output is structured score data consumed by Phase 5 (reports) and Phase 6 (simulation).

</domain>

<decisions>
## Implementation Decisions

### Score Granularity
- Uniform 0-3 scale for all 9 sub-dimensions (no variable ranges)
- Sub-dimension scores sum to lens totals: Technical Feasibility (0-9), Adoption Realism (0-12), Value & Efficiency (0-6)
- Each sub-dimension scored individually by the LLM, not lens-level holistic scores
- Lens weights applied to normalized sub-totals: Technical 0.30, Adoption 0.45, Value 0.25
- Composite range: 0.0 to 1.0

### LLM Scoring Strategy
- JSON schema embedded in prompt; LLM returns structured JSON with score + reason per dimension
- Zod validates LLM output; retry on parse failure
- One LLM call per lens (3 calls per opportunity), each with lens-specific context:
  - Technical Feasibility: opportunity + Aera knowledge base data
  - Adoption Realism: opportunity + constituent L4 activities
  - Value & Efficiency: opportunity + company financials
- Per-dimension reason strings preserved in output for downstream Phase 5 reports

### Scoring Confidence
- Data-driven per-lens confidence tag (HIGH / MEDIUM / LOW) — purely algorithmic, no LLM self-assessment
- Overall confidence = lowest lens confidence
- Confidence is informational only — does NOT affect the 0.60 threshold gate
- LOW confidence flagged in output for human review but does not block simulation promotion

### Claude's Discretion
- Archetype routing implementation (how DETERMINISTIC vs AGENTIC vs GENERATIVE evaluation patterns differ)
- Exact confidence threshold rules per lens (specific percentage cutoffs for HIGH/MEDIUM/LOW)
- Retry strategy details (max retries, backoff, fallback on persistent JSON parse failure)
- Prompt engineering for reliable Qwen 32B JSON output
- Scoring calibration approach (anchor examples, rubric design)

</decisions>

<specifics>
## Specific Ideas

- Sub-dimension breakdown display style mirrors a tree: lens total at top, sub-dimensions indented below with individual scores
- Reason strings should be concise (1-2 sentences) — actionable context, not essays
- Confidence rules should key off concrete data signals: L4 count, percentage with financial ratings, presence of decision articulations, rating_confidence distribution, lead_archetype presence, combined_max_value

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/hierarchy.ts`: Full TypeScript types for L3Opportunity, L4Activity, CompanyContext — includes all fields needed for scoring inputs (financial_rating, decision_exists, ai_suitability, lead_archetype, etc.)
- `src/schemas/hierarchy.test.ts`: Zod validation pattern already established for hierarchy data — scoring output schemas can follow the same pattern

### Established Patterns
- Zod for runtime validation (used in Phase 1 for ingestion) — natural fit for validating LLM JSON output
- TypeScript strict mode with no `any` types — scoring types should follow this
- Error handling returns strings, never throws — scoring failures should follow this pattern

### Integration Points
- Scoring engine receives: validated HierarchyExport (from Phase 1) + knowledge base (from Phase 2) + triage results with tier assignments and red flags (from Phase 3)
- Scoring engine outputs: structured score data consumed by Phase 5 (TSV/markdown reports) and Phase 6 (simulation — only opportunities with composite >= 0.60)
- Uses 32B Ollama model (Qwen 2.5 32B Q4) — connectivity established in Phase 1

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-scoring-engine*
*Context gathered: 2026-03-10*
