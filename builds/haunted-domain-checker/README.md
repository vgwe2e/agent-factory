# Haunted Domain Checker

> Before you buy a domain name, first check to see if it's haunted.

An AI agent that audits domain names before purchase to uncover hidden reputation problems — blacklists, spam history, Google penalties, malware flags, and more.

## The Problem

Expired and pre-owned domains can carry invisible baggage:

- **Google penalties** — Previous spam use means zero organic search traffic for months
- **Email blacklists** — Your emails go straight to spam folders
- **Social media blocks** — Facebook, Twitter, and others block the domain from being shared
- **Corporate firewall blocks** — ISPs and enterprise firewalls categorize the domain based on old content
- **Antivirus flags** — Norton, McAfee, etc. warn users about your "dangerous" site

People discover these problems *after* buying. Cleaning up a haunted domain can take months and cost more than just buying a fresh one.

## How It Works

```
You: "Check example-domain.com before I buy it"

Agent:
  1. fetch_domain_info    → RDAP registration, Wayback Machine history, DNS records
  2. check_domain_reputation → Blacklists, malware, phishing, spam, VirusTotal, email rep
  3. write_domain_report  → Reputation score 1-10, red/green flags, BUY/SKIP recommendation
```

## What Gets Checked

| Check | Source | What It Reveals |
|-------|--------|-----------------|
| Domain age & registration | RDAP | How old, who registered it, expiry |
| Historical content | Wayback Machine CDX API | What the site looked like before |
| DNS configuration | Cloudflare DNS-over-HTTPS | Current A, MX, NS, TXT records, SPF/DMARC |
| Blacklists | Web search + MxToolbox | Spam/malware blacklist appearances |
| Malware & phishing | VirusTotal + Google Safe Browsing | Security flags and warnings |
| Email reputation | Web search | Sender reputation and deliverability concerns |
| General reputation | Web mentions | What the internet says about this domain |

## Reputation Score Guide

| Score | Label | Meaning |
|-------|-------|---------|
| 8-10 | 🟢 CLEAN | Safe to buy. No significant issues found. |
| 5-7 | 🟡 SOME CONCERNS | Proceed with caution. Minor issues or unknowns. |
| 1-4 | 🔴 HAUNTED | Significant reputation damage. Consider a fresh domain instead. |

## Quick Start

```bash
npm install
cp .env.example .env
# Add your OPENROUTER_API_KEY (or other provider key)
npm run dev
# Open http://localhost:3000
```

## Example Queries

- "Check coolstartup.io before I buy it"
- "Is old-business-name.com safe to register?"
- "Audit this expired domain: techdeals.net"
- "Should I buy premium-word.com from a domain broker?"

## Tools

| Tool | Purpose |
|------|---------|
| `fetch_domain_info` | RDAP registration + Wayback Machine history + DNS records |
| `check_domain_reputation` | Blacklists, malware, phishing, spam, email reputation search |
| `write_domain_report` | Generate scored report with buy/skip recommendation |

## Built With

Hand-written agentic orchestration loop, DuckDuckGo search, RDAP, Wayback Machine CDX API, Cloudflare DNS-over-HTTPS. No API keys needed beyond the LLM provider.

## License

MIT
