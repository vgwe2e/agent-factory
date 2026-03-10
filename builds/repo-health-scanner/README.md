# Repo Health Scanner

An AI agent that evaluates the health of any GitHub repository and produces a graded report. Know exactly what you're getting before you `npm install` it.

## Why This Exists

You're about to add a new dependency. It has 2k stars. But:
- When was the last commit?
- Do maintainers respond to issues?
- Is there a license? Tests? CI?
- Are there known problems people are complaining about?

Checking all this manually takes 15-20 minutes per repo. This agent does it in one prompt.

## How It Works

```
You paste a GitHub repo URL
        |
        v
+---------------------+
|  1. FETCH REPO INFO |  Stars, commits, README, license,
|  fetch_repo_info     |  languages, activity, metadata
+---------+-----------+
          |
          v
+---------------------+
|  2. ANALYZE COMMUNITY|  Issue response rate, PR activity,
|  analyze_community   |  CONTRIBUTING.md, external reviews
+---------+-----------+
          |
          v
+---------------------+
|  3. HEALTH REPORT   |  Grade (A-F), category scores,
|  write_health_report |  strengths, weaknesses, advice
+---------------------+
        |
        v
   Graded report in ./output/
```

## What It Evaluates

| Category | What's Checked |
|----------|----------------|
| **Documentation** | README quality, examples, API docs, getting started guide |
| **Maintenance** | Commit recency, release cadence, last push date |
| **Community** | Issue response rate, PR merges, contributor count, CONTRIBUTING.md |
| **Code Quality** | CI/CD presence, tests, linting, type safety, SECURITY.md |

## Grading Scale

| Grade | Meaning |
|-------|---------|
| **A** | Excellent — production-ready, well-maintained |
| **B** | Good — suitable for most uses |
| **C** | Mediocre — use with caution, have a fallback |
| **D** | Poor — significant risks, consider alternatives |
| **F** | Abandoned or fundamentally problematic |

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> repo-health-scanner
cd repo-health-scanner
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Example Prompts

- "How healthy is facebook/react?"
- "Should I use https://github.com/expressjs/express as a dependency?"
- "Evaluate vercel/next.js — is it well-maintained?"
- "Check the health of this repo: sindresorhus/got"

## Output

Reports are saved to `./output/` as markdown with:
- Overall grade (A-F) with emoji
- Category scores (Documentation, Maintenance, Community, Code Quality)
- Specific strengths and weaknesses
- Actionable recommendations
- "Should you use this?" verdict

## Built On

[Agentic Harness](https://github.com/your-org/agentic-harness) — a minimal, self-hosted AI agent framework with tool use and streaming.

## License

MIT
