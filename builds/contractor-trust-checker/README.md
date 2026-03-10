# Contractor Trust Checker

> Research your contractor in 30 seconds, not 30 minutes.

An AI agent that checks contractor licenses, BBB ratings, reviews, complaints, and credentials before you hire — consolidating 5+ manual searches into one report.

## The Problem

Homeowners check 5+ sources before hiring a contractor:
- State licensing board (is the license valid?)
- BBB (any complaints?)
- Google Reviews / Yelp / Angi (what do customers say?)
- Company website (do they look professional?)
- General web search (any lawsuits or warnings?)

This takes 20-30 minutes per contractor, and you typically get 3+ quotes. That's hours of manual research.

## How It Works

```
You: "Check out ABC Plumbing in Portland, Oregon"

Agent:
  1. search_contractor        → Find web presence, license info, BBB profile, review listings
  2. verify_contractor        → Check complaints, lawsuits, insurance, review patterns
  3. write_contractor_report  → Trust score 1-10, red/green flags, hire/avoid recommendation
```

## What Gets Checked

| Check | Method | What It Reveals |
|-------|--------|-----------------|
| Web presence | DuckDuckGo search | Website, professionalism, online footprint |
| License status | State board search | Valid, expired, suspended, or not found |
| BBB profile | BBB search | Rating, accreditation, complaint history |
| Reviews | Multi-platform search | Google, Yelp, Angi review patterns |
| Complaints | Web search | Scam reports, rip-off reports, warnings |
| Legal history | Web search | Lawsuits, disciplinary actions, violations |
| Insurance | Web + site check | Liability and workers' comp evidence |
| Business history | Web search | How long they've been operating |

## Trust Score Guide

| Score | Label | Meaning |
|-------|-------|---------|
| 8-10 | 🟢 TRUSTED | Licensed, reviewed, clean record. Standard precautions. |
| 5-7 | 🟡 SOME CONCERNS | Mixed signals. Get more quotes and verify directly. |
| 1-4 | 🔴 HIGH RISK | Major red flags. Avoid or investigate further. |

## Quick Start

```bash
npm install
cp .env.example .env
# Add your OPENROUTER_API_KEY (or other provider key)
npm run dev
# Open http://localhost:3000
```

## Example Queries

- "Check ABC Plumbing in Portland, Oregon"
- "Is Johnson Roofing LLC licensed in Texas? License #12345"
- "Research Superior Electric — they quoted me $8,000 for a panel upgrade in San Jose, CA"
- "Should I hire Mike's Handyman Service? He wants $500 upfront for a bathroom remodel"

## Tools

| Tool | Purpose |
|------|---------|
| `search_contractor` | Find web presence, license info, BBB, review site listings |
| `verify_contractor` | Deep check: complaints, lawsuits, insurance, review patterns |
| `write_contractor_report` | Generate scored report with hire/avoid recommendation |

## Built With

Hand-written agentic orchestration loop, DuckDuckGo search. No API keys needed beyond the LLM provider.

## License

MIT
