<objective>
Create a comprehensive, LLM-friendly prompt quality audit document that analyzes the actual evaluation results from the Aera Skill Feasibility Engine to identify systematic prompt failures, score inflation patterns, and knowledge grounding gaps. This document will serve as a living rulebook for improving the scoring prompts that drive the engine.

The goal is twofold:
1. Diagnose what went wrong (or right) in the current evaluation outputs
2. Produce concrete reinforcement rules and guardrails for future prompt iterations
</objective>

<context>
The evaluation engine uses LLM prompts (Qwen 2.5 32B via vLLM) to score opportunities across 3 lenses with 9 sub-dimensions. We have real evaluation data to analyze.

**IMPORTANT CONTEXT ON VALUE LENS**: The Value & Efficiency lens (25% weight) intentionally uses conservative, capped value estimates. The upstream data pipeline applies several realism constraints before values ever reach the scoring prompts:
- Values are capped so they cannot exceed cost of goods (COGS)
- Double-counting across overlapping opportunities is detected and cut
- The `combined_max_value` field represents a deliberately conservative starting point, not an optimistic ceiling

This means: if the Value lens shows compressed or moderate scores, that is EXPECTED BEHAVIOR — not a prompt failure. Do NOT flag conservative value scores as a problem. The caps are a feature of the methodology, not a bug. Focus value-lens analysis on whether the prompt correctly interprets the capped values it receives, not on whether the values themselves are too low. The real diagnostic questions for the value lens are:
- Does `value_density` correctly assess the capped value relative to company revenue?
- Does `simulation_viability` discriminate between opportunities with clear vs. unclear decision flows?
- Are there cases where the value lens scores are suspiciously HIGH given the conservative inputs (which would indicate the prompt is ignoring the caps)?

Read these source files for the scoring prompt logic:
- `src/scoring/prompts/technical.ts` — Technical lens prompt builder
- `src/scoring/prompts/adoption.ts` — Adoption lens prompt builder
- `src/scoring/prompts/value.ts` — Value lens prompt builder
- `src/scoring/knowledge-context.ts` — How Aera knowledge base is injected into prompts
- `src/scoring/archetype-router.ts` — Archetype classification logic
- `src/scoring/lens-scorers.ts` — How lens scores are extracted from LLM responses
- `src/scoring/schemas.ts` — Response validation schemas

Read these evaluation output files for result analysis:
- `src/evaluation-vllm/evaluation/feasibility-scores.tsv` — Full scoring results (322 opportunities with all sub-dimension scores)
- `src/evaluation-vllm/evaluation/triage.tsv` — Triage results for cross-reference (if it exists)

Read these simulation prompt files for simulation-stage analysis:
- `src/simulation/prompts/component-map.ts`
- `src/simulation/prompts/decision-flow.ts`
- `src/simulation/prompts/integration-surface.ts`
- `src/simulation/prompts/mock-test.ts`

Also read for knowledge base context:
- `src/data/` directory — bundled Aera reference data
</context>

<analysis_requirements>

## Part 1: Scoring Distribution Analysis

Analyze `feasibility-scores.tsv` for each of the 9 sub-dimensions:

1. **Distribution profile**: Calculate min, max, median, mode, standard deviation for each sub-dimension
2. **Collapsed dimensions**: Identify any sub-dimension where >90% of scores cluster at a single value (this indicates the prompt is not discriminating)
3. **Ceiling effects**: Identify sub-dimensions where >70% score at max (3)
4. **Floor effects**: Identify sub-dimensions where >70% score at minimum (0)
5. **Cross-dimension correlation**: Do certain sub-dimensions always move together? (Indicates redundancy)

**CRITICAL KNOWN ISSUE**: `platform_fit` = 0 for ALL 322 scored opportunities. This is the most severe prompt failure. The root cause is now identified — the knowledge context injected into the Technical Feasibility prompt is insufficient.

**Root cause investigation — read these files to confirm:**

The current knowledge injection path:
- `src/scoring/knowledge-context.ts` — Builds context by calling `getAllComponents()` and `getAllPBNodes()`
- `src/knowledge/components.ts` — Returns 21 UI components with name + description only
- `src/knowledge/process-builder.ts` — Returns 22 PB nodes with name + category + purpose only

What gets injected into the prompt is essentially:
```
- Table: Data display component for tabular data
- IF (control_flow): Conditional branching node
```

This is **component-level naming only** — the LLM has zero knowledge about what business problems Aera can solve, what capabilities the platform has (forecasting, RCA, optimization, CWB lifecycle, etc.), or how to map a supply chain opportunity to specific Aera components.

**The missing knowledge lives in an external Aera reference repo** at `/Users/vincent.wicker/Documents/area/reference/`. Key files that SHOULD inform platform_fit scoring:

1. `/Users/vincent.wicker/Documents/area/reference/platform-capabilities-map.md` — 4-pillar capability taxonomy (Data Foundation, Intelligence Layer, Decision & Action, Orchestration) with 20+ capabilities, best-for/not-for guidance
2. `/Users/vincent.wicker/Documents/area/reference/when-to-use-guide.md` — Decision trees mapping use cases to Aera components (Use Case → Primary Components → Supporting Components → Skill Type)
3. `/Users/vincent.wicker/Documents/area/reference/component-selection.yaml` — Maps classified features to specific Aera components (AI/ML: Cortex Auto Forecast, RCA Service, Safety Stock; Rule-Based: STREAMS, Remote Functions, Subject Areas; Hybrid: Process Builder, CWB)
4. `/Users/vincent.wicker/Documents/area/reference/skill-classification.yaml` — Capability keywords (prediction, optimization, pattern_mining, business_rules, calculations, ETL, workflow) mapped to component types
5. `/Users/vincent.wicker/Documents/area/reference/orchestration-decision-guide.md` — When to use Process Builder vs Agentic AI vs Hybrid, with 5 scenario-based decision guides

The prompt says "score platform_fit 0-3 based on matching Aera components" but the LLM only knows component NAMES (Table, Dropdown, IF node), not CAPABILITIES (can Aera do demand forecasting? inventory optimization? exception management?). With only UI widget names and PB node names, the LLM cannot determine if "Warranty Performance Monitoring & Analytics" maps to Aera capabilities — so it correctly scores 0 ("No matching Aera components").

**Your analysis should**:
1. Read the current `buildTechnicalPrompt()` in `src/scoring/prompts/technical.ts` and identify exactly what knowledge context it receives
2. Read the Aera reference files listed above to understand what's available but NOT being injected
3. Recommend specific knowledge that should be added to the context — focusing on capability-level and use-case-level knowledge, not just more component names
4. Propose a revised knowledge context builder that draws from the Aera reference repo
5. Consider context window limits — the full platform-capabilities-map.md is ~5,400 lines; propose a condensed format that fits within scoring prompt budgets

## Part 2: Prompt-Level Failure Analysis

For each of the 3 scoring prompts, evaluate:

1. **Rubric clarity**: Are the 0-3 scoring levels unambiguous? Could an LLM reasonably distinguish between adjacent levels?
2. **Grounding quality**: Does the prompt provide enough concrete reference material for the LLM to make informed assessments?
3. **Anchoring bias risk**: Does the prompt structure or example ordering bias the LLM toward certain scores?
4. **Archetype emphasis effectiveness**: Do the archetype-specific emphasis paragraphs actually change scoring behavior, or are they ignored?
5. **Input signal quality**: Is the L4 activity data presented in a format that enables accurate scoring?

## Part 3: Confidence Score Analysis

Examine the `confidence` column:
1. What percentage are HIGH vs MEDIUM vs LOW?
2. Is confidence correlated with composite score? (It shouldn't be — low-scoring opportunities can have high confidence)
3. Are there opportunities with HIGH confidence but very low scores that might indicate false confidence?

## Part 4: Simulation Prompt Analysis

For the 4 simulation prompts, evaluate:
1. Are the YAML/Mermaid output format instructions clear enough to avoid parse failures?
2. Do the prompts ground outputs in actual Aera platform components, or do they hallucinate?
3. Is the knowledge base reference (PB nodes, UI components) actually being used effectively?

## Part 5: Reinforcement Rulebook

Based on all findings, produce:

### Success Patterns (preserve these)
- What the prompts do well
- Which sub-dimensions show healthy discrimination
- Effective grounding techniques that work

### Failure Patterns (fix these)
- Systematic biases identified with root cause
- Collapsed dimensions with recommended prompt changes
- Missing context that would improve accuracy

### Prompt Reinforcement Rules
For each identified issue, provide:
- **Rule ID**: e.g., `TECH-01`
- **Problem**: What's wrong
- **Evidence**: Specific data from the evaluation results
- **Root cause**: Why the prompt produces this failure
- **Fix**: Concrete prompt text changes or structural modifications
- **Expected impact**: What should change after the fix

### Guardrail Checks
Define automated checks that should run after every evaluation:
- Distribution health checks (flag if any sub-dimension has <2 distinct values)
- Score inflation alerts (flag if median composite >0.85)
- Confidence calibration checks
- Knowledge grounding verification

</analysis_requirements>

<constraints>
- Base ALL conclusions on actual data from the TSV files — no speculation without evidence
- Do NOT over-index on value lens compression — the input values are intentionally capped and de-duplicated upstream. Moderate or compressed value scores are expected and correct. Only flag value-lens issues if scores are suspiciously inflated relative to capped inputs, or if the two value sub-dimensions fail to discriminate from each other
- When recommending prompt changes, show the specific text that should change (quote the current text, show the proposed replacement)
- The document must be structured so an LLM in a future conversation can read it and apply the rules without additional context
- Use clear headers with consistent hierarchy for LLM parseability
- Include the raw data summaries inline — don't just reference files
- Every rule in the rulebook must have a falsifiable success criterion (how do you know the fix worked?)
</constraints>

<output>
Save the document to: `./deliverables/prompt-quality-audit-rulebook.md`
</output>

<verification>
Before completing, verify:
- The platform_fit = 0 failure is thoroughly diagnosed with specific prompt text cited
- All 9 sub-dimensions have distribution analysis with data
- At least 5 concrete reinforcement rules are defined with rule IDs
- Each rule has problem, evidence, root cause, fix, and expected impact
- The guardrail checks section defines at least 4 automated checks
- The document is self-contained — an LLM reading it cold can apply the rules
</verification>

<success_criteria>
1. An engineer reading this document can immediately fix the platform_fit = 0 failure
2. A prompt engineer can use the reinforcement rules to iterate on all 3 scoring prompts
3. The guardrail checks can be implemented as automated post-evaluation validators
4. Future evaluation runs show improved score discrimination (fewer collapsed dimensions)
</success_criteria>
