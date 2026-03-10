# Immigration Form Navigator

AI agent that helps people navigate US immigration forms — determines which forms to file, checks eligibility, flags common mistakes, and generates personalized filing guides. Replaces the need to pay $1,500-$5,000 for a lawyer just to figure out which forms you need.

## The Problem

USCIS received **10.4 million forms** in FY2023. **44% of rejections** are caused by using the wrong form version alone. Errors cost applicants **$1,500-$3,000+** in re-filing fees plus **1-2 years** of delay. EB-2 NIW approval rates collapsed from 96% to 43% in FY2024.

Immigration attorneys charge $1,500-$5,000+ just for form preparation. Free resources exist (USCIS.gov) but require you to already know which form you need. No free AI tool systematically determines which forms to file based on your situation, walks through eligibility requirements, and flags common mistakes before you file.

## How It Works

```
Tell the agent your immigration situation
         │
         ▼
┌──────────────────────────────┐
│ analyze_immigration_situation │ ← Determines which forms you
│                               │   need based on your status,
│                               │   goal, and circumstances
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ search_immigration           │ ← Searches for latest requirements,
│ _requirements                │   processing times, fees, policies
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ check_visa_bulletin          │ ← Checks priority dates for EB
│                              │   and family preference categories
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ write_filing_guide           │ ← Generates personalized guide:
│                              │   forms list, document checklist,
│                              │   fee summary, common mistakes,
│                              │   timeline
└──────────────────────────────┘
```

## Example Prompts

- "I'm on an H-1B visa and my employer wants to sponsor me for a green card. I'm from India. What forms do I need?"
- "I'm a US citizen and I want to sponsor my spouse who is currently outside the US in Mexico."
- "I've been a green card holder for 4 years and I'm married to a US citizen. Can I apply for citizenship?"
- "I'm an F-1 student and I want to apply for OPT. What do I need to do?"
- "I need to extend my B-2 tourist visa. It expires next month."
- "I want to apply for DACA renewal. What's the current process?"

## Tools

| Tool | Description |
|------|-------------|
| `analyze_immigration_situation` | Determines which USCIS forms to file based on status, goal, and circumstances. Includes fees, processing times, eligibility checks, and warnings. |
| `search_immigration_requirements` | Searches for current USCIS requirements, policy updates, processing times, and fee schedules. |
| `check_visa_bulletin` | Checks priority dates for employment-based and family preference green card categories by country. |
| `write_filing_guide` | Generates personalized filing guide with document checklist, fee summary, filing steps, common mistakes, and timeline. |
| `web_search` | General web search for additional research |
| `web_fetch` | Fetch and extract content from web pages |
| `file_write` | Save filing guides to disk |
| `file_read` | Read files from disk |

## Immigration Paths Covered

- **Family-based green cards** (I-130, I-485, DS-260)
- **Employment-based green cards** (PERM, I-140, I-485)
- **Self-petitions** (EB-2 NIW, EB-1A)
- **Naturalization** (N-400)
- **Work authorization** (I-765, OPT, EAD)
- **Status changes/extensions** (I-539)
- **H-1B petitions** (I-129)
- **DACA** (I-821D)
- **Asylum** (I-589)
- **TPS** (I-821)

## Quick Start

```bash
npm install
cp .env.example .env
# Set OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) in .env
npm run dev
# Open http://localhost:3000
```

## Why This Matters

- 10.4M USCIS forms filed annually — growing 52% over the last decade
- Filing errors cost $1,500-$3,000+ per person in re-filing fees plus years of delay
- Immigration attorneys charge $1,500-$5,000+ for basic form preparation
- Free government resources require you to already know which form you need
- This tool is **free** and helps people navigate the process independently

## Disclaimer

This tool provides **informational guidance only**, not legal advice. Immigration law is extremely complex and constantly changing. Filing errors can result in denial, loss of status, or deportation. For important applications, **strongly consider consulting an immigration attorney**. USCIS (uscis.gov) is the only authoritative source for current forms, fees, and requirements.

---

Built on the [Agentic Harness](../../seed/README.md) — a minimal, self-hosted AI agent framework.
