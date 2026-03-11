# Phase 3: Triage & Red Flags - Research

**Researched:** 2026-03-11
**Domain:** Deterministic opportunity binning and disqualification filters
**Confidence:** HIGH

## Summary

Phase 3 implements a fast-pass filter that bins all L3 opportunities into priority tiers and applies red flag disqualification/demotion rules before the expensive 32B scoring in Phase 4. The critical finding from analyzing the Ford export (362 L3 opportunities, 2016 L4 activities) is that **all triage and red flag logic is deterministic** -- every rule can be computed directly from fields already present in the validated hierarchy data without LLM inference.

The roadmap mentions "using the 8B model" for tier binning. After examining the data, the tier criteria (quick_win + combined_max_value > 5M for Tier 1, high AI suitability for Tier 2) and all red flag conditions (decision density, financial ratings, confidence levels, opportunity_exists, l4_count) are fully computable from structured fields. The 8B model's role in this phase should be limited to generating a short rationale/explanation for each tier assignment -- not for computing the tier itself. This keeps triage fast, reproducible, and testable.

**Primary recommendation:** Implement triage as a pure-function pipeline that takes `HierarchyExport` and returns `TriageResult[]` with tier assignments, red flags, and sort order. Reserve 8B LLM for optional rationale generation only. Output TSV sorted by tier with red flag annotations.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRIG-01 | Engine bins opportunities into Tier 1 (quick_win + value > $5M), Tier 2 (high AI suitability), Tier 3 (everything else) | All fields exist on L3/L4 types. Ford data: 42 Tier 1, ~103 Tier 2, ~217 Tier 3. Deterministic from structured fields. |
| TRIG-02 | Engine outputs triage results as TSV sorted by tier | TSV generation is string formatting. Sort by tier (1,2,3) then by combined_max_value descending within tier. |
| TRIG-03 | Engine processes Tier 1 first, then Tier 2, then Tier 3 | Return sorted array; downstream consumers iterate in order. |
| FLAG-01 | Engine auto-skips opportunities where decision density = 0% across all L4s (dead zone) | Requires joining L4 activities to L3 by l3_name, counting decision_exists. Ford data: 3 dead zones. |
| FLAG-02 | Engine demotes opportunities with zero HIGH financial ratings + SECOND-order impact only (no stakes) | Check L4s: no financial_rating=HIGH AND all impact_order=SECOND. Ford data: 21 no-stakes. |
| FLAG-03 | Engine flags opportunities where >50% of L4s have rating_confidence = LOW (confidence gap) | Count LOW confidence L4s / total L4s per L3. Ford data: 57 confidence gaps. |
| FLAG-04 | Engine skips opportunities where opportunity_exists = false (phantom) | Direct boolean check on L3. Ford data: 2 phantoms. |
| FLAG-05 | Engine flags opportunities where l4_count < 3 (orphan/thin opportunity) | Direct numeric check on L3. Ford data: 5 orphans. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:test | built-in | Test runner | Already established in Phase 1. Zero dependency. |
| zod | ^3.24.0 | Schema validation | Already installed. Use for TriageResult schema. |
| commander | ^13.0.0 | CLI | Already installed. Not directly used in this phase but triage integrates into pipeline. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | - | - | Phase 3 requires zero new dependencies. All logic is pure computation over existing types. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deterministic triage | 8B LLM for tier assignment | LLM adds latency, non-determinism, and makes testing harder. Reserve for rationale text only. |
| TSV string formatting | csv-stringify library | Overkill for tab-separated output with no special characters. Hand-format is simpler. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  triage/
    red-flags.ts          # Red flag detection functions
    red-flags.test.ts     # Tests for red flag rules
    tier-engine.ts        # Tier assignment logic
    tier-engine.test.ts   # Tests for tier binning
    triage-pipeline.ts    # Orchestrates flags + tiers + sorting
    triage-pipeline.test.ts
    format-tsv.ts         # TSV output formatting
    format-tsv.test.ts
  types/
    triage.ts             # TriageResult, RedFlag, Tier types
```

### Pattern 1: L4 Aggregation Helper
**What:** A utility that groups L4 activities by their L3 name, enabling per-opportunity aggregate calculations.
**When to use:** Every red flag and Tier 2 determination requires examining L4s belonging to a given L3.
**Example:**
```typescript
// Build lookup map once, reuse for all rules
function groupL4sByL3(hierarchy: L4Activity[]): Map<string, L4Activity[]> {
  const map = new Map<string, L4Activity[]>();
  for (const l4 of hierarchy) {
    const existing = map.get(l4.l3) ?? [];
    existing.push(l4);
    map.set(l4.l3, existing);
  }
  return map;
}
```

### Pattern 2: Red Flag as Tagged Union
**What:** Each red flag is a discriminated union so consumers know exactly what was flagged and why.
**When to use:** Red flags need to be serializable (for TSV), displayable, and programmatically filterable.
**Example:**
```typescript
type RedFlag =
  | { type: "DEAD_ZONE"; decisionDensity: 0 }
  | { type: "PHANTOM"; opportunityExists: false }
  | { type: "NO_STAKES"; highFinancialCount: 0; allSecondOrder: true }
  | { type: "CONFIDENCE_GAP"; lowConfidencePct: number }
  | { type: "ORPHAN"; l4Count: number };

type FlagAction = "skip" | "demote" | "flag";

// Each flag type maps to exactly one action
const FLAG_ACTIONS: Record<RedFlag["type"], FlagAction> = {
  DEAD_ZONE: "skip",
  PHANTOM: "skip",
  NO_STAKES: "demote",
  CONFIDENCE_GAP: "flag",
  ORPHAN: "flag",
};
```

### Pattern 3: Triage Result Type
**What:** The complete output of the triage pipeline for a single opportunity.
**When to use:** Returned from triage, consumed by TSV formatter and downstream scoring.
**Example:**
```typescript
type Tier = 1 | 2 | 3;

interface TriageResult {
  l3Name: string;
  l2Name: string;
  l1Name: string;
  tier: Tier;
  redFlags: RedFlag[];
  action: "process" | "skip" | "demote";  // worst action from flags
  combinedMaxValue: number | null;
  quickWin: boolean;
  leadArchetype: string | null;
  l4Count: number;
}
```

### Pattern 4: Pipeline as Pure Function
**What:** The triage pipeline is a pure function: `(HierarchyExport) => TriageResult[]`. No side effects, no I/O.
**When to use:** Always. This makes it trivially testable and composable.
**Example:**
```typescript
function triageOpportunities(export: HierarchyExport): TriageResult[] {
  const l4Map = groupL4sByL3(export.hierarchy);

  return export.l3_opportunities
    .map(opp => {
      const l4s = l4Map.get(opp.l3_name) ?? [];
      const flags = detectRedFlags(opp, l4s);
      const action = resolveAction(flags);
      const tier = action === "skip" ? 3 : assignTier(opp, l4s);
      return { ...buildResult(opp, tier, flags, action) };
    })
    .sort(compareTriage);  // Tier ASC, value DESC within tier
}
```

### Anti-Patterns to Avoid
- **Mixing I/O with logic:** Do NOT read files or call Ollama inside triage functions. Triage takes parsed data in and returns results out.
- **Skipped opportunities disappearing:** Skipped items (DEAD_ZONE, PHANTOM) must still appear in output with action="skip". They are not filtered out -- they are marked.
- **Tier assignment on skipped items:** Skipped items should still get a tier assignment (Tier 3) so they sort correctly in TSV output.
- **Mutable aggregation state:** Do not accumulate flags in a shared mutable array. Each opportunity gets its own independent flag detection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| L4-to-L3 grouping | Inline groupBy in every function | Single `groupL4sByL3` utility built once | Used by 5+ red flag checks and tier logic; avoid redundant iteration |
| TSV escaping | Complex CSV/TSV library | Simple tab-join with newline-to-space sanitization | Aera data has no tabs in field values; keep it minimal |

**Key insight:** This phase is pure data transformation. Every input field is already validated by Zod in Phase 1. There are no edge cases from malformed data -- only business logic edge cases (null values, empty L4 sets).

## Common Pitfalls

### Pitfall 1: L3-L4 Join Mismatch
**What goes wrong:** L3 `l3_name` does not match any L4's `l3` field, resulting in empty L4 arrays and false dead zones.
**Why it happens:** The join key between L3 opportunities and L4 activities is string-based (`l3_name` on L3, `l3` on L4). If the export has inconsistent naming, the join breaks silently.
**How to avoid:** After building the L4 map, log/warn about L3 opportunities with zero matching L4s that also have `l4_count > 0`. This detects join mismatches vs legitimate empty sets.
**Warning signs:** Dead zone count unexpectedly high; known-good opportunities showing up as flagged.

### Pitfall 2: Null combined_max_value in Tier 1 Check
**What goes wrong:** Tier 1 requires `combined_max_value > 5_000_000`, but the field is nullable. Comparing `null > 5000000` evaluates to `false` in JS, which is correct, but TypeScript strict mode will flag it.
**Why it happens:** 2 of 362 Ford opportunities have null combined_max_value.
**How to avoid:** Explicit null check: `opp.combined_max_value !== null && opp.combined_max_value > 5_000_000`.

### Pitfall 3: Decision Density Denominator
**What goes wrong:** Division by zero when an L3 has zero matching L4s.
**Why it happens:** Either a join mismatch (Pitfall 1) or a data anomaly where `l4_count > 0` but no L4 records exist.
**How to avoid:** If L4 array is empty, decision density is undefined (not 0%). Treat as a flag-worthy condition but not a dead zone. Use `l4s.length === 0 ? null : decisionCount / l4s.length`.

### Pitfall 4: "High AI Suitability" Tier 2 Definition Ambiguity
**What goes wrong:** The requirement says "high AI suitability" but does not specify the threshold. Is it majority of L4s? Any L4? A specific percentage?
**Why it happens:** L3 opportunities do not have an `ai_suitability` field directly. It exists only on L4 activities.
**How to avoid:** Define Tier 2 as: at least 50% of an opportunity's L4 activities have `ai_suitability = "HIGH"`. This produces ~103 Tier 2 opportunities in Ford data, which is a reasonable middle tier. Document the threshold as a configurable constant.

### Pitfall 5: Red Flag Ordering vs Tier Assignment
**What goes wrong:** Applying red flags after tier assignment means a Tier 1 opportunity could be flagged but still processed first.
**Why it happens:** Skip-flags (DEAD_ZONE, PHANTOM) should prevent any tier upgrade. Demote-flags should push to Tier 3.
**How to avoid:** Apply red flags FIRST, then assign tier. Skipped opportunities are forced to Tier 3 with action="skip". Demoted opportunities are forced to Tier 3 with action="demote".

## Code Examples

### Complete Red Flag Detection
```typescript
function detectRedFlags(opp: L3Opportunity, l4s: L4Activity[]): RedFlag[] {
  const flags: RedFlag[] = [];

  // FLAG-04: Phantom (check first -- cheapest)
  if (!opp.opportunity_exists) {
    flags.push({ type: "PHANTOM", opportunityExists: false });
  }

  // FLAG-05: Orphan/thin
  if (opp.l4_count < 3) {
    flags.push({ type: "ORPHAN", l4Count: opp.l4_count });
  }

  // Need L4s for remaining flags
  if (l4s.length === 0) return flags;

  // FLAG-01: Dead zone (0% decision density)
  const decisionCount = l4s.filter(l4 => l4.decision_exists).length;
  if (decisionCount === 0) {
    flags.push({ type: "DEAD_ZONE", decisionDensity: 0 });
  }

  // FLAG-02: No stakes (zero HIGH financial + all SECOND order)
  const hasHighFinancial = l4s.some(l4 => l4.financial_rating === "HIGH");
  const allSecondOrder = l4s.every(l4 => l4.impact_order === "SECOND");
  if (!hasHighFinancial && allSecondOrder) {
    flags.push({ type: "NO_STAKES", highFinancialCount: 0, allSecondOrder: true });
  }

  // FLAG-03: Confidence gap (>50% LOW confidence)
  const lowConfCount = l4s.filter(l4 => l4.rating_confidence === "LOW").length;
  const lowConfPct = lowConfCount / l4s.length;
  if (lowConfPct > 0.5) {
    flags.push({ type: "CONFIDENCE_GAP", lowConfidencePct: lowConfPct });
  }

  return flags;
}
```

### Tier Assignment
```typescript
const TIER1_VALUE_THRESHOLD = 5_000_000;
const TIER2_AI_SUITABILITY_THRESHOLD = 0.5;  // 50% of L4s must be HIGH

function assignTier(opp: L3Opportunity, l4s: L4Activity[]): Tier {
  // Tier 1: quick_win AND value > $5M
  if (
    opp.quick_win &&
    opp.combined_max_value !== null &&
    opp.combined_max_value > TIER1_VALUE_THRESHOLD
  ) {
    return 1;
  }

  // Tier 2: high AI suitability (>=50% of L4s are HIGH)
  if (l4s.length > 0) {
    const highAiCount = l4s.filter(l4 => l4.ai_suitability === "HIGH").length;
    if (highAiCount / l4s.length >= TIER2_AI_SUITABILITY_THRESHOLD) {
      return 2;
    }
  }

  // Tier 3: everything else
  return 3;
}
```

### TSV Output
```typescript
const TSV_HEADERS = [
  "tier", "action", "l1_name", "l2_name", "l3_name",
  "combined_max_value", "quick_win", "lead_archetype",
  "l4_count", "red_flags"
].join("\t");

function formatTriageTsv(results: TriageResult[]): string {
  const rows = results.map(r => [
    r.tier,
    r.action,
    r.l1Name,
    r.l2Name,
    r.l3Name,
    r.combinedMaxValue ?? "",
    r.quickWin,
    r.leadArchetype ?? "",
    r.l4Count,
    r.redFlags.map(f => f.type).join(",")
  ].join("\t"));

  return [TSV_HEADERS, ...rows].join("\n");
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM for all classification | Deterministic rules + LLM for reasoning | Common pattern | Faster, reproducible, testable triage |
| Single pass scoring | Two-pass: cheap triage then expensive scoring | N/A | Saves ~75% of 32B model inference on Tier 3 |

**Key architectural insight:** The two-model strategy (INFR-04, Phase 7) means triage runs on the 8B model. But since triage logic is deterministic, the 8B model is actually not needed for tier assignment at all in Phase 3. Phase 7 will wire the 8B model for rationale generation. Phase 3 should build the deterministic engine and expose a hook for optional LLM rationale enrichment later.

## Ford Export Data Profile (Reference)

These numbers come from the actual Ford hierarchy export and should be used for test assertions:

| Metric | Count | Notes |
|--------|-------|-------|
| Total L3 opportunities | 362 | |
| Total L4 activities | 2016 | |
| Tier 1 candidates | 42 | quick_win=true AND combined_max_value > $5M |
| Tier 2 candidates | ~103 | >=50% of L4s have ai_suitability=HIGH |
| Tier 3 candidates | ~217 | Everything else |
| Dead zones (FLAG-01) | 3 | 0% decision density |
| Phantoms (FLAG-04) | 2 | opportunity_exists=false |
| No stakes (FLAG-02) | 21 | Zero HIGH financial + all SECOND order |
| Confidence gaps (FLAG-03) | 57 | >50% LOW confidence L4s |
| Orphans (FLAG-05) | 5 | l4_count < 3 |

**Note:** Some opportunities may have multiple flags. The action resolution should use the worst action: skip > demote > flag > process.

## Open Questions

1. **8B Model Role in Phase 3**
   - What we know: All tier/flag logic is computable from structured data. Roadmap says "using the 8B model."
   - What's unclear: Whether the 8B model should generate tier rationale text in this phase or if that's deferred to Phase 7 (Pipeline Orchestration).
   - Recommendation: Build deterministic triage now. Add an optional `rationale?: string` field to TriageResult. Phase 7 can populate it with 8B model output. This keeps Phase 3 testable without Ollama dependency.

2. **Tier 2 "High AI Suitability" Threshold**
   - What we know: L4 ai_suitability is HIGH/MEDIUM/LOW/NOT_APPLICABLE/null. L3 has no direct ai_suitability field.
   - What's unclear: Exact threshold for "high AI suitability." Is 50% of L4s having HIGH sufficient?
   - Recommendation: Use 50% threshold (produces 103 Tier 2 in Ford data). Make it a named constant for easy adjustment.

3. **Flag Interaction with Tier Assignment**
   - What we know: DEAD_ZONE and PHANTOM should "skip" (auto-skip). NO_STAKES should "demote." CONFIDENCE_GAP and ORPHAN should "flag."
   - What's unclear: Can a Tier 1 opportunity be demoted? (e.g., a quick_win + >$5M opportunity that also has zero HIGH financial ratings)
   - Recommendation: Yes -- red flags override tier assignment. A skipped opportunity is forced to Tier 3/skip regardless of original tier qualification. A demoted opportunity is forced to Tier 3/demote. A flagged opportunity keeps its computed tier but carries the flag annotation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- uses package.json scripts |
| Quick run command | `cd src && node --test triage/*.test.ts --loader tsx` |
| Full suite command | `cd src && node --test **/*.test.ts --loader tsx` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRIG-01 | Bins into Tier 1/2/3 | unit | `cd src && node --test triage/tier-engine.test.ts --loader tsx` | Wave 0 |
| TRIG-02 | TSV output sorted by tier | unit | `cd src && node --test triage/format-tsv.test.ts --loader tsx` | Wave 0 |
| TRIG-03 | Tier 1 processed first in output ordering | unit | `cd src && node --test triage/triage-pipeline.test.ts --loader tsx` | Wave 0 |
| FLAG-01 | Dead zone detection (0% decision density) | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | Wave 0 |
| FLAG-02 | No-stakes demotion | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | Wave 0 |
| FLAG-03 | Confidence gap flagging | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | Wave 0 |
| FLAG-04 | Phantom skip | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | Wave 0 |
| FLAG-05 | Orphan flagging | unit | `cd src && node --test triage/red-flags.test.ts --loader tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && node --test triage/*.test.ts --loader tsx`
- **Per wave merge:** `cd src && node --test **/*.test.ts --loader tsx`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/triage/red-flags.test.ts` -- covers FLAG-01 through FLAG-05
- [ ] `src/triage/tier-engine.test.ts` -- covers TRIG-01
- [ ] `src/triage/format-tsv.test.ts` -- covers TRIG-02
- [ ] `src/triage/triage-pipeline.test.ts` -- covers TRIG-03, integration of flags + tiers

## Sources

### Primary (HIGH confidence)
- Ford hierarchy export data analysis (362 L3 opportunities, 2016 L4 activities) -- direct field inspection
- Phase 1 source code: `src/types/hierarchy.ts`, `src/schemas/hierarchy.ts` -- validated type definitions
- `src/ingestion/parse-export.ts` -- established Result pattern
- `src/infra/ollama.ts` -- established Ollama integration pattern

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- requirement definitions for FLAG-01 through FLAG-05, TRIG-01 through TRIG-03
- `.planning/ROADMAP.md` -- phase dependencies and success criteria

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, reusing Phase 1 patterns
- Architecture: HIGH - pure functions over validated types, all fields verified in real data
- Pitfalls: HIGH - all edge cases identified from actual Ford data analysis (null values, join keys, thresholds)
- Tier 2 threshold: MEDIUM - 50% is reasonable but not specified in requirements; made configurable
- 8B model role: MEDIUM - recommend deferring to Phase 7, but roadmap is ambiguous

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain -- data structures fixed from Phase 1)
