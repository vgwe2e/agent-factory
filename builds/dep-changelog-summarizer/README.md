# Dependency Changelog Summarizer

An AI agent that reads your project's dependency file, fetches recent changelogs, and tells you what actually changed — in plain English. No more manually reading 20 CHANGELOG.md files before updating.

## Why This Exists

**Dependabot tells you WHAT to update. This tells you WHY.**

Every developer has been there: Dependabot opens 15 PRs, you have no idea what changed, so you either blindly merge or ignore them all. Both are bad.

This agent reads your package.json (or requirements.txt, or Gemfile), looks up the actual release notes for your dependencies, and gives you a prioritized report: what's critical, what's breaking, and what can wait.

## How It Works

```
Point it at your package.json
        |
        v
+---------------------+
|  1. SCAN DEPS       |  Parse package.json / requirements.txt
|  scan_dependencies   |  List all deps with current versions
+---------+-----------+
          |
          v
+---------------------+
|  2. FETCH CHANGES   |  Look up GitHub releases, changelogs
|  fetch_changelogs    |  Focus on breaking changes + security
+---------+-----------+
          |
          v
+---------------------+
|  3. UPDATE REPORT   |  Categorize by urgency, summarize
|  write_update_report |  breaking changes, recommend strategy
+---------------------+
        |
        v
   Prioritized report in ./output/
```

## What You Get

- **Urgency levels**: Critical / High / Moderate / Low for each update
- **Breaking changes**: Specific details, not just "there are breaking changes"
- **Migration notes**: What you need to change in your code
- **Update strategy**: Recommended order to apply updates
- **Security flags**: Vulnerabilities highlighted first

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> dep-changelog-summarizer
cd dep-changelog-summarizer
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set PROVIDER, MODEL, and API key

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Example Prompts

- "Scan my package.json and tell me what needs updating"
- "Check the changelogs for my project at ./package.json"
- "What breaking changes are in the latest React and Next.js?"
- "Analyze requirements.txt and prioritize what I should update first"

## Supported Package Managers

| Format | File | Ecosystem |
|--------|------|-----------|
| npm/yarn/pnpm | `package.json` | Node.js |
| pip | `requirements.txt` | Python |
| Bundler | `Gemfile` | Ruby |

## Output

Reports are saved to `./output/` as markdown with:
- Color-coded urgency badges
- Per-package changelogs summarized
- Breaking changes with migration steps
- Recommended update order

## Built On

[Agentic Harness](https://github.com/your-org/agentic-harness) — a minimal, self-hosted AI agent framework with tool use and streaming.

## License

MIT
