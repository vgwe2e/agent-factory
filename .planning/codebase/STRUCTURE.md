# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
/Users/vincent.wicker/Documents/agent-factory/seed/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # POST /api/chat endpoint
│   ├── layout.tsx             # Root HTML layout
│   ├── page.tsx               # Chat UI page
│   └── globals.css            # Tailwind styles
├── lib/                       # Core logic (non-UI)
│   ├── orchestrator.ts        # Agent loop (main logic)
│   ├── provider-factory.ts    # LLM provider factory
│   ├── types.ts               # Shared type definitions
│   ├── providers/             # LLM provider implementations
│   │   ├── base.ts            # Abstract base class
│   │   ├── anthropic.ts       # Anthropic API provider
│   │   └── openai.ts          # OpenAI-compatible provider
│   └── tools/                 # Tool implementations
│       ├── registry.ts        # Tool registry (Map-based)
│       ├── web-search.ts      # DuckDuckGo search
│       ├── web-fetch.ts       # Page content extraction
│       ├── file-read.ts       # Read local files
│       ├── file-write.ts      # Write files to output/
│       ├── composio-search.ts # Search Composio tool catalog
│       ├── composio-execute.ts # Run Composio tools
│       └── composio-connections.ts # Manage auth flows
├── config.ts                  # Agent configuration
├── next.config.ts             # Next.js config
├── tsconfig.json              # TypeScript config
├── postcss.config.mjs         # Tailwind/PostCSS config
├── package.json               # Dependencies
└── .env.example               # Environment variables template
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router directory — defines routes and UI
- Contains: Route handlers (api/) and page components (.tsx)
- Key files: `page.tsx` (main UI), `api/chat/route.ts` (LLM endpoint)

**`lib/`:**
- Purpose: Core business logic, isolated from UI framework
- Contains: Orchestration, provider abstraction, tool system, shared types
- Key files: `orchestrator.ts` (agent loop), `types.ts` (all TypeScript interfaces)

**`lib/providers/`:**
- Purpose: LLM API integrations
- Contains: Abstract base class and concrete implementations
- Key files: `base.ts` (interface), `anthropic.ts` (native), `openai.ts` (compatible)

**`lib/tools/`:**
- Purpose: Agent tools (actions the LLM can invoke)
- Contains: Tool definitions, execute functions, registry
- Key files: `registry.ts` (central tool store), individual tool files

## Key File Locations

**Entry Points:**

- `app/page.tsx`: React client entry point — loads chat UI
- `app/api/chat/route.ts`: API entry point — processes chat messages and returns SSE stream
- `app/layout.tsx`: HTML document root

**Configuration:**

- `config.ts`: Agent behavior (maxRounds, maxToolResultChars, systemPrompt)
- `tsconfig.json`: TypeScript compiler options and path aliases (`@/*` → `./*`)
- `next.config.ts`: Next.js runtime configuration (empty/default)
- `.env.example`: Template for required environment variables (PROVIDER, MODEL, API_KEY, etc.)

**Core Logic:**

- `lib/orchestrator.ts`: Agent loop — implements agentic reasoning with tool use
- `lib/provider-factory.ts`: Factory pattern to instantiate correct LLM provider
- `lib/types.ts`: Centralized type definitions (ChatMessage, ToolDefinition, StreamChunk, AgentStreamEvent)

**Tool System:**

- `lib/tools/registry.ts`: In-memory tool registry with register/getTool/getToolDefinitions functions
- `lib/tools/web-search.ts`: Web search via DuckDuckGo HTML scraping
- `lib/tools/web-fetch.ts`: Extract readable content from URLs using @mozilla/readability
- `lib/tools/file-read.ts`: Read files from local filesystem
- `lib/tools/file-write.ts`: Write files to `output/` directory
- `lib/tools/composio-*.ts`: Composio API integrations (search, execute, manage connections)

**Testing:**

- None detected in codebase

**UI/Styling:**

- `app/globals.css`: Tailwind CSS and custom component classes
- `app/page.tsx`: React component with inline Tailwind classes (no separate component files)

## Naming Conventions

**Files:**

- Kebab-case for files: `web-search.ts`, `file-write.ts`, `composio-execute.ts`
- Suffix pattern for tools: `web-*.ts`, `file-*.ts`, `composio-*.ts`
- Route files: `route.ts` (Next.js convention)
- TypeScript (not JS): All source files are `.ts` or `.tsx`

**Directories:**

- Lowercase plural for feature areas: `providers/`, `tools/`
- App Router convention: `app/`, `lib/`
- Feature-based organization under `app/api/`

**Functions and Variables:**

- camelCase for functions: `runAgent()`, `registerTool()`, `createProvider()`
- UPPER_SNAKE_CASE for constants: Minimal use (none observed)
- Exported symbol pattern: tools export `definition` and `execute`

**Types:**

- PascalCase for interfaces: `ChatMessage`, `ToolDefinition`, `BaseProvider`
- Exported from `lib/types.ts` centrally

**CSS Classes:**

- Tailwind utility classes throughout
- BEM-inspired for custom classes: `.prose-chat`, `.custom-scrollbar`, `.tool-pulse`

## Where to Add New Code

**New Tool:**

1. Create `lib/tools/[category]-[name].ts`
2. Export `definition: ToolDefinition` with name, description, parameters schema
3. Export `execute(args: Record<string, unknown>): Promise<string>` function
4. Import and register in `app/api/chat/route.ts` via `registerTool()`
5. Update `config.ts` systemPrompt to document the tool

Example structure:
```typescript
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'tool_name',
  description: '...',
  parameters: {
    type: 'object',
    properties: { /* parameter definitions */ },
    required: ['paramName'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const paramName = args.paramName as string
  // Implementation
  return 'Result string'
}
```

**New LLM Provider:**

1. Create `lib/providers/[provider-name].ts`
2. Extend `BaseProvider` class
3. Implement `chat()` and `stream()` methods
4. Implement `formatTools()` and `formatMessages()` helpers for provider-specific format
5. Add case in `lib/provider-factory.ts` createProvider() switch statement
6. Add environment variable documentation

**New API Endpoint:**

1. Create `app/api/[name]/route.ts`
2. Export `POST()` (or GET, etc.) function taking `Request` and returning `Response`
3. Import any needed lib code

**UI Component:**

1. Add `.tsx` file in `app/`
2. Use 'use client' directive if interactive
3. Import shared types from `@/lib/types`

**Utilities:**

- Shared helpers: Create new file in `lib/` (e.g., `lib/utils.ts`)
- Import pattern: `import { helper } from '@/lib/utils'`

## Special Directories

**`app/api/`:**
- Purpose: Next.js API routes (Server Functions)
- Generated: No (user-written route handlers)
- Committed: Yes

**`output/`:**
- Purpose: Directory where file_write tool saves generated files
- Generated: Yes (created by agents at runtime)
- Committed: No (add to .gitignore if not present)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No (.gitignore)

**`.next/`:**
- Purpose: Next.js build artifacts
- Generated: Yes (next build)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-03-10*
