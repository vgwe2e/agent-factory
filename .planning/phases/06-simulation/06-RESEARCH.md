# Phase 6: Simulation - Research

**Researched:** 2026-03-11
**Domain:** LLM-powered simulation artifact generation (Mermaid diagrams, YAML component maps, mock tests, integration surfaces) with knowledge base validation
**Confidence:** HIGH

## Summary

Phase 6 generates four concrete implementation artifacts for every opportunity that scored composite >= 0.60 in Phase 4: (1) Mermaid decision flow diagrams, (2) YAML component maps, (3) mock decision tests, and (4) integration surface maps. Each artifact is produced by a separate LLM call to the Qwen 2.5 32B model via Ollama, following the one-call-per-artifact pattern established in Phase 4's one-call-per-lens design. The critical differentiator from scoring is that simulation outputs are free-form text (Mermaid syntax, YAML documents) rather than structured JSON, which changes the validation strategy significantly.

The KNOW-04 requirement -- ensuring every component reference exists in the bundled knowledge base -- is the most technically interesting challenge. The knowledge base has 22 named Process Builder nodes, 21 named UI components (organized by category), 7 workflow patterns, and an orchestration decision guide with routes and integration patterns. Validation means post-processing LLM output to extract component references and checking each one against these known sets. The "confirmed" vs "inferred" confidence tagging on component maps adds a structured dimension to what is otherwise free-text generation.

The LLM output for this phase is NOT suited for Ollama's `format` parameter (which constrains JSON schema output). Mermaid diagrams are plain text with specific syntax. YAML can technically be constrained via JSON schema, but the nested structure with variable keys makes it impractical. Instead, the strategy is: generate plain text output, parse/validate it after generation, and retry on parse failure. For YAML specifically, parse with a YAML library (js-yaml or yaml) then validate the parsed structure with Zod. For Mermaid, use regex-based structural validation (check for flowchart declaration, node/edge syntax) rather than importing the full mermaid library.

**Primary recommendation:** Build four generator modules (one per artifact type), each as a prompt-builder + LLM-call + post-validation pipeline. Use `js-yaml` for YAML parsing and Zod for structure validation of parsed YAML. Use regex-based Mermaid syntax validation (not the full mermaid library, which has browser dependencies). Implement a knowledge base validator module that checks extracted component names against the Phase 2 knowledge modules. Output files to `evaluation/simulations/<skill-name>/` directory structure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Mermaid diagrams with happy path + 2-3 key decision branches (not exhaustive edge cases)
- One diagram per L3 opportunity -- no sub-flows
- Aera-specific node labels referencing actual knowledge base components (e.g., 'PB: Approval Gate', 'Cortex: Anomaly Detection')
- Full trigger-to-terminal scope: starts with data trigger event, ends with terminal action
- YAML format organized by Aera product area: streams, cortex, process_builder, agent_teams, ui
- Drill to specific components + properties from the knowledge base
- List components only -- no estimated counts or sizing
- Flag each mapping as "confirmed" (direct knowledge base match) or "inferred" (reasonable but not exact match)
- Validated against bundled knowledge base -- KNOW-04 compliance
- 1 happy-path test case per opportunity (not 3 or 5)
- YAML format with three fields: input, expected_output, rationale
- Input values derived from actual export financials (company_context, L4 financial_ratings) -- not literal copy-paste, not synthetic
- Use L4 decision_articulation text as the decision being tested when available
- When no decision_articulation exists, generate from opportunity summary
- Integration surface format: YAML document (not Mermaid, not table)
- Sections: source_systems, aera_ingestion, processing, ui_surface
- Source systems inferred from company_context.enterprise_applications array; mark as "TBD -- requires discovery" when no match
- Map to specific Aera Stream types where identifiable (Event Stream, Reference Stream, etc.)
- Structural connections only -- no data freshness or timing estimates

### Claude's Discretion
- LLM prompt design for generating Mermaid syntax reliably from 32B model
- Retry/validation strategy for malformed Mermaid or YAML output
- How to handle opportunities where lead_archetype is null
- Ordering of simulation generation (by tier, by archetype, or by score)
- Exact YAML schema structure for component maps and integration surfaces

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIMU-01 | Engine generates Mermaid decision flow diagrams for qualifying opportunities (composite >= 0.60) | LLM generates flowchart TD Mermaid syntax. Prompt includes opportunity context + knowledge base PB nodes + orchestration guide. Regex-based validation confirms flowchart structure. One .mmd file per opportunity. |
| SIMU-02 | Engine produces YAML component maps linking opportunities to specific Aera components | LLM generates YAML with 5 product area sections. js-yaml parses output, Zod validates structure. Knowledge base validator checks every component name against Phase 2 data. Confirmed/inferred flags per mapping. |
| SIMU-03 | Engine creates mock decision tests with sample inputs/outputs using actual client financials | LLM generates YAML with input/expected_output/rationale. Input values derived from company_context financials and L4 financial_ratings. decision_articulation used as decision-under-test when available. |
| SIMU-04 | Engine maps integration surfaces (source systems -> Aera -> process -> UI) | LLM generates YAML with 4 sections. enterprise_applications array drives source_systems section. Aera Stream types mapped where identifiable. "TBD" marker for unmatched sources. |
| KNOW-04 | Every generated component map and spec references only real Aera components from bundled knowledge base | Post-generation validator extracts component names from YAML, checks against getAllPBNodes() names (22), getAllComponents() names (21), workflow pattern names (7), integration pattern names (4), orchestration routes. Non-matching references flagged as "inferred". |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.24.0 (installed) | Validate parsed YAML structures against expected schemas | Already used project-wide. Validates LLM-generated content after YAML parsing. |
| js-yaml | ^4.1.0 | Parse YAML strings into JavaScript objects | Most popular YAML parser for Node.js (50M+ weekly downloads). Lightweight, zero dependencies. |
| zod-to-json-schema | (installed in Phase 4) | Convert Zod schemas for Ollama format parameter on structured portions | Already in project from Phase 4 scoring. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/js-yaml | ^4.0.9 | TypeScript definitions for js-yaml | Install alongside js-yaml for type safety |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| js-yaml | yaml (npm) | yaml has newer API but js-yaml is lighter and more battle-tested. Both work. js-yaml is simpler for load/dump. |
| Regex Mermaid validation | mermaid npm package (mermaid.parse()) | Full mermaid package is 2MB+, designed for browser rendering, has DOM dependencies. Node.js parse() has known issues (GitHub #6370). Regex for structural validation is sufficient for flowchart syntax checking. |
| Regex Mermaid validation | @mermaid-js/parser | Standalone parser but experimental. Regex is simpler and sufficient for validating LLM output structure. |

**Installation:**
```bash
cd src && npm install js-yaml @types/js-yaml
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  simulation/
    types.ts                    # SimulationResult, artifact type interfaces
    schemas.ts                  # Zod schemas for YAML artifact validation
    prompts/
      decision-flow.ts          # Mermaid diagram prompt builder
      component-map.ts          # Component map prompt builder
      mock-test.ts              # Mock decision test prompt builder
      integration-surface.ts    # Integration surface prompt builder
    generators/
      decision-flow-gen.ts      # Generate + validate Mermaid diagram
      component-map-gen.ts      # Generate + validate component map YAML
      mock-test-gen.ts          # Generate + validate mock test YAML
      integration-surface-gen.ts # Generate + validate integration surface YAML
    validators/
      mermaid-validator.ts      # Regex-based Mermaid flowchart syntax check
      knowledge-validator.ts    # KNOW-04: check component refs against knowledge base
    simulation-pipeline.ts      # Orchestrate: filter promoted -> generate 4 artifacts per opp -> write files
    simulation-pipeline.test.ts # Integration test with mocked LLM responses
  types/
    simulation.ts               # Exported simulation types (used by Phase 9)
```

### Pattern 1: Plain Text LLM Output with Post-Validation
**What:** Unlike Phase 4 scoring which used Ollama's `format` parameter for JSON schema constraints, simulation artifacts are generated as plain text (Mermaid) or loosely structured text (YAML). Validation happens AFTER generation, not during.
**When to use:** All four artifact generators.
**Example:**
```typescript
// Mermaid generation: no format parameter, plain text response
async function generateDecisionFlow(
  opportunity: L3Opportunity,
  l4s: L4Activity[],
  knowledgeContext: string,
): Promise<{ success: true; mermaid: string } | { success: false; error: string }> {
  const messages = buildDecisionFlowPrompt(opportunity, l4s, knowledgeContext);

  // No format parameter -- Mermaid is free-text
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:32b",
      messages,
      stream: false,
      options: { temperature: 0.3 }, // Slightly higher than scoring for creativity
    }),
  });

  const data = await response.json() as { message: { content: string } };
  const raw = data.message.content;

  // Extract Mermaid block if wrapped in markdown code fence
  const mermaid = extractMermaidBlock(raw);

  // Validate structure
  const valid = validateMermaidFlowchart(mermaid);
  if (!valid.ok) return { success: false, error: valid.error };

  return { success: true, mermaid };
}
```

### Pattern 2: YAML Generation with Zod Post-Validation
**What:** LLM generates YAML text. Parse with js-yaml.load(), validate parsed object with Zod schema.
**When to use:** Component maps, mock tests, integration surfaces.
**Example:**
```typescript
import yaml from "js-yaml";
import { z } from "zod";

const ComponentMapSchema = z.object({
  streams: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    confidence: z.enum(["confirmed", "inferred"]),
  })).default([]),
  cortex: z.array(z.object({
    name: z.string(),
    capability: z.string().optional(),
    confidence: z.enum(["confirmed", "inferred"]),
  })).default([]),
  process_builder: z.array(z.object({
    name: z.string(),
    node_type: z.string().optional(),
    purpose: z.string().optional(),
    confidence: z.enum(["confirmed", "inferred"]),
  })).default([]),
  agent_teams: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    confidence: z.enum(["confirmed", "inferred"]),
  })).default([]),
  ui: z.array(z.object({
    name: z.string(),
    component_type: z.string().optional(),
    properties: z.array(z.string()).optional(),
    confidence: z.enum(["confirmed", "inferred"]),
  })).default([]),
});

async function parseAndValidateYaml<T>(
  raw: string,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    // Strip markdown code fence if present
    const yamlStr = extractYamlBlock(raw);
    const parsed = yaml.load(yamlStr);
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
```

### Pattern 3: Knowledge Base Validation (KNOW-04)
**What:** After generating component maps and integration surfaces, extract all component names and validate each against the Phase 2 knowledge base. Flag non-matching references.
**When to use:** Post-generation validation for SIMU-02 and SIMU-04.
**Example:**
```typescript
import { getAllPBNodes } from "../knowledge/process-builder.js";
import { getAllComponents } from "../knowledge/components.js";
import { getWorkflowPatterns } from "../knowledge/process-builder.js";
import { getIntegrationPatterns } from "../knowledge/orchestration.js";

interface ValidationResult {
  component: string;
  section: string;
  status: "confirmed" | "inferred";
  matchedTo?: string;
}

function buildKnowledgeIndex(): Map<string, string> {
  const index = new Map<string, string>();

  // PB nodes (22)
  for (const node of getAllPBNodes()) {
    index.set(node.name.toLowerCase(), `PB:${node.name}`);
  }

  // UI components (21)
  for (const comp of getAllComponents()) {
    index.set(comp.name.toLowerCase(), `UI:${comp.name}`);
  }

  // Workflow patterns (7)
  for (const pattern of getWorkflowPatterns()) {
    index.set(pattern.name.toLowerCase(), `Pattern:${pattern.name}`);
  }

  // Integration patterns (4)
  for (const pattern of getIntegrationPatterns()) {
    index.set(pattern.name.toLowerCase(), `Integration:${pattern.name}`);
  }

  // Known Aera product concepts (not in knowledge base but valid references)
  const aeraConcepts = [
    "event stream", "reference stream", "transaction stream",
    "cortex", "aera chat", "action item", "inbox",
    "agent function", "llm agent", "autonomous agent",
    "subject area", "streams",
  ];
  for (const concept of aeraConcepts) {
    index.set(concept.toLowerCase(), `Aera:${concept}`);
  }

  return index;
}

function validateComponentRef(
  name: string,
  knowledgeIndex: Map<string, string>,
): "confirmed" | "inferred" {
  // Direct match
  if (knowledgeIndex.has(name.toLowerCase())) return "confirmed";

  // Fuzzy: check if any known component name is a substring
  for (const [known] of knowledgeIndex) {
    if (name.toLowerCase().includes(known) || known.includes(name.toLowerCase())) {
      return "confirmed";
    }
  }

  return "inferred";
}
```

### Pattern 4: Retry with Structural Repair
**What:** When Mermaid or YAML validation fails, retry with a refined prompt that includes the error message. LLMs can often fix their own output when told what went wrong.
**When to use:** On first validation failure for any artifact.
**Example:**
```typescript
async function generateWithRetry<T>(
  generateFn: () => Promise<string>,
  validateFn: (raw: string) => { success: true; data: T } | { success: false; error: string },
  repairPromptFn: (error: string) => Array<{ role: string; content: string }>,
  maxAttempts: number = 3,
): Promise<{ success: true; data: T; attempts: number } | { success: false; error: string }> {
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = attempt === 1
      ? await generateFn()
      : await callOllama(repairPromptFn(lastError));

    const result = validateFn(raw);
    if (result.success) {
      return { success: true, data: result.data, attempts: attempt };
    }

    lastError = result.error;
  }

  return { success: false, error: `Failed after ${maxAttempts} attempts: ${lastError}` };
}
```

### Pattern 5: File Output Structure
**What:** Each simulated opportunity gets a directory under evaluation/simulations/ named by a slugified version of l3_name.
**When to use:** File write step after all 4 artifacts generated.
**Example:**
```typescript
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Output structure:
// evaluation/simulations/<slug>/
//   decision-flow.mmd
//   component-map.yaml
//   mock-test.yaml
//   integration-surface.yaml
```

### Anti-Patterns to Avoid
- **Using Ollama `format` parameter for Mermaid output:** The format parameter constrains JSON output only. Mermaid is not JSON. Use plain text generation.
- **Using Ollama `format` parameter for YAML:** While YAML can map to JSON schema, the complexity of nested optional arrays makes it impractical. Generate as text, parse, validate.
- **Importing full mermaid npm package for validation:** 2MB+ with browser dependencies. Use regex-based structural checks instead.
- **Generating all 4 artifacts in a single LLM call:** Each artifact type has distinct context needs and output format. One call per artifact maintains quality and keeps context focused.
- **Skipping KNOW-04 validation:** The whole point is grounding in real components. Never output component maps without validation pass.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom YAML parser or regex extraction | `js-yaml` load() | YAML spec is complex (anchors, aliases, multi-doc). js-yaml handles edge cases. |
| YAML serialization | String concatenation | `js-yaml` dump() | Proper escaping, indentation, multi-line strings |
| Mermaid syntax construction | LLM from scratch each time | Provide template skeleton in prompt | LLMs produce more reliable Mermaid when given a structural template to fill in rather than generating from nothing |
| Component name matching | Exact string matching only | Case-insensitive + substring matching | LLM may reference "IF Node" vs "IF" or "Data View Node" vs "Data View" |
| File path sanitization | Basic string replace | Proper slugify with edge case handling | L3 names contain special characters, spaces, ampersands |

**Key insight:** The simulation artifacts are text-generation tasks, not structured-data tasks. The validation strategy shifts from "constrain the output" (Phase 4) to "validate after generation" (Phase 6). This is a fundamentally different pipeline shape.

## Common Pitfalls

### Pitfall 1: LLM Wraps Output in Markdown Code Fences
**What goes wrong:** LLM returns ````mermaid\n...\n````  or ````yaml\n...\n```` instead of raw content. Direct file write includes the fence markers, making the .mmd or .yaml file invalid.
**Why it happens:** Chat-trained models default to markdown formatting. Qwen 2.5 frequently wraps code output in fences.
**How to avoid:** Always strip markdown code fences from LLM output before validation. Use a simple regex: `/^```(?:mermaid|yaml|yml)?\n([\s\S]*?)\n```$/m` to extract the content block. Include "Do not wrap in code fences" in the system prompt, but always strip anyway.
**Warning signs:** YAML parse errors mentioning unexpected characters at position 0. Mermaid files starting with triple backticks.

### Pitfall 2: Mermaid Syntax Errors from LLM
**What goes wrong:** LLM generates Mermaid with common errors: unmatched brackets, missing arrow syntax (uses `->` instead of `-->`), uses reserved word `end` in lowercase, or generates diagram types other than flowchart.
**Why it happens:** LLMs have imprecise knowledge of Mermaid syntax details. The 32B quantized model is less reliable than larger models.
**How to avoid:** Provide a complete Mermaid flowchart template/example in the prompt. Use structural validation regex to catch common issues. Include explicit syntax reminders: "Use `-->` for arrows, not `->`. Capitalize `End` in node labels."
**Warning signs:** Generated .mmd files that don't render in Mermaid Live Editor.

### Pitfall 3: Knowledge Base Component Name Drift
**What goes wrong:** LLM references components with slightly different names than what's in the knowledge base. E.g., "Process Builder IF Node" vs "IF", "Table Component" vs "Table", "Aera Streams" vs "Stream".
**Why it happens:** LLM generates natural-language component names rather than exact knowledge base identifiers.
**How to avoid:** The knowledge base validator must use fuzzy matching (case-insensitive, substring). Include the exact component name list in the prompt. Consider providing a "component glossary" section listing all 22 PB nodes and 21 UI components by exact name.
**Warning signs:** High proportion of "inferred" flags when components should clearly match.

### Pitfall 4: YAML Indentation Errors from LLM
**What goes wrong:** YAML is whitespace-sensitive. LLM generates YAML with inconsistent indentation (mixing 2-space and 4-space, or using tabs). js-yaml throws YAMLException.
**Why it happens:** LLMs don't track indentation state perfectly across long outputs.
**How to avoid:** Pre-process LLM YAML output: normalize indentation (convert tabs to spaces), strip trailing whitespace. If yaml.load() fails, try a simple indentation repair pass before retrying with the LLM.
**Warning signs:** YAMLException with "bad indentation" or "end of the stream" errors.

### Pitfall 5: Empty or Minimal Artifact Generation
**What goes wrong:** For opportunities with sparse data (no decision_articulation, null archetype, few L4s), LLM generates trivially simple artifacts -- a 3-node Mermaid diagram, a component map with only 1-2 entries.
**Why it happens:** Insufficient context for the LLM to generate meaningful content.
**How to avoid:** Set minimum complexity expectations in prompts. For opportunities with sparse data, use the opportunity_summary and rationale fields as additional context. Accept that some simulations will be thinner than others -- this is honest and useful for SE teams.
**Warning signs:** Generated artifacts consistently under 10 lines for certain opportunities.

### Pitfall 6: Context Window Competition Between Artifacts
**What goes wrong:** The knowledge base context (22 PB nodes, 21 UI components with properties, orchestration guide) is large. Combined with opportunity data and L4 activities, prompts may approach 32K token limit.
**Why it happens:** Each artifact prompt includes opportunity-specific data + relevant knowledge base context.
**How to avoid:** Include only relevant knowledge base subsets per artifact type. Decision flow prompts: PB nodes + orchestration patterns. Component map prompts: all knowledge base sections but summarized. Mock test prompts: minimal knowledge base (just decision_articulation + financials). Integration surface prompts: orchestration patterns + enterprise_applications.
**Warning signs:** LLM responses are truncated or become generic/repetitive.

## Code Examples

### Mermaid Structural Validation (Regex-Based)
```typescript
// Source: Mermaid syntax documentation (mermaid.js.org/syntax/flowchart.html)

interface MermaidValidation {
  ok: boolean;
  error?: string;
}

function validateMermaidFlowchart(content: string): MermaidValidation {
  const lines = content.trim().split("\n");

  // Must start with flowchart direction declaration
  const firstLine = lines[0]?.trim() ?? "";
  if (!/^flowchart\s+(TD|TB|BT|RL|LR)$/i.test(firstLine)) {
    return { ok: false, error: `First line must be flowchart direction (e.g., "flowchart TD"), got: "${firstLine}"` };
  }

  // Must have at least 3 lines (declaration + 2 nodes/edges minimum)
  if (lines.length < 3) {
    return { ok: false, error: `Flowchart too short (${lines.length} lines). Need at least a declaration and 2 edges.` };
  }

  // Check for at least one edge (-->)
  const hasEdge = lines.some(l => /-->/.test(l));
  if (!hasEdge) {
    return { ok: false, error: "No edges found. Flowchart must contain at least one --> connection." };
  }

  // Check for lowercase "end" used as node name (Mermaid gotcha)
  const hasLowercaseEnd = lines.some(l => /\bend\b/.test(l) && !/\bEnd\b/.test(l) && !/subgraph/.test(l));
  if (hasLowercaseEnd) {
    return { ok: false, error: 'Lowercase "end" found. Capitalize to "End" to avoid Mermaid parser issues.' };
  }

  return { ok: true };
}
```

### Extract Code Block from LLM Response
```typescript
function extractMermaidBlock(raw: string): string {
  // Try to extract from markdown code fence
  const fenceMatch = raw.match(/```(?:mermaid)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // If no fence, assume raw content is the diagram
  return raw.trim();
}

function extractYamlBlock(raw: string): string {
  const fenceMatch = raw.match(/```(?:ya?ml)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return raw.trim();
}
```

### Decision Flow Prompt Builder
```typescript
// Provides opportunity context + PB nodes + orchestration routing
function buildDecisionFlowPrompt(
  opp: L3Opportunity,
  l4s: L4Activity[],
  pbNodes: string,      // Serialized PB node list
  orchestrationRoute: string, // From archetype routing
): Array<{ role: string; content: string }> {
  const decisions = l4s
    .filter(l4 => l4.decision_articulation)
    .map(l4 => `- ${l4.name}: ${l4.decision_articulation}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are an Aera platform solutions engineer generating decision flow diagrams.
Output ONLY valid Mermaid flowchart syntax. Do not wrap in code fences.

Rules:
- Start with "flowchart TD"
- Use --> for connections
- Use descriptive node labels referencing Aera components: PB: <node>, Cortex: <capability>, UI: <component>
- Include happy path plus 2-3 key decision branches
- Start with a data trigger event, end with a terminal action
- Capitalize "End" if used as a node label (never lowercase "end")

Available Process Builder nodes:
${pbNodes}

Orchestration route: ${orchestrationRoute}`,
    },
    {
      role: "user",
      content: `Generate a Mermaid decision flow diagram for this opportunity:

Name: ${opp.l3_name}
Summary: ${opp.opportunity_summary ?? opp.rationale}
Archetype: ${opp.lead_archetype ?? "UNKNOWN"}
Complexity: ${opp.implementation_complexity ?? "UNKNOWN"}

Key decisions from L4 activities:
${decisions || "No explicit decisions articulated -- infer from opportunity summary."}

L4 activity names: ${l4s.map(l4 => l4.name).join(", ")}`,
    },
  ];
}
```

### Component Map Zod Schema
```typescript
const ComponentRefSchema = z.object({
  name: z.string(),
  purpose: z.string().optional(),
  confidence: z.enum(["confirmed", "inferred"]),
});

const ComponentMapSchema = z.object({
  streams: z.array(ComponentRefSchema.extend({
    type: z.string().optional(), // Event Stream, Reference Stream, etc.
  })).default([]),
  cortex: z.array(ComponentRefSchema.extend({
    capability: z.string().optional(),
  })).default([]),
  process_builder: z.array(ComponentRefSchema.extend({
    node_type: z.string().optional(),
  })).default([]),
  agent_teams: z.array(ComponentRefSchema.extend({
    role: z.string().optional(),
  })).default([]),
  ui: z.array(ComponentRefSchema.extend({
    component_type: z.string().optional(),
    properties: z.array(z.string()).optional(),
  })).default([]),
});

type ComponentMap = z.infer<typeof ComponentMapSchema>;
```

### Mock Test Zod Schema
```typescript
const MockTestSchema = z.object({
  decision: z.string(),
  input: z.object({
    financial_context: z.record(z.unknown()),
    trigger: z.string(),
    parameters: z.record(z.unknown()).optional(),
  }),
  expected_output: z.object({
    action: z.string(),
    outcome: z.string(),
    affected_components: z.array(z.string()).optional(),
  }),
  rationale: z.string(),
});
```

### Integration Surface Zod Schema
```typescript
const IntegrationSurfaceSchema = z.object({
  source_systems: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    status: z.enum(["identified", "tbd"]).default("identified"),
  })),
  aera_ingestion: z.array(z.object({
    stream_name: z.string(),
    stream_type: z.string().optional(), // Event Stream, Reference Stream
    source: z.string(),
  })),
  processing: z.array(z.object({
    component: z.string(),
    type: z.string(), // process_builder, cortex, agent_team
    function: z.string(),
  })),
  ui_surface: z.array(z.object({
    component: z.string(),
    screen: z.string().optional(),
    purpose: z.string(),
  })),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM format parameter for all outputs | Format parameter only for JSON; plain text for Mermaid/YAML | Current best practice | Avoids fighting the format constraint for non-JSON output |
| Full mermaid npm for validation | Regex-based structural validation | Practical choice for server-side | Avoids 2MB+ browser-oriented dependency |
| Single monolithic simulation prompt | Separate prompt per artifact type | Following Phase 4 one-call-per-lens pattern | Better context focus, easier debugging, independent retry |

**Deprecated/outdated:**
- Using Ollama `format: "json"` and asking for YAML inside JSON: Convoluted. Generate YAML directly as text.

## Open Questions

1. **Temperature Setting for Simulation**
   - What we know: Phase 4 scoring uses temperature=0 for determinism. Simulation benefits from some creativity in diagram design and component mapping.
   - What's unclear: Optimal temperature for Qwen 32B for text generation quality.
   - Recommendation: Use temperature=0.3 for simulation (slightly creative but still focused). This is Claude's discretion per CONTEXT.md.

2. **Ordering of Simulation Generation**
   - What we know: Opportunities arrive sorted by composite score (descending) from Phase 4.
   - What's unclear: Whether processing by score, tier, or archetype affects output quality.
   - Recommendation: Process by composite score descending (highest first). This ensures the most promising opportunities are simulated first if the run is interrupted. This is Claude's discretion per CONTEXT.md.

3. **Handling Null Lead Archetype in Simulation**
   - What we know: Phase 4 scoring resolves null archetypes via the archetype-router. The resolved archetype + route should be available to simulation.
   - What's unclear: Whether the Phase 4 ScoringResult type includes the resolved archetype.
   - Recommendation: Simulation consumes ScoringResult which includes resolved archetype (never null). Use the archetype to route prompt context (which PB patterns to emphasize, which orchestration route to highlight). This is Claude's discretion per CONTEXT.md.

4. **Throughput and Duration**
   - What we know: 4 LLM calls per opportunity on 32B model. If ~50-100 opportunities score >= 0.60 (estimated from 337 processable, 60% threshold), that's 200-400 calls.
   - What's unclear: Exact per-call latency for text generation (vs JSON-constrained generation in Phase 4).
   - Recommendation: Estimate 20-40 seconds per text generation call. For 80 opportunities: 80 * 4 * 30s = 2.7 hours. Fits overnight batch window. Log progress as "Simulating opportunity N/M".

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none -- uses package.json `"test": "node --test"` |
| Quick run command | `cd src && node --test simulation/*.test.ts --loader tsx` |
| Full suite command | `cd src && node --test **/*.test.ts --loader tsx` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIMU-01 | Mermaid diagram generation + validation | unit (mock LLM) | `cd src && node --test simulation/generators/decision-flow-gen.test.ts --loader tsx` | Wave 0 |
| SIMU-02 | Component map YAML generation + validation + KNOW-04 | unit (mock LLM) | `cd src && node --test simulation/generators/component-map-gen.test.ts --loader tsx` | Wave 0 |
| SIMU-03 | Mock test YAML generation + validation | unit (mock LLM) | `cd src && node --test simulation/generators/mock-test-gen.test.ts --loader tsx` | Wave 0 |
| SIMU-04 | Integration surface YAML generation + validation | unit (mock LLM) | `cd src && node --test simulation/generators/integration-surface-gen.test.ts --loader tsx` | Wave 0 |
| KNOW-04 | Knowledge base component reference validation | unit | `cd src && node --test simulation/validators/knowledge-validator.test.ts --loader tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && node --test simulation/**/*.test.ts --loader tsx`
- **Per wave merge:** `cd src && node --test **/*.test.ts --loader tsx`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/simulation/validators/mermaid-validator.test.ts` -- covers SIMU-01 structural validation
- [ ] `src/simulation/validators/knowledge-validator.test.ts` -- covers KNOW-04 component matching
- [ ] `src/simulation/schemas.test.ts` -- covers Zod schema validation for all 3 YAML artifact types
- [ ] `src/simulation/generators/decision-flow-gen.test.ts` -- covers SIMU-01 with mocked LLM
- [ ] `src/simulation/generators/component-map-gen.test.ts` -- covers SIMU-02 with mocked LLM + KNOW-04
- [ ] `src/simulation/generators/mock-test-gen.test.ts` -- covers SIMU-03 with mocked LLM
- [ ] `src/simulation/generators/integration-surface-gen.test.ts` -- covers SIMU-04 with mocked LLM

### Testing Strategy Note
Same as Phase 4: LLM-dependent tests MUST use mocked Ollama responses. Create fixture YAML/Mermaid strings with realistic content for each artifact type. Test the parse + validate + knowledge-check pipeline, not LLM generation quality. The knowledge-validator tests can use real knowledge base data since it loads from bundled JSON files.

## Sources

### Primary (HIGH confidence)
- Project source: `src/infra/ollama.ts` -- Ollama fetch pattern, model names, API URL
- Project source: `src/knowledge/components.ts` -- 21 UI components, getComponent(), getAllComponents()
- Project source: `src/knowledge/process-builder.ts` -- 22 PB nodes, getPBNode(), getAllPBNodes(), getWorkflowPatterns()
- Project source: `src/knowledge/orchestration.ts` -- orchestration routes, archetype mapping, integration patterns
- Project source: `src/types/hierarchy.ts` -- L3Opportunity, L4Activity with all fields needed as simulation input
- Project source: `src/schemas/hierarchy.ts` -- Zod validation pattern established for runtime validation
- Phase 4 research: `.planning/phases/04-scoring-engine/04-RESEARCH.md` -- Ollama chat pattern, retry strategy, archetype routing

### Secondary (MEDIUM confidence)
- [Mermaid flowchart syntax docs](https://mermaid.js.org/syntax/flowchart.html) -- official syntax reference, common gotchas (lowercase "end", "o"/"x" prefixes)
- [js-yaml npm](https://www.npmjs.com/package/js-yaml) -- YAML parsing library, load/dump API
- [Ollama API docs](https://github.com/ollama/ollama/blob/main/docs/api.md) -- /api/chat endpoint, stream/format parameters
- [Mermaid parse() issue](https://github.com/mermaid-js/mermaid/issues/6370) -- Node.js parse() has known issues, confirming regex approach

### Tertiary (LOW confidence)
- Temperature setting (0.3) for text generation: based on general LLM prompting experience, not empirically validated with Qwen 32B for this specific task.
- Throughput estimate (20-40s per call): extrapolated from Phase 4 scoring estimates, not measured.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- js-yaml is battle-tested, Zod is established project pattern, no exotic dependencies
- Architecture: HIGH -- follows Phase 4 patterns (prompt builder + LLM call + validation), adapted for text output
- Knowledge base validation (KNOW-04): HIGH -- knowledge base modules are fully implemented with lookup APIs
- Mermaid validation approach: MEDIUM -- regex-based is pragmatic but may miss edge cases; full parser would be more thorough
- Prompt design for reliable output: MEDIUM -- specific prompts are Claude's discretion, general strategy is sound
- Pitfalls: HIGH -- text generation + parsing is well-understood problem domain

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain -- Ollama API, js-yaml, Mermaid syntax are mature)
