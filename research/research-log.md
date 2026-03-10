# Research Log

Ongoing record of problems discovered, scored, and evaluated for the agent-factory pipeline.

---

## 2026-03-10 — Session 1

### Finding: Job Posting Scam Detector
- **Source**: Reddit (r/jobs, r/scams), FlexJobs survey, Indeed career advice, Hacker News
- **Signal**: 4 in 10 Americans received job scam texts in 2025 (Resume.org survey). LinkedIn job scams surging in 2026. AI-generated fake postings increasingly sophisticated. Constant complaints on Reddit about fake listings.
- **Current solutions**: Norton Genie (generic scam detector, not job-specific). Resumly AI (paid). Manual checklist articles. No free, focused, AI-powered job posting analyzer.
- **Agent design**: Tool 1 (GATHER): web_fetch to grab job posting page. Tool 2 (PROCESS): web_search to verify company existence, check domain, find reviews. Tool 3 (OUTPUT): file_write risk report with specific red flags.
- **Score**: SIGNAL: 1 | GAP: 1 | FEASIBLE: 1 | Total: 3/3
- **Status**: built (venture 6/6)
- **Notes**: Broad audience. Emotional appeal. Very testable — paste a URL, get a risk score. Red flags: vague descriptions, unrealistic salary, grammar issues, missing company info, generic email domains, payment requests. BUILD: TypeScript clean, Next.js build passes. 3 specialized tools: fetch_job_posting, verify_employer, generate_risk_report.

### Finding: Dependency Changelog Summarizer
- **Source**: DEV Community, npm/Renovate docs, HN developer tool wishes
- **Signal**: "Updating packages leads to questioning career choices at 2 AM." Developers miss breaking changes constantly. Dependabot/Renovate create PRs but don't summarize what changed.
- **Current solutions**: Dependabot (creates PRs, no summaries). Renovate Bot (same). Manual changelog reading. GitHub releases page (per-repo visits).
- **Agent design**: Tool 1 (GATHER): file_read package.json, web_fetch GitHub release notes. Tool 2 (PROCESS): Summarize changelogs, highlight breaking changes, rate urgency. Tool 3 (OUTPUT): file_write structured update report.
- **Score**: SIGNAL: 1 | GAP: 1 | FEASIBLE: 1 | Total: 3/3
- **Status**: built (venture 6/6)
- **Notes**: Clear gap vs existing tools. Dependabot tells you WHAT to update, not WHY or what breaks. Works with any package manager. BUILD: TypeScript clean, Next.js build passes. 3 tools: scan_dependencies, fetch_changelogs, write_update_report.

### Finding: GitHub Repo Health Scanner
- **Source**: GitHub topics (readme-score), NxCode tool, HN discussions
- **Signal**: Developers evaluate repos before adopting. Common: Is it maintained? Good docs? Active community? Responsive to issues?
- **Current solutions**: NxCode web tool (limited). GitHub Code Quality (preview, own repos only). readme-score (outdated). Manual evaluation (slow).
- **Agent design**: Tool 1 (GATHER): web_fetch GitHub repo page + API. Tool 2 (PROCESS): Score health (README, commits, issues, stars, license, CI). Tool 3 (OUTPUT): file_write health report.
- **Score**: SIGNAL: 1 | GAP: 1 | FEASIBLE: 1 | Total: 3/3
- **Status**: built (venture 6/6)
- **Notes**: Useful for any developer evaluating dependencies. Also for maintainers improving their repos. BUILD: TypeScript clean, Next.js build passes. 3 tools: fetch_repo_info, analyze_community, write_health_report.

### Finding: Landing Page Copy Auditor
- **Source**: Reddit (r/webdev, r/entrepreneur), HN, indie hacker communities
- **Signal**: Common pain — people want landing page feedback.
- **Current solutions**: Roastd.io (free). NxCode (free tier). Multiple free options emerging.
- **Score**: SIGNAL: 1 | GAP: 0 | FEASIBLE: 1 | Total: 2/3
- **Status**: deferred
- **Notes**: Gap closing fast. Roastd.io already does this well for free.

### Finding: Content Repurposer (Blog to Social)
- **Source**: Reddit marketing communities, Sprout Social
- **Signal**: 94% of marketers repurpose content.
- **Current solutions**: Planable (free, unlimited). Repurpose.io. Many free options.
- **Score**: SIGNAL: 1 | GAP: 0 | FEASIBLE: 1 | Total: 2/3
- **Status**: rejected
- **Notes**: Market saturated. Planable offers this free and unlimited.

### Finding: TOS/Privacy Policy Change Monitor
- **Source**: VentureBeat, TechCrunch, general web
- **Signal**: People care when TOS changes but specific tool request is niche.
- **Current solutions**: Visualping (general). TOSBack (shut down). No focused free tracker.
- **Score**: SIGNAL: 0 | GAP: 1 | FEASIBLE: 1 | Total: 2/3
- **Status**: deferred
- **Notes**: Gap exists but signal is weak.

### Finding: Freelance Contract Red Flag Reviewer
- **Source**: HN, Reddit freelancer communities
- **Signal**: Freelancers worry about contracts. Commercial tools expensive.
- **Current solutions**: Spellbook, Ironclad, goHeather (all expensive/enterprise).
- **Score**: SIGNAL: 1 | GAP: 0 | FEASIBLE: 1 | Total: 2/3
- **Status**: rejected
- **Notes**: Doesn't leverage tools — just LLM text analysis. Base harness already does this.
