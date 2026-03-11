# Domain Pitfalls

**Domain:** CLI-based catalog evaluation engine with local LLM orchestration
**Researched:** 2026-03-10

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Context Window Overflow with Large Catalogs

**What goes wrong:** Feeding accumulated evaluation context into each LLM call causes the context to exceed the model's window (32K-128K tokens for Qwen 2.5 models). Responses degrade silently -- the model starts ignoring early context, producing inconsistent scores.
**Why it happens:** 362 opportunities with detailed descriptions, plus scoring rubrics, plus knowledge base excerpts, plus accumulated results easily exceeds 32K tokens.
**Consequences:** Scoring becomes unreliable after the first ~20-30 evaluations. Overnight run produces garbage for the remaining 330+ opportunities without any visible error.
**Prevention:** Strict context budgeting per call. Each LLM call gets: (1) the current opportunity, (2) the relevant scoring rubric, (3) a compressed summary of prior evaluations, (4) relevant knowledge base excerpt. Total budget: under 8K tokens input. Summarize and archive aggressively between batches.
**Detection:** Monitor response token counts. If input tokens approach 16K, the context management is failing.

### Pitfall 2: LLM Output Format Drift During Long Runs

**What goes wrong:** The LLM produces valid JSON for the first 50 calls, then starts drifting -- adding extra fields, changing key names, wrapping in markdown fences inconsistently, or switching between array and object formats.
**Why it happens:** Local models (especially quantized) have less output format consistency than cloud API models. Temperature, context, and prior conversation history all influence output format.
**Consequences:** Zod validation starts failing mid-run. Without retry logic, the pipeline crashes at 3am with 200 evaluations incomplete.
**Prevention:** (1) Zod validation on every response. (2) Retry with explicit "output valid JSON" correction prompt on parse failure. (3) Include a concrete JSON example in every prompt (few-shot). (4) Set temperature to 0.1-0.3 for structured output calls. (5) Strip markdown code fences before JSON.parse.
**Detection:** Track parse failure rate per batch. If more than 10% of calls need retries, the prompt needs revision.

### Pitfall 3: Model Memory Exhaustion on Apple Silicon

**What goes wrong:** Loading the 32B model uses ~20GB GPU memory. With Node.js heap, OS overhead, and Ollama's runtime, total memory exceeds 36GB. The system starts swapping to disk, Ollama becomes unresponsive, or the process gets OOM-killed.
**Why it happens:** 36GB is tight for 32B Q4_K_M plus application overhead. Memory pressure increases over long runs as OS caches and Node.js heap grow.
**Consequences:** Overnight run dies silently. Or worse, performance degrades 100x due to swap thrashing, and the run produces only 20% of expected output by morning.
**Prevention:** (1) Explicitly unload models between phases via Ollama API. (2) Use Q4_K_S (smaller quantization) if Q4_K_M causes pressure. (3) Monitor memory with a periodic check: if available memory drops below 4GB, pause and force GC. (4) Set Node.js `--max-old-space-size=4096` to cap heap. (5) Never run 8B and 32B models simultaneously.
**Detection:** Log system memory at each batch boundary. Alert threshold: under 4GB available.

### Pitfall 4: Prompt Engineering Treated as Afterthought

**What goes wrong:** Developers build the pipeline infrastructure first, then hastily write prompts. The prompts produce low-quality, inconsistent evaluations that undermine the entire scoring system.
**Why it happens:** Prompt engineering for structured evaluation is genuinely hard. It requires iterating on rubric wording, few-shot examples, output format instructions, and edge case handling.
**Consequences:** The engine runs overnight and produces a beautifully formatted report full of meaningless scores. "Technical Feasibility: 0.72" means nothing if the rubric is not carefully calibrated.
**Prevention:** (1) Design prompts FIRST, pipeline second. (2) Test prompts manually with 5-10 representative opportunities before building automation. (3) Version-control prompts as first-class artifacts. (4) Include ground truth comparisons: manually score 10 opportunities, then measure LLM alignment.
**Detection:** Human review of first batch output before committing to overnight run. Does the scoring feel calibrated?

### Pitfall 5: No Crash Recovery for Overnight Runs

**What goes wrong:** A 6-hour overnight run crashes at hour 4 (Ollama timeout, disk full, thermal throttling). Zero results are available in the morning because all state was in memory.
**Why it happens:** Developers test with small inputs (10 opportunities) where crashes do not happen, then run the full 362 without persistence.
**Consequences:** Wasted night. Must re-run everything.
**Prevention:** File-based state persistence after each evaluation cycle. Git commit at stage boundaries. On restart, detect existing outputs and resume from last incomplete stage.
**Detection:** Verify resume logic works by intentionally killing the process mid-run and restarting.

## Moderate Pitfalls

### Pitfall 1: Scoring Rubric Miscalibration

**What goes wrong:** All opportunities score between 0.55-0.65, or all score above 0.80, making the ranking useless.
**Prevention:** Calibrate rubrics against manually-scored ground truth. Ensure the scoring scale uses its full range. Include explicit anchor points in prompts ("0.2 means X, 0.5 means Y, 0.8 means Z").

### Pitfall 2: Knowledge Base Staleness

**What goes wrong:** The bundled Aera knowledge base (21 UI components, 22 PB nodes) becomes outdated as Aera evolves. Specs reference deprecated components.
**Prevention:** Version the knowledge base with a date stamp. Include a "last verified" field. Make knowledge base updates a maintenance task, not an afterthought.

### Pitfall 3: Ollama API Timeout Without Retry

**What goes wrong:** Ollama occasionally returns 500 errors or times out (especially after thermal throttling). A single failure crashes the pipeline.
**Prevention:** Implement exponential backoff with 3 retries. Set reasonable timeout (120s for 32B, 30s for 8B). Log failures but continue processing remaining opportunities.

### Pitfall 4: TSV/Markdown Output Encoding Issues

**What goes wrong:** Opportunity descriptions containing tabs, newlines, or special characters break TSV output or corrupt markdown tables.
**Prevention:** Sanitize all text fields before writing to TSV (replace tabs with spaces, strip newlines). Use proper markdown escaping for table cells.

### Pitfall 5: Git Commit Overhead Kills Throughput

**What goes wrong:** Committing after every single evaluation (362 times) takes 10+ minutes total and fragments the git history into uselessness.
**Prevention:** Commit at batch boundaries (every 10 evaluations) or at stage boundaries (after triage, after scoring, etc.), not after every individual evaluation.

## Minor Pitfalls

### Pitfall 1: Inconsistent Mermaid Syntax

**What goes wrong:** LLM generates Mermaid text with invalid syntax (unescaped brackets, missing arrows, duplicate node IDs).
**Prevention:** Validate generated Mermaid syntax against basic rules before writing. Use template-driven generation where the LLM fills data slots, not freeform Mermaid.

### Pitfall 2: Hard-Coded Model Names

**What goes wrong:** Model names like `qwen2.5:32b-instruct-q4_K_M` are scattered through the codebase. Switching models requires find-and-replace.
**Prevention:** Define model names in a single config object. Pass model identifiers through the LLM client, not in individual prompt calls.

### Pitfall 3: Evaluation Directory Conflicts

**What goes wrong:** Running the engine twice without clearing the output directory mixes artifacts from different runs.
**Prevention:** Use timestamped output directories (`evaluation/2026-03-10T22:00/`) or prompt to overwrite. Never silently merge with existing output.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Ingestion and Validation | Hierarchy JSON schema drift between clients | Make Zod schema permissive on optional fields, strict on required ones |
| Triage (8B model) | 8B model misclassifies nuanced opportunities | Accept higher error rate at triage; scoring stage corrects with 32B |
| Scoring (3-lens) | Adoption Realism lens is subjective and hard to calibrate | Ground truth: manually score 10 opportunities, iterate prompt until alignment |
| Simulation (decision flows) | Mermaid output quality from LLM is unpredictable | Template-driven generation; LLM fills structured data, code builds Mermaid |
| Spec Writing | Specs reference hallucinated Aera capabilities | Constrain LLM to knowledge base components only via system prompt + validation |
| Overnight Execution | Thermal throttling on Apple Silicon during 6-hour run | Monitor token/sec rate; if it drops over 50%, pause 10 minutes for cooldown |
| Meta-Reflections | Reflections are generic platitudes, not actionable patterns | Include concrete data (score distributions, archetype ratios) in reflection prompt |

## Sources

- [Qwen 2.5 32B Apple Silicon performance](https://dev.to/atsushiambo/running-qwen-nearly-as-powerful-as-deepseek-on-a-macbook-pro-367k) - Memory usage and thermal behavior
- [Ollama documentation](https://docs.ollama.com) - API behavior, timeout characteristics
- [Aera Skill Feasibility Engine PROJECT.md](../.planning/PROJECT.md) - Hardware constraints and requirements
