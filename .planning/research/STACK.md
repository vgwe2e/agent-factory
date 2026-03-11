# Technology Stack

**Project:** Aera Skill Feasibility Engine
**Researched:** 2026-03-10

## Recommended Stack

### Language & Runtime

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | 5.9.x | Primary language | Already used in agent-factory (seed/package.json has 5.9.3). Type safety is essential for a multi-stage pipeline with complex data shapes (scoring lenses, component maps, hierarchy schemas). | HIGH |
| Node.js | >= 22.x | Runtime | LTS branch with native TS type-stripping support. The engine is I/O-bound (Ollama HTTP calls, file writes, git ops) -- Node's async model is ideal. No CPU-bound compute that would favor Go/Rust. | HIGH |
| tsx | 4.21.x | Dev runner | Zero-config TS execution via esbuild. Use for development and as the production runner (`tsx src/main.ts`). No separate build step needed for a CLI tool that won't be published to npm. Avoids tsconfig/bundler complexity entirely. | HIGH |

**Why not native Node TS stripping?** Node's `--experimental-strip-types` is enabled by default in v23+ but still experimental, doesn't support enums or parameter properties, and emits warnings on v22 LTS. tsx is battle-tested and zero-friction.

**Why not Python?** The existing agent-factory codebase is TypeScript/Node. Sharing patterns (git auto-commit, file persistence, loop-forever) is easier in the same language. Python's Ollama client is equivalent, but consistency with the monorepo wins.

### CLI Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Commander.js | 14.x | CLI argument parsing | Zero dependencies, 25ms startup, 500M+ weekly downloads. This engine has exactly one command (`evaluate`) with a few flags (`--input`, `--output-dir`, `--dry-run`, `--model`). Commander handles this trivially. Oclif's scaffolding/plugins are overkill for a single-command CLI. | HIGH |

**Why not yargs?** 7 dependencies, 48ms startup, and the declarative API adds nothing for a single-command tool. Commander's imperative `.option()` chain is clearer for this use case.

**Why not oclif?** 30 dependencies, 135ms startup, designed for multi-command plugin-extensible CLIs (like Salesforce CLI). This engine is one command. Oclif would add complexity with zero benefit.

### LLM Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ollama (official) | 0.6.x | Ollama API client | Official client from the Ollama team. Supports chat, generate, streaming, model management. TypeScript types included. Direct mapping to Ollama REST API. | HIGH |

**Why not LangChain?** LangChain adds a massive abstraction layer (chains, agents, memory, vector stores) that this engine does not need. The engine makes direct prompt-in/text-out calls with structured output parsing. The `ollama` package's `chat()` method is the entire API surface needed. LangChain would add hundreds of dependencies for zero value.

**Why not Vercel AI SDK + ollama provider?** The AI SDK is designed for streaming UI responses in web apps. This engine processes batch results synchronously (wait for full response, parse, score, continue). The AI SDK's streaming-first design is the wrong abstraction.

### Schema Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 4.x | Runtime validation + type inference | Validates hierarchy JSON imports (2000+ activities), scoring outputs, component maps, and LLM response parsing. Zod 4 has native JSON Schema export, which could feed structured output instructions to the LLM. Single source of truth for types and validation. | HIGH |

**Why not TypeBox?** TypeBox is JSON Schema-first, which matters for OpenAPI specs. This engine is TypeScript-first -- Zod's inference from schema-to-type is the natural direction. Zod's ecosystem is also 10x larger.

**Why not io-ts?** Effectively unmaintained. Zod won the TypeScript validation war.

### File I/O & Output Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| yaml (eemeli/yaml) | 2.x | YAML serialization for component maps | Modern YAML 1.2 library with TypeScript types, no external dependencies. `js-yaml` is older and YAML 1.1-focused. | MEDIUM |
| Node.js fs/promises | built-in | File read/write | Native async file operations. No library needed for writing markdown, TSV, and Mermaid files -- they're all plain text. | HIGH |

**Mermaid generation:** Do NOT install the `mermaid` npm package (11.x). The engine generates Mermaid *source text* (`.mmd` files), not rendered images. Mermaid syntax is simple string concatenation:

```typescript
const mermaid = `graph TD\n  A[${stepName}] --> B[${nextStep}]`;
fs.writeFileSync('diagram.mmd', mermaid);
```

The `mermaid` package is a 5MB browser-based renderer. The engine only needs to produce `.mmd` text files that humans view in VS Code, GitHub, or Mermaid Live Editor.

**TSV generation:** Use template literals or a simple `join('\t')`. Do NOT install a CSV library for tab-separated output.

### Git Operations

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| simple-git | 3.x | Programmatic git commits | The engine auto-commits artifacts during overnight runs. simple-git provides a clean async API for `add`, `commit`, `log` with TypeScript types. Avoids fragile `child_process.exec('git ...')` string interpolation. | HIGH |

**Why not raw child_process?** The engine commits after every evaluation cycle. simple-git handles quoting, error parsing, and async correctly. Worth the single dependency.

### Logging

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pino | 9.x | Structured logging | JSON-structured logs are essential for debugging overnight unattended runs. Pino is the fastest Node logger (async I/O, minimal serialization overhead). Pipe to `pino-pretty` during development, raw JSON to file in production. | HIGH |
| pino-pretty | 13.x | Dev log formatting | Human-readable log output during development. Not used in overnight runs. | HIGH |

**Why not Winston?** Winston is 5x slower than Pino in benchmarks. For an overnight batch process generating thousands of log entries, Pino's performance matters. Winston's flexibility (multiple transports, custom formats) is unnecessary -- the engine logs to stdout + file.

**Why not console.log?** No structured data, no log levels, no timestamps, impossible to debug a failed overnight run from output alone.

### Concurrency Control

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| p-queue | 8.x | LLM call queue management | The engine sends many Ollama requests (triage 362 opportunities, then score, then simulate). p-queue provides concurrency limits, priority ordering, and pause/resume. Essential for managing the 8B triage model vs 32B reasoning model on shared GPU memory. | MEDIUM |

**Why p-queue over p-limit?** p-queue adds priority support (triage calls at lower priority than scoring calls) and `.onIdle()` for clean phase transitions. p-limit is concurrency-only with no queue semantics.

**Practical note:** On 36GB Apple Silicon running Qwen 2.5 32B, effective Ollama concurrency is 1 (the model saturates GPU memory). p-queue's value is in *sequencing* and *model switching* (unload 32B, load 8B for bulk triage, then switch back), not parallel execution.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js test runner | built-in | Unit/integration tests | Node 22+ has a stable built-in test runner (`node --test`). Zero dependencies. Supports describe/it, assertions, mocking, and test isolation. No reason to install vitest/jest for a CLI tool. | MEDIUM |

**Why not Vitest?** Vitest excels for projects with Vite. This is a CLI tool with no bundler. The built-in runner is sufficient and adds zero dependencies.

## Model Strategy (Not a Stack Decision, But Stack-Adjacent)

| Model | Size | Quantization | Memory | Use Case |
|-------|------|-------------|--------|----------|
| Qwen 2.5 7B | 7B | Q4_K_M | ~5GB | Bulk triage, simple classification, red-flag detection |
| Qwen 2.5 32B | 32B | Q4_K_M | ~20GB | Scoring, reasoning, spec writing, simulation |

**Memory management:** On 36GB, running the 32B model leaves ~16GB for OS + Node. The engine MUST unload models between phases (`ollama.delete()` or API call to unload). Running 7B and 32B simultaneously is not viable.

**Token budget per call:** At 32B Q4 on Apple Silicon M-series, expect ~8-12 tokens/second. A scoring call with 2000-token context + 500-token response takes ~40-60 seconds. Budget accordingly for overnight runs of 362 opportunities.

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| LangChain / LlamaIndex | Massive abstraction layers designed for RAG pipelines and agent chains. This engine makes direct LLM calls with structured prompts. The complexity tax is enormous for zero benefit. |
| Vercel AI SDK | Streaming-first, UI-focused. Wrong abstraction for batch processing. |
| mermaid (npm) | 5MB browser renderer. Engine generates .mmd text, not SVG/PNG. |
| csv-parse / papaparse | Overkill for writing TSV. `array.join('\t')` is the entire implementation. |
| dotenv | Use Node 22's built-in `--env-file` flag instead. |
| chalk / kleur | Minimal terminal output needed. The engine runs unattended overnight. Use pino for structured logging, not colored console output. |
| inquirer / prompts | Zero interactive prompts. This is a batch CLI, not an interactive tool. |
| oclif | Plugin system and multi-command scaffolding for a single-command tool. |
| express / fastify | No HTTP server. This is a CLI tool. |
| prisma / drizzle / any ORM | No database. All state is files (JSON, YAML, markdown, TSV). |
| Docker | Runs directly on the host where Ollama is installed. Docker adds GPU passthrough complexity on macOS with zero benefit. |

## Full Dependency List

### Production Dependencies

```bash
npm install commander ollama zod yaml simple-git pino p-queue
```

7 production dependencies. Deliberately minimal.

### Dev Dependencies

```bash
npm install -D typescript tsx @types/node pino-pretty
```

4 dev dependencies.

### package.json Shape

```json
{
  "name": "aera-skill-engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "aera-evaluate": "./bin/evaluate.mjs"
  },
  "scripts": {
    "evaluate": "tsx src/main.ts",
    "dev": "tsx watch src/main.ts",
    "test": "node --test --experimental-test-snapshots src/**/*.test.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

**ESM-only.** No CJS support needed. `"type": "module"` with tsx handles everything.

## Project Structure

```
aera-skill-engine/
  src/
    main.ts              # CLI entry point (commander setup)
    pipeline/
      ingest.ts          # Parse hierarchy JSON, validate with Zod
      triage.ts          # Tier 1/2/3 classification (8B model)
      score.ts           # 3-lens scoring (32B model)
      simulate.ts        # Decision flow generation (32B model)
      spec.ts            # Implementation spec writing (32B model)
      reflect.ts         # Meta-reflections across evaluations
    llm/
      client.ts          # Ollama wrapper with retry, timeout, model switching
      prompts.ts         # Prompt templates for each pipeline stage
      context.ts         # Context window management (summarize, archive, reset)
    schema/
      hierarchy.ts       # Zod schemas for input hierarchy JSON
      scoring.ts         # Zod schemas for scoring outputs
      components.ts      # Zod schemas for Aera component maps
    output/
      markdown.ts        # Report generation
      mermaid.ts         # Decision flow diagram text generation
      yaml-writer.ts     # Component map YAML output
      tsv.ts             # TSV output utilities
    knowledge/
      components.ts      # Bundled Aera UI components (21)
      process-builder.ts # Bundled PB nodes (22)
      patterns.ts        # Orchestration patterns
    utils/
      git.ts             # simple-git wrapper for auto-commit
      logger.ts          # pino configuration
      queue.ts           # p-queue setup for LLM call management
  evaluation/            # Output directory (gitignored until committed by engine)
  knowledge/             # Static Aera knowledge base (YAML/JSON)
  test/
    fixtures/            # Sample hierarchy exports for testing
```

## Sources

- [Commander.js - npm](https://www.npmjs.com/package/commander) - v14.0.3, 500M+ weekly downloads
- [ollama - npm](https://www.npmjs.com/package/ollama) - v0.6.3, official Ollama JS client
- [Zod - npm](https://www.npmjs.com/package/zod) - v4.3.6, TypeScript-first validation
- [tsx - npm](https://www.npmjs.com/package/tsx) - v4.21.0, zero-config TS execution
- [simple-git - npm](https://www.npmjs.com/package/simple-git) - v3.x, programmatic git operations
- [Pino - npm](https://www.npmjs.com/package/pino) - v9.x, fastest Node.js logger
- [p-queue - npm](https://www.npmjs.com/package/p-queue) - v8.x, promise queue with concurrency control
- [yaml - npm](https://www.npmjs.com/package/yaml) - v2.x, YAML 1.2 parser/serializer
- [Qwen 2.5 32B on Apple Silicon](https://dev.to/atsushiambo/running-qwen-nearly-as-powerful-as-deepseek-on-a-macbook-pro-367k) - 30-34GB memory, ~8-12 tok/s on M-series
- [Node.js native TypeScript](https://nodejs.org/en/learn/typescript/run-natively) - Still experimental as of Node 24
- [tsup maintenance status](https://blog.logrocket.com/tsup/) - No longer actively maintained, tsx preferred for execution
