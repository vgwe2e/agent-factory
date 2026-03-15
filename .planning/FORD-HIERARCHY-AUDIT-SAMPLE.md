# Ford Hierarchy Audit Sample

Date: 2026-03-13

Basis:

- Rubric: [HIERARCHY-AUDIT-RUBRIC.md](./HIERARCHY-AUDIT-RUBRIC.md)
- Source hierarchy: [.planning/ford_hierarchy_v3_export.json](./ford_hierarchy_v3_export.json)
- Sample shortlist: [implementation-shortlist.tsv](../src/evaluation-vllm/evaluation/implementation-shortlist.tsv)
- Sample review queue: [manual-review-queue.tsv](../src/evaluation-vllm/evaluation/manual-review-queue.tsv)

## Sample

This is an initial diagnostic sample of 10 Ford L3 areas:

- `6` from `ADVANCE`
- `4` from `REVIEW`

The goal is not final certification. The goal is to identify the dominant bottleneck:

- hierarchy design
- L4 granularity
- skill placement
- skill generation quality / coverage
- suitability-gate calibration versus downstream evaluation

## Fast Findings

### Primary finding

The biggest immediate problem is **not** that the areas are universally wrong.

The biggest immediate problem also does **not** appear to be raw skill sparsity by itself.

After checking the upstream suitability gate in [suitability_rating.py](../../AeraPerioic/backend/app/prompts/suitability_rating.py), the correct interpretation is:

- zero skills can be intentional
- `NOT_APPLICABLE` nodes are supposed to receive no skills
- uncertain cases are intentionally downgraded conservatively
- Ford-scale `HIGH` suitability uses a high annual impact bar (`>$5M`)

That means this sample does **not** justify a blanket conclusion that generation failed whenever an area is sparse.

The more credible first bottleneck is **alignment between the suitability gate and downstream promotion/scoring/simulation**:

- are the right L4s being admitted as DI-suitable?
- are downstream scores respecting that admitted set?
- are areas advancing because of metadata signals even when few child L4s are actually strong DI candidates?

### Secondary finding

The `REVIEW` cohort is not random noise. It is disproportionately made of **broad analytic / cross-functional bundles**.

Those areas often combine:

- forecasting
- intelligence
- launch planning
- optimization
- risk
- remediation

into one L3. That hurts simulation groundedness and makes implementation patterns less crisp.

### Practical conclusion

For Ford, the bottleneck is mixed:

1. **First bottleneck:** suitability-gate calibration and downstream alignment
2. **Second bottleneck:** overly broad L3/L4 design in part of the `REVIEW` cohort
3. **Third bottleneck:** sibling overlap / placement drift in some dense areas
4. **Not the first bottleneck:** prompt polish on already-good individual skills

## Scored Sample

Scale:

- `0` broken
- `1` weak
- `2` acceptable
- `3` strong
- `NA` not scoreable because the area had no generated child skills

Columns:

- `coverage` = total generated skills / total child L4s in that L3
  This is contextual only, not a failure signal by itself.
- `rep_l4` = representative L4 used for B-scores
- `rep_skill` = representative skill used for C-scores

| area | queue | coverage | A1 | A2 | A3 | rep_l4 | B1 | B2 | B3 | B4 | rep_skill | C1 | C2 | C3 | C4 | diagnosis |
|------|-------|----------|----|----|----|--------|----|----|----|----|-----------|----|----|----|----|-----------|
| Supplier Capacity Management | ADVANCE | 2 / 5 | 3 | 3 | 2 | Supplier Capacity Increase Request & Approval | 3 | 3 | 3 | 3 | Automated Supplier Capacity Augmentation | 3 | 3 | 3 | 2 | Strong area; weak sibling coverage |
| Demand Signal Sensing & Adjustment | ADVANCE | 10 / 5 | 3 | 2 | 2 | Short-Term Forecast Adjustment Process | 3 | 3 | 3 | 3 | Dynamic Short-Term Demand Adjustment | 3 | 3 | 3 | 2 | Strong area; some sibling overlap risk |
| Request for Quote (RFQ) & Bid Management | ADVANCE | 0 / 6 | 3 | 3 | 3 | Commercial Bid Analysis & Cost Breakdowns | 3 | 2 | 2 | 3 | none | NA | NA | NA | NA | Hierarchy is strong; zero coverage is inconclusive without suitability mix |
| Returnable Packaging Management | ADVANCE | 0 / 5 | 3 | 3 | 2 | Packaging Inventory Tracking & Loss Prevention | 3 | 2 | 2 | 3 | none | NA | NA | NA | NA | Plausible area; likely conservative gating or downstream mismatch to inspect |
| Service Parts Master Data & Bill of Material (BOM) Management | ADVANCE | 0 / 5 | 2 | 2 | 2 | Data Quality Audit & Remediation | 3 | 2 | 2 | 3 | none | NA | NA | NA | NA | Mixed fit area; may be filtered intentionally as weak DI control decisions |
| Vehicle & Part Order Allocation | ADVANCE | 2 / 4 | 3 | 3 | 3 | Production Slot Allocation to Orders | 3 | 3 | 3 | 3 | Production Slot Allocation Optimization | 3 | 3 | 3 | 2 | Strong area; under-covered siblings |
| Demand Forecasting & Analysis | REVIEW | 16 / 5 | 2 | 1 | 1 | Global Sales Forecast Aggregation | 3 | 2 | 2 | 2 | Global Sales Forecast Consolidation | 2 | 2 | 2 | 1 | Broad area; skills overlap and blur boundaries |
| Material Requirements Planning (MRP) Integration | REVIEW | 15 / 5 | 2 | 2 | 2 | Supplier Release Generation & Transmission | 3 | 3 | 3 | 2 | Autonomous MRP Supplier Release | 3 | 3 | 3 | 1 | Area is workable but too broad and over-layered |
| Cost & Value Optimization Initiatives | REVIEW | 4 / 4 | 2 | 2 | 1 | Should-Cost Analysis & Negotiation Strategy | 3 | 3 | 2 | 3 | Should-Cost Analysis & Negotiation Strategy | 3 | 3 | 3 | 2 | Moderate area quality; over-bundled cost levers |
| Manufacturing Anomaly & Issue Resolution | REVIEW | 0 / 5 | 2 | 2 | 1 | Production Line Stoppage Management | 3 | 3 | 2 | 2 | none | NA | NA | NA | NA | Broad area plus sparse skills; cannot separate gating from coverage without suitability data |

## Evidence Notes

### Strong areas with sparse or absent skills

These areas are structurally good, but that does **not** prove generation failure. Under the current suitability logic, sparse output may simply mean the child L4s were rated conservatively:

- `Request for Quote (RFQ) & Bid Management`
- `Returnable Packaging Management`
- `Vehicle & Part Order Allocation`
- `Supplier Capacity Management`

These are the right places to audit **L4 suitability distributions** before touching prompts.

### Broad areas with real hierarchy drag

These areas are plausible but too broad to stay crisp through simulation:

- `Demand Forecasting & Analysis`
- `Cost & Value Optimization Initiatives`
- `Manufacturing Anomaly & Issue Resolution`

They combine multiple implementation patterns under one area, which is consistent with weaker groundedness in simulation and more conservative suitability outcomes.

### Areas where the engine is closest to healthy

Best sample item:

- `Demand Signal Sensing & Adjustment`

Why:

- coherent decision family
- good L4 coverage
- strong representative skill structure
- only moderate risk is sibling redundancy

## What This Means

### Question 1: should you improve prompts for the 20,000 skills?

Not first.

Doing that now would improve wording quality, but it would not solve:

- false assumptions about which L4s were intentionally filtered out
- downstream promotion that may not line up with the suitability gate
- over-broad L3 bundles

### Question 2: should you improve the 2,000 decision units / areas?

Partly yes.

But the audit says:

- many `ADVANCE` areas are already good enough
- the hierarchy problem is concentrated in part of the `REVIEW` cohort

So the correct answer is **not** “rebuild the whole hierarchy first.”

The better answer is:

1. validate which child L4s were actually admitted by the suitability gate
2. compare that admitted set to downstream promotion and simulation outcomes
3. split the broad `REVIEW` areas
4. only then inspect prompt quality inside the admitted containers

## Recommended Next Moves

### 1. Export and inspect suitability distributions before changing prompts

For each audited L3, compute:

- count of child L4s with `decision_exists = true`
- count of child L4s by `ai_suitability` bucket
- count of child L4s that actually received skills

This is the minimum evidence needed to distinguish:

- intentional sparsity
- conservative gate calibration
- downstream mismatch
- actual missed skill generation

### 2. Compare suitability to downstream promotion

Target first:

- `Request for Quote (RFQ) & Bid Management`
- `Returnable Packaging Management`
- `Service Parts Master Data & Bill of Material (BOM) Management`
- `Manufacturing Anomaly & Issue Resolution`

Question:

- why did these areas surface as `ADVANCE` or `REVIEW` if few child L4s appear to have survived into skills?
- is the answer legitimate high-value DI fit, or a scoring/promotion mismatch?

### 3. Split broad review areas

Highest priority splits:

- `Demand Forecasting & Analysis`
  - separate pure forecasting from market intelligence and launch planning
- `Cost & Value Optimization Initiatives`
  - separate cost modeling, negotiation, and VA/VE
- `Manufacturing Anomaly & Issue Resolution`
  - separate line-stop response, defect containment, corrective action, and aftermarket issue handling

### 4. Add a placement / overlap pass

Needed especially for:

- `Demand Signal Sensing & Adjustment`
- `Material Requirements Planning (MRP) Integration`

These areas have decent skill density, but sibling skills risk collapsing into paraphrase variants.

### 5. Only then tune the generation prompts

Prompt work should focus on:

- stronger trigger / decision / action structure
- clearer source system grounding
- less sibling redundancy
- less “constraint-aware / dynamic / orchestration” boilerplate where it does not add specificity

## Final Diagnosis

If I had to rank the real Ford bottlenecks from this sample:

1. **Suitability-gate calibration and downstream alignment**
2. **Hierarchy breadth in selected review areas**
3. **Sibling overlap / placement validation**
4. **Prompt wording quality**

So the answer is:

- not “just improve prompts”
- not “treat sparsity as failure”
- but **check suitability alignment first, split the broad areas second, then refine prompts inside the admitted set**
