# Phase 4: Scoring Engine - Research

**Researched:** 2026-03-11
**Domain:** LLM-powered multi-lens opportunity scoring with structured JSON output via Ollama
**Confidence:** HIGH

## Summary

Phase 4 implements a three-lens scoring engine that uses the Qwen 2.5 32B model (via Ollama) to evaluate each non-disqualified opportunity across 9 sub-dimensions. The engine makes 3 LLM calls per opportunity (one per lens), validates structured JSON output with Zod, computes weighted composite scores, and applies a threshold gate (>= 0.60) to determine simulation promotion.

The critical technical challenge is reliable structured JSON extraction from a local LLM. Ollama's `format` parameter (available since v0.5) accepts a JSON schema object and constrains the model's output to match it. Combined with Zod for both schema definition and response validation, this creates a robust pipeline: define schema in Zod, convert to JSON schema via `zod-to-json-schema`, pass to Ollama's `format` parameter, validate response with Zod `parse()`, retry on failure. The project already uses Zod 3.25.x extensively, and the Ollama connectivity module (`src/infra/ollama.ts`) establishes the fetch-based API pattern.

The scoring engine receives pre-triaged opportunities from Phase 3 (with tier assignments and red flags) and the Aera knowledge base from Phase 2. It processes only opportunities with `action === "process"` (skipped/demoted are excluded from scoring). Each opportunity is scored with lens-specific context injected into the prompt: Technical Feasibility gets knowledge base data, Adoption Realism gets constituent L4 activities, and Value & Efficiency gets company financials.

**Primary recommendation:** Build the scoring engine as a pipeline of pure scoring functions per lens, each returning a Zod-validated result. Use Ollama `/api/chat` with `format` parameter for schema-constrained JSON output. Implement retry with backoff for parse failures. Keep prompt templates as separate string-returning functions for testability.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Uniform 0-3 scale for all 9 sub-dimensions (no variable ranges)
- Sub-dimension scores sum to lens totals: Technical Feasibility (0-9), Adoption Realism (0-12), Value & Efficiency (0-6)
- Each sub-dimension scored individually by the LLM, not lens-level holistic scores
- Lens weights applied to normalized sub-totals: Technical 0.30, Adoption 0.45, Value 0.25
- Composite range: 0.0 to 1.0
- JSON schema embedded in prompt; LLM returns structured JSON with score + reason per dimension
- Zod validates LLM output; retry on parse failure
- One LLM call per lens (3 calls per opportunity), each with lens-specific context:
  - Technical Feasibility: opportunity + Aera knowledge base data
  - Adoption Realism: opportunity + constituent L4 activities
  - Value & Efficiency: opportunity + company financials
- Per-dimension reason strings preserved in output for downstream Phase 5 reports
- Data-driven per-lens confidence tag (HIGH / MEDIUM / LOW) -- purely algorithmic, no LLM self-assessment
- Overall confidence = lowest lens confidence
- Confidence is informational only -- does NOT affect the 0.60 threshold gate
- LOW confidence flagged in output for human review but does not block simulation promotion

### Claude's Discretion
- Archetype routing implementation (how DETERMINISTIC vs AGENTIC vs GENERATIVE evaluation patterns differ)
- Exact confidence threshold rules per lens (specific percentage cutoffs for HIGH/MEDIUM/LOW)
- Retry strategy details (max retries, backoff, fallback on persistent JSON parse failure)
- Prompt engineering for reliable Qwen 32B JSON output
- Scoring calibration approach (anchor examples, rubric design)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCOR-01 | Engine scores each opportunity on Technical Feasibility lens (Data Readiness, Aera Platform Fit, Archetype Confidence) -- 0-9 scale | 3 sub-dimensions at 0-3 each. LLM call with opportunity + knowledge base context. Zod schema validates 3 scores + 3 reasons. |
| SCOR-02 | Engine scores each opportunity on Adoption Realism lens (Decision Density, Financial Gravity, Impact Proximity, Confidence Signal) -- 0-12 scale | 4 sub-dimensions at 0-3 each. LLM call with opportunity + constituent L4 activities. Most heavily weighted lens (0.45). |
| SCOR-03 | Engine scores each opportunity on Value & Efficiency lens (Value Density, Simulation Viability) -- 0-6 scale | 2 sub-dimensions at 0-3 each. LLM call with opportunity + company financials. |
| SCOR-04 | Engine computes weighted composite score (Technical 0.30, Adoption 0.45, Value 0.25) -- 0.0 to 1.0 range | Pure arithmetic: normalize each lens total to 0-1 range (divide by max), apply weights, sum. Deterministic -- no LLM needed. |
| SCOR-05 | Engine applies ratcheting threshold -- only promotes opportunities with composite >= 0.60 to simulation | Boolean gate on composite score. Output includes promotion status field. |
| SCOR-06 | Engine classifies each opportunity by archetype (DETERMINISTIC, AGENTIC, GENERATIVE) and routes to appropriate evaluation patterns | Archetype already on L3Opportunity.lead_archetype. Routing uses orchestration decision guide from Phase 2. Null archetypes need fallback classification. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.24.0 (installed: 3.25.76) | LLM output schema definition + validation | Already used project-wide. Validates structured JSON from Ollama. |
| zod-to-json-schema | ^3.24.0 | Convert Zod schemas to JSON Schema for Ollama format parameter | Official recommendation from Ollama docs for JS/TS. Zod 3.x does not have native toJSONSchema(). |
| node:test | built-in | Test runner | Established in Phase 1. Zero dependency. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional) | - | - | Ollama API called via native fetch (established in src/infra/ollama.ts). No HTTP client library needed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod-to-json-schema | Hand-write JSON schemas | Error-prone, schemas drift from Zod definitions. zod-to-json-schema keeps them in sync. |
| Native fetch | ollama-js SDK | Adds dependency; native fetch is already the pattern in this project. SDK abstracts away format parameter control. |
| Temperature 0 | Higher temperature | Temperature 0 gives most deterministic scoring output. Higher temps introduce noise in scores. |

**Installation:**
```bash
cd src && npm install zod-to-json-schema
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  scoring/
    types.ts                  # ScoringResult, LensScore, SubDimensionScore types
    schemas.ts                # Zod schemas for LLM output per lens + zodToJsonSchema conversion
    ollama-client.ts          # Thin wrapper: send chat prompt with format, parse response
    prompts/
      technical.ts            # Technical Feasibility prompt builder
      adoption.ts             # Adoption Realism prompt builder
      value.ts                # Value & Efficiency prompt builder
    lens-scorers.ts           # scoreTechnical(), scoreAdoption(), scoreValue()
    composite.ts              # Weighted composite calculation + threshold gate
    confidence.ts             # Per-lens confidence computation (algorithmic)
    archetype-router.ts       # Archetype classification + routing
    scoring-pipeline.ts       # Orchestrates: filter triaged -> score per lens -> composite -> gate
    scoring-pipeline.test.ts  # Integration test with mock Ollama responses
    composite.test.ts         # Unit tests for weighted scoring math
    confidence.test.ts        # Unit tests for confidence rules
    archetype-router.test.ts  # Unit tests for archetype classification
  types/
    scoring.ts                # Exported scoring types (used by Phase 5)
```

### Pattern 1: Ollama Chat with Schema-Constrained JSON
**What:** Send a prompt to Ollama `/api/chat` with the `format` parameter containing a JSON schema. The model is constrained to output valid JSON matching the schema.
**When to use:** Every scoring LLM call.
**Example:**
```typescript
// Source: Ollama structured outputs docs
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const TechnicalLensSchema = z.object({
  data_readiness: z.object({
    score: z.number().int().min(0).max(3),
    reason: z.string(),
  }),
  aera_platform_fit: z.object({
    score: z.number().int().min(0).max(3),
    reason: z.string(),
  }),
  archetype_confidence: z.object({
    score: z.number().int().min(0).max(3),
    reason: z.string(),
  }),
});

const jsonSchema = zodToJsonSchema(TechnicalLensSchema);

async function callOllamaChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
): Promise<string> {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false, format }),
  });
  const data = await response.json() as { message: { content: string } };
  return data.message.content;
}
```

### Pattern 2: Prompt Template as Pure Function
**What:** Each lens prompt is a function that takes typed inputs and returns a system + user message pair. No I/O inside prompts.
**When to use:** All three lens scoring prompts.
**Example:**
```typescript
function buildTechnicalPrompt(
  opportunity: L3Opportunity,
  l4s: L4Activity[],
  knowledgeBase: { components: string; processBuilder: string },
): Array<{ role: string; content: string }> {
  return [
    {
      role: "system",
      content: `You are an Aera platform technical feasibility assessor. Score each dimension 0-3:
0 = No evidence/completely unsuitable
1 = Weak evidence/poor fit
2 = Moderate evidence/reasonable fit
3 = Strong evidence/excellent fit

Return JSON with score (integer 0-3) and reason (1-2 sentences) per dimension.

Available Aera components: ${knowledgeBase.components}
Process Builder nodes: ${knowledgeBase.processBuilder}`,
    },
    {
      role: "user",
      content: `Score this opportunity:
Name: ${opportunity.l3_name}
Summary: ${opportunity.opportunity_summary ?? "N/A"}
Lead Archetype: ${opportunity.lead_archetype ?? "UNKNOWN"}
L4 Activities: ${JSON.stringify(l4s.map(l4 => ({
  name: l4.name, description: l4.description,
  ai_suitability: l4.ai_suitability,
  decision_exists: l4.decision_exists,
})))}`,
    },
  ];
}
```

### Pattern 3: Retry with Validation
**What:** Call Ollama, validate with Zod, retry on parse failure with exponential backoff.
**When to use:** Every LLM call. Qwen 32B Q4 may occasionally produce malformed JSON even with format constraint.
**Example:**
```typescript
async function scoreWithRetry<T>(
  schema: z.ZodSchema<T>,
  callFn: () => Promise<string>,
  maxRetries: number = 3,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const raw = await callFn();
      const parsed = JSON.parse(raw);
      const validated = schema.parse(parsed);
      return { success: true, data: validated };
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  return { success: false, error: `Failed after ${maxRetries} attempts` };
}
```

### Pattern 4: Deterministic Composite Scoring
**What:** Pure arithmetic on validated lens scores. No LLM involved.
**When to use:** After all three lens scores are collected for an opportunity.
**Example:**
```typescript
interface CompositeResult {
  technical: { total: number; normalized: number };
  adoption: { total: number; normalized: number };
  value: { total: number; normalized: number };
  composite: number;
  promotedToSimulation: boolean;
}

const WEIGHTS = { technical: 0.30, adoption: 0.45, value: 0.25 } as const;
const MAX_SCORES = { technical: 9, adoption: 12, value: 6 } as const;
const PROMOTION_THRESHOLD = 0.60;

function computeComposite(
  technicalTotal: number,
  adoptionTotal: number,
  valueTotal: number,
): CompositeResult {
  const techNorm = technicalTotal / MAX_SCORES.technical;
  const adoptNorm = adoptionTotal / MAX_SCORES.adoption;
  const valNorm = valueTotal / MAX_SCORES.value;

  const composite =
    techNorm * WEIGHTS.technical +
    adoptNorm * WEIGHTS.adoption +
    valNorm * WEIGHTS.value;

  return {
    technical: { total: technicalTotal, normalized: techNorm },
    adoption: { total: adoptionTotal, normalized: adoptNorm },
    value: { total: valueTotal, normalized: valNorm },
    composite,
    promotedToSimulation: composite >= PROMOTION_THRESHOLD,
  };
}
```

### Pattern 5: Algorithmic Confidence Tags
**What:** Per-lens confidence computed from data signals, not LLM self-assessment.
**When to use:** After scoring, before output. Confidence is informational only.
**Recommended rules (Claude's discretion):**

```typescript
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

// Technical Feasibility confidence:
// - HIGH: lead_archetype present AND ai_suitability on >75% of L4s is not null/NOT_APPLICABLE
// - LOW: lead_archetype null OR ai_suitability null on >50% of L4s
// - MEDIUM: everything else

// Adoption Realism confidence:
// - HIGH: decision_exists on >60% of L4s AND >50% have financial_rating !== "LOW"
// - LOW: decision_exists on <25% of L4s OR >75% have rating_confidence = "LOW"
// - MEDIUM: everything else

// Value & Efficiency confidence:
// - HIGH: combined_max_value is not null AND company financials (annual_revenue, cogs) present
// - LOW: combined_max_value is null OR no company financial data at all
// - MEDIUM: everything else

// Overall = lowest of the three
```

### Anti-Patterns to Avoid
- **Asking the LLM to self-assess confidence:** Decision locked -- confidence is algorithmic, not LLM-derived.
- **Single monolithic prompt for all 3 lenses:** Decision locked -- one call per lens with lens-specific context.
- **Hardcoded JSON schema strings:** Use zod-to-json-schema to generate from Zod schemas. Keeps validation and schema in sync.
- **Streaming responses for scoring:** Use `stream: false` for scoring. Structured output needs the complete response for JSON parsing.
- **Modifying triage results:** Scoring engine reads triage results but does not mutate them. Scoring output is a separate data structure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema generation | Manual JSON schema objects | `zod-to-json-schema` converting Zod schemas | Schemas stay in sync; single source of truth |
| LLM response validation | Manual JSON.parse + field checks | Zod `.parse()` on the parsed JSON | Type-safe, generates TypeScript types, established pattern |
| Weighted average math | Complex scoring framework | Simple arithmetic functions | 3 weights, 3 lens totals -- trivial math, no framework needed |
| Ollama HTTP calls | Custom HTTP client | Native `fetch` with typed response parsing | Already established in `src/infra/ollama.ts` |

**Key insight:** The scoring engine is structurally simple (3 LLM calls + arithmetic). The complexity is in prompt quality and JSON reliability, not in code architecture.

## Common Pitfalls

### Pitfall 1: Qwen 32B JSON Parse Failures Despite Format Constraint
**What goes wrong:** Even with Ollama's `format` parameter, quantized models (Q4) occasionally produce JSON that technically matches the schema structure but has edge-case issues (trailing whitespace, unicode issues, number-as-string).
**Why it happens:** Quantization reduces model precision. The format constraint guides but does not perfectly guarantee output.
**How to avoid:** Always validate with Zod after JSON.parse(). Use `z.coerce.number()` for score fields if needed. Implement retry (3 attempts with backoff). Set temperature to 0 for maximum determinism.
**Warning signs:** Intermittent Zod validation errors on fields that should be simple integers.

### Pitfall 2: Context Window Overflow with Large L4 Sets
**What goes wrong:** Some L3 opportunities have 10+ L4 activities. Serializing all L4s into the Adoption Realism prompt may exceed useful context or dilute the model's focus.
**Why it happens:** Qwen 32B has a 32K context window. Large L4 sets with full descriptions can consume significant tokens.
**How to avoid:** Truncate L4 descriptions to first 200 characters. For opportunities with >8 L4s, include only the most relevant fields (name, financial_rating, decision_exists, ai_suitability, rating_confidence). Monitor prompt token counts.
**Warning signs:** Scores degrade for high-L4-count opportunities; model responses become generic.

### Pitfall 3: Score Distribution Clustering
**What goes wrong:** LLM scores cluster around 2/3 (mid-high) for most opportunities, providing poor discrimination.
**Why it happens:** Without calibration anchors, LLMs default to "average-to-good" assessments. The 0-3 scale is narrow.
**How to avoid:** Include scoring rubric with concrete examples in the system prompt. Provide anchor examples: "A score of 0 means X (example), a score of 3 means Y (example)." Consider including a calibration example in the first message.
**Warning signs:** >70% of opportunities score 2 on most dimensions; composite scores cluster tightly around 0.6-0.7.

### Pitfall 4: Null Lead Archetype Handling
**What goes wrong:** L3Opportunity.lead_archetype is nullable. Scoring and archetype routing fail or produce meaningless results for null-archetype opportunities.
**Why it happens:** Some export data has null archetypes (data was not classified upstream).
**How to avoid:** For SCOR-06 archetype routing: when lead_archetype is null, infer from L4 data patterns. If majority of L4s have decision_exists=true and ai_suitability=HIGH, suggest DETERMINISTIC. If supporting_archetypes is non-empty, use the first. Otherwise default to DETERMINISTIC as the safest/most conservative route.
**Warning signs:** A significant portion of opportunities lack archetype classification.

### Pitfall 5: Ollama Model Loading Latency
**What goes wrong:** First LLM call takes 30-60 seconds while Ollama loads the 32B model into memory. Subsequent calls are fast.
**Why it happens:** Ollama loads models on demand. 32B Q4 is ~18GB in memory.
**How to avoid:** Before the scoring loop, make a warmup call (simple prompt). Log timing so users know the first call is slow. Do not set aggressive timeouts on the first call.
**Warning signs:** First opportunity takes much longer to score than subsequent ones; timeout errors on first call.

### Pitfall 6: Adoption Realism Weight Dominance
**What goes wrong:** With 0.45 weight, adoption realism scores dominate the composite. A low adoption score (e.g., 4/12) almost guarantees failure even with perfect technical and value scores.
**Why it happens:** This is by design (adoption matters most), but the math means: technical=9/9 + adoption=4/12 + value=6/6 => composite = 0.30 + 0.15 + 0.25 = 0.70. An adoption score of 3/12 => 0.30 + 0.1125 + 0.25 = 0.6625, still passing. But 2/12 => 0.30 + 0.075 + 0.25 = 0.625, still passing. Only at adoption=1/12 does it fail with perfect other scores: 0.30 + 0.0375 + 0.25 = 0.5875.
**How to avoid:** This is expected behavior -- document it clearly. The threshold at 0.60 is generous enough that adoption alone rarely blocks with reasonable other scores. Log the math for each opportunity.

## Code Examples

### Complete Scoring Output Type
```typescript
// Source: Derived from CONTEXT.md decisions

interface SubDimensionScore {
  name: string;
  score: number;     // 0-3 integer
  reason: string;    // 1-2 sentences
}

interface LensScore {
  lens: "technical" | "adoption" | "value";
  subDimensions: SubDimensionScore[];
  total: number;     // sum of sub-dimension scores
  maxPossible: number; // 9, 12, or 6
  normalized: number;  // total / maxPossible (0.0-1.0)
  confidence: ConfidenceLevel;
}

interface ScoringResult {
  l3Name: string;
  l2Name: string;
  l1Name: string;
  archetype: LeadArchetype;  // resolved (never null in output)
  archetypeSource: "export" | "inferred";
  lenses: {
    technical: LensScore;
    adoption: LensScore;
    value: LensScore;
  };
  composite: number;         // 0.0-1.0 weighted
  overallConfidence: ConfidenceLevel;
  promotedToSimulation: boolean;
  scoringDurationMs: number;
}
```

### Ollama Chat Wrapper for Scoring
```typescript
const OLLAMA_CHAT_API = "http://localhost:11434/api/chat";
const SCORING_MODEL = "qwen2.5:32b";
const SCORING_TIMEOUT_MS = 120_000; // 2 minutes per call
const SCORING_TEMPERATURE = 0;

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
}

async function ollamaChat(
  messages: Array<{ role: string; content: string }>,
  format: Record<string, unknown>,
): Promise<{ success: true; content: string; durationMs: number } | { success: false; error: string }> {
  try {
    const response = await fetch(OLLAMA_CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SCORING_MODEL,
        messages,
        stream: false,
        format,
        options: { temperature: SCORING_TEMPERATURE },
      }),
      signal: AbortSignal.timeout(SCORING_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { success: false, error: `Ollama returned ${response.status}` };
    }

    const data = await response.json() as OllamaChatResponse;
    const durationMs = data.total_duration
      ? Math.round(data.total_duration / 1_000_000) // nanoseconds to ms
      : 0;

    return { success: true, content: data.message.content, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
```

### Archetype Routing (Claude's Discretion)
```typescript
// Source: Phase 2 orchestration module + CONTEXT.md

import { getRouteForArchetype } from "../knowledge/orchestration.js";
import type { LeadArchetype } from "../types/hierarchy.js";
import type { L3Opportunity, L4Activity } from "../types/hierarchy.js";

interface ArchetypeClassification {
  archetype: LeadArchetype;
  source: "export" | "inferred";
  route: { primary_route: string; secondary_route: string; rationale: string };
}

function classifyArchetype(
  opp: L3Opportunity,
  l4s: L4Activity[],
): ArchetypeClassification {
  // Use export archetype if available
  if (opp.lead_archetype !== null) {
    return {
      archetype: opp.lead_archetype,
      source: "export",
      route: getRouteForArchetype(opp.lead_archetype),
    };
  }

  // Infer from L4 patterns when lead_archetype is null
  const hasDecisions = l4s.filter(l4 => l4.decision_exists).length;
  const highAiCount = l4s.filter(l4 => l4.ai_suitability === "HIGH").length;

  // Check supporting_archetypes first
  if (opp.supporting_archetypes.length > 0) {
    const first = opp.supporting_archetypes[0] as LeadArchetype;
    if (["DETERMINISTIC", "AGENTIC", "GENERATIVE"].includes(first)) {
      return {
        archetype: first,
        source: "inferred",
        route: getRouteForArchetype(first),
      };
    }
  }

  // Heuristic: high decision density + high AI suitability => DETERMINISTIC
  // Low decision density + generative signals => GENERATIVE
  // Otherwise => AGENTIC (middle ground)
  let inferred: LeadArchetype = "DETERMINISTIC"; // safe default
  if (l4s.length > 0) {
    const decisionPct = hasDecisions / l4s.length;
    const aiPct = highAiCount / l4s.length;
    if (decisionPct < 0.3 && aiPct < 0.3) {
      inferred = "GENERATIVE";
    } else if (decisionPct < 0.5 || aiPct > 0.6) {
      inferred = "AGENTIC";
    }
  }

  return {
    archetype: inferred,
    source: "inferred",
    route: getRouteForArchetype(inferred),
  };
}
```

### Evaluation Pattern Differences by Archetype
```typescript
// How archetype affects the scoring prompts (Claude's Discretion):

// DETERMINISTIC: Emphasize rule-based decision automation.
//   - Technical: Weight "Aera Platform Fit" toward Process Builder capabilities.
//   - Adoption: Weight "Decision Density" highest -- deterministic skills need clear decisions to automate.
//   - Value: Emphasize quantifiable ROI and direct cost savings.

// AGENTIC: Emphasize AI-assisted decision support.
//   - Technical: Weight "Archetype Confidence" toward agent team patterns.
//   - Adoption: Weight "Confidence Signal" -- agentic skills need trust from users.
//   - Value: Emphasize productivity gains and decision quality improvement.

// GENERATIVE: Emphasize content/insight generation.
//   - Technical: Weight "Data Readiness" highest -- generative needs rich data inputs.
//   - Adoption: Weight "Impact Proximity" -- generative value must be visible quickly.
//   - Value: Emphasize novel capabilities not possible without AI.

// Implementation: Archetype context is injected into the system prompt for each lens.
// The scoring rubric descriptions change per archetype, but the 0-3 scale stays uniform.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ollama `format: "json"` (unstructured) | `format: { JSON Schema }` (structured) | Ollama v0.5 (2024) | Model output constrained to match schema; dramatically reduces parse failures |
| Manual JSON schema authoring | zod-to-json-schema from Zod definitions | Standard practice | Single source of truth for schema + validation |
| LLM confidence self-assessment | Algorithmic confidence from data signals | Domain best practice | Reproducible, not subject to LLM hallucination of confidence |

**Deprecated/outdated:**
- Ollama `format: "json"` without schema: Still works but provides no structural guarantees. Always use full JSON schema with the `format` parameter.
- `zod-to-json-schema` is in maintenance mode (Zod v4 has native `z.toJSONSchema()`), but project uses Zod 3.25.x so `zod-to-json-schema` is the correct choice.

## Open Questions

1. **Prompt Calibration Quality**
   - What we know: Qwen 2.5 32B is capable of structured JSON output and domain reasoning.
   - What's unclear: Whether scoring discrimination will be sufficient without iterative prompt tuning. Score clustering (Pitfall 3) may require multiple iterations.
   - Recommendation: Build the engine first with rubric-based prompts including anchor examples. Test with 5-10 opportunities from Ford data. Adjust rubric language if scores cluster. This is noted as a blocker/concern in STATE.md.

2. **Ollama Response Time per Opportunity**
   - What we know: 3 LLM calls per opportunity on Qwen 32B Q4. Apple Silicon (M-series) inference.
   - What's unclear: Exact per-call latency. Likely 15-45 seconds per call depending on prompt length.
   - Recommendation: Log timing per call. For 362 opportunities (minus ~25 skipped) = ~337 opportunities * 3 calls * 30 sec average = ~8.4 hours. This fits the overnight batch model. Add progress logging showing opportunity N/total and estimated remaining time.

3. **Token Budget per Prompt**
   - What we know: Qwen 32B has 32K context window. Prompts include system message + scoring rubric + opportunity data + L4 activities.
   - What's unclear: Exact token counts for large opportunities.
   - Recommendation: Estimate ~2K tokens for system prompt + rubric, ~500 tokens per L4 activity summary. Cap at 8 L4s in prompt (~6K total). Well within 32K window.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- uses package.json `"test": "node --test"` |
| Quick run command | `cd src && node --test scoring/*.test.ts --loader tsx` |
| Full suite command | `cd src && node --test **/*.test.ts --loader tsx` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCOR-01 | Technical Feasibility scoring (0-9) | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | Wave 0 |
| SCOR-02 | Adoption Realism scoring (0-12) | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | Wave 0 |
| SCOR-03 | Value & Efficiency scoring (0-6) | unit (mock LLM) | `cd src && node --test scoring/lens-scorers.test.ts --loader tsx` | Wave 0 |
| SCOR-04 | Weighted composite calculation | unit | `cd src && node --test scoring/composite.test.ts --loader tsx` | Wave 0 |
| SCOR-05 | Threshold gate (>= 0.60 promotes) | unit | `cd src && node --test scoring/composite.test.ts --loader tsx` | Wave 0 |
| SCOR-06 | Archetype classification + routing | unit | `cd src && node --test scoring/archetype-router.test.ts --loader tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && node --test scoring/*.test.ts --loader tsx`
- **Per wave merge:** `cd src && node --test **/*.test.ts --loader tsx`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/scoring/composite.test.ts` -- covers SCOR-04, SCOR-05 (pure math, no LLM)
- [ ] `src/scoring/confidence.test.ts` -- covers confidence tag computation
- [ ] `src/scoring/archetype-router.test.ts` -- covers SCOR-06 (no LLM dependency)
- [ ] `src/scoring/lens-scorers.test.ts` -- covers SCOR-01, SCOR-02, SCOR-03 with mocked Ollama responses
- [ ] `src/scoring/schemas.test.ts` -- covers Zod schema validation of LLM output shapes

### Testing Strategy Note
LLM-dependent tests (lens scorers) MUST use mocked Ollama responses to remain fast and deterministic. Create fixture JSON files with realistic LLM output for each lens. Test the validation + retry logic, not the LLM's scoring quality. LLM quality testing is a manual calibration concern, not an automated test concern.

## Sources

### Primary (HIGH confidence)
- Ollama structured outputs docs (https://docs.ollama.com/capabilities/structured-outputs) -- format parameter with JSON schema, JS/Zod examples
- Ollama API docs (https://github.com/ollama/ollama/blob/main/docs/api.md) -- /api/chat endpoint, stream/format parameters
- Project source: `src/infra/ollama.ts` -- established Ollama fetch pattern
- Project source: `src/types/hierarchy.ts` -- L3Opportunity, L4Activity type definitions with all scoring-relevant fields
- Project source: `src/types/triage.ts` -- TriageResult type (scoring engine input)
- Project source: `src/knowledge/orchestration.ts` -- getRouteForArchetype() for archetype routing
- Project source: `src/schemas/hierarchy.ts` -- established Zod schema patterns

### Secondary (MEDIUM confidence)
- zod-to-json-schema npm (https://www.npmjs.com/package/zod-to-json-schema) -- v3.24+ compatible with Zod 3.x
- Qwen 2.5 model page (https://ollama.com/library/qwen2.5:32b) -- model capabilities and context window
- Ollama blog on structured outputs (https://ollama.com/blog/structured-outputs) -- best practices for temperature and reliability

### Tertiary (LOW confidence)
- Scoring calibration approach: Based on general LLM evaluation best practices (rubric anchoring, concrete examples). No project-specific empirical data yet. Needs validation in Phase 4 implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Zod + zod-to-json-schema + native fetch, all verified against Ollama docs
- Architecture: HIGH -- follows established project patterns (pure functions, Result types, Zod validation)
- Pitfalls: HIGH -- LLM JSON reliability, context window, score clustering are well-documented challenges
- Prompt calibration: LOW -- no empirical testing yet; marked as open question
- Archetype routing: MEDIUM -- heuristic inference for null archetypes is reasonable but untested against real data

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain -- Ollama API and Zod are mature)
