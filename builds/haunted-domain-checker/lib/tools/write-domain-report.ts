import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_domain_report',
  description:
    'Generate and save a domain health report with a reputation score (1-10) and a buy/skip recommendation. Summarizes all findings from fetch_domain_info and check_domain_reputation into a single actionable report. Always end here.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "example-com-report.md")',
      },
      domain: {
        type: 'string',
        description: 'The domain name being evaluated',
      },
      reputation_score: {
        type: 'string',
        description: 'Reputation score from 1 (haunted — do not buy) to 10 (clean — safe to buy)',
      },
      recommendation: {
        type: 'string',
        description: 'Buy recommendation: BUY / PROCEED WITH CAUTION / SKIP',
      },
      red_flags: {
        type: 'string',
        description: 'Newline-separated list of red flags and risks found',
      },
      green_flags: {
        type: 'string',
        description: 'Newline-separated list of positive signals',
      },
      domain_age: {
        type: 'string',
        description: 'How old the domain is (e.g. "5.2 years" or "Unknown")',
      },
      previous_use: {
        type: 'string',
        description: 'What the domain was previously used for based on Wayback Machine and web mentions',
      },
      blacklist_status: {
        type: 'string',
        description: 'Summary of blacklist check results',
      },
      email_reputation: {
        type: 'string',
        description: 'Summary of email deliverability concerns',
      },
      details: {
        type: 'string',
        description: 'Detailed analysis explaining the reputation assessment and recommendation',
      },
    },
    required: ['filename', 'domain', 'reputation_score', 'recommendation', 'red_flags', 'green_flags', 'details'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const domain = args.domain as string
  const reputationScore = args.reputation_score as string
  const recommendation = args.recommendation as string
  const redFlags = args.red_flags as string
  const greenFlags = args.green_flags as string
  const domainAge = (args.domain_age as string) || 'Unknown'
  const previousUse = (args.previous_use as string) || 'Unknown'
  const blacklistStatus = (args.blacklist_status as string) || 'See details below.'
  const emailReputation = (args.email_reputation as string) || 'See details below.'
  const details = args.details as string

  if (!filename || !domain || !reputationScore || !recommendation || !details) {
    return 'Error: filename, domain, reputation_score, recommendation, and details are required'
  }

  const score = parseInt(reputationScore, 10)
  const emoji = score >= 7 ? '\ud83d\udfe2' : score >= 4 ? '\ud83d\udfe1' : '\ud83d\udd34'
  const label = score >= 7 ? 'CLEAN' : score >= 4 ? 'SOME CONCERNS' : 'HAUNTED'

  const report = `# Domain Report: ${domain}

## ${emoji} Reputation Score: ${reputationScore}/10 \u2014 ${label}

| Field | Value |
|-------|-------|
| **Domain** | ${domain} |
| **Recommendation** | **${recommendation}** |
| **Domain Age** | ${domainAge} |
| **Previous Use** | ${previousUse} |
| **Generated** | ${new Date().toISOString().split('T')[0]} |

---

## Red Flags

${redFlags.split('\n').filter(Boolean).map(f => `- \u26a0\ufe0f ${f.trim()}`).join('\n') || '- None identified'}

## Green Flags

${greenFlags.split('\n').filter(Boolean).map(s => `- \u2705 ${s.trim()}`).join('\n') || '- None identified'}

## Blacklist Status

${blacklistStatus}

## Email Reputation

${emailReputation}

## Detailed Analysis

${details}

---

## What To Do Next

${score >= 7 ? `This domain appears clean. Before purchasing:
- [ ] Verify the price is reasonable for the TLD
- [ ] Double-check Wayback Machine for any content you may have missed
- [ ] Set up SPF, DKIM, and DMARC records immediately after purchase
- [ ] Submit the domain to Google Search Console after launching your site
- [ ] Monitor your sender reputation for the first few weeks of email use` :
score >= 4 ? `This domain has some concerns. Before purchasing:
- [ ] Visit the Wayback Machine link and review past content manually
- [ ] Check VirusTotal manually for recent scan results
- [ ] Search for the domain on major blacklist aggregators (MxToolbox, multirbl.valli.org)
- [ ] Test email deliverability from the domain before committing
- [ ] Consider whether the issues found are worth the risk
- [ ] Budget extra time for blacklist delisting requests if needed
- [ ] Set up monitoring (Google Search Console, email reputation tools) immediately` :
`This domain has significant reputation issues. Recommendation: SKIP.
- [ ] Consider registering a fresh domain instead
- [ ] If you must proceed, expect weeks/months of cleanup work
- [ ] You will likely need to submit delisting requests to multiple blacklist operators
- [ ] Google penalties may take 6-12 months to fully clear
- [ ] Email from this domain may be rejected by major providers
- [ ] Social media platforms may block sharing links from this domain
- [ ] Factor in the hidden cost of reputation repair vs. buying a clean domain`}

---

## Quick Reference Links

- [Wayback Machine](https://web.archive.org/web/*/${domain})
- [VirusTotal](https://www.virustotal.com/gui/domain/${domain})
- [Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/search?url=${domain})
- [MxToolbox Blacklists](https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${domain}&run=toolpage)
- [Spamhaus](https://check.spamhaus.org/listed/?searchterm=${domain})

---

*Generated by Haunted Domain Checker \u2014 an open-source AI agent for domain reputation auditing*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Domain report saved to output/${sanitized} (${report.length} characters)\n\nSummary: ${emoji} ${label} (${reputationScore}/10) \u2014 ${recommendation}`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
