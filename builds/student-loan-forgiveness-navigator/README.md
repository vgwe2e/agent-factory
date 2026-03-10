# Student Loan Forgiveness Navigator

AI agent that helps federal student loan borrowers determine which forgiveness programs they qualify for, compare income-driven repayment plans, and generate personalized application guides.

**Not financial or legal advice.** Always verify at StudentAid.gov. Never pay for forgiveness help — all applications are free.

## What It Does

1. **Analyzes your loan situation** — determines eligibility for PSLF, IDR forgiveness, SAVE, Teacher, Borrower Defense, TPD discharge, and more
2. **Researches current program status** — checks latest rules, litigation status (SAVE), policy changes, and deadlines
3. **Compares repayment plans** — side-by-side IDR plan comparison with estimated payments based on your income
4. **Generates a personalized guide** — step-by-step application instructions, document checklists, timeline, and resources

## Tools

| Tool | Purpose |
|------|---------|
| `analyze_loan_situation` | Determine forgiveness eligibility, classify loans, assess options |
| `search_forgiveness_programs` | Research current program rules, litigation status, deadlines |
| `check_repayment_options` | Compare IDR plans (SAVE, PAYE, IBR, ICR) with payment estimates |
| `write_forgiveness_guide` | Generate personalized application guide with checklists |
| `web_search` | General web search |
| `web_fetch` | Fetch and extract page content |
| `file_write` / `file_read` | Read/write local files |

## Programs Covered

- **PSLF** — Public Service Loan Forgiveness (10 years, government/nonprofit)
- **SAVE** — Saving on a Valuable Education (lowest payments, 20-25 year forgiveness)
- **PAYE** — Pay As You Earn (20-year forgiveness)
- **IBR** — Income-Based Repayment (20-25 year forgiveness)
- **ICR** — Income-Contingent Repayment (25 years, only option for Parent PLUS)
- **Teacher Loan Forgiveness** — up to $17,500 after 5 years
- **Borrower Defense** — discharge for school fraud
- **Closed School Discharge** — automatic if school closed during enrollment
- **TPD Discharge** — total and permanent disability
- **Fresh Start** — return from default to good standing

## Quick Start

```bash
cp .env.example .env
# Set PROVIDER, MODEL, and API key in .env
npm install
npm run dev
# Open http://localhost:3000
```

## Example Conversation

> "I have $85,000 in Direct Loans from grad school. I've been working as a social worker at a county government agency for 3 years, making $52,000/year. I'm on the standard repayment plan paying $890/month. Family size is 2. Am I eligible for any forgiveness?"

The agent will:
1. Analyze the situation — Direct Loans + government employer = PSLF eligible, plus IDR forgiveness
2. Research current PSLF rules and SAVE plan litigation status
3. Compare IDR plans — show SAVE at ~$165/mo vs standard at $890/mo, recommend switching
4. Generate a guide with PSLF application steps, IDR enrollment, document checklist, and timeline (7 more years to forgiveness)

## Architecture

Built on the [Agentic Harness](https://github.com/your-repo/agentic-harness) — a minimal Next.js app with hand-written orchestration loop, model-agnostic provider layer, and SSE streaming.

## License

MIT
