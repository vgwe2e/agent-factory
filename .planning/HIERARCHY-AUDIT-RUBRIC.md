# Hierarchy Audit Rubric

## Purpose

Use this rubric to answer the question:

- Is quality being lost because the **areas / hierarchy are wrong**?
- Or because the **skills themselves are weakly generated**?

This is the right audit for the current engine because the pipeline now operates on:

- many raw/generated skills
- grouped under L4 activities
- grouped under L3 opportunity areas

The core principle is:

- **Ontology before prompting**
- **structure before prose**
- **decision unit before skill quality**

If the hierarchy is wrong, better prompts will mostly produce cleaner nonsense.

Important nuance:

- **Do not automatically treat sparse or missing skills as a failure.**
- In this workflow, absence can be by design because suitability gating happens before skill generation.
- A missing skill only becomes evidence of a problem if:
  - the parent L4 was expected to be `MID` or `HIGH` suitable for DI, or
  - a downstream shortlist/report treats the broader area as viable despite weak suitable-L4 support.

## What To Audit

Audit at three levels:

1. **L3 area**
2. **L4 activity**
3. **Skill**

Do not start by reading thousands of raw skills. Start with the container quality:

- first the L3 area
- then the L4 activity
- then the skills inside it

Before scoring skill coverage, ask:

- Was this L4 actually admitted by the suitability gate?
- If not, zero skills is neutral, not negative.

## Recommended Audit Sample

For a real run like Ford:

1. Audit `20` items from the `ADVANCE` shortlist
2. Audit `10` items from `REVIEW`
3. Audit `5` obvious weak or duplicate areas

That gives you enough signal to determine whether the problem is:

- hierarchy design
- grouping/placement
- skill generation quality

## Scoring Scale

Score each dimension `0-3`:

- `0` = broken
- `1` = weak
- `2` = acceptable
- `3` = strong

## Level 1: L3 Area Quality

Question: is the L3 a real decision domain, or just a loose topic bucket?

### A1. Decision Domain Coherence

Ask:

- Is this L3 centered on one business decision family?
- Would a stakeholder recognize it as one operating problem space?
- Are the child L4s solving variations of the same thing?

Score:

- `0`: random theme bucket, no single decision family
- `1`: partially related items, but still too broad or mixed
- `2`: mostly coherent domain with minor spillover
- `3`: clearly one decision/problem family

### A2. Business Boundary Clarity

Ask:

- Is the scope clear?
- Can you say what belongs here and what does not?
- Is the boundary stable enough for deterministic scoring?

Score:

- `0`: no usable boundary
- `1`: fuzzy boundary, frequent bleed across neighbors
- `2`: mostly clear with some overlap
- `3`: sharply bounded

### A3. Implementation Pattern Consistency

Ask:

- Do the L4s under this L3 point toward similar implementation patterns?
- Or does the area mix forecasting, approvals, workflow, search, analytics, and RPA into one bucket?

Score:

- `0`: incompatible implementation patterns mixed together
- `1`: several distinct patterns with no clean split
- `2`: mostly consistent pattern family
- `3`: very consistent pattern family

## Level 2: L4 Activity Quality

Question: is the L4 a valid atomic scoring and simulation unit?

### B1. Atomicity

Ask:

- Is this one implementable activity?
- Or is it really 2-5 activities glued together?

Score:

- `0`: multiple unrelated activities jammed together
- `1`: too broad, likely needs splitting
- `2`: mostly atomic
- `3`: clearly one implementable activity

### B2. Decision Specificity

Ask:

- Is there a specific decision or action implied?
- Could a scenario spec name the trigger, decision, and action cleanly?

Score:

- `0`: no decision shape
- `1`: vague process topic only
- `2`: decision is implied but incomplete
- `3`: clear trigger-decision-action shape

### B3. Aera Feasibility Shape

Ask:

- Could this plausibly map to one Aera implementation route?
- Or is it too ambiguous to score consistently?

Score:

- `0`: no plausible implementation shape
- `1`: very speculative
- `2`: plausible but underspecified
- `3`: strong and clear implementation path

### B4. Skill Container Fit

Ask:

- Do the skills under this L4 belong together?
- Are they variants of the same execution idea?

Score:

- `0`: children clearly do not belong together
- `1`: weak clustering
- `2`: mostly coherent clustering
- `3`: strong coherent clustering

## Level 3: Skill Quality

Question: assuming the area and L4 are valid, are the skills themselves good enough?

Coverage rule:

- only audit coverage for L4s that were intentionally admitted by suitability (`MID` or `HIGH`, or equivalent)
- do not penalize areas for lacking skills under L4s that were intentionally filtered out

### C1. Placement Accuracy

Ask:

- Does this skill belong under this L4?
- Would moving it to a neighboring L4 improve fit?

Score:

- `0`: clearly misplaced
- `1`: questionable placement
- `2`: acceptable placement
- `3`: obviously correct placement

### C2. Structural Completeness

Ask:

- Does the skill specify enough structured information to score and simulate reliably?
- Trigger, targets, actions, constraints, autonomy, rollback, value signals?

Score:

- `0`: mostly empty shell
- `1`: partial structure, major gaps
- `2`: workable structure
- `3`: strong structured completeness

### C3. Outcome Realism

Ask:

- Is this a credible operational skill?
- Or is it fluffy, generic, or impossible?

Score:

- `0`: unrealistic / marketing language / non-operational
- `1`: weakly realistic
- `2`: believable
- `3`: strong operational realism

### C4. Redundancy / Overlap

Ask:

- Is this materially different from sibling skills?
- Or is it a paraphrase duplicate?

Score:

- `0`: duplicate
- `1`: heavy overlap
- `2`: mostly distinct
- `3`: clearly distinct

## Diagnosis Matrix

Use the scores to diagnose the real bottleneck.

### Case 1: Low L3/L4 scores, mixed skill scores

Meaning:

- the hierarchy is the main problem

Interpretation:

- improving prompts will not fix this much
- the container is wrong
- scoring noise is structural, not linguistic

Action:

- redesign L3 boundaries
- split or merge L4s
- re-place skills before regenerating them

### Case 2: Good L3/L4 scores, weak skill scores

Meaning:

- the ontology is mostly fine
- generation quality is the problem

Action:

- improve prompts
- improve structured field extraction
- add duplicate suppression
- tighten skill-generation constraints

### Case 3: Good areas, good skills, bad placement

Meaning:

- the grouping logic is the problem

Action:

- add placement validation
- add a “best L4 fit” review pass
- deduplicate across sibling L4s

### Case 4: Good placement, weak simulation realism

Meaning:

- the generation inputs are still too vague for scenario synthesis

Action:

- enrich structured fields
- require explicit trigger / decision / source-system / value evidence
- do not solve this with more creative prompt wording alone

### Case 5: Suitable-L4 gate and downstream promotion disagree

Meaning:

- the bottleneck is not coverage
- the bottleneck is **unit mismatch or calibration mismatch**

Examples:

- L3/L4 suitability gating prunes most child L4s, but the broader L3 still advances strongly downstream
- simulation/reporting rewards a broad area narrative that is weakly supported by suitable child L4s
- generated skills are automotive-specific, but downstream groundedness still fails because Aera/system mapping expectations differ from the suitability criteria

Action:

- audit suitability calibration directly
- compare `suitable L4 set` vs `promoted/scenario-supported L3 set`
- tighten the contract between:
  - suitability prompt
  - skill generation prompt
  - downstream scoring/simulation rubric

## Thresholds For Decision Making

Use these thresholds across the audit sample.

### Hierarchy-First Threshold

If more than `25%` of audited L4s score:

- `0` or `1` on **Atomicity**
- or `0` or `1` on **Skill Container Fit**

Then:

- stop prompt tuning
- fix hierarchy first

### Placement-First Threshold

If more than `20%` of audited skills score:

- `0` or `1` on **Placement Accuracy**

Then:

- fix placement / regrouping before prompt work

### Prompt-First Threshold

If:

- L3 and L4 averages are both `>= 2.2`
- but skill **Structural Completeness** or **Outcome Realism** average is `< 2.0`

Then:

- prompt and generation quality are the primary bottleneck

### Calibration-Mismatch Threshold

If a promoted L3 area is supported by only a small minority of child L4s that passed suitability, then the likely bottleneck is calibration or unit mismatch, not sparse skills.

Ask:

- how many child L4s passed suitability?
- how many of those produced usable skills?
- is downstream scoring/simulation using the same unit of truth?

## Fast Ford Audit Workflow

For the current Ford work:

1. Take `20` items from `implementation-shortlist.tsv`
2. Take `10` items from `manual-review-queue.tsv`
3. For each item:
   - score the parent L3 on `A1-A3`
   - score the L4 on `B1-B4`
   - score the best `3-5` child skills on `C1-C4`
4. Compute averages and failure counts
5. Classify the bottleneck:
   - hierarchy
   - placement
   - skill generation
   - structured field sparsity

## Minimal Audit Worksheet

Use this table shape:

| item | level | unit | A1 | A2 | A3 | B1 | B2 | B3 | B4 | C1 | C2 | C3 | C4 | notes | action |
|------|-------|------|----|----|----|----|----|----|----|----|----|----|----|-------|--------|
| 1 | L3/L4/Skill | pricing-management | 3 | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 1 | 2 | 2 | placement mostly good, structure thin | improve skill prompt |

## Practical Conclusion

If you only do one thing next:

- do **not** start by rewriting prompts for all skills

Do this instead:

1. validate the L3/L4 ontology
2. validate skill placement under L4
3. only then tune prompts for skill generation

That order gives you the highest leverage on both:

- scoring quality
- simulation realism
