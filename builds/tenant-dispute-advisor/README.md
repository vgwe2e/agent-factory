# Tenant Dispute Advisor

AI agent that helps renters diagnose landlord disputes, understand their state-specific rights, research landlord complaint histories, and generate action plans with demand letters and escalation steps.

**Not legal advice.** This tool provides general information to help tenants understand their rights. For eviction defense or disputes involving large amounts, consult a tenant rights attorney or legal aid organization.

## What It Does

1. **Diagnoses your dispute** — classifies the issue (habitability, security deposit, eviction, rent increase, harassment, retaliation, discrimination) and assesses your legal position
2. **Researches your rights** — searches for state-specific and city-specific tenant protection laws, statutes, and procedures
3. **Investigates the landlord** — looks up complaint history, code violations, BBB records, and tenant reviews
4. **Generates an action plan** — produces a ready-to-send demand letter, documentation checklist, escalation timeline, and links to legal resources

## Tools

| Tool | Purpose |
|------|---------|
| `analyze_tenant_dispute` | Classify dispute type, assess legal position, recommend actions |
| `search_tenant_rights` | Search state/city-specific tenant rights and statutes |
| `research_landlord_record` | Research landlord complaint history and code violations |
| `write_tenant_action_plan` | Generate demand letter, action plan, and escalation guide |
| `web_search` | General web search |
| `web_fetch` | Fetch and extract page content |
| `file_write` / `file_read` | Read/write local files |

## Dispute Types Covered

- **Habitability** — repairs, mold, pests, no heat/hot water, unsafe conditions
- **Security deposit** — unreturned deposit, excessive deductions, no itemization
- **Eviction** — notice to quit, pay or quit, illegal lockout, self-help eviction
- **Rent increase** — excessive increase, no notice, rent control violation
- **Harassment** — illegal entry, threats, intimidation, utility shutoff
- **Retaliation** — adverse action after tenant complained or reported
- **Discrimination** — Fair Housing Act violations

## Quick Start

```bash
cp .env.example .env
# Set PROVIDER, MODEL, and API key in .env
npm install
npm run dev
# Open http://localhost:3000
```

## Example Conversation

> "My landlord in Portland, Oregon hasn't fixed the broken heater in my apartment for 6 weeks. I've texted him about it three times and he just says 'I'll get to it.' My rent is $1,800/month and I have a year lease ending in August. What can I do?"

The agent will:
1. Analyze the dispute as a habitability issue (broken heater, landlord promised but didn't fix)
2. Research Oregon-specific repair and deduct laws, warranty of habitability statutes, and Portland renter protections
3. Check the landlord's complaint and violation history
4. Generate an action plan with a demand letter, code enforcement filing guide, repair-and-deduct instructions, and small claims court steps

## Architecture

Built on the [Agentic Harness](https://github.com/your-repo/agentic-harness) — a minimal Next.js app with hand-written orchestration loop, model-agnostic provider layer, and SSE streaming.

## License

MIT
