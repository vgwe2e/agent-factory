# Prompt Audit Report: adoption-realism
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 19 / 40

---

## Prompt Classification
**Type**: system_prompt + user_prompt_template (function-generated chat message pair)
**File**: `src/scoring/prompts/adoption.ts`
**Function**: `buildAdoptionPrompt`
**Dynamic Inputs**: `opp: L3Opportunity`, `l4s: L4Activity[]`, `archetypeHint: LeadArchetype | null`
**Static Content Injected**: `ARCHETYPE_EMPHASIS` record (3 archetype-specific paragraphs), `DEFAULT_EMPHASIS` fallback string

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 6 | 10 | -- |
| Layer 2: Context Engineering | 5 | 8 | -- |
| Layer 3: Intent Engineering | 5 | 10 | -- |
| Layer 4: Specification | 3 | 12 | -- |
| **COMPOSITE** | **19** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (6 / 10)

### 2.1 Instruction Clarity: 2 / 2
The rubric for each sub-dimension is unambiguous with quantitative thresholds:
> "- 2 = Moderate decision density; 25-75% of L4s have decision_exists=true"
> "- 3 = High decision density; >75% of L4s have decision_exists=true with clear articulation"

Each score level (0-3) for all four sub-dimensions has a distinct definition. No instruction admits multiple interpretations.

### 2.2 Examples and Counter-Examples: 0 / 2
No worked examples of any kind are present. The prompt does not include a sample L3/L4 input with expected output, nor a counter-example showing what a misleading input looks like. The rubric levels provide definitions but these are criteria, not examples. For a scoring prompt targeting Qwen 2.5 32B, few-shot examples would significantly improve calibration.

### 2.3 Output Format Specification: 2 / 2
The prompt states:
> "Return JSON with score (integer 0-3) and reason (1-2 concise sentences) for each dimension: decision_density, financial_gravity, impact_proximity, confidence_signal."

All four field names are enumerated. The downstream Zod schema (`AdoptionLensSchema` in `schemas.ts`) enforces `{ score: z.number().int().min(0).max(3), reason: z.string() }` per field. The JSON schema is passed as the `format` parameter to Ollama, providing structural enforcement. Score: 2 (schema fully specifies field names, types, and constraints).

### 2.4 Guardrails: 1 / 2
The archetype emphasis block provides conditional logic:
> "This is a DETERMINISTIC archetype opportunity. Weight 'decision_density' highest."
> "This is an AGENTIC archetype opportunity. Weight 'confidence_signal' highest."

A null archetype fallback exists:
> "The archetype is unknown. Evaluate all four dimensions equally without bias toward any particular pattern."

However, there is no guardrail for unexpected L4 data (e.g., empty L4 array, all N/A fields, contradictory signals). The prompt does not specify what to do when L4 data is sparse or when signals conflict across dimensions.

### 2.5 Negative Constraints: 1 / 2
The DEFAULT_EMPHASIS contains one negative-framed constraint:
> "Evaluate all four dimensions equally without bias toward any particular pattern."

The archetype-specific emphases implicitly constrain by directing weight, but there are no explicit "do not" instructions such as: "Do not score decision_density=3 when fewer than 4 L4s exist" or "Do not infer financial ratings not present in the input data." Only generic negative framing, not specific anti-patterns.

---

## Layer 2 -- Context Engineering (5 / 8)

### 3.1 Context Window Composition: 2 / 2
The full context is traceable through code:
- System message: rubric text + archetype emphasis (static per archetype)
- User message: `opp.l3_name`, `opp.opportunity_summary`, `opp.lead_archetype`, `l4s.length`, and a structured summary of each L4 with `name`, `decision_exists`, `financial_rating`, `impact_order`, `rating_confidence`, `decision_articulation` (truncated to 150 chars)
- Format parameter: `adoptionJsonSchema` (Zod-to-JSON-Schema conversion)

No blind spots: everything the model sees is deterministic and reconstructible.

### 3.2 Context-to-Prompt Ratio: 1 / 2
The rubric thresholds (e.g., ">75% of L4s have decision_exists=true") are hardcoded in the system message. These threshold values encode domain knowledge that should arguably be configurable context rather than baked into the prompt string. The L4 data itself is properly injected as dynamic context. However, the archetype emphasis paragraphs are also hardcoded rather than loaded from a configuration source.

### 3.3 Context Quality: 1 / 2
L4 data is relevant and high-signal for the scoring task. However, `decision_articulation` is truncated to 150 characters:
> `l4.decision_articulation.length > 150 ? l4.decision_articulation.slice(0, 150) + "..." : l4.decision_articulation`

This truncation may discard critical detail for the decision_density sub-dimension. Additionally, the prompt does not include L2 or L1 context, which could help the model understand organizational scope. The `opportunity_summary` field is the only L3-level context beyond the name.

### 3.4 Context Gaps: 1 / 2
One material gap: the prompt provides no historical baseline or distribution anchor. A domain expert scoring adoption realism would know what "typical" looks like across a portfolio. Without this, the model has no calibration reference, which the evaluation data confirms -- decision_density scores 3 for 93.2% of opportunities (see Findings). The model lacks context to discriminate because it evaluates each opportunity in isolation with no portfolio-level perspective.

---

## Layer 3 -- Intent Engineering (5 / 10)

### 4.1 Objective Hierarchy: 1 / 2
The primary objective is stated:
> "Your task is to evaluate how likely an opportunity is to be adopted by real users in production."

However, secondary objectives are not ranked. The archetype emphasis says to "weight X highest" but does not specify relative importance of the remaining three dimensions. Are they equal? Is the second-highest contextual? This is left implicit.

### 4.2 The Klarna Test: 0 / 2
If the model ruthlessly optimizes for "evaluating adoption likelihood," it will score everything highly because the input data (Ford hierarchy export) represents already-curated opportunities with mostly positive signals. The evaluation data confirms this: decision_density=3 in 93.2% of cases, financial_gravity=3 in 34.5% and 2 in 63.4%. There is no quality floor or discrimination target. The prompt does not say "expect a distribution" or "not all opportunities should score highly." Ruthless optimization for the stated objective produces ceiling-clustered scores that fail to discriminate, which is the exact FP-P002 failure pattern already documented in config.

### 4.3 Decision Boundaries: 0 / 2
No escalation or human-review triggers are defined. The prompt does not specify what should happen when:
- L4 data is contradictory (e.g., decision_exists=true but no decision_articulation)
- Confidence is genuinely uncertain
- The opportunity falls between score levels

The model decides everything autonomously with no escalation path.

### 4.4 Values Alignment: 2 / 2
The prompt aligns with stated product values:
- **Scoring accuracy**: The 0-3 rubric with specific thresholds per level supports discrimination (config value: "scores must discriminate between opportunities with meaningful variance").
- **Evidence-grounded**: The rubric explicitly references input fields: "L4s have decision_exists=true", "HIGH financial ratings", "FIRST impact_order" (config value: "every score must be justified by data signals present in the input").
- **Conservative realism**: The prompt name itself is "adoption realism," and the rubric levels are graduated. However, note the Klarna Test failure -- the rubric *design* is aligned but the *execution* produces ceiling clustering, which is an implementation gap not a values conflict.

### 4.5 Senior Employee Test: 2 / 2
The prompt encodes non-obvious expert knowledge:
- Archetype-specific weighting logic: "Agentic skills require trust from users -- high rating confidence signals organizational readiness" reflects deep domain understanding of Aera adoption patterns.
- The distinction between FIRST-order and SECOND-order impact is a supply chain domain heuristic.
- Decision density as a proxy for automation readiness is a practitioner insight.

These are not generic instructions; they encode Aera platform adoption expertise.

---

## Layer 4 -- Specification Completeness (3 / 12)

### 5.1 Self-Contained Problem Statement: 1 / 2
The system message opens with:
> "You are an Aera platform adoption realism assessor. Your task is to evaluate how likely an opportunity is to be adopted by real users in production."

A reader familiar with Aera can understand the purpose. However, an outsider would not understand what "Aera platform" is, what L3/L4 hierarchy means, or why adoption realism matters. The problem context assumes domain familiarity.

### 5.2 Acceptance Criteria: 0 / 2
There are no verifiable acceptance criteria. No statement like "a correct score for an opportunity with >75% decision_exists=true L4s should yield decision_density=3." The rubric defines score levels but not what "correct scoring" looks like end-to-end. No test oracle exists.

### 5.3 Constraint Architecture: 1 / 2
- **Musts**: Present -- "Score each dimension as an integer from 0 to 3", "Return JSON with score and reason"
- **Must-nots**: Absent -- no prohibited behaviors
- **Preferences**: Present -- archetype emphasis provides default weighting preferences
- **Escalation triggers**: Absent -- no conditions triggering human review or uncertainty flagging

Two of four types present (Musts, Preferences). Must-nots and Escalation triggers missing.

### 5.4 Decomposition: 1 / 2
The task is multi-step: assess 4 sub-dimensions, each requiring analysis of L4 data against different criteria. The sub-dimensions are clearly separated in the rubric, but there is no explicit instruction about evaluation order or how to handle cross-dimension dependencies (e.g., financial_gravity and impact_proximity share overlapping L4 signals). Decomposition is informal.

### 5.5 Evaluation Design: 0 / 2
No test cases exist in `audit/tests/adoption-realism/`. While evaluation results exist in `src/evaluation-vllm/evaluation/feasibility-scores.tsv`, these are bulk run outputs, not curated test cases with known-good expected scores.

### 5.6 Version and Ownership: 0 / 2
The prompt file contains no version identifier, no owner/team attribution, and no last-modified date. The file header comment describes the function but has no metadata:
> "Adoption Realism lens prompt builder. Pure function: takes typed inputs, returns system + user message pair."

---

## Findings

### [FINDING-001] [Section 4.2] [Severity: HIGH] [DOMAIN]
**Evidence**: Evaluation data shows decision_density=3 for 300/322 opportunities (93.2%). financial_gravity clusters at 2 (63.4%) and 3 (34.5%) with only 2.2% scoring 1. This matches project failure pattern FP-P002 ("Ceiling clustering on adoption sub-dimensions").
**Gap**: The rubric for decision_density score=3 sets a low bar: ">75% of L4s have decision_exists=true with clear articulation." In a curated enterprise hierarchy, most opportunities naturally exceed this threshold. No portfolio-level calibration or distribution target exists.
**Fix**: [DOMAIN] Tighten the decision_density=3 threshold. Options: (a) raise threshold to >90% with articulation quality requirement; (b) add a discriminating criterion such as "decision_articulation provides specific trigger conditions and thresholds, not just descriptions"; (c) add a calibration instruction: "In a typical enterprise portfolio, expect no more than 20-30% of opportunities to score 3 on any dimension."

### [FINDING-002] [Section 2.2] [Severity: HIGH] [MECHANICAL]
**Evidence**: No examples exist anywhere in the prompt. The system message contains only the rubric definitions.
**Gap**: Section 2.2 requires >=2 positive examples AND >=1 counter-example for full score. For a scoring prompt running on Qwen 2.5 32B, few-shot examples are critical for calibration -- they establish the scoring anchor the model uses.
**Fix**: Add at least 2 worked examples: (1) a high-scoring opportunity with clear decision density and financial gravity, showing expected JSON output; (2) a low-scoring opportunity with sparse L4 data, showing expected lower scores; (3) a counter-example showing an opportunity that appears high-quality but should score low on one dimension due to a subtle issue (e.g., all HIGH financial_rating but only SECOND-order impact).

### [FINDING-003] [Section 4.3] [Severity: HIGH] [MECHANICAL]
**Evidence**: The prompt contains no escalation triggers or decision boundaries. The model scores everything autonomously.
**Gap**: No instruction for what to do when L4 data is contradictory, sparse (e.g., 1-2 L4s), or when the model is uncertain. Section 4.3 requires explicit definition of model autonomy vs. escalation.
**Fix**: Add to the system message: "If fewer than 3 L4 activities are present, flag confidence as LOW in all reason fields. If L4 signals are contradictory (e.g., decision_exists=true but decision_articulation is N/A for >50% of L4s), note this conflict in the reason and score conservatively (prefer the lower adjacent score level)."

### [FINDING-004] [Section 5.5] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: No test cases exist in `audit/tests/adoption-realism/`.
**Gap**: Section 5.5 requires test cases with known-good outputs for score of 2. Without test cases, prompt changes cannot be regression-tested.
**Fix**: Create `audit/tests/adoption-realism/` with at least 3 test fixtures: (1) a high-adoption opportunity (expected: decision_density=3, financial_gravity=3); (2) a low-adoption opportunity (expected: scores mostly 0-1); (3) an edge case with mixed signals. Use real L3/L4 data from the Ford hierarchy export where manual expert scoring is available.

### [FINDING-005] [Section 5.6] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: File header: `"Adoption Realism lens prompt builder. Pure function: takes typed inputs, returns system + user message pair. No I/O inside -- prompt construction only."`
**Gap**: No version identifier, owner, or last-modified date in the prompt file.
**Fix**: Add metadata block to the file header comment:
```
* @version 1.0
* @owner Aera Feasibility Engine team
* @lastModified 2026-03-12
```

### [FINDING-006] [Section 2.5] [Severity: MEDIUM] [DOMAIN]
**Evidence**: The only negative constraint is the generic: "Evaluate all four dimensions equally without bias toward any particular pattern." No specific anti-patterns are named.
**Gap**: The prompt should explicitly prohibit common LLM scoring failure modes.
**Fix**: Add to system message: "Do NOT: (1) Default to score 3 when the data merely meets the minimum threshold -- require clear, unambiguous evidence above the threshold. (2) Infer financial_rating or impact_order values not explicitly present in the L4 data. (3) Give identical scores across all four dimensions unless the evidence genuinely supports it."

### [FINDING-007] [Section 3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: Each opportunity is scored in isolation. The evaluation shows 93.2% ceiling clustering on decision_density.
**Gap**: No portfolio-level calibration context. A domain expert would know the expected distribution shape.
**Fix**: Add a calibration paragraph to the system message: "You are scoring opportunities within a large enterprise portfolio. Scores should discriminate meaningfully: a score of 3 should represent genuinely exceptional adoption readiness, not merely meeting minimum criteria. Expect roughly 10-20% of well-curated opportunities to warrant a 3 on any given dimension."

### [FINDING-008] [Section 5.3] [Severity: LOW] [MECHANICAL]
**Evidence**: Constraint Architecture analysis shows Musts and Preferences present, Must-nots and Escalation triggers absent.
**Gap**: Two of four constraint types missing for full specification completeness.
**Fix**: Addressed by FINDING-003 (escalation triggers) and FINDING-006 (must-nots). Implementing both would bring this to 4/4 constraint types.

---

## Critical Gap
**[FINDING-001]** -- Decision_density ceiling clustering at 93.2% score=3. This is the highest-impact gap because adoption carries 45% weight in the composite score (highest of all three lenses). When the dominant sub-dimension cannot discriminate, the entire composite score loses resolution. Fix requires tightening the decision_density=3 rubric threshold and/or adding calibration instructions to the system message. This is a DOMAIN fix requiring human review of what the correct distribution target should be.

---

## Human Input Required
- [ ] [FINDING-001]: What should the target distribution for decision_density scores be? Current rubric produces 93% at ceiling. Should the score=3 threshold be raised (e.g., >90% with quality gate on articulation), or should a calibration instruction be added?
- [ ] [FINDING-006]: What specific anti-patterns have been observed in LLM scoring that should be encoded as negative constraints?
- [ ] [FINDING-007]: What is the expected distribution shape for a healthy adoption score across the Ford portfolio? Is 10-20% at score=3 a reasonable target?

---

## New Failure Patterns
**FP-P003 (Isolation Scoring Bias)**: When a scoring prompt evaluates items in isolation without portfolio-level calibration context, the LLM defaults to generous scoring because each item looks "good enough" against the rubric in isolation. Signal: >80% of scores at the same level for a sub-dimension across a portfolio evaluation. Fix: Add calibration instructions with expected distribution anchors and/or comparative context.
