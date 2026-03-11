# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code, type-safe runtime environment
- React 19.2.3 - UI component framework for web interface
- HTML/CSS - Semantic markup with Tailwind CSS for styling

**Secondary:**
- JavaScript - Configuration files and generated assets

## Runtime

**Environment:**
- Node.js (implicit, v20+) - Server-side execution, Next.js runtime
- Browser (modern ES2017+) - Client-side React execution

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework, API routes, server/client split
- React 19.2.3 - Component framework
- React DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS 4.0 - Utility-first CSS framework
- @tailwindcss/postcss 4.0 - PostCSS integration for Tailwind

**Build/Dev:**
- TypeScript 5.9.3 - Compilation and type checking
- PostCSS 4.0 (via `postcss.config.mjs`) - CSS transformation pipeline

**Content Processing:**
- @mozilla/readability 0.6.0 - Article/content extraction from HTML pages
- linkedom 0.18.12 - DOM implementation for server-side HTML parsing
- react-markdown 10.1.0 - Markdown rendering in React components
- remark-gfm 4.0.1 - GitHub Flavored Markdown support
- rehype-highlight 7.0.2 - Syntax highlighting for code blocks

## Key Dependencies

**Critical:**
- react 19.2.3 - UI framework, core dependency
- react-dom 19.2.3 - React DOM binding
- next 16.1.6 - Full-stack framework, routing, API layer

**Infrastructure:**
- @mozilla/readability 0.6.0 - Enables web_fetch tool to extract readable content from pages
- linkedom 0.18.12 - DOM parser for server-side HTML processing
- react-markdown 10.1.0 - Renders markdown responses from agent in chat interface
- rehype-highlight 7.0.2 - Code syntax highlighting for better readability

## Configuration

**Environment:**
- Configured via `.env` file (not committed)
- Example configuration: `.env.example` (see INTEGRATIONS.md for required keys)
- Environment variables loaded automatically by Next.js at runtime

**TypeScript:**
- Config file: `tsconfig.json`
- Target: ES2017
- Module: esnext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to project root for imports
- JSX: react-jsx (new transform)
- Plugins: Next.js TypeScript plugin

**Build:**
- Config file: `next.config.ts` (currently empty, uses Next.js defaults)
- No custom build steps beyond Next.js standard pipeline

**PostCSS:**
- Config file: `postcss.config.mjs`
- Tailwind CSS as primary PostCSS plugin

## Platform Requirements

**Development:**
- Node.js 20+ (inferred from TypeScript target ES2017 and modern React features)
- npm for package management
- TypeScript compiler (ts-node or included in dev environment)

**Production:**
- Deployment target: Node.js 20+ capable hosting (Vercel recommended for Next.js)
- Runtime: nodejs (specified in `app/api/chat/route.ts`)
- Static file serving for Next.js public assets
- Server-side streaming support for Server-Sent Events (SSE)

## Runtime Characteristics

**Server Components:**
- `app/api/chat/route.ts` - Server-side API route with streaming response
- Tool execution runs entirely on server
- API keys managed server-side only

**Client Components:**
- Chat UI in React with client-side message handling
- Fetch-based communication with `/api/chat` endpoint
- Server-Sent Events (SSE) streaming for real-time response updates

---

*Stack analysis: 2026-03-10*
