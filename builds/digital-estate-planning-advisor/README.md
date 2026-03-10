# Digital Estate Planning Advisor

AI agent that helps people create comprehensive plans for their digital assets and online accounts — ensuring nothing is lost, locked out, or left unmanaged after death or incapacity.

**Not legal advice.** Consult an estate planning attorney for your will, trust, and power of attorney.

## What It Does

1. **Inventories your digital life** — maps every account and digital asset, identifies each platform's legacy/succession policy
2. **Researches platform policies** — looks up current memorialization, data download, and account transfer procedures
3. **Checks your state's laws** — researches RUFADAA adoption and digital estate statutes
4. **Generates a comprehensive plan** — step-by-step instructions for legacy features, password management, legal documents, crypto handling, and a communication plan

## Tools

| Tool | Purpose |
|------|---------|
| `analyze_digital_estate` | Inventory accounts, assess legacy policies, identify actions |
| `search_platform_policies` | Research specific platform's legacy/succession procedures |
| `search_estate_laws` | Research state-specific digital estate laws (RUFADAA) |
| `write_estate_plan` | Generate comprehensive digital estate plan |
| `web_search` | General web search |
| `web_fetch` | Fetch and extract page content |
| `file_write` / `file_read` | Read/write local files |

## What's Covered

- **Legacy features**: Google Inactive Account Manager, Apple Legacy Contact, Facebook memorialization
- **Password management**: Setup guide, emergency access, master password storage
- **Cryptocurrency**: Recovery phrase storage, exchange documentation, hardware wallets
- **Legal documents**: Digital asset will clause, power of attorney, HIPAA authorization
- **Platform-by-platform**: 20+ major platforms with specific succession policies
- **State laws**: RUFADAA, fiduciary access, power of attorney for digital assets

## Quick Start

```bash
cp .env.example .env
# Set PROVIDER, MODEL, and API key in .env
npm install
npm run dev
# Open http://localhost:3000
```

## Example Conversation

> "I need help planning what happens to my digital life. I use Gmail, Facebook, Instagram, Amazon, Netflix, Coinbase, Dropbox, and GoDaddy. I have some Bitcoin and a couple domain names. I live in California and don't have a will yet. My wife should get access to everything."

The agent will:
1. Analyze all 8 accounts — identify Google/Apple/Facebook legacy features, flag Coinbase crypto risk, note GoDaddy domains as transferable assets
2. Research California's RUFADAA adoption and digital estate laws
3. Research Coinbase's estate access process (documentation required)
4. Generate a plan with: legacy feature setup, password manager guide, crypto recovery phrase instructions, will template with digital asset clause, and communication plan for wife

## Architecture

Built on the [Agentic Harness](https://github.com/your-repo/agentic-harness) — a minimal Next.js app with hand-written orchestration loop, model-agnostic provider layer, and SSE streaming.

## License

MIT
