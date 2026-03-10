# Research Log

See `research/summary.md` for cumulative history.
See `research/archive/` for full session logs.

---

## 2026-03-10 — Session 3

### Research Round 1: Hunting TAM 4+ with non-trust-checker architectures

Searched 20+ problem areas across Reddit, HN, Product Hunt, GitHub trends, and general web.
Key finding: AI tool explosion in 2024-2025 filled almost every consumer-facing niche. GAP=0 remains the #1 kill reason.

### Finding: Property Tax Appeal Advisor ✅ QUEUED
- **Source**: Bankrate, CBS News, CNBC, Reddit property tax threads, Ownwell ($50M raise)
- **Signal**: 87M owner-occupied homes in US, avg $4,271/year in property taxes. Only 5% appeal but 30-94% success rate. Average savings $539-$774/year. Over 40% of homeowners could potentially save $100+/year.
- **Current solutions**: County-specific tools only (Cook County, Jefferson County). Ownwell is PAID (takes 25% of savings). PropGap.ai covers NJ only. TaxNetUSA has a comp tool. No comprehensive FREE tool that works across all states.
- **Agent design**: GATHER (property address → search Zillow/Redfin for comparable sales + county assessor for current assessment) → ANALYZE (compare assessment to market value, flag if overassessed) → GENERATE (county-specific appeal process with deadlines/forms + draft appeal letter)
- **Score**: SIGNAL: 1 | GAP: 1 | FEASIBLE: 1 | TAM: 3 (87M homeowners) | Composite: 18
- **Status**: queued → building
- **Notes**: Different architecture from trust-checkers. Advisory + comparative analysis + document generation. Ownwell's $50M raise proves massive demand. $370B/year in property taxes paid = huge market. Previously researched in round 6 but never built.

### Rejected Ideas (this round)

| Idea | Reason | TAM |
|------|--------|-----|
| Personal data exposure scanner | GAP: partial — ExpressVPN, DeleteMe, Optery free scans exist as lead-gen | 4 |
| Tenant rights advisor | GAP: 0 — LeaseChat (U. Chicago), LeaseRights.ai, Renter Protector AI | 3 |
| Small business marketing audit | GAP: 0 — BuzzBoard, Thryv, Infoserve free audits. Same as rejected SEO audit | 3 |
| Complaint letter generator | GAP: 0 — Template.net, LogicBalls, Writecream, Easy-Peasy all free | 4 |
| Salary negotiation advisor | GAP: 0 — Career Agents free tool, Salary Wizard | 3 |
| Insurance policy analyzer | GAP: 0 — CoverageCheck, ScanPolicy, PolicyAdvisor.pro, ByteBeam all free | 4 |
| International money transfer comparison | GAP: 0 — CompareRemit, Monito, Wise, RemitAnalyst all free | 4 |
| Resume ATS optimizer | GAP: 0 — SkillSyncer, Novorésumé, ResyMatch, KudosWall, 10+ free | 4 |
| Parking ticket appeal generator | GAP: 0 — LogicBalls, Pardonn, Template.net all free | 3 |
| College financial aid comparison | GAP: 0 — College Raptor, Scholarships360, Road2College all free | 3 |
| Tariff lookup/calculator | GAP: 0 — Flexport Tariff Simulator, AMZ Prep, USITC official | 3 |
| Job offer total comp comparison | GAP: 0 — Levels.fyi, Career Agents, Salary.com all free | 3 |
| Food ingredient safety scanner | GAP: 0 — Yuka (8M users), Think Dirty, EWG Skin Deep | 4 |
| Utility bill audit | Location-specific; utility companies offer free audits | 4 |
| Consumer tariff impact calculator | GAP: 0 — TrumpTariffCalc.com, Speed Commerce, Budget Lab | 4 |
| EU AI Act compliance advisor | Too similar to regulatory-compliance-briefing already built | 3 |
| Flight delay compensation | All services take 25-50% commission; agent can't file claims | 4 |
| E-commerce review analyzer | GAP: 0 — ChatGPT/Perplexity do this natively; Fakespot exists | 3 |
