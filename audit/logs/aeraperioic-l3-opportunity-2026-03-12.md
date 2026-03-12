# Prompt Audit Report: aeraperioic-l3-opportunity
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 33 / 40

---

## Prompt Classification
**Type**: system_prompt (developer message) + user_prompt_template
**File**: `/Users/vincent.wicker/Documents/AeraPerioic/backend/app/prompts/l3_opportunity.py`
**Function**: `build_l3_opportunity_messages`
**Dynamic Inputs**: `l3_name` (str), `l3_children` (list[dict] with name, financial_rating, ai_suitability, value_metric, skills), `context` (CompanyContext with industry, company_name, annual_revenue, business_exclusions, hard_exclusions), `industry_analysis` (Optional[IndustryAnalysis] with di_opportunity_areas)
**Static Content Injected**: `AERA_CAPABILITIES_REFERENCE` (484-line platform reference from `aera_reference.py`), `APS_POSITIONING_EXAMPLES` (good/bad positioning examples), tier-aware value ranges from `get_prompt_value_ranges()`

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 10 | 10 | -- |
| Layer 2: Context Engineering | 7 | 8 | -- |
| Layer 3: Intent Engineering | 9 | 10 | -- |
| Layer 4: Specification | 7 | 12 | -- |
| **COMPOSITE** | **33** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (10 / 10)

### 2.1 Instruction Clarity: 2 / 2
Instructions are exceptionally precise with step-by-step ordering. Evidence: `"OPPORTUNITY ASSESSMENT (follow this order): Step 1 -- EXISTENCE CHECK: Apply the OPPORTUNITY EXISTENCE GATE below. If opportunity_exists = false, stop."` Each step has a named output. The archetype selection includes explicit tie-break rules: `"Tie-break rule: DETERMINISTIC > AGENTIC > GENERATIVE > CONVERSATIONAL"`. No ambiguity in interpretation.

### 2.2 Examples and Counter-Examples: 2 / 2
Two full positive synthesis examples (inventory replenishment and production scheduling), plus multiple negative/counter-examples. Evidence of positive: `"Good opportunity_name: 'Autonomous Inventory Replenishment Engine'"` with full rationale and positioning. Evidence of negative: `"NEGATIVE EXAMPLE (do NOT produce summaries like this): BAD: 'This opportunity leverages AI to improve supply chain operations.'"` Also negative examples for positioning (`"'Better demand forecasting' -> They already have this"`) and differentiators (`"'SPEED: faster' -> No incumbent named, no quantity"`). Well exceeds 2 positive + 1 negative threshold.

### 2.3 Output Format Specification: 2 / 2
Full JSON schema with all field names, types, and valid values enumerated. Evidence: `"opportunity_exists": true | false`, `"lead_archetype": "DETERMINISTIC" | "GENERATIVE" | "CONVERSATIONAL" | "AGENTIC" | null`, `"implementation_complexity": "LOW" | "MEDIUM" | "HIGH" | null`, `"combined_max_value": <number in dollars> | null`. All 12 fields specified with types and null handling. `prompt_version` is templated in.

### 2.4 Guardrails: 2 / 2
Multiple if-X-do-Y patterns with explicit fallbacks. Evidence: `"BRANCHING RULE: If opportunity_exists = true: all fields must be populated ... If opportunity_exists = false: set opportunity_name, opportunity_summary, lead_archetype, combined_max_value ... all to null or []"`. Escalation triggers defined: `"Flag in the rationale field when: combined_max_value was capped at {l3_cap_str}"`. Missing input fallback: `"If no max_value figures are available, note '[REVIEW: financial base unavailable]' in rationale"`.

### 2.5 Negative Constraints: 2 / 2
Numerous specific must-not constraints. Evidence: `"Do NOT set opportunity_exists = true simply because the L3 function sounds strategic."` `"FALSE POSITIVE TO AVOID: A 'Data Management & Reporting' L3 with all LOW/NOT_APPLICABLE children should have opportunity_exists = false"`. BAD differentiator examples: `"'SPEED: faster' -> No incumbent named, no quantity"`. BAD positioning: `"'Better demand forecasting' -> They already have this"`. Business exclusions enforcement: `"Do NOT generate any L3 opportunity whose opportunity_name, opportunity_summary, or rationale touches those excluded areas."` Well exceeds 2 specific constraints.

---

## Layer 2 -- Context Engineering (7 / 8)

### 3.1 Context Window Composition: 2 / 2
Full traceability of what the model sees at runtime. The developer message contains: (1) `AERA_CAPABILITIES_REFERENCE` -- 484 lines of platform knowledge, (2) the full instruction set within `<l3_opportunity_criteria>` tags, (3) `<output_format>` block. The user message contains: `<industry_context>` (industry, company, revenue, exclusions, DI areas) and `<l3_function>` (L3 name, L4 children with ratings, aggregate stats). Dynamic values are all traceable through the Python code: `l3_cap_str`, `tier_name`, `base_label`, `base_amount` from `get_prompt_value_ranges()`.

### 3.2 Context-to-Prompt Ratio: 2 / 2
Domain knowledge lives in injected context (`AERA_CAPABILITIES_REFERENCE`, `APS_POSITIONING_EXAMPLES`, dynamic `industry_context`, L4 children data). The prompt itself is an instruction layer referencing this context. Evidence: the reference is imported from `aera_reference.py` and injected at the top; value ranges come from `get_prompt_value_ranges(context)` rather than being hardcoded.

### 3.3 Context Quality: 1 / 2
Context is relevant and high-signal. However, the L4 children are truncated to 3 skills max: `"for s in child['skills'][:3]"`. For L4 nodes with more than 3 skills, the model cannot see the full picture. This is a signal quality issue -- the model may miss relevant skills when calculating combined value or assessing archetype coherence. Additionally, `AERA_CAPABILITIES_REFERENCE` at 484 lines is substantial but well-structured with XML tags.

### 3.4 Context Gaps: 2 / 2
The model receives: L4 children with ratings and skills, company financials, industry analysis, business exclusions, tier-aware value caps, full Aera platform reference, and competitive positioning examples. This covers what a domain expert would need to synthesize an L3 opportunity. The `rating_confidence` field referenced in quick_win criteria (condition 5: `"highest-value L4 child has rating_confidence = HIGH"`) should be present in the L4 children data passed in. No other material gaps identified -- the archetype, value metrics, and suitability data are all passed through.

---

## Layer 3 -- Intent Engineering (9 / 10)

### 4.1 Objective Hierarchy: 2 / 2
Explicit priority order stated. Evidence: `"PRIORITY ORDER (when trade-offs arise): 1. Financial credibility first -- combined_max_value must have traceable arithmetic 2. Opportunity existence accuracy -- a false positive is worse than a missed opportunity 3. Positioning quality -- Aera-specific, time/volume quantified, APS-named differentiators"`.

### 4.2 The Klarna Test: 2 / 2
If the model ruthlessly optimized for the stated primary objective (financial credibility with traceable arithmetic), it would produce conservative, evidence-backed value figures. The synergy discount (0.8x) and L3 cap prevent runaway values. The existence gate prevents false positives. The explicit statement `"a false positive is worse than a missed opportunity"` aligns with the "Conservative realism" product value. No perverse incentive identified.

### 4.3 Decision Boundaries: 2 / 2
Clear autonomous vs. escalation boundaries. Evidence: The model decides autonomously on opportunity existence, archetype selection, value calculation, and positioning. Escalation triggers are explicit: `"Flag in the rationale field when: combined_max_value was capped"`, `"Company financials are absent"`, `"Mixed signal L3"`. The `[REVIEW: ...]` tags create structured human review triggers.

### 4.4 Values Alignment: 2 / 2
Checked against config values:
- **Scoring accuracy**: The 5-step assessment order, archetype tie-break rules, and quick_win binary criteria all enforce discriminating scores.
- **Evidence-grounded**: `"combined_max_value must have traceable arithmetic"` and `"Show this arithmetic in the rationale field"`.
- **Conservative realism**: `"When uncertain whether opportunity_exists is true or false: prefer false"`, synergy discount, L3 cap, `"a false positive is worse than a missed opportunity"`.
All three values are actively encoded.

### 4.5 Senior Employee Test: 1 / 2
Strong domain expertise encoded: archetype coherence check with cross-L4 coordination override, APS vendor selection heuristic by industry (`"Kinaxis for multi-echelon CPG/manufacturing, SAP IBP for SAP-heavy industries"`), synergy discount for overlapping L4 values, competitive positioning against named incumbents. However, one expert heuristic is missing: there is no guidance on how to handle L3 functions that span multiple value metrics (e.g., some children are COGS, others are WORKING_CAPITAL). A supply chain expert would know that cross-metric L3s require different aggregation logic -- summing a COGS reduction with a working capital reduction is not straightforward and may overstate combined value. The prompt treats all max_value figures as additive.

---

## Layer 4 -- Specification Completeness (7 / 12)

### 5.1 Self-Contained Problem Statement: 2 / 2
The module docstring and business rationale section fully explain the problem. Evidence: `"Business rationale: L3-level synthesis exists because individual L4 process ratings do not communicate strategic value to a business audience. An L3 opportunity tells a VP whether an entire function ... has a coherent AI automation case worth pursuing -- with a single dollar figure, a named implementation approach, and a competitive positioning statement."` Pipeline position and consumer are also stated: `"Pipeline position: Phase 06 (final). Consumes Phase 04 + Phase 05 outputs. Consumer: Frontend heatmap L3 tiles, sales conversation enablement."`

### 5.2 Acceptance Criteria: 2 / 2
Five explicit, verifiable acceptance criteria in the module docstring. Evidence: `"1. opportunity_exists = false for any L3 where all children have ai_suitability = NOT_APPLICABLE"`, `"2. combined_max_value is traceable to child max_value figures (arithmetic shown in rationale)"`, `"3. competitive_positioning contains a specific time or volume metric"`, `"4. No opportunity is generated for a domain listed in business_exclusions"`, `"5. aera_differentiators list contains at least one entry with a named APS system comparison"`. All are testable.

### 5.3 Constraint Architecture: 2 / 2
All four constraint types present:
- **Musts**: `"opportunity_summary field MUST include ALL of the following"`, `"Every differentiator must name a specific incumbent system"`, `"Each MUST follow this format"`
- **Must-nots**: `"Do NOT set opportunity_exists = true simply because the L3 function sounds strategic"`, `"Do NOT generate any L3 opportunity whose ... rationale touches those excluded areas"`
- **Preferences**: Explicit `"PREFERENCES (defaults when ambiguous)"` section with 4 preference rules
- **Escalation triggers**: `"<escalation_rules>"` section with 4 specific flag conditions

### 5.4 Decomposition: 2 / 2
Complex multi-step task is decomposed into 5 explicit steps with clear boundaries. Evidence: `"Step 1 -- EXISTENCE CHECK ... -> Output: opportunity_exists field set."` through `"Step 5 -- COMPETITIVE POSITIONING ... -> Output: competitive_positioning field set."` Each step has named input, processing rule, and output field.

### 5.5 Evaluation Design: 0 / 2
No test cases exist at `audit/tests/aeraperioic-l3-opportunity/`. Despite having 5 verifiable acceptance criteria in the docstring, there are no known-good input/output pairs to validate the prompt against.

### 5.6 Version and Ownership: 1 / 2
Version and owner are present in the Python file: `PROMPT_VERSION = "l3-opportunity-2026-03-12-v1.2"` and `PROMPT_OWNER = "platform-team"` and `PROMPT_LAST_MODIFIED = "2026-02-28"`. However, this metadata exists only in the Python wrapper -- it is not present in the prompt text sent to the model (only `prompt_version` is templated into the output schema). The version identifier, owner, and last-modified date are not all present in the prompt file's text that the model sees. Scoring 1 because the metadata exists in the file but owner/last-modified are not in the prompt content itself. Note: `PROMPT_VERSION` is referenced in the output format as `{PROMPT_VERSION}` so the model does see the version string, but not owner or date.

---

## Findings

### [FINDING-001] [Section 5.5] [Severity: HIGH] [MECHANICAL]
**Evidence**: No directory exists at `audit/tests/aeraperioic-l3-opportunity/`
**Gap**: Spec 5.5 requires test cases with known-good outputs. The prompt has 5 verifiable acceptance criteria but no automated test cases to validate them.
**Fix**: Create `audit/tests/aeraperioic-l3-opportunity/` with at least 3 test cases:
1. All-NOT_APPLICABLE L4 children -> `opportunity_exists: false` (AC #1)
2. Mixed HIGH/MEDIUM L4s with known max_values -> verify arithmetic in rationale matches combined_max_value (AC #2)
3. L3 in excluded domain -> `opportunity_exists: false` (AC #4)

### [FINDING-002] [Section 3.3] [Severity: MEDIUM] [DOMAIN]
**Evidence**: `"for s in child['skills'][:3]"` (line 277)
**Gap**: L4 children with more than 3 skills have their skill list truncated. The model cannot see all skills when performing value calculation or archetype assessment. This could cause incorrect combined_max_value (missing high-value skills) or wrong archetype selection (missing an AGENTIC skill that triggers the coherence override).
**Fix**: Either remove the `[:3]` truncation or increase the limit. If context window size is a concern, add a note in the user message indicating truncation occurred (e.g., `"[+N more skills not shown]"`). DOMAIN: requires assessment of whether the truncation was intentional for context window management.

### [FINDING-003] [Section 4.5] [Severity: MEDIUM] [DOMAIN]
**Evidence**: `"Sum the max_value figures of all HIGH-suitability L4 skills under this L3"` -- no guidance on cross-metric aggregation.
**Gap**: The value calculation sums all max_value figures regardless of value_metric type (COGS, REVENUE, WORKING_CAPITAL, EBITDA). A supply chain expert would know that summing $5M COGS reduction with $10M working capital improvement overstates impact because these metrics are not directly additive on a P&L. The combined figure could mislead a VP audience.
**Fix**: Add guidance in the COMBINED VALUE CALCULATION section: "When L4 children have mixed value_metrics, group by metric and sum within groups. Report the combined figure as the largest single-metric group, and note the secondary metric separately in rationale. Example: 'COGS: $8M + $6M = $14M x 0.8 = $11.2M combined; additionally $5M WORKING_CAPITAL improvement.'" DOMAIN: changes financial aggregation logic.

### [FINDING-004] [Section 5.6] [Severity: LOW] [MECHANICAL]
**Evidence**: `PROMPT_OWNER = "platform-team"` and `PROMPT_LAST_MODIFIED = "2026-02-28"` exist as Python constants but are not injected into the prompt content sent to the model.
**Gap**: Spec 5.6 requires version identifier, owner, and last-modified date in the prompt file. Owner and date exist in the Python file but not in the prompt text. Only version is templated via `{PROMPT_VERSION}`.
**Fix**: This is acceptable for operational purposes since the metadata is in the source file. To reach 2/2, add a comment block or metadata section visible in the prompt, or accept the current 1/2 score as sufficient since the Python file is the canonical source.

### [FINDING-005] [Section 3.3] [Severity: LOW] [MECHANICAL]
**Evidence**: Quick win condition 5: `"The highest-value L4 child has rating_confidence = HIGH"`. The L4 child formatting in the user message (lines 284-286) does not include `rating_confidence`.
**Gap**: The model is asked to check `rating_confidence = HIGH` for quick_win assessment, but `rating_confidence` is not rendered in the L4 summary injected into the user message. The model would need to infer or guess this value.
**Fix**: Add `rating_confidence` to the L4 child rendering. In the entry format (line 284-286), add: `Confidence: {child.get('rating_confidence', 'N/A')}`. This ensures the model has the data needed to apply quick_win condition 5.

---

## Failure Pattern Check

**FP-001 (Klarna)**: NOT triggered. The prompt has explicit value caps (`l3_cap_str`), synergy discount (0.8x), and conservative defaults. Financial credibility is the #1 priority.

**FP-002 (Silent Gate)**: NOT triggered. The existence gate has explicit branching: `"If opportunity_exists = false: set ... all to null or []"`. Downstream fields are explicitly nulled.

**FP-003 (Unnamed Output)**: NOT triggered. Full JSON schema with all 12 field names, types, and valid values.

**FP-004 (Vague Estimate)**: NOT triggered. Value calculation has explicit methodology: `"Sum the max_value figures ... Apply a 20% synergy discount ... Cap at {l3_cap_str} ... Show this arithmetic in the rationale field"`.

**FP-P001 (Collapsed platform_fit)**: Not directly applicable to this prompt (L3 synthesis, not L4 rating).

**FP-P002 (Ceiling clustering)**: Partially relevant. The combined_max_value has a cap, but there is no floor or distribution guidance for `implementation_complexity`. Could cluster at MEDIUM. Low risk given the explicit LOW/HIGH criteria.

---

## Critical Gap
**[FINDING-005]** -- `rating_confidence` is referenced in quick_win criteria but not injected into the user message context. This creates a silent data gap where the model cannot accurately evaluate quick_win condition 5, potentially producing incorrect quick_win assessments. Fix: add `rating_confidence` to the L4 child rendering template.

---

## Human Input Required
- [ ] [FINDING-002]: Was the `[:3]` skill truncation intentional for context window management? If so, should a truncation indicator be added? If not, should the limit be removed?
- [ ] [FINDING-003]: Should cross-metric value aggregation be handled differently (e.g., report by metric group rather than summing all)? This changes the financial logic visible to sales audiences.

---

## New Failure Patterns
**FP-P003 (Phantom Input Reference)**: A prompt references a data field in its decision logic that is not actually injected into the context window. Signal: prompt mentions a field name in a condition but the context assembly code does not render that field. This prompt's `rating_confidence` reference in quick_win criteria without rendering it in the L4 summary is an instance. Suggested addition to `audit/config.yaml`:
```yaml
- id: "FP-P003"
  name: "Phantom input reference"
  description: "Prompt references a data field in decision logic that is not rendered in the context window"
  signal: "Field name appears in conditional logic but not in context assembly code"
  fix: "Add the referenced field to the context rendering template"
```
