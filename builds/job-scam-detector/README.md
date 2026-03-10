# Job Scam Detector

An AI agent that analyzes job postings for scam indicators, verifies employers, and produces risk reports. Paste a URL or job description and get an instant safety assessment.

## Why This Exists

**4 in 10 Americans received scam job texts in 2025.** AI-generated fake postings are flooding LinkedIn, Indeed, and Craigslist. They look real, use professional language, and promise great pay for minimal work.

Existing solutions are either generic scam detectors (Norton Genie) or expensive enterprise tools. There's no free, focused, AI-powered job posting analyzer — until now.

## How It Works

```
You paste a job posting URL or text
        |
        v
+---------------------+
|  1. FETCH & PARSE   |  Extract job title, company, salary,
|  fetch_job_posting   |  description, qualifications, contact
+---------+-----------+
          |
          v
+---------------------+
|  2. VERIFY EMPLOYER  |  Search web for company website,
|  verify_employer     |  Glassdoor reviews, scam reports
+---------+-----------+
          |
          v
+---------------------+
|  3. RISK REPORT     |  Score red flags, produce report
|  generate_risk_report|  with rating (1-10) + next steps
+---------------------+
        |
        v
   Markdown report saved to ./output/
```

## What It Checks

**High-severity red flags:**
- Requests for money, fees, or gift cards
- Asks for SSN/bank info before hiring
- No company name or fake company name
- Personal email domains (Gmail, Yahoo) for corporate communication

**Medium-severity red flags:**
- Unrealistic salary for the role
- Vague job description
- "No experience needed" for skilled positions
- Extreme urgency ("apply NOW")
- Text-only interviews

**Verification checks:**
- Does the company have a real website?
- Does it have Glassdoor/Indeed reviews?
- Are there scam reports for this company?
- Is the domain indexed by search engines?

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> job-scam-detector
cd job-scam-detector
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

Then paste a job posting URL or text into the chat. The agent will analyze it and produce a risk report.

## Example Prompts

- "Is this job legit? https://example.com/job/senior-developer-remote"
- "Check this job posting I found on LinkedIn: [paste full text]"
- "I got this email about a work-from-home opportunity. Is it a scam? [paste email]"

## Output

Reports are saved to `./output/` as markdown files with:
- Risk score (1-10) with color coding
- List of red flags found
- Positive indicators
- Employer verification results
- Concrete next steps

## Built On

[Agentic Harness](https://github.com/your-org/agentic-harness) — a minimal, self-hosted AI agent framework with tool use and streaming.

## License

MIT
