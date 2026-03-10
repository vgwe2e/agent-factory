# Rental Scam Detector

> 50% of rental scams reported to the FTC start on Facebook. Don't be the next victim.

An AI agent that analyzes rental listings to identify potential scams before you send money. Verifies the property, landlord, contact info, and pricing through web research.

## The Problem

Rental fraud is surging:
- **$5.2B** lost to real estate scams in the US (2023, FBI IC3)
- **50%** of rental scams start on Facebook Marketplace (FTC, 2025)
- AI-generated fake listings are increasingly sophisticated
- Scammers copy real listings, replace contact info, and collect fake deposits

Victims lose first/last month's rent + security deposit — often $3,000-$10,000.

## How It Works

```
You: "Is this Craigslist rental listing legit? [paste URL or details]"

Agent:
  1. fetch_rental_listing   → Fetch listing, analyze platform risk, detect text red flags
  2. verify_rental_listing  → Cross-reference address, landlord, contact info, pricing
  3. write_risk_assessment  → Risk score 1-10, red/green flags, recommendation
```

## What Gets Checked

| Check | Method | What It Reveals |
|-------|--------|-----------------|
| Platform risk | URL analysis | Craigslist/Facebook = higher risk, Zillow/Apartments.com = lower |
| Text red flags | Content parsing | Urgency language, payment methods, impossible terms |
| Property exists | Web search | Verifies address appears in real estate databases |
| Scam reports | Web search | Checks if address/contact appear in scam databases |
| Landlord verification | Web search | Confirms web presence, reviews, complaints |
| Contact info | Web search | Checks email domain, phone in spam databases |
| Price comparison | Web search | Compares to area market rates |

## Risk Score Guide

| Score | Label | Meaning |
|-------|-------|---------|
| 1-3 | 🟢 LOW RISK | Listing appears legitimate. Standard precautions apply. |
| 4-6 | 🟡 MODERATE RISK | Some concerns found. Verify before sending money. |
| 7-10 | 🔴 HIGH RISK | Strong scam indicators. Do not send money. |

## Quick Start

```bash
npm install
cp .env.example .env
# Add your OPENROUTER_API_KEY (or other provider key)
npm run dev
# Open http://localhost:3000
```

## Example Queries

- "Check this rental listing: [Craigslist URL]"
- "Is this apartment legit? 2BR at 123 Main St, Austin TX for $800/mo, contact john@gmail.com"
- "Landlord says he's overseas and wants me to wire a deposit. The listing is on Facebook."
- "Is $900/mo for a 3BR in Manhattan realistic?"

## Tools

| Tool | Purpose |
|------|---------|
| `fetch_rental_listing` | Fetch listing URL + analyze platform risk + detect text red flags |
| `verify_rental_listing` | Cross-reference address, landlord, contacts, pricing via web search |
| `write_risk_assessment` | Generate scored report with recommendation and next steps |

## Built With

Hand-written agentic orchestration loop, DuckDuckGo search, Readability content extraction. No API keys needed beyond the LLM provider.

## License

MIT
