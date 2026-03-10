import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_contractor_report',
  description:
    'Generate and save a contractor trust report. Includes a trust score (1-10), red/green flags, and a hire/avoid recommendation. Always end here.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "joes-plumbing-report.md")',
      },
      business_name: {
        type: 'string',
        description: 'The contractor or company name',
      },
      trade: {
        type: 'string',
        description: 'Type of work (plumber, electrician, roofer, etc.)',
      },
      location: {
        type: 'string',
        description: 'Where the contractor operates',
      },
      trust_score: {
        type: 'string',
        description: 'Trust score from 1 (avoid) to 10 (highly trusted)',
      },
      recommendation: {
        type: 'string',
        description: 'Recommendation: HIRE / GET MORE QUOTES / AVOID',
      },
      red_flags: {
        type: 'string',
        description: 'Newline-separated list of red flags and concerns',
      },
      green_flags: {
        type: 'string',
        description: 'Newline-separated list of positive trust signals',
      },
      license_status: {
        type: 'string',
        description: 'Summary of license verification findings',
      },
      review_summary: {
        type: 'string',
        description: 'Summary of reviews across platforms',
      },
      details: {
        type: 'string',
        description: 'Detailed analysis explaining the trust assessment',
      },
    },
    required: ['filename', 'business_name', 'trust_score', 'recommendation', 'red_flags', 'green_flags', 'details'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const businessName = args.business_name as string
  const trade = (args.trade as string) || 'Contractor'
  const location = (args.location as string) || 'Not specified'
  const trustScore = args.trust_score as string
  const recommendation = args.recommendation as string
  const redFlags = args.red_flags as string
  const greenFlags = args.green_flags as string
  const licenseStatus = (args.license_status as string) || 'See details below.'
  const reviewSummary = (args.review_summary as string) || 'See details below.'
  const details = args.details as string

  if (!filename || !businessName || !trustScore || !recommendation || !details) {
    return 'Error: filename, business_name, trust_score, recommendation, and details are required'
  }

  const score = parseInt(trustScore, 10)
  const emoji = score >= 7 ? '\ud83d\udfe2' : score >= 4 ? '\ud83d\udfe1' : '\ud83d\udd34'
  const label = score >= 7 ? 'TRUSTED' : score >= 4 ? 'SOME CONCERNS' : 'HIGH RISK'

  const report = `# Contractor Trust Report: ${businessName}

## ${emoji} Trust Score: ${trustScore}/10 \u2014 ${label}

| Field | Value |
|-------|-------|
| **Business** | ${businessName} |
| **Trade** | ${trade} |
| **Location** | ${location} |
| **Recommendation** | **${recommendation}** |
| **Generated** | ${new Date().toISOString().split('T')[0]} |

---

## Red Flags

${redFlags.split('\n').filter(Boolean).map(f => `- \u26a0\ufe0f ${f.trim()}`).join('\n') || '- None identified'}

## Green Flags

${greenFlags.split('\n').filter(Boolean).map(s => `- \u2705 ${s.trim()}`).join('\n') || '- None identified'}

## License Status

${licenseStatus}

## Review Summary

${reviewSummary}

## Detailed Analysis

${details}

---

## Before You Hire: Checklist

${score >= 7 ? `This contractor appears trustworthy. Standard precautions:
- [ ] Get a written estimate (not just verbal)
- [ ] Verify the estimate includes scope of work, materials, timeline, and payment schedule
- [ ] Confirm they carry liability insurance (ask for certificate)
- [ ] Confirm workers' compensation insurance if they have employees
- [ ] Never pay more than 10-30% upfront for large projects
- [ ] Get the contract in writing before work begins
- [ ] Agree on a payment schedule tied to milestones, not dates` :
score >= 4 ? `This contractor has some concerns. Before hiring:
- [ ] Get at least 2-3 additional quotes for comparison
- [ ] Verify the license number directly with your state licensing board
- [ ] Ask for 3 recent references and actually call them
- [ ] Request proof of liability insurance AND workers' compensation
- [ ] Check if they pull permits (licensed contractors should handle this)
- [ ] Never pay more than 10% upfront
- [ ] Get everything in a detailed written contract
- [ ] Consider using an escrow service for large projects
- [ ] Don't be pressured into signing immediately` :
`This contractor has significant trust issues. Recommended actions:
- [ ] DO NOT hire without resolving the red flags above
- [ ] Get quotes from at least 3 other licensed contractors
- [ ] Verify any license claims directly with the state board
- [ ] If they demand large upfront payments or cash only, walk away
- [ ] Report unlicensed contractors to your state licensing board
- [ ] If you've already had problems, file complaints with:
  - Your state contractor licensing board
  - Better Business Bureau (bbb.org)
  - State Attorney General's consumer protection division
  - Federal Trade Commission (reportfraud.ftc.gov)`}

---

## Common Contractor Scams

1. **Storm chasers** \u2014 After severe weather, unlicensed contractors go door-to-door offering "emergency repairs" at inflated prices
2. **Bait and switch** \u2014 Low initial quote, then costs balloon once work starts
3. **Large upfront payment** \u2014 Demand 50%+ upfront, then disappear or do poor work
4. **No permit pulling** \u2014 Skip permits to save money, leaving you liable for code violations
5. **Cash only** \u2014 No paper trail makes complaints and legal action harder
6. **Pressure tactics** \u2014 "This price is only good today" or "I have another job starting tomorrow"

---

*Generated by Contractor Trust Checker \u2014 an open-source AI agent for contractor due diligence*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Trust report saved to output/${sanitized} (${report.length} characters)\n\nSummary: ${emoji} ${label} (${trustScore}/10) \u2014 ${recommendation}`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
