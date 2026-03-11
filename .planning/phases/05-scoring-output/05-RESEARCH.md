# Phase 5: Scoring Output - Research

**Researched:** 2026-03-11
**Domain:** File output generation (TSV, Markdown) from structured scoring data
**Confidence:** HIGH

## Summary

Phase 5 is a pure output/formatting phase. It takes structured data produced by Phase 3 (triage results, red flags) and Phase 4 (three-lens scores, composite scores, archetype classifications) and writes it to four specific output files: two TSV files and two Markdown reports. There is no LLM involvement, no external library complexity, and no network I/O -- this is deterministic file generation from typed TypeScript data.

The primary challenge is defining clean interfaces for the scoring data that Phase 4 produces and Phase 5 consumes, designing readable report formats, and ensuring TSV output is well-structured for downstream consumption (e.g., spreadsheet import). The codebase already uses `node:fs/promises` for file I/O, Zod for validation, and `node:test` for testing -- Phase 5 follows these patterns exactly.

**Primary recommendation:** Define scoring/triage output types first (as a shared contract with Phase 4), then implement four focused formatter modules -- one per output file -- each with pure functions that take typed data and return strings. Write files using `node:fs/promises`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCOR-07 | Engine outputs scored opportunities as TSV with all dimension breakdowns | TSV formatter for feasibility-scores.tsv -- tab-separated with 9 sub-dimension columns plus lens totals and composite |
| SCOR-08 | Engine outputs scored opportunities as markdown report with analysis | Markdown report generator using per-dimension reason strings from Phase 4 LLM output |
| OUTP-01 | Engine produces evaluation/triage.tsv with all opportunities tier-sorted | TSV formatter for triage.tsv -- sorted by tier (1, 2, 3) with key fields |
| OUTP-02 | Engine produces evaluation/feasibility-scores.tsv with 9-dimension breakdown | Same as SCOR-07 -- single TSV file with full score matrix |
| OUTP-03 | Engine produces evaluation/adoption-risk.md with red flags and dead zones | Markdown generator consuming red flag data from Phase 3 with flag type and reasoning |
| OUTP-04 | Engine produces evaluation/tier1-report.md with deep analysis of top-tier opportunities | Markdown narrative generator for Tier 1 opportunities using scores + reasons + company context |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs/promises | built-in | Write output files to evaluation/ directory | Already used in project (parse-export.ts). Zero dependencies. |
| node:path | built-in | Construct output file paths | Already used implicitly. Cross-platform path handling. |
| zod | 3.x (installed) | Validate scoring input data structures | Project standard for runtime validation. Ensures Phase 4 output conforms to expected shape. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:test | built-in | Unit tests for formatters | Project standard (established in Phase 1). Test each formatter with fixture data. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-built TSV strings | csv-stringify or papaparse | Overkill for tab-separated output with known columns. TSV is trivial -- just join with \t. No quoting edge cases since data is numeric scores and short strings. |
| Template literals for markdown | Handlebars or EJS | Unnecessary complexity. Markdown reports are structured but simple. Template literals with helper functions are clearer and more type-safe. |

**Installation:**
```bash
# No new dependencies needed. Everything is node built-ins + already-installed zod.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  output/                    # NEW -- Phase 5 output formatters
    format-triage-tsv.ts     # OUTP-01: triage.tsv formatter
    format-scores-tsv.ts     # OUTP-02/SCOR-07: feasibility-scores.tsv formatter
    format-adoption-risk.ts  # OUTP-03: adoption-risk.md formatter
    format-tier1-report.ts   # OUTP-04: tier1-report.md formatter
    write-evaluation.ts      # Orchestrator: creates evaluation/ dir, calls all formatters, writes files
    format-triage-tsv.test.ts
    format-scores-tsv.test.ts
    format-adoption-risk.test.ts
    format-tier1-report.test.ts
    write-evaluation.test.ts
  types/
    scoring.ts               # NEW -- shared types for scored opportunity data (Phase 4 output / Phase 5 input)
    triage.ts                # NEW -- shared types for triage results (Phase 3 output / Phase 5 input)
```

### Pattern 1: Pure Formatter Functions
**What:** Each formatter is a pure function: typed data in, string out. No I/O in formatters.
**When to use:** Always for this phase. Separation of formatting from writing enables easy testing.
**Example:**
```typescript
// format-triage-tsv.ts
import type { TriagedOpportunity } from "../types/triage.js";

const HEADER = [
  "tier", "l3_name", "l1_name", "l2_name",
  "lead_archetype", "quick_win", "combined_max_value",
  "ai_suitability_summary", "flag_count", "flags"
].join("\t");

export function formatTriageTsv(opportunities: TriagedOpportunity[]): string {
  const sorted = [...opportunities].sort((a, b) => a.tier - b.tier);
  const rows = sorted.map(opp => [
    opp.tier,
    opp.l3_name,
    opp.l1_name,
    opp.l2_name,
    opp.lead_archetype ?? "",
    opp.quick_win ? "Y" : "N",
    opp.combined_max_value ?? "",
    opp.ai_suitability_summary ?? "",
    opp.flags.length,
    opp.flags.join("; ")
  ].join("\t"));
  return [HEADER, ...rows].join("\n") + "\n";
}
```

### Pattern 2: Shared Type Contract Between Phases
**What:** Define scoring and triage output types in `src/types/` so Phase 4 produces them and Phase 5 consumes them.
**When to use:** For all cross-phase data. Types are the API contract.
**Example:**
```typescript
// types/scoring.ts
import type { LeadArchetype } from "./hierarchy.js";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface SubDimensionScore {
  score: number;      // 0-3
  reason: string;     // 1-2 sentence explanation from LLM
}

export interface TechnicalFeasibility {
  data_readiness: SubDimensionScore;
  platform_fit: SubDimensionScore;
  archetype_confidence: SubDimensionScore;
  total: number;      // 0-9
  confidence: ConfidenceLevel;
}

export interface AdoptionRealism {
  decision_density: SubDimensionScore;
  financial_gravity: SubDimensionScore;
  impact_proximity: SubDimensionScore;
  confidence_signal: SubDimensionScore;
  total: number;      // 0-12
  confidence: ConfidenceLevel;
}

export interface ValueEfficiency {
  value_density: SubDimensionScore;
  simulation_viability: SubDimensionScore;
  total: number;      // 0-6
  confidence: ConfidenceLevel;
}

export interface ScoredOpportunity {
  l3_name: string;
  l1_name: string;
  l2_name: string;
  lead_archetype: LeadArchetype | null;
  technical: TechnicalFeasibility;
  adoption: AdoptionRealism;
  value: ValueEfficiency;
  composite: number;          // 0.0-1.0
  overall_confidence: ConfidenceLevel;
  promotes_to_simulation: boolean;  // composite >= 0.60
}
```

### Pattern 3: Markdown Report Builder with Sections
**What:** Build markdown reports by composing section-generator functions, each returning a string block.
**When to use:** For adoption-risk.md and tier1-report.md where the structure has headers, tables, and narrative.
**Example:**
```typescript
// format-tier1-report.ts
function formatHeader(companyName: string, count: number): string {
  return `# Tier 1 Opportunity Analysis: ${companyName}\n\n` +
    `**${count} opportunities** qualified for Tier 1 (quick_win + value > $5M).\n`;
}

function formatOpportunitySection(opp: ScoredOpportunity, rank: number): string {
  return `## ${rank}. ${opp.l3_name}\n\n` +
    `**Domain:** ${opp.l1_name} > ${opp.l2_name}\n` +
    `**Archetype:** ${opp.lead_archetype ?? "Unclassified"}\n` +
    `**Composite Score:** ${opp.composite.toFixed(2)}\n\n` +
    `### Technical Feasibility (${opp.technical.total}/9)\n` +
    // ... dimension breakdowns with reasons
    ``;
}

export function formatTier1Report(
  opportunities: ScoredOpportunity[],
  companyName: string
): string {
  const tier1 = opportunities.filter(o => /* tier 1 criteria */);
  const sorted = tier1.sort((a, b) => b.composite - a.composite);
  return [
    formatHeader(companyName, sorted.length),
    ...sorted.map((opp, i) => formatOpportunitySection(opp, i + 1))
  ].join("\n---\n\n");
}
```

### Pattern 4: Orchestrated Write with Directory Creation
**What:** Single `writeEvaluation()` function creates the `evaluation/` directory, calls all formatters, and writes all files.
**When to use:** Called from the main pipeline after Phase 4 scoring completes.
**Example:**
```typescript
// write-evaluation.ts
import fs from "node:fs/promises";
import path from "node:path";

export async function writeEvaluation(
  outputDir: string,
  scoredOpportunities: ScoredOpportunity[],
  triagedOpportunities: TriagedOpportunity[],
  companyName: string
): Promise<{ success: true; files: string[] } | { success: false; error: string }> {
  const evalDir = path.join(outputDir, "evaluation");
  await fs.mkdir(evalDir, { recursive: true });

  const files = [
    { name: "triage.tsv", content: formatTriageTsv(triagedOpportunities) },
    { name: "feasibility-scores.tsv", content: formatScoresTsv(scoredOpportunities) },
    { name: "adoption-risk.md", content: formatAdoptionRisk(triagedOpportunities) },
    { name: "tier1-report.md", content: formatTier1Report(scoredOpportunities, companyName) },
  ];

  for (const file of files) {
    await fs.writeFile(path.join(evalDir, file.name), file.content, "utf-8");
  }

  return { success: true, files: files.map(f => path.join(evalDir, f.name)) };
}
```

### Anti-Patterns to Avoid
- **Mixing formatting and I/O:** Formatter functions should return strings, not write files. The orchestrator handles writing. This makes testing trivial.
- **Over-engineering TSV generation:** No need for a CSV library. Data is numeric scores and short known strings with no embedded tabs or newlines. Simple `join("\t")` is correct and clear.
- **Coupling to Phase 4 internals:** Phase 5 should consume typed interfaces, not import Phase 4 implementation details. The type contract in `src/types/scoring.ts` is the boundary.
- **Omitting trailing newline:** TSV and markdown files should end with `\n` for POSIX compliance and clean `git diff` output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number formatting (currency) | Custom currency formatter | `Intl.NumberFormat` | Already used in cli.ts. Handles locale, currency symbols, edge cases. |
| TSV escaping | Custom escape logic | Simple `join("\t")` -- no escaping needed | All data fields are scores (numbers), short labels, and enum values. No tabs or newlines in data. |
| File path construction | String concatenation | `path.join()` | Cross-platform. Already the project pattern. |

**Key insight:** Phase 5 is output formatting -- the simplest kind of code. The complexity is in getting the type contract right with Phase 4, not in the file generation itself.

## Common Pitfalls

### Pitfall 1: Mismatched Type Contract with Phase 4
**What goes wrong:** Phase 5 defines types that Phase 4 does not actually produce, leading to runtime mismatches.
**Why it happens:** Phases are planned independently and types drift.
**How to avoid:** Define the shared types (`ScoredOpportunity`, `TriagedOpportunity`) in `src/types/` as a contract BEFORE implementing either Phase 4 or Phase 5. Both phases import from the same type file.
**Warning signs:** Tests pass with fixture data but fail with real Phase 4 output.

### Pitfall 2: Missing or Inconsistent Sort Order
**What goes wrong:** TSV rows appear in arbitrary order, making the output hard to read or inconsistent across runs.
**Why it happens:** Array order from upstream phases is not guaranteed.
**How to avoid:** Always sort explicitly in each formatter. triage.tsv: sort by tier ASC then composite DESC. feasibility-scores.tsv: sort by composite DESC.
**Warning signs:** Output changes between runs with same input.

### Pitfall 3: Null/Undefined Values Producing "null" or "undefined" in TSV
**What goes wrong:** TSV cells contain literal string "null" or "undefined" instead of empty string.
**Why it happens:** JavaScript string coercion of null/undefined.
**How to avoid:** Use `value ?? ""` for all nullable fields in TSV formatting. Establish a `tsvCell()` helper.
**Warning signs:** Spreadsheet import shows literal "null" strings.

### Pitfall 4: Red Flag Data Not Available from Phase 3
**What goes wrong:** adoption-risk.md needs flag types and reasons, but Phase 3 triage only stored boolean flags.
**Why it happens:** Phase 3 was planned without Phase 5's reporting needs in mind.
**How to avoid:** Ensure the triage type includes structured flag data: `{ type: "dead_zone" | "no_stakes" | "confidence_gap" | "phantom" | "orphan"; reason: string }[]`. This must be part of the shared type contract.
**Warning signs:** adoption-risk.md has flag names but no explanations.

### Pitfall 5: Tier 1 Report Missing Narrative Depth
**What goes wrong:** tier1-report.md is just a reformatted version of the TSV data, not a "deep narrative analysis."
**Why it happens:** Formatter only dumps scores without using the per-dimension reason strings.
**How to avoid:** Phase 4 stores reason strings per sub-dimension (per the Phase 4 CONTEXT.md decision). tier1-report.md MUST include these reasons as narrative paragraphs, not just the numeric scores.
**Warning signs:** Report reads like a data dump rather than an analysis.

## Code Examples

### TSV Header/Row Pattern
```typescript
// Utility for safe TSV cell values
function tsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Y" : "N";
  return String(value);
}

function tsvRow(cells: (string | number | boolean | null | undefined)[]): string {
  return cells.map(tsvCell).join("\t");
}
```

### Feasibility Scores TSV Columns
```
l3_name  l1_name  l2_name  archetype  data_readiness  platform_fit  archetype_conf  tech_total  decision_density  financial_gravity  impact_proximity  confidence_signal  adoption_total  value_density  simulation_viability  value_total  composite  confidence  promotes_to_sim
```

### Adoption Risk Markdown Structure
```markdown
# Adoption Risk Assessment

**Generated:** {date}
**Total opportunities evaluated:** {count}
**Red-flagged opportunities:** {flagged_count}

## Dead Zones (FLAG-01)
Opportunities with 0% decision density across all L4 activities.

| Opportunity | Domain | L4 Count | Reason |
|-------------|--------|----------|--------|
| {name}      | {l1}   | {count}  | {reason} |

## No Stakes (FLAG-02)
Opportunities with zero HIGH financial ratings and SECOND-order impact only.

...

## Confidence Gaps (FLAG-03)
...

## Phantoms (FLAG-04)
...

## Orphan/Thin Opportunities (FLAG-05)
...
```

### Tier 1 Report Markdown Structure
```markdown
# Tier 1 Deep Analysis: {company_name}

**Generated:** {date}
**Tier 1 criteria:** quick_win = true AND combined_max_value > $5M
**Opportunities in Tier 1:** {count}

---

## 1. {opportunity_name}

**{l1_name} > {l2_name} > {l3_name}**
**Archetype:** {lead_archetype} | **Composite:** {composite} | **Confidence:** {confidence}

### Technical Feasibility ({tech_total}/9)
- **Data Readiness ({score}/3):** {reason}
- **Platform Fit ({score}/3):** {reason}
- **Archetype Confidence ({score}/3):** {reason}

### Adoption Realism ({adoption_total}/12)
- **Decision Density ({score}/3):** {reason}
- **Financial Gravity ({score}/3):** {reason}
- **Impact Proximity ({score}/3):** {reason}
- **Confidence Signal ({score}/3):** {reason}

### Value & Efficiency ({value_total}/6)
- **Value Density ({score}/3):** {reason}
- **Simulation Viability ({score}/3):** {reason}

### Assessment
{narrative synthesis -- why this opportunity is Tier 1, what makes it actionable}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSV with commas | TSV for data exchange | Standard practice | No quoting needed for most data; cleaner for spreadsheet paste |
| Monolithic report generators | Composable section functions | Modern TS patterns | Each section testable independently |
| `fs.writeFileSync` | `fs.writeFile` (promises) | Node 14+ | Async I/O, project standard |

**Deprecated/outdated:**
- `fs.writeFileSync`: Project uses async patterns throughout. Use `fs.writeFile` from `node:fs/promises`.

## Open Questions

1. **SCOR-08 overlap with OUTP-04**
   - What we know: SCOR-08 says "markdown report with analysis" and OUTP-04 says "tier1-report.md with deep analysis." These may be the same file or different.
   - What's unclear: Whether SCOR-08 covers ALL scored opportunities as markdown (a separate file) or is satisfied by tier1-report.md.
   - Recommendation: Treat SCOR-08 as satisfied by the combination of tier1-report.md (deep Tier 1 analysis) and adoption-risk.md (flagged opportunity analysis). The success criteria say "scored opportunities as a markdown report with analysis narrative alongside the raw TSV data" -- this suggests SCOR-08 is the overall markdown output requirement that OUTP-03 and OUTP-04 fulfill together.

2. **Output directory location**
   - What we know: Requirements say `evaluation/` prefix for all files. CLI takes `--input` flag.
   - What's unclear: Is `evaluation/` relative to CWD or to the input file location?
   - Recommendation: Default to CWD + `evaluation/`. This can be overridden later with an `--output` flag if needed (not in scope for Phase 5).

3. **Triage data shape from Phase 3**
   - What we know: Phase 3 is not yet planned in detail. It produces tier assignments and red flag results.
   - What's unclear: Exact data structure of Phase 3 output.
   - Recommendation: Phase 5 should define the `TriagedOpportunity` type it needs (tier, flags with types and reasons) and Phase 3 should conform to it. Define types proactively.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- direct `node --test` invocation |
| Quick run command | `npx tsx --test src/output/*.test.ts` |
| Full suite command | `npx tsx --test src/**/*.test.ts` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCOR-07 | feasibility-scores.tsv has all 9 dimensions + composite | unit | `npx tsx --test src/output/format-scores-tsv.test.ts` | Wave 0 |
| SCOR-08 | Markdown report contains analysis narrative per opportunity | unit | `npx tsx --test src/output/format-tier1-report.test.ts` | Wave 0 |
| OUTP-01 | triage.tsv sorted by tier with all opportunities | unit | `npx tsx --test src/output/format-triage-tsv.test.ts` | Wave 0 |
| OUTP-02 | feasibility-scores.tsv has full 9-dimension breakdown | unit | `npx tsx --test src/output/format-scores-tsv.test.ts` | Wave 0 |
| OUTP-03 | adoption-risk.md has red flags with types and reasoning | unit | `npx tsx --test src/output/format-adoption-risk.test.ts` | Wave 0 |
| OUTP-04 | tier1-report.md has deep narrative for Tier 1 opps | unit | `npx tsx --test src/output/format-tier1-report.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsx --test src/output/*.test.ts`
- **Per wave merge:** `npx tsx --test src/**/*.test.ts`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- [ ] `src/output/format-triage-tsv.test.ts` -- covers OUTP-01
- [ ] `src/output/format-scores-tsv.test.ts` -- covers SCOR-07, OUTP-02
- [ ] `src/output/format-adoption-risk.test.ts` -- covers OUTP-03
- [ ] `src/output/format-tier1-report.test.ts` -- covers SCOR-08, OUTP-04
- [ ] `src/output/write-evaluation.test.ts` -- integration test for full write orchestration
- [ ] `src/types/scoring.ts` -- shared type contract (not a test, but prerequisite)
- [ ] `src/types/triage.ts` -- shared type contract (not a test, but prerequisite)

## Sources

### Primary (HIGH confidence)
- Project codebase (`src/types/hierarchy.ts`, `src/schemas/hierarchy.ts`, `src/ingestion/parse-export.ts`) -- established patterns for types, Zod, file I/O, Result pattern
- Phase 4 CONTEXT.md -- scoring design decisions (uniform 0-3 scale, per-dimension reasons, JSON schema validation, confidence levels)
- REQUIREMENTS.md -- exact output file specifications and requirement IDs
- ROADMAP.md -- phase dependencies and success criteria

### Secondary (MEDIUM confidence)
- Node.js `fs/promises` API -- well-known, stable, no verification needed
- TSV format conventions -- tab-separated, no quoting for simple alphanumeric data

### Tertiary (LOW confidence)
- None. This phase is pure formatting with well-understood tools.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all built-in Node.js modules + already-installed zod
- Architecture: HIGH -- follows established project patterns (pure functions, types in types/, Zod validation)
- Pitfalls: HIGH -- well-understood domain (file output formatting), pitfalls are straightforward data handling issues

**Research date:** 2026-03-11
**Valid until:** No expiry -- stable domain, no external dependencies
