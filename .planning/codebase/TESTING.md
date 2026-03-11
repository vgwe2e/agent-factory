# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework Status

**Current State:**
- No test files detected in repository
- No test runner configured (Jest, Vitest, etc.)
- No test dependencies in `package.json`
- TypeScript strict mode serves as primary quality gate

**Environment:**
- TypeScript 5.9.3 provides compile-time type checking
- No runtime test execution setup

## Test File Organization

**Recommendation (not yet implemented):**
- Location: Co-located with source files
- Pattern: `{module}.test.ts` or `{module}.spec.ts`
- Directory structure would mirror source: `lib/tools/__tests__/web-search.test.ts`

## Architecture Testability

**Unit Testing Targets:**

**1. Tool Functions** (`lib/tools/*.ts`):
- Each tool exports `definition` and `execute` function
- Execute functions are pure async functions: `async function execute(args: Record<string, unknown>): Promise<string>`
- Testable in isolation — no side effects except file I/O or network requests

**Example testable tool** (`lib/tools/file-read.ts`):
```typescript
export async function execute(args: Record<string, unknown>): Promise<string> {
  const filepath = args.filepath as string
  if (!filepath) return 'Error: filepath is required'
  try {
    const content = await readFile(filepath, 'utf-8')
    return content
  } catch (err) {
    return `File read error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
```

Test structure would be:
```typescript
describe('file_read.execute', () => {
  it('should return error for missing filepath', async () => {
    const result = await execute({})
    expect(result).toBe('Error: filepath is required')
  })

  it('should read file contents', async () => {
    const result = await execute({ filepath: '/path/to/test.txt' })
    expect(result).toContain('expected content')
  })

  it('should catch read errors', async () => {
    const result = await execute({ filepath: '/nonexistent/file.txt' })
    expect(result).toMatch(/^File read error:/)
  })
})
```

**2. Providers** (`lib/providers/*.ts`):
- Base class defines interface; implementations (Anthropic, OpenAI) provide concrete behavior
- Both `chat()` and `stream()` are async and can be mocked

**Provider test pattern:**
```typescript
describe('AnthropicProvider', () => {
  it('should format tools correctly', () => {
    const provider = new AnthropicProvider('test-key', 'claude-3-sonnet')
    const tools = [{ name: 'test', description: '...', parameters: {...} }]
    const formatted = provider.formatTools(tools) // protected method would need accessor
    expect(formatted[0]).toHaveProperty('input_schema')
  })

  it('should throw error for missing API key', () => {
    expect(() => {
      new AnthropicProvider('', 'claude-3-sonnet')
    }).not.toThrow() // Constructor doesn't validate; validation happens at call
  })
})
```

**3. Provider Factory** (`lib/provider-factory.ts`):
- Reads environment variables and returns provider instances
- Pure function with environment dependency

```typescript
describe('createProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create AnthropicProvider by default', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    const provider = createProvider()
    expect(provider).toBeInstanceOf(AnthropicProvider)
  })

  it('should throw error if API key missing', () => {
    process.env.PROVIDER = 'anthropic'
    delete process.env.ANTHROPIC_API_KEY
    expect(() => createProvider()).toThrow('ANTHROPIC_API_KEY is required')
  })
})
```

**4. Tool Registry** (`lib/tools/registry.ts`):
- Singleton Map for managing tool definitions
- Pure functions for registration and retrieval

```typescript
describe('tool registry', () => {
  beforeEach(() => {
    // Clear registry between tests
    for (const [key] of getRegistry()) {
      toolRegistry.delete(key)
    }
  })

  it('should register tools', () => {
    const mockTool: RegisteredTool = {
      definition: { name: 'test', description: '', parameters: {...} },
      execute: async () => 'result'
    }
    registerTool(mockTool)
    expect(getTool('test')).toBe(mockTool)
  })

  it('should return undefined for unregistered tools', () => {
    expect(getTool('nonexistent')).toBeUndefined()
  })
})
```

**5. Orchestrator Loop** (`lib/orchestrator.ts`):
- Complex async generator function
- Coordinate state machine for agentic loop
- Difficult to test end-to-end without mocking providers

**Orchestrator test pattern (requires mocking):**
```typescript
describe('runAgent', () => {
  it('should yield text events from LLM response', async () => {
    const mockProvider = {
      stream: jest.fn(function* () {
        yield { type: 'text', content: 'Hello' }
        yield { type: 'done' }
      })
    }
    // Mock createProvider to return mockProvider

    const events = []
    for await (const event of runAgent([...messages])) {
      events.push(event)
    }

    expect(events).toContainEqual(expect.objectContaining({ type: 'text' }))
  })

  it('should execute tool calls and append results', async () => {
    // Setup mock provider with tool calls
    // Verify tool registry is called
    // Verify results appended to history
  })
})
```

## Mocking Strategy

**What to Mock:**
- External API calls (Anthropic, OpenAI, DuckDuckGo, Composio)
- File system operations (`fs/promises` methods)
- Network requests (`fetch`)
- Environment variables
- Date/time for deterministic testing

**What NOT to Mock:**
- Tool definitions (test actual schema)
- Error handling paths
- Type conversions (especially Record<string, unknown> parsing)

**Mocking Patterns:**

**Fetch Mocking** (for tools like `web-search`, `web-fetch`):
```typescript
global.fetch = jest.fn((url: string) =>
  Promise.resolve(
    new Response(mockHtmlContent, { status: 200 })
  )
)

// Restore after test
afterEach(() => {
  jest.restoreAllMocks()
})
```

**Provider Mocking:**
```typescript
const mockProvider = {
  chat: jest.fn().mockResolvedValue({
    content: 'response',
    toolCalls: [],
    usage: { promptTokens: 10, completionTokens: 20 }
  }),
  stream: jest.fn(function* () {
    yield { type: 'text', content: 'streaming...' }
    yield { type: 'done', finishReason: 'stop' }
  })
}

jest.mock('@/lib/provider-factory', () => ({
  createProvider: () => mockProvider
}))
```

**Environment Variable Mocking:**
```typescript
beforeEach(() => {
  process.env.PROVIDER = 'anthropic'
  process.env.ANTHROPIC_API_KEY = 'test-key-123'
})

afterEach(() => {
  delete process.env.PROVIDER
  delete process.env.ANTHROPIC_API_KEY
})
```

## Fixtures and Test Data

**Location:** Would be in `__tests__/fixtures/` directory adjacent to tested module

**Example Fixture Pattern:**

**fixtures/chat-messages.ts:**
```typescript
import type { ChatMessage } from '@/lib/types'

export const mockUserMessage: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'Search for TypeScript best practices',
  timestamp: Date.now()
}

export const mockAssistantMessage: ChatMessage = {
  id: 'msg-2',
  role: 'assistant',
  content: 'I found several resources...',
  toolCalls: [
    {
      id: 'tc-1',
      name: 'web_search',
      arguments: { query: 'TypeScript best practices' }
    }
  ],
  timestamp: Date.now()
}

export const mockToolResultMessage: ChatMessage = {
  id: 'msg-3',
  role: 'tool',
  content: '[web_search]: 1. Result 1...',
  toolResults: [
    {
      toolCallId: 'tc-1',
      name: 'web_search',
      content: '1. Result 1\n2. Result 2'
    }
  ],
  timestamp: Date.now()
}
```

**fixtures/stream-chunks.ts:**
```typescript
import type { StreamChunk } from '@/lib/types'

export const textChunks: StreamChunk[] = [
  { type: 'text', content: 'Hello ' },
  { type: 'text', content: 'world' }
]

export const toolCallChunks: StreamChunk[] = [
  { type: 'tool_call_start', toolCall: { id: 'tc-1', name: 'web_search' } },
  { type: 'tool_call_delta', toolCallId: 'tc-1', args: '{"q' },
  { type: 'tool_call_delta', toolCallId: 'tc-1', args: 'uery": "test"}' },
  { type: 'tool_call_end', toolCallId: 'tc-1' }
]

export const doneChunk: StreamChunk = {
  type: 'done',
  finishReason: 'stop',
  usage: { promptTokens: 100, completionTokens: 50 }
}
```

## Test Structure

**Setup Pattern:**
```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import * as webSearch from '@/lib/tools/web-search'

describe('web_search tool', () => {
  beforeEach(() => {
    // Setup mocks
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('definition', () => {
    it('should have correct schema', () => {
      expect(webSearch.definition.name).toBe('web_search')
      expect(webSearch.definition.parameters.required).toContain('query')
    })
  })

  describe('execute', () => {
    // Test cases...
  })
})
```

**Assertion Patterns:**
- Jest matchers for type checking: `expect(result).toBeInstanceOf(AnthropicProvider)`
- String assertions for tool results: `expect(result).toMatch(/^Error:/)`
- Array length checks: `expect(events).toHaveLength(5)`
- Object property checks: `expect(formatted[0]).toHaveProperty('input_schema')`

## Integration Testing

**API Route Testing:**
The `/api/chat` route in `app/api/chat/route.ts` would require:
1. Request body validation
2. Tool registration (ensureTools)
3. Agent orchestration
4. SSE stream encoding

**Pattern:**
```typescript
describe('POST /api/chat', () => {
  it('should return 400 for invalid JSON', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: 'invalid json'
    })
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing messages array', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({})
    })
    expect(response.status).toBe(400)
  })

  it('should stream events as SSE', async () => {
    // Mock agent and tools
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [mockUserMessage] })
    })

    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const text = await response.text()
    expect(text).toContain('data:')
  })
})
```

## Coverage Targets

**Current Status:** No coverage tracking configured

**Recommended Coverage:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Priority Areas:**
1. Tool execute functions (high impact on agent behavior)
2. Error handling paths (critical for reliability)
3. Provider implementations (API interactions)
4. Orchestrator loop edge cases (complex state management)

**Commands (to be configured):**
```bash
jest                           # Run all tests
jest --watch                   # Watch mode
jest --coverage                # Generate coverage report
jest lib/tools/                # Run tests in specific directory
jest web-search.test.ts        # Run single test file
```

## Type Testing

**TypeScript as Test Gate:**
The codebase relies heavily on TypeScript's strict mode:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Compile-time type checking prevents:
- Missing required properties
- Invalid function signatures
- Uncaught null/undefined access
- Type mismatches in tool arguments

**Runtime Validation Pattern:**
Since tool arguments come from LLM output, validation happens inside execute functions:
```typescript
export async function execute(args: Record<string, unknown>): Promise<string> {
  const query = args.query as string
  if (!query) return 'Error: query is required'
  // ... proceed with typed variable
}
```

## Testing Best Practices Applied

**Current Codebase:**
- Error handling is testable: errors return strings, never throw
- Functions are pure or easily mockable (async)
- Tool interface is standardized: `definition` + `execute`
- Providers follow consistent abstract base class pattern
- No hidden side effects in tool execution

**Gaps:**
- No test files written yet
- No CI/CD pipeline configured
- Manual verification required for API integrations
- Streaming protocol validation done at runtime only

---

*Testing analysis: 2026-03-10*
