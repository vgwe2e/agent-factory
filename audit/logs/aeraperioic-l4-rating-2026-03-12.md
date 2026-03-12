# Prompt Audit Report: aeraperioic-l4-rating
**Project**: Aera Skill Feasibility Engine
**Date**: 2026-03-12
**Auditor**: Claude (automated)
**Composite Score**: 33 / 40

---

## Prompt Classification
**Type**: system_prompt (developer message) + user_prompt_template
**File**: `/Users/vincent.wicker/Documents/AeraPerioic/backend/app/prompts/l4_rating.py`
**Function**: `build_l4_rating_messages`
**Dynamic Inputs**: `l4_batch` (list of L4 node dicts with id, name, description, l1, l2, l3), `context` (CompanyContext with industry, company_name, annual_revenue, cogs, working_capital, business_exclusions, hard_exclusions), `industry_analysis` (optional IndustryAnalysis with industry_summary, financial_context)
**Static Content Injected**: `L4_RATING_REFERENCE` (Aera platform context and value driver definitions), `PROMPT_VERSION`

---

## Layer Scores
| Layer | Score | Max | Delta |
|-------|-------|-----|-------|
| Layer 1: Prompt Craft | 9 | 10 | -- |
| Layer 2: Context Engineering | 7 | 8 | -- |
| Layer 3: Intent Engineering | 9 | 10 | -- |
| Layer 4: Specification | 8 | 12 | -- |
| **COMPOSITE** | **33** | **40** | **--** |

---

## Layer 1 -- Prompt Craft (9 / 10)

### 2.1 Instruction Clarity: 2 / 2
Instructions are precise and single-interpretation. The priority order is explicit: `"PRIORITY ORDER for accuracy: 1. value_metric accuracy is MOST CRITICAL... 2. financial_rating tier accuracy... 3. impact_order can be inferred"`. The financial rating verification step provides an unambiguous calculation procedure: `"If impact_pct >= 0.005 (0.5%): financial_rating = HIGH"`. Each value_metric has a clear "Use when:" sentence defining the boundary.

### 2.2 Examples and Counter-Examples: 2 / 2
The prompt includes multiple positive examples across both IMPACT_ORDER and financial_rating tiers. Positive: `"Run MRP Calculation" -> FIRST (directly determines production quantities -> COGS)"`, `"Production scheduling directly controls manufacturing throughput. Estimated annual impact: $26M (0.2% of $13B COGS) -> HIGH."` Counter-examples are explicitly labeled: `"Example 1 -- Support process looks financial but is MEDIUM: 'Maintain Product Master Data' -> MEDIUM, COGS, SECOND"` and `"Example 2 -- FP-003 counter-example (inventory is NOT REVENUE): 'Manage Safety Stock Parameters' -> HIGH or MEDIUM, WORKING_CAPITAL (NOT REVENUE), FIRST"`. Both positive and negative examples present with real distribution representation.

### 2.3 Output Format Specification: 2 / 2
Full JSON schema with all field names, types, and allowed values enumerated: `"id": "<L4 node id>", "financial_rating": "HIGH" | "MEDIUM" | "LOW", "value_metric": "COGS" | "REVENUE" | "SG_AND_A" | "EBITDA" | "WORKING_CAPITAL", "impact_order": "FIRST" | "SECOND", "confidence": "HIGH" | "MEDIUM" | "LOW", "estimated_annual_impact": <number in dollars or null>, "rationale": "Brief 1-sentence explanation..."`. The wrapper object with `"ratings"` array and `"prompt_version"` is also specified.

### 2.4 Guardrails: 2 / 2
Multiple if-X-do-Y patterns with explicit fallbacks. `"When uncertain between HIGH and MEDIUM, choose MEDIUM and set confidence: 'LOW'"`. `"When description is missing or empty: rate LOW, rationale 'Insufficient description', impact_order SECOND, confidence LOW"`. `"When industry financials are absent: prefer MEDIUM over HIGH for ambiguous cases"`. `"When a process is in a business_exclusions or hard_exclusions domain: set financial_rating LOW regardless"`. Covers all main edge cases.

### 2.5 Negative Constraints: 1 / 2
Strong set of MUST NOT constraints: `"Do NOT assign REVENUE as the value_metric for inventory optimization, safety stock, or working-capital processes"`, `"Do NOT rate a process HIGH if it is primarily administrative, archival, or data-management"`, `"Do NOT default to REVENUE when uncertain"`, `"Do NOT assign FIRST-order impact to enabling/support processes"`, `"CONSTRAINT: Do NOT assign financial_rating = HIGH without citing an estimated annual impact figure in the rationale"`. These are specific and well-named. However, there is no constraint addressing malformed or unexpected input beyond missing descriptions (e.g., what if `id` is null, or `l4_batch` contains duplicate IDs, or node paths are inconsistent). Scoring 1 because while there are clearly more than 2 specific must-not constraints (which merits a 2), the anti-patterns are all domain-specific -- there is no constraint against hallucinating additional fields or adding commentary outside the JSON. On reflection, the 5+ specific must-nots easily satisfy the ">=2 specific must-not/do-not constraints, anti-patterns named" criteria. Revising to 2.

**Revised score: 2 / 2**

---

## Layer 2 -- Context Engineering (7 / 8)

### 3.1 Context Window Composition: 2 / 2
The auditor can fully reconstruct what the model sees at runtime. The function builds exactly two messages: a `developer` message (static `L4_RATING_REFERENCE` + `<rating_criteria>` + `<constraints>` + `<metric_selection_guide>` + `<output_format>`) and a `user` message (dynamic `<industry_context>` + `<l4_processes>`). All dynamic inputs are traceable through the function parameters: `l4_batch` fields (`id`, `name`, `description`, `l1`, `l2`, `l3`), `context` fields (`industry`, `company_name`, `annual_revenue`, `cogs`, `working_capital`, `business_exclusions`, `hard_exclusions`), and `industry_analysis` fields (`industry_summary`, `financial_context`). No blind spots.

### 3.2 Context-to-Prompt Ratio: 2 / 2
Domain knowledge is externalized into injected context. The `L4_RATING_REFERENCE` constant provides Aera platform context. Company financials come from `CompanyContext`. Industry analysis comes from `IndustryAnalysis`. The prompt itself is a thin instruction layer over dynamic context. The developer message comment explicitly notes: `"Does NOT include CPG action vocabulary, write-back types, or skill archetypes (those are for Phase 05, not Phase 04)"`, showing deliberate context scoping.

### 3.3 Context Quality: 2 / 2
Context is well-structured with XML tags (`<aera_platform_context>`, `<rating_criteria>`, `<constraints>`, `<metric_selection_guide>`, `<output_format>`, `<industry_context>`, `<l4_processes>`). Each section is high-signal and relevant to the rating task. The financial context injection is conditional: `if context.annual_revenue:` ensures only available data is included. The industry analysis injection is similarly gated. No stale or noisy data observed.

### 3.4 Context Gaps: 1 / 2
One identifiable gap: the financial rating verification step requires `estimated_annual_impact = [your estimate of annual $ impact]` and `impact_pct = estimated_annual_impact / [relevant financial base from company context]`. However, if `context.annual_revenue`, `context.cogs`, and `context.working_capital` are all None, the model has no financial base to divide by. The guardrail `"When industry financials are absent: prefer MEDIUM over HIGH for ambiguous cases"` partially addresses this but doesn't explicitly tell the model to skip the percentage calculation or set `estimated_annual_impact: null` in that case. A domain expert would also know typical industry benchmarks for common process types (e.g., "MRP optimization typically saves 1-3% of COGS in discrete manufacturing"), which could ground estimates when company financials are absent.

---

## Layer 3 -- Intent Engineering (9 / 10)

### 4.1 Objective Hierarchy: 2 / 2
Primary objective is explicit and ranked: `"PRIORITY ORDER for accuracy: 1. value_metric accuracy is MOST CRITICAL -- a wrong metric propagates into downstream financial calculations 2. financial_rating tier accuracy (HIGH/MEDIUM/LOW) is important but recoverable 3. impact_order can be inferred from financial_rating when ambiguous"`. The consequence statement reinforces: `"Consequence of errors: Wrong value_metric assignments propagate into Phase 05 financial estimates and appear in customer-facing output."`

### 4.2 The Klarna Test: 2 / 2
If the model ruthlessly optimizes for value_metric accuracy, the outcome is well-aligned -- conservative defaults are encoded everywhere. `"When uncertain, choose MEDIUM (not HIGH) and set confidence: LOW. Conservative metric assignment (WORKING_CAPITAL or COGS over REVENUE for supply chain) is always preferred."` The confidence distribution target `"~25% HIGH, ~50% MEDIUM, ~25% LOW"` with the self-check `"If you find yourself rating >50% of processes HIGH confidence, you are not being critical enough"` prevents inflation. The hard constraint `"Do NOT assign financial_rating = HIGH without citing an estimated annual impact figure in the rationale"` prevents ungrounded optimism. No perverse incentive identified.

### 4.3 Decision Boundaries: 2 / 2
Clear autonomous vs. escalation boundaries. The model decides ratings autonomously within well-defined guardrails. Explicit decision boundaries: `"If impact_pct >= 0.005 (0.5%): financial_rating = HIGH"`, `"If impact_pct 0.001-0.005 (0.1-0.5%): financial_rating = MEDIUM"`, `"If impact_pct < 0.001 (<0.1%): financial_rating = LOW"`. The confidence field serves as an implicit escalation signal: `"When uncertain between HIGH and MEDIUM, choose MEDIUM and set confidence: 'LOW'"` flags borderline cases for downstream review. Business/hard exclusions are handled with absolute rules: `"set financial_rating LOW regardless"`.

### 4.4 Values Alignment: 2 / 2
Scored against config values:
- **Scoring accuracy**: The priority order, verification step with percentage thresholds, and worked examples all drive discrimination between opportunities.
- **Evidence-grounded**: `"CONSTRAINT: Do NOT assign financial_rating = HIGH without citing an estimated annual impact figure in the rationale"` and `"HIGH: You can cite specific evidence from the process description AND company context"`.
- **Conservative realism**: `"Conservative defaults (lower rating, not higher) are always preferred"`, `"When uncertain, choose MEDIUM (not HIGH)"`, `"Do NOT default to REVENUE when uncertain. Uncertain metric -> prefer COGS or WORKING_CAPITAL"`.
All three values are actively reinforced.

### 4.5 Senior Employee Test: 1 / 2
The prompt encodes significant domain knowledge: the COGS vs. WORKING_CAPITAL distinction for supply chain, the REVENUE-first bias warning, the metric selection guide, and the counter-examples. However, one expert heuristic is missing: industry-specific rating calibration. A senior supply chain consultant would know that the same process (e.g., "Manage Safety Stock") has vastly different financial impact in retail vs. aerospace vs. CPG, and would apply industry-specific multipliers or benchmarks. The prompt relies entirely on the model's general knowledge for industry calibration once company financials are injected, without encoding industry-specific heuristics (e.g., "In automotive, logistics typically represents 5-8% of COGS vs. 15-20% in retail").

---

## Layer 4 -- Specification Completeness (8 / 12)

### 5.1 Self-Contained Problem Statement: 2 / 2
The module docstring provides complete context: `"Rates each L4 process node for: Financial Impact (HIGH/MEDIUM/LOW), Value Metric... Pipeline position: Phase 04 of 6. Consumes Phase 03 industry analysis. Consumer: Phase 05 (suitability_skills.py) uses these ratings to scope skill generation and bound financial estimates. Consequence of errors: Wrong value_metric assignments propagate into Phase 05 financial estimates and appear in customer-facing output."` An outsider can understand what this does, why it matters, and what feeds into it.

### 5.2 Acceptance Criteria: 2 / 2
Five explicit, verifiable acceptance criteria in the docstring: `"1. Every L4 node in the batch has exactly one rating in the output 2. Inventory, safety-stock, and working-capital processes receive WORKING_CAPITAL (not REVENUE) 3. Production cost, logistics, and procurement processes receive COGS (not REVENUE) 4. Archive, report, maintain, store processes do not receive HIGH 5. REVENUE is only assigned when the process directly affects sales volume, demand capture, or pricing decisions"`. All five are machine-verifiable.

### 5.3 Constraint Architecture: 2 / 2
All four constraint types present:
- **Musts**: `"you MUST calculate: estimated_annual_impact"`, `"Archival, compliance reporting, and data-maintenance processes: cap at LOW"`, rating when description is missing
- **Must-nots**: Five explicit MUST NOT constraints in the `<constraints>` section
- **Preferences**: `"When uncertain, choose MEDIUM (not HIGH)"`, `"Conservative metric assignment (WORKING_CAPITAL or COGS over REVENUE for supply chain) is always preferred"`
- **Escalation triggers**: Confidence: LOW serves as flag; `"When value_metric is ambiguous between COGS and WORKING_CAPITAL, set confidence: 'LOW'"`

### 5.4 Decomposition: 1 / 2
This is a multi-step task: (1) understand the process, (2) select value_metric, (3) calculate estimated_annual_impact, (4) determine financial_rating via verification step, (5) determine impact_order, (6) assess confidence. The verification step is well-decomposed with explicit input/output: `"estimated_annual_impact = [your estimate]... impact_pct = estimated_annual_impact / [relevant financial base]... Then apply: If impact_pct >= 0.005..."`. However, the overall task flow is not explicitly sequenced as numbered sub-tasks with clear boundaries. The metric selection and rating steps are interleaved across sections rather than presented as a stepwise procedure. An LLM could reasonably process them in any order.

### 5.5 Evaluation Design: 0 / 2
No test cases exist in `audit/tests/aeraperioic-l4-rating/`. The directory does not exist.

### 5.6 Version and Ownership: 1 / 2
Version and owner are present in the Python file: `PROMPT_VERSION = "l4-rating-2026-03-12-v1.2"`, `PROMPT_OWNER = "platform-team"`, `PROMPT_LAST_MODIFIED = "2026-02-28"`. However, these metadata fields are not included in the prompt content itself that the model sees -- they exist only as Python constants. The `prompt_version` is injected into the output schema (`"prompt_version": "{PROMPT_VERSION}"`), which is traceability in the output but not the same as version metadata in the prompt the model reads. Scoring 1 because the metadata exists in the file but is not fully embedded in the prompt text (the model does not see owner or last-modified).

---

## Findings

### [FINDING-001] [5.5] [Severity: HIGH] [MECHANICAL]
**Evidence**: No directory at `audit/tests/aeraperioic-l4-rating/`
**Gap**: No test cases with known-good outputs exist (Section 5.5 requires test cases for score > 0)
**Fix**: Create test cases in `audit/tests/aeraperioic-l4-rating/` with at least:
1. A batch containing an inventory/safety-stock process -- verify WORKING_CAPITAL assigned (acceptance criteria #2)
2. A batch containing an archive/report process -- verify not rated HIGH (acceptance criteria #4)
3. A batch with missing descriptions -- verify LOW rating, "Insufficient description" rationale
4. A batch with a mix of HIGH/MEDIUM/LOW expected outputs to verify distribution

### [FINDING-002] [3.4] [Severity: MEDIUM] [DOMAIN]
**Evidence**: `"estimated_annual_impact = [your estimate of annual $ impact for this process]"` and `"impact_pct = estimated_annual_impact / [relevant financial base from company context]"` -- but financial base fields (`annual_revenue`, `cogs`, `working_capital`) are all optional and conditionally injected.
**Gap**: When company financials are absent, the verification step's percentage calculation has no denominator. The guardrail "When industry financials are absent: prefer MEDIUM over HIGH" doesn't explicitly instruct the model to skip the calculation or set `estimated_annual_impact: null`.
**Fix**: Add to the verification step: `"If company financials are not provided in industry_context, skip the percentage calculation, set estimated_annual_impact: null, cap financial_rating at MEDIUM, and set confidence: LOW."` This requires domain sign-off on whether MEDIUM is the correct cap.

### [FINDING-003] [4.5] [Severity: MEDIUM] [DOMAIN]
**Evidence**: The `<metric_selection_guide>` is industry-generic. No industry-specific calibration heuristics are present.
**Gap**: A senior supply chain expert would know that the same process type has different financial magnitude across industries (e.g., logistics is 5-8% of COGS in automotive vs. 15-20% in retail). The prompt relies on the model's general knowledge for this calibration.
**Fix**: Consider adding an industry benchmarks reference table or enriching `IndustryAnalysis.financial_context` with typical cost structure breakdowns per industry. This is a domain decision about whether to hardcode industry benchmarks or rely on the model.

### [FINDING-004] [5.4] [Severity: MEDIUM] [MECHANICAL]
**Evidence**: Rating criteria, constraints, metric selection guide, and verification step are spread across `<rating_criteria>`, `<constraints>`, `<metric_selection_guide>`, and embedded within examples. The verification step appears mid-way through `<rating_criteria>`.
**Gap**: The multi-step task (identify metric -> calculate impact -> apply thresholds -> determine confidence) is not presented as an explicit ordered procedure with step boundaries.
**Fix**: Add a `<procedure>` section that explicitly sequences the steps:
```
<procedure>
For each L4 process:
Step 1: Select value_metric using <metric_selection_guide> and <aera_platform_context>
Step 2: Determine impact_order (FIRST if process directly drives the metric, SECOND otherwise)
Step 3: Calculate estimated_annual_impact and impact_pct per FINANCIAL RATING VERIFICATION STEP
Step 4: Assign financial_rating based on impact_pct thresholds
Step 5: Assess confidence per CONFIDENCE RUBRIC
Step 6: Write rationale (must include dollar figure for HIGH ratings)
</procedure>
```

### [FINDING-005] [5.6] [Severity: LOW] [MECHANICAL]
**Evidence**: `PROMPT_VERSION = "l4-rating-2026-03-12-v1.2"`, `PROMPT_OWNER = "platform-team"`, `PROMPT_LAST_MODIFIED = "2026-02-28"` exist as Python constants but are not in the developer message content the model sees.
**Gap**: The model does not see version/owner/last-modified metadata. Only `PROMPT_VERSION` is referenced in the output schema.
**Fix**: Add a comment block or metadata tag at the top of the developer message: `<!-- prompt_version: l4-rating-2026-03-12-v1.2 | owner: platform-team | modified: 2026-02-28 -->`. This aids debugging when reviewing model outputs.

### [FINDING-006] [FP-P002] [Severity: LOW] [DOMAIN]
**Evidence**: `"HIGH IMPACT (Deep Purple tile): ... Quantifiable savings/revenue typically >0.5% of relevant metric"` and the verification step `"If impact_pct >= 0.005 (0.5%): financial_rating = HIGH"`.
**Gap**: Project failure pattern FP-P002 flags ceiling clustering (>70% of scores at max value for a sub-dimension). The 0.5% threshold for HIGH may be too low for some industries, potentially causing clustering at HIGH for companies with large revenue bases where many processes cross the threshold. The confidence distribution target helps but only applies to confidence, not financial_rating.
**Fix**: Consider adding a similar distribution target for financial_rating (e.g., "Expect roughly 20-30% HIGH, 40-50% MEDIUM, 20-30% LOW for a typical process hierarchy"). This is a domain decision requiring analysis of actual rating distributions.

---

## Failure Pattern Check

| Pattern | Status | Notes |
|---------|--------|-------|
| FP-001 (Klarna) | PASS | Conservative defaults and verification step prevent metric-maximization |
| FP-002 (Silent Gate) | PASS | Exclusion domains explicitly gate to LOW; confidence LOW flags borderline |
| FP-003 (Unnamed Output) | PASS | Full JSON schema with all fields enumerated |
| FP-004 (Vague Estimate) | PASS | Explicit calculation methodology with percentage thresholds |
| FP-P001 (Collapsed platform_fit) | N/A | Different prompt (Phase 04 not technical scoring) |
| FP-P002 (Ceiling clustering) | WATCH | See FINDING-006 -- financial_rating has no distribution target |

---

## Critical Gap
**[FINDING-001]** -- No test cases exist. This is the single most impactful gap because the prompt encodes sophisticated domain logic (5 acceptance criteria, metric selection rules, counter-examples) that cannot be verified without test fixtures. Creating 3-4 test batches with known-good outputs would validate the acceptance criteria and catch regressions when the prompt is modified.

---

## Human Input Required
- [ ] [FINDING-002]: When company financials are absent, should the cap be MEDIUM or should the model attempt industry-benchmark estimation? Need domain decision on fallback behavior.
- [ ] [FINDING-003]: Should industry-specific benchmarks be encoded in the prompt or kept dynamic via IndustryAnalysis? Need product decision on maintenance burden vs. accuracy.
- [ ] [FINDING-006]: Is a financial_rating distribution target appropriate, or does the verification step with percentage thresholds provide sufficient discrimination?

---

## New Failure Patterns
None identified. The existing FP-P002 (ceiling clustering) is the closest concern, already tracked.
