<objective>
Apply all audit findings and rulebook recommendations to harden the three scoring prompts (technical.ts, adoption.ts, value.ts). This is a comprehensive fix pass addressing findings from 3 prompt audits and the prompt quality audit rulebook.
</objective>

<context>
Read the CLAUDE.md for project conventions.

**Audit reports (read ALL of these first — they contain specific findings with fix recommendations):**
- `audit/logs/technical-feasibility-2026-03-12.md` — 19/40, 10 findings
- `audit/logs/adoption-realism-2026-03-12.md` — 19/40, 8 findings
- `audit/logs/value-efficiency-2026-03-12.md` — 16/40, 9 findings
- `deliverables/prompt-quality-audit-rulebook.md` — 7 reinforcement rules (TECH-01 through SIM-01)

**Scoring prompts to modify:**
- `src/scoring/prompts/technical.ts` — Technical Feasibility lens
- `src/scoring/prompts/adoption.ts` — Adoption Realism lens
- `src/scoring/prompts/value.ts` — Value & Efficiency lens

**Supporting files for context:**
- `src/types/scoring.ts` — Weights, max scores, types
- `src/scoring/knowledge-context.ts` — Knowledge injection pipeline
- `src/data/capabilities/platform-capabilities.json` — New capability knowledge (recently added)
- `src/data/capabilities/use-case-mappings.json` — Use case mappings (recently added)
- `src/evaluation-vllm/evaluation/feasibility-scores.tsv` — Real evaluation results (322 rows) for picking worked examples

**Value cap methodology (read for value prompt context):**
The upstream value pipeline in AeraPerioic applies multi-layered caps:

1. **Percentage-based tiers by company revenue:**
   - Small-cap (<$2B): L4 cap = 0.3% of base metric, max $10M; L3 cap = 0.5%, max $20M
   - Mid-cap ($2B-$10B): L4 cap = 0.3%, max $30M; L3 cap = 0.5%, max $50M
   - Large-cap ($10B-$50B): L4 cap = 0.3%, max $100M; L3 cap = 0.5%, max $200M
   - Mega-cap ($50B-$200B): L4 cap = 0.3%, max $500M; L3 cap = 0.5%, max $1B
   - Ultra-cap (>$200B): L4 cap = 0.3%, max $1B; L3 cap = 0.5%, max $2B

2. **L3 combined value formula:** Sum HIGH-suitability L4 max_values × 0.8 (20% synergy discount for overlap), cap at tier ceiling

3. **Conservative bias:** COGS/working capital preferred over revenue as base metric; MEDIUM rating default when uncertain; $100K minimum floor; human review flag if >$25M

4. **Impact rating ranges:** HIGH+FIRST = 0.1-0.3% of base; HIGH+SECOND = 0.03-0.1%; MEDIUM = 0.01-0.03%
</context>

<requirements>

## Fix 1: Add "not-for" boundaries to capability knowledge (TECH-01)

Update `src/data/capabilities/platform-capabilities.json` — for each capability, add a `not_for` array alongside the existing `best_for`. Extract these from `/Users/vincent.wicker/Documents/area/reference/platform-capabilities-map.md` which has "not-for" guidance for each capability.

Then update `src/scoring/knowledge-context.ts` to include not_for in the serialized context string, e.g.:
```
- Cortex Auto Forecast: Time-series demand forecasting
  Best for: demand planning, sales forecasting, revenue prediction
  Not for: one-time strategic decisions, unstructured text analysis
```

## Fix 2: Require component-level evidence for platform_fit ≥ 2 (TECH-02)

In `src/scoring/prompts/technical.ts`, update the aera_platform_fit rubric to add an explicit evidence requirement:
- Score 2 requires naming at least 2 specific Aera capabilities or components that apply
- Score 3 requires naming specific components AND an implementation pattern (e.g., "Cortex Auto Forecast → Process Builder → CWB recommendation")
- Add a negative constraint: "Do NOT score platform_fit ≥ 2 based on generic keyword matches alone. You must cite specific Aera capabilities from the knowledge context."

## Fix 3: Tighten decision_density rubric (ADOPT-01)

The current rubric uses simple percentage thresholds (0 = no decisions, 1 = <25%, 2 = 25-75%, 3 = >75%). For curated enterprise data where most L4s have `decision_exists=true`, this clusters at 3.

Redesign the rubric to assess decision QUALITY, not just presence:
- 0 = No automated decisions identified; no L4 activities have decision_exists=true
- 1 = Decisions exist but lack articulation: decision_exists=true but decision_articulation is missing, vague, or generic for >50% of L4s. Decisions are named but not operationally defined.
- 2 = Decisions are articulated with measurable triggers: majority of L4s have specific decision_articulation text that names a trigger condition, threshold, or business rule. However, decision flows may overlap or have unclear sequencing.
- 3 = Decisions are fully articulated with clear trigger → action → outcome chains: >75% of L4s have specific, non-overlapping decision_articulation with quantifiable thresholds. Decision flows compose into a coherent end-to-end automation sequence.

## Fix 4: Tighten simulation_viability rubric (VALUE-01)

The current rubric clusters at 2-3. Given how skills are built, almost everything has some simulation potential. Redesign to explode the 2-3 range:
- 0 = No concrete decision scenarios to simulate; no clear inputs/outputs for a simulation model
- 1 = Weak simulation potential: fewer than 50% of decision flows are identifiable, AND simplifying the dependency chain would neuter the core decision logic (i.e., the dependencies ARE the value — removing them removes the point)
- 2 = Moderate simulation potential: majority of decision flows identifiable with measurable inputs, but at least one of: (a) cross-system dependencies that require multi-source data orchestration, (b) decision sequences with feedback loops that complicate isolated testing, (c) time-dependent logic where simulation accuracy depends on temporal ordering
- 3 = Strong simulation potential: clear decision flows with self-contained inputs/outputs, minimal cross-system dependencies, decision logic can be tested in isolation without losing fidelity, straightforward to model as a stateless decision function

## Fix 5: Inject COGS-cap methodology into value prompt (VALUE-FINDING-005)

In `src/scoring/prompts/value.ts`, add context about the upstream value caps to the system prompt so the model understands the values are pre-constrained:

Add after the rubric section:
```
IMPORTANT CONTEXT: The combined_max_value figures provided have already been constrained by upstream methodology:
- Values are capped at percentage-of-COGS/working-capital tiers (0.3% for L4, 0.5% for L3)
- A 20% synergy discount has been applied to remove double-counting across child activities
- Conservative metric selection (COGS/working capital preferred over revenue as base)
- $100K minimum floor per activity

These values represent deliberately conservative starting points. When scoring value_density, assess the capped value relative to company revenue — do not penalize for conservative estimates. A combined_max_value of $50M for a mega-cap company ($50B+ revenue) represents a 0.1% impact, which is meaningful but appropriately scoped.
```

## Fix 6: Fix confidence signal — calibrate from data (CONF-01)

The confidence output is 91.6% HIGH, providing no discrimination. In ALL THREE prompts, add calibration guidance for the confidence output:

Add to each system prompt (after the scoring rubric, before the return format instruction):

```
CONFIDENCE CALIBRATION:
Your confidence rating reflects how certain YOU are about your scores, not the quality of the opportunity.
- HIGH: You have clear, specific evidence from the L4 data for every sub-dimension score. No guessing.
- MEDIUM: You have evidence for most scores but had to infer at least one sub-dimension from indirect signals.
- LOW: You had to make significant assumptions — sparse L4 data, vague descriptions, or conflicting signals.

Target distribution: roughly 30% HIGH, 50% MEDIUM, 20% LOW across a diverse opportunity set. If you find yourself rating everything HIGH, you are likely not being critical enough about your evidence quality.
```

## Fix 7: Add worked examples to all 3 prompts

Read `src/evaluation-vllm/evaluation/feasibility-scores.tsv` and select:
- **High-scoring example**: Pick an opportunity scoring in the 0.88-0.93 composite range with clear, strong signals
- **Low-scoring example**: Pick an opportunity scoring in the 0.50-0.60 range with weak signals
- **Mid-range example**: Pick an opportunity scoring in the 0.70-0.80 range with mixed signals

For each prompt, add a `WORKED EXAMPLES` section after the rubric showing how the example opportunities SHOULD be scored on that lens's sub-dimensions, with 1-sentence reasoning per score. Format:

```
WORKED EXAMPLES (for calibration):

Example 1 — Strong fit: "Warehouse & Inventory Management" (Move & Fulfill > Inbound Logistics)
- [sub_dimension_1]: 3 — [reason]
- [sub_dimension_2]: 2 — [reason]

Example 2 — Weak fit: "Emergency Services Integration" (Service > Roadside Assistance)
- [sub_dimension_1]: 1 — [reason]
- [sub_dimension_2]: 0 — [reason]
```

Choose examples where you can write genuine, defensible scores based on what the L4 data would show. The examples must be realistic calibration anchors, not cherry-picked extremes.

## Fix 8: Fix dropped archetypeHint in value prompt (VALUE-FINDING-002)

In `src/scoring/prompts/value.ts`, the `archetypeHint` parameter is accepted but never used in the prompt text. Either:
- Add archetype-specific emphasis (like the other two prompts have), OR
- Remove the parameter if archetype doesn't affect value scoring

Decision: Add minimal archetype context — include the archetype in the user message so the model has it as signal, but don't add archetype-specific emphasis paragraphs since value assessment should be archetype-neutral.

## Fix 9: Add JSON schema template to all 3 prompts

In each prompt's system message, replace the vague "Return JSON with..." instruction with an explicit JSON template:

For technical.ts:
```
Return your assessment as a JSON object with this exact structure:
{
  "data_readiness": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "aera_platform_fit": { "score": <0-3>, "reason": "<1-2 sentences citing specific Aera capabilities>" },
  "archetype_confidence": { "score": <0-3>, "reason": "<1-2 sentences>" }
}
```

For adoption.ts:
```
Return your assessment as a JSON object with this exact structure:
{
  "decision_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "financial_gravity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "impact_proximity": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "confidence_signal": { "score": <0-3>, "reason": "<1-2 sentences>" }
}
```

For value.ts:
```
Return your assessment as a JSON object with this exact structure:
{
  "value_density": { "score": <0-3>, "reason": "<1-2 sentences>" },
  "simulation_viability": { "score": <0-3>, "reason": "<1-2 sentences>" }
}
```

## Fix 10: Add negative constraints to all 3 prompts

Add a `CONSTRAINTS` section to each system prompt:

For technical.ts:
```
CONSTRAINTS:
- Do NOT score platform_fit ≥ 2 based on generic keyword overlap alone. Cite specific Aera capabilities.
- Do NOT assume all supply chain problems fit Aera. Score 0 for platform_fit if the opportunity requires capabilities outside Aera's scope (see "not for" entries in the knowledge context).
- Do NOT give identical scores to all sub-dimensions. If data_readiness is 3, that does not automatically mean platform_fit is also 3.
```

For adoption.ts:
```
CONSTRAINTS:
- Do NOT score decision_density based solely on decision_exists=true counts. Evaluate the quality and specificity of decision_articulation text.
- Do NOT default to 3 on any sub-dimension without specific evidence. If >50% of L4s lack detailed decision_articulation, decision_density cannot be 3.
- Do NOT score financial_gravity and impact_proximity identically unless they genuinely warrant the same score — they measure different things.
```

For value.ts:
```
CONSTRAINTS:
- Do NOT penalize low combined_max_value — values are deliberately capped by upstream methodology.
- Do NOT score simulation_viability ≥ 2 if the core decision logic depends on cross-system dependencies that cannot be isolated.
- Do NOT default to 2 on simulation_viability for every opportunity. Carefully assess whether dependency simplification would neuter the decision logic.
```

## Fix 11: Wire capability knowledge into simulation prompts (SIM-01)

Update `src/simulation/prompts/component-map.ts` to accept and use the enriched capability context (platform capabilities, use-case mappings) alongside the existing PB node and UI component lists. The component map prompt especially needs capability knowledge to produce realistic mappings.

Update the function signature to accept a capabilities context string parameter and include it in the system prompt.

## Fix 12: Add version metadata as comments

Add a version comment block at the top of each prompt builder file (technical.ts, adoption.ts, value.ts):
```typescript
/**
 * ...existing docstring...
 *
 * @version 2.0 — 2026-03-12
 * @changelog
 * - v2.0: Hardened from audit findings. Added worked examples, JSON schema,
 *   negative constraints, confidence calibration, tightened rubrics.
 * - v1.0: Initial implementation with basic rubrics.
 */
```
</requirements>

<constraints>
- Read all 3 audit reports and the rulebook BEFORE making any changes
- Maintain backward compatibility — don't break existing function signatures; add optional parameters if needed
- Follow existing code patterns: pure functions, no I/O side effects, TypeScript strict mode
- Keep prompt text changes within reasonable context budget — the worked examples should be concise (not paragraphs)
- Run `npm test` from `src/` after all changes to verify no regressions
- When picking worked examples from the TSV data, choose REAL opportunities from the evaluation results
</constraints>

<output>
Modified files:
- `src/scoring/prompts/technical.ts`
- `src/scoring/prompts/adoption.ts`
- `src/scoring/prompts/value.ts`
- `src/scoring/knowledge-context.ts`
- `src/data/capabilities/platform-capabilities.json`
- `src/simulation/prompts/component-map.ts`
</output>

<verification>
1. Run `npm test` from `src/` — no regressions on existing tests
2. Each prompt now contains: rubric, worked examples, JSON schema, negative constraints, confidence calibration
3. The technical prompt includes "not-for" boundaries in capability context
4. The value prompt includes COGS-cap methodology context
5. The adoption prompt's decision_density rubric assesses quality, not just presence
6. The value prompt's simulation_viability rubric distinguishes dependency-neutering from testable flows
7. The component-map simulation prompt accepts capability context
</verification>

<success_criteria>
Re-running /audit-prompt on the three files should show:
- Layer 1 (Craft): ≥8/10 (from ~6) — examples, schema, constraints added
- Layer 2 (Context): ≥7/8 (from ~5) — capability knowledge, COGS methodology
- Layer 3 (Intent): ≥7/10 (from ~4) — worked examples, decision boundaries, confidence calibration
- Layer 4 (Spec): ≥6/12 (from 3) — JSON schema, negative constraints, version metadata
- Total: ≥28/40 (from ~18) — "Acceptable" range
</success_criteria>
