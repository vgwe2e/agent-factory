# Property Tax Appeal Advisor

A free AI agent that helps homeowners determine if their property tax assessment is too high and guides them through the appeal process — with comparable sales evidence, county-specific filing instructions, and a draft appeal letter.

## The Problem

87 million homeowners in the US pay an average of $4,271/year in property taxes. Over 40% are potentially overassessed, but **only 5% ever appeal**. Those who do appeal succeed 30-94% of the time, saving an average of $539-$774/year.

Why don't more people appeal? Because the process is confusing: you need to find comparable sales, understand your county's assessment methodology, meet filing deadlines, and present your case. This agent does all of that for you.

## What It Does

Tell it your property address and assessed value. It will:

1. **Search for comparable sales** — finds recently sold homes similar to yours on Zillow, Redfin, and Realtor.com
2. **Analyze your assessment** — compares your assessed value to market data and tells you if you're overassessed
3. **Research your county's appeal process** — finds filing deadlines, required forms, hearing procedures, and assessor contact info
4. **Generate a complete appeal report** — with comparable sales evidence, step-by-step instructions, and a draft appeal letter

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> property-tax-appeal-advisor
cd property-tax-appeal-advisor
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Example Prompt

> My property at 456 Oak Ave, Naperville, IL 60540 is assessed at $425,000. I think that's too high — similar homes in my neighborhood sold for around $380,000-$395,000 last year. Can you help me figure out if I should appeal?

The agent will search for comparable sales, analyze whether you're overassessed, research DuPage County's appeal process, and generate a report with a draft appeal letter.

## Tools

| Tool | Description |
|---|---|
| `search_comparable_sales` | Searches real estate sites for recently sold comparable homes near your property |
| `analyze_assessment` | Compares your assessed value to comparable sales and determines if you're overassessed |
| `write_appeal_report` | Generates a comprehensive appeal report with evidence, process guide, and draft letter |
| `web_search` | General web search for county-specific appeal rules and deadlines |
| `web_fetch` | Fetches county assessor pages and property listing details |
| `file_write` | Saves supplementary files |
| `file_read` | Reads files from disk |

## What You Get

The final report includes:

- **Assessment analysis** — Is your assessed value above market value? By how much?
- **Comparable sales evidence** — 3-5 recently sold similar homes with prices, dates, and details
- **Error check** — Factual errors in your property record (wrong sqft, bedrooms, etc.)
- **Appeal process** — County-specific deadlines, forms, filing requirements, hearing info
- **Draft appeal letter** — Customized letter citing your evidence and requesting a specific reduction
- **Tax savings estimate** — How much you could save annually if your appeal succeeds
- **Tips for success** — What to bring, how to present your case, what to expect

## Key Facts

- **No risk**: Appeals can only lower your assessment or leave it unchanged
- **Free to file**: Most counties don't charge for the first level of appeal
- **High success rate**: 30-94% of appellants get a reduction
- **Annual opportunity**: You can appeal every reassessment cycle

## Limitations

- Uses publicly available data from web searches — not a licensed appraisal
- Comparable sales data may be incomplete depending on local MLS access
- Appeal rules change — always verify deadlines with your county assessor
- This is informational guidance, not legal or tax advice

## Supported Providers

| Provider | Env Vars | Example Models |
|---|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` |
| `openai` | `OPENAI_API_KEY` | `gpt-4o` |
| `openrouter` | `OPENROUTER_API_KEY` | `anthropic/claude-sonnet-4-6` |
| `ollama` | `OLLAMA_BASE_URL` | `llama3`, `mistral` |

## License

MIT
