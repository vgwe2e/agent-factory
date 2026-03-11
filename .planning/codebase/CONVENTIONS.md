# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- Tool files: `{purpose}.ts` - Examples: `web-search.ts`, `file-write.ts`, `anthropic.ts`
- Component files: `{name}.tsx` - Examples: `page.tsx`, `layout.tsx`
- Type files: `types.ts` - Centralized type definitions
- API routes: `route.ts` placed in `app/api/{endpoint}/` directory
- Configuration: `config.ts` for application-wide settings
- Factories: `{entity}-factory.ts` - Example: `provider-factory.ts`

**Functions and Variables:**
- camelCase for functions: `sendMessage()`, `handleStop()`, `generateId()`
- camelCase for variables: `isStreaming`, `toolCalls`, `pendingToolCalls`
- lowerCamelCase for state variables in React: `streamContent`, `currentRound`, `tokenUsage`
- Descriptive handler names: `handleSubmit()`, `handleKeyDown()`, `handleCopy()`
- Callback prefixes: `sendMessage()`, `scrollToBottom()` (called with `useCallback`)

**Types and Interfaces:**
- PascalCase for interfaces: `ChatMessage`, `ToolDefinition`, `BaseProvider`, `AnthropicProvider`
- Interface naming convention: Domain-specific naming like `ChatMessage`, `LLMResponse`, `StreamChunk`
- Type aliases use PascalCase: `AgentStreamEvent`, `TokenUsage`
- Discriminated unions for event types: `type StreamChunk = { type: 'text'; content: string } | ...`

**Constants:**
- Configuration objects: `agentConfig` (exported object)
- CSS class strings: `className` attributes typically inline

## Code Style

**Formatting:**
- TypeScript 5.9.3 with strict mode enabled
- Target: ES2017
- Module format: ESNext with bundler resolution
- No Prettier or ESLint configuration detected — relies on TypeScript strict checking

**Linting:**
- TypeScript strict mode enabled in `tsconfig.json`
- No inline linting configuration; enforced at compile time
- Type safety is primary quality gate

## Import Organization

**Order:**
1. External libraries (`react`, `next`, `linkedom`, etc.)
2. Internal types (`type { ... } from '@/lib/types'`)
3. Internal modules (`from '@/lib/...`, `from '@/config'`)
4. Relative imports when within same directory

**Path Aliases:**
- `@/*` maps to repository root (configured in `tsconfig.json`)
- Used consistently: `@/lib/types`, `@/lib/tools`, `@/lib/orchestrator`
- Avoids relative path imports in cross-module dependencies

**Example import pattern:**
```typescript
import type { ChatMessage, ToolDefinition, LLMResponse, StreamChunk } from '../types'
import { BaseProvider } from './base'
import { agentConfig } from '../config'
```

## Error Handling

**Patterns:**
- Try-catch blocks with descriptive error messages: `catch (err) { return \`Error: ${err instanceof Error ? err.message : 'Unknown error'}\` }`
- Error type narrowing: Always check `err instanceof Error` before accessing `.message`
- Tool execution errors return string result with "Error: " prefix, never throw
- Silent catch blocks (continue parsing) for malformed JSON or parsing failures
- Error status codes checked with `if (!res.ok)` before processing response
- Tool registration ensures graceful fallback if tool not found

**Error Response Format:**
Tools return error strings prefixed with "Error: " or "Status code:" — no exceptions thrown. Examples:
- `'Error: filepath is required'`
- `'File read error: ${err.message}'`
- `'Fetch error: Unknown error'`
- `'Search failed with status ${res.status}'`

**Stream Error Handling:**
Errors yielded as stream events: `{ type: 'error', error: errorMsg }` rather than thrown exceptions.

## Logging

**Framework:** No structured logging; browser `console` methods not used in production code.

**Patterns:**
- Errors are captured and returned as string results for tools
- Streaming events convey progress information instead of logs
- No debugging console statements in shipped code
- Error messages embedded in tool results for LLM context

## Comments

**When to Comment:**
- Module-level documentation for complex systems: `/** Core agentic orchestration loop. ... */`
- Architecture explanations: Comments describe high-level flow before implementation blocks
- Complex parsing logic: Regex matching and state machine operations documented
- Magic numbers explained: Example: `// DDG wraps URLs in a redirect — extract the actual URL`

**JSDoc/TSDoc:**
- Tool definitions documented with `definition.description` property (for LLM consumption)
- Functions lack JSDoc comments; types are self-documenting through TypeScript
- Inline comments preferred for algorithm clarification

**Example:**
```typescript
// DDG wraps URLs in a redirect — extract the actual URL
const urlMatch = rawUrl.match(/uddg=([^&]+)/)
const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl
```

## Function Design

**Size:** Functions are compact, typically 20-50 lines. Larger functions (100+ lines) reserved for:
- Streaming protocol handlers (parsing SSE events)
- Complex state machine orchestrators (agent loop)
- UI component rendering

**Parameters:**
- Tool execute functions: `async function execute(args: Record<string, unknown>): Promise<string>`
- Provider methods: Consistent signature across implementations `async chat(messages, tools?, systemPrompt?)`
- React handlers: Event-based naming `handleSubmit(e: React.FormEvent)`, `handleKeyDown(e: React.KeyboardEvent)`

**Return Values:**
- Tool functions return `Promise<string>` — errors embedded in string, never thrown
- Providers return typed objects: `Promise<LLMResponse>` or `AsyncGenerator<StreamChunk>`
- Void handlers (onClick, onChange) update state via `setState`

**Async Patterns:**
- `async function*` generators for streaming: `async *stream(...): AsyncGenerator<StreamChunk>`
- `for await...of` to consume async generators
- AbortSignal used for request cancellation: `signal: controller.signal` in fetch

## Module Design

**Exports:**
- Tool modules export `definition` (ToolDefinition) and `execute` function separately
- Providers export class constructors implementing `BaseProvider` interface
- Orchestrator exports generator function `runAgent()`
- Types centralized in `lib/types.ts` with barrel exports

**Example Tool Module Pattern** (`lib/tools/web-search.ts`):
```typescript
export const definition: ToolDefinition = { ... }
export async function execute(args: Record<string, unknown>): Promise<string> { ... }
```

**Barrel Files:**
- None detected; direct imports preferred
- `lib/tools/registry.ts` acts as singleton module for tool management
- `lib/tools/*` files are importable directly, not through index

**Tool Registration Pattern:**
Registry is a singleton Map that holds tool definitions and execute functions:
```typescript
const toolRegistry = new Map<string, RegisteredTool>()
export function registerTool(tool: RegisteredTool) { toolRegistry.set(...) }
export function getTool(name: string) { return toolRegistry.get(name) }
```

## React & Component Conventions

**Hooks Usage:**
- `useState` for component state: `const [isStreaming, setIsStreaming] = useState(false)`
- `useCallback` for stable function references passed to event handlers
- `useRef` for DOM refs and persistent values: `scrollRef.current`, `abortRef.current`
- `useEffect` for side effects: scroll-to-bottom, textarea auto-sizing

**Component Organization:**
- Helper components defined before main component in same file: `CodeBlock()`, `ToolResultCard()` before `ChatPage()`
- Markdown configuration objects declared at module level: `mdComponents = { code: CodeBlock, ... }`
- Inline className strings with conditional logic for dynamic styling
- Utility functions at module level: `formatTokens()`, `generateId()`

**Event Handling:**
- Form submission: `onSubmit={handleSubmit}` with `e.preventDefault()`
- Keyboard events: `onKeyDown={handleKeyDown}` for Enter/Shift+Enter detection
- State updates after async operations: await stream → setMessages() → update parent state

## TypeScript Patterns

**Type Narrowing:**
- Error instanceof checks: `err instanceof Error ? err.message : 'Unknown error'`
- Optional chaining: `data.usage?.input_tokens ?? 0`
- Nullish coalescing: `this.baseUrl ?? ''`, `count >= 1000 ? ... : String(count)`

**Generic Constraints:**
- Tool arguments: `Record<string, unknown>` for flexibility in LLM-provided inputs
- Provider abstraction: Base class with abstract methods implemented per provider

**Type Safety:**
- No `any` types; `unknown` preferred when parsing external data
- Function signatures include all parameter types
- Tool parameter validation happens inside execute function after type coercion

---

*Convention analysis: 2026-03-10*
