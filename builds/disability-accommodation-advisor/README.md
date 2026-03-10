# Disability Accommodation Advisor

AI agent that helps people with disabilities understand their accommodation rights under the ADA, Section 504, and Fair Housing Act. Analyzes your situation, suggests specific accommodations, and generates formal request letters with escalation plans.

## The Problem

**40 million+ Americans** have disabilities that could qualify for accommodations, but **25% of workers** with disabilities have unmet accommodation needs. Only **37% of disabled college students** disclose to their school. Most people don't know what to ask for, how to ask, or what to do when denied.

JAN (Job Accommodation Network) is the gold standard for accommodation advice but is phone/email only — not AI-powered, not instant, not available 24/7. No free AI tool combines rights analysis, accommodation suggestions, law research, and formal request letter generation.

## How It Works

```
Tell the agent about your situation
         │
         ▼
┌──────────────────────────────┐
│ analyze_accommodation_needs  │ ← Identifies applicable laws,
│                              │   suggests accommodations based
│                              │   on disability type & barriers
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ search_accommodation_laws    │ ← Searches for state-specific
│                              │   disability laws, ADA updates
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ search_accommodation_examples│ ← Finds practical accommodation
│                              │   ideas from JAN and real cases
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ write_accommodation_request  │ ← Generates formal request letter,
│                              │   documentation checklist, denial
│                              │   escalation plan, complaint guide
└──────────────────────────────┘
```

## Example Prompts

- "I have ADHD and I work as a software engineer in an open office. The noise makes it impossible to concentrate. How do I request accommodation?"
- "I'm a college student with anxiety and I need extended time on exams. My school denied my request."
- "I have chronic back pain and my employer won't let me work from home even though my doctor recommended it."
- "My landlord won't allow my emotional support animal despite my therapist's letter. I'm in California."
- "I have a hearing impairment and I need captioning for meetings. My employer says it's too expensive."

## Tools

| Tool | Description |
|------|-------------|
| `analyze_accommodation_needs` | Analyzes situation, identifies applicable laws (ADA, 504, FHA), suggests specific accommodations, outlines interactive process and complaint options |
| `search_accommodation_laws` | Searches for state-specific disability laws, ADA updates, EEOC guidance, JAN resources |
| `search_accommodation_examples` | Finds practical accommodation ideas from JAN database and real-world examples |
| `write_accommodation_request` | Generates formal request letter, documentation checklist, escalation guide, and complaint filing instructions |
| `web_search` | General web search for additional research |
| `web_fetch` | Fetch and extract content from web pages |
| `file_write` | Save request letters and plans to disk |
| `file_read` | Read files from disk |

## Contexts Covered

- **Workplace** — ADA Title I, PWFA, FMLA, Rehabilitation Act
- **College** — Section 504, ADA Title II/III
- **K-12 School** — IDEA, Section 504, ADA Title II (IEP and 504 Plans)
- **Housing** — Fair Housing Act, ADA Title III, Section 504

## Quick Start

```bash
npm install
cp .env.example .env
# Set OPENROUTER_API_KEY (or ANTHROPIC_API_KEY) in .env
npm run dev
# Open http://localhost:3000
```

## Why This Matters

- 25% of workers with disabilities have unmet accommodation needs
- 63% of accommodations cost nothing; 88% cost under $500 (JAN)
- 60% of HR managers report increased accommodation requests in 2024
- Employees who receive accommodations have higher job satisfaction and retention
- This tool is **free** and available 24/7

## Disclaimer

This tool provides **informational guidance only**, not legal advice. Disability rights law is complex. For denied accommodations or retaliation, consult a disability rights attorney — many offer free consultations. Your state's Protection & Advocacy organization provides free legal help: https://www.ndrn.org/about/ndrn-member-agencies/

---

Built on the [Agentic Harness](../../seed/README.md) — a minimal, self-hosted AI agent framework.
