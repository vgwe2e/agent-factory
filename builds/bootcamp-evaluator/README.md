# Bootcamp Evaluator

> Research your bootcamp in 60 seconds, not 60 minutes.

An AI agent that checks coding bootcamp reviews, outcomes, complaints, accreditation, and curriculum quality before you enroll — consolidating hours of manual research into one scored report.

## The Problem

Prospective students check 6+ sources before choosing a bootcamp:
- Course Report / SwitchUp (ratings and reviews)
- Reddit (unfiltered graduate experiences)
- Official website (pricing, curriculum, outcomes claims)
- BBB (complaints and business legitimacy)
- LinkedIn (alumni outcomes — did graduates actually get jobs?)
- State education department (accreditation and complaints)

This takes hours per program, and you typically compare 3-5 bootcamps. That's days of manual research while marketing teams are optimized to rush you into enrolling.

## How It Works

```
You: "Evaluate App Academy's full-stack web development program"

Agent:
  1. search_bootcamp           → Find website, Course Report, SwitchUp, Reddit, pricing
  2. evaluate_bootcamp         → Check outcomes, placement rates, complaints, accreditation, curriculum
  3. write_evaluation_report   → Overall score 1-10, red/green flags, enroll/skip recommendation
```

## What Gets Checked

| Check | Method | What It Reveals |
|-------|--------|-----------------|
| Web presence | DuckDuckGo search | Official site, online footprint, legitimacy |
| Course Report | Site search | Ratings, graduate reviews, school profile |
| SwitchUp | Site search | Community ratings, verified reviews |
| Reddit sentiment | Site search | Unfiltered graduate experiences, honest opinions |
| Job placement | Web search | Employment rates, CIRR audited data |
| Complaints | Web search | Scam reports, BBB complaints, regulatory actions |
| Accreditation | Web search | State approval, licensing, legitimacy |
| Curriculum | Web + site check | Tech stack relevance, depth, instructor quality |
| Pricing | Web search | Tuition, ISA terms, value vs alternatives |

## Score Guide

| Score | Label | Meaning |
|-------|-------|---------|
| 8-10 | RECOMMENDED | Strong outcomes, good reviews, transparent. Standard due diligence. |
| 5-7 | MIXED SIGNALS | Some concerns. Compare alternatives and talk to graduates. |
| 1-4 | NOT RECOMMENDED | Major red flags. Skip or investigate thoroughly. |

## Quick Start

```bash
npm install
cp .env.example .env
# Add your OPENROUTER_API_KEY (or other provider key)
npm run dev
# Open http://localhost:3000
```

## Example Queries

- "Evaluate App Academy's full-stack program"
- "Is Flatiron School worth the money for data science?"
- "Research General Assembly's UX design bootcamp in New York"
- "Should I enroll in Lambda School (now BloomTech)? I've heard mixed things"
- "Compare Codecademy Pro vs freeCodeCamp for self-taught web development"
- "Is [bootcamp name] a scam? They're charging $20,000 for a 12-week program"

## Tools

| Tool | Purpose |
|------|---------|
| `search_bootcamp` | Find web presence, Course Report, SwitchUp, Reddit, pricing |
| `evaluate_bootcamp` | Deep check: outcomes, complaints, accreditation, curriculum, value |
| `write_evaluation_report` | Generate scored report with enroll/skip recommendation |

## Built With

Hand-written agentic orchestration loop, DuckDuckGo search. No API keys needed beyond the LLM provider.

## License

MIT
