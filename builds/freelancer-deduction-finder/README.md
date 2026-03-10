# Freelancer Deduction Finder

An AI agent that helps freelancers and self-employed workers discover tax deductions they may be missing. Tell it about your work situation, and it generates a personalized deduction report with estimated savings, IRS form references, and action items.

**No bank connection required.** Unlike Keeper ($20/mo) or FlyFin (requires OAuth), this agent works by analyzing your work profile — not your bank statements. It's a guidance tool, not a tax filing service.

## Who Is This For?

- Freelance designers, writers, developers, photographers, consultants
- Rideshare and delivery drivers (Uber, DoorDash, Instacart)
- Independent contractors and 1099 workers
- Side hustlers with self-employment income
- Anyone filing Schedule C who wants to make sure they're not leaving money on the table

The average freelancer misses **$2,400/year** in legitimate deductions (FlyFin). That's real money.

## What It Does

```
You: "I'm a freelance graphic designer making about $75K/year. I work from
     home, use my car for client meetings, pay for Adobe CC and Figma, and
     bought a new MacBook this year."

Agent: *searches IRS rules for graphic designers*
       *analyzes your expense categories*
       *verifies current deduction limits*
       *generates personalized report*

Output: A detailed report with 15+ applicable deductions, estimated
        $6,800-$11,200 in potential savings, IRS form references for
        each deduction, and a record-keeping checklist.
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> freelancer-deduction-finder
cd freelancer-deduction-finder
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Tools

| Tool | What It Does |
|------|-------------|
| `search_deductions` | Searches for IRS deduction rules specific to the user's profession |
| `analyze_expenses` | Analyzes expense categories against IRS rules with limits and form references |
| `write_deduction_report` | Generates a comprehensive deduction report saved to `output/` |
| `web_search` | Searches the web for current IRS limits and thresholds |
| `web_fetch` | Fetches IRS pages for detailed deduction rules |

## What It Covers

- **Schedule C deductions**: All business expenses (supplies, software, equipment, travel, meals, marketing)
- **Home office**: Simplified vs. regular method, qualification rules
- **Vehicle/mileage**: Standard mileage rate vs. actual expenses
- **Health insurance**: Self-employed health insurance deduction
- **Retirement**: SEP-IRA, Solo 401(k), Traditional IRA
- **Self-employment tax**: The 50% SE tax deduction most freelancers forget
- **QBI deduction**: Section 199A (up to 20% of business income)
- **Profession-specific**: Equipment, tools, supplies unique to your field

## Example Prompts

- "I'm a freelance photographer making $60K. I have a home studio, drive to shoots, and bought a new camera lens this year."
- "I do DoorDash and Uber Eats as a side hustle. What can I deduct?"
- "I'm a freelance software developer. I pay for GitHub, AWS, and a coworking space. What am I missing?"
- "What's the home office deduction and do I qualify?"

## Limitations

- **Not tax advice.** This is educational guidance. Consult a CPA for your specific situation.
- **No bank connection.** It can't scan your transactions — you tell it what you spend money on.
- **Federal deductions only.** State-specific deductions vary and aren't covered.
- **Current-year focus.** IRS limits and rates are searched in real-time but may lag updates.

## Architecture

```
User describes work situation
        │
        ▼
┌─────────────────────┐
│  search_deductions   │ → Find profession-specific IRS rules
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  analyze_expenses    │ → Match expenses against deduction categories
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  web_search/fetch    │ → Verify current-year limits and thresholds
└─────────┬───────────┘
          ▼
┌──────────────────────────┐
│  write_deduction_report   │ → Generate personalized report with savings estimate
└──────────────────────────┘
```

## License

MIT
