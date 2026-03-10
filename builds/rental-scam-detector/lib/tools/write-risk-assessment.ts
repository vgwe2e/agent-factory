import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_risk_assessment',
  description:
    'Generate and save a rental listing risk assessment report. Includes a risk score (1-10), red flags, green flags, and a recommendation (SAFE / CAUTION / LIKELY SCAM). Always end here.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "123-main-st-risk-report.md")',
      },
      listing_summary: {
        type: 'string',
        description: 'Brief summary of the listing (address, price, source)',
      },
      risk_score: {
        type: 'string',
        description: 'Risk score from 1 (very safe) to 10 (almost certainly a scam)',
      },
      recommendation: {
        type: 'string',
        description: 'Recommendation: LIKELY LEGITIMATE / PROCEED WITH CAUTION / LIKELY SCAM',
      },
      red_flags: {
        type: 'string',
        description: 'Newline-separated list of red flags found',
      },
      green_flags: {
        type: 'string',
        description: 'Newline-separated list of positive legitimacy signals',
      },
      verification_summary: {
        type: 'string',
        description: 'Summary of verification results (address, landlord, contact checks)',
      },
      details: {
        type: 'string',
        description: 'Detailed analysis explaining the risk assessment',
      },
    },
    required: ['filename', 'listing_summary', 'risk_score', 'recommendation', 'red_flags', 'green_flags', 'details'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const listingSummary = args.listing_summary as string
  const riskScore = args.risk_score as string
  const recommendation = args.recommendation as string
  const redFlags = args.red_flags as string
  const greenFlags = args.green_flags as string
  const verificationSummary = (args.verification_summary as string) || 'See details below.'
  const details = args.details as string

  if (!filename || !listingSummary || !riskScore || !recommendation || !details) {
    return 'Error: filename, listing_summary, risk_score, recommendation, and details are required'
  }

  const score = parseInt(riskScore, 10)
  const emoji = score <= 3 ? '\ud83d\udfe2' : score <= 6 ? '\ud83d\udfe1' : '\ud83d\udd34'
  const label = score <= 3 ? 'LOW RISK' : score <= 6 ? 'MODERATE RISK' : 'HIGH RISK'

  const report = `# Rental Listing Risk Assessment

## ${emoji} Risk Score: ${riskScore}/10 \u2014 ${label}

| Field | Value |
|-------|-------|
| **Listing** | ${listingSummary} |
| **Recommendation** | **${recommendation}** |
| **Generated** | ${new Date().toISOString().split('T')[0]} |

---

## Red Flags

${redFlags.split('\n').filter(Boolean).map(f => `- \u26a0\ufe0f ${f.trim()}`).join('\n') || '- None identified'}

## Green Flags

${greenFlags.split('\n').filter(Boolean).map(s => `- \u2705 ${s.trim()}`).join('\n') || '- None identified'}

## Verification Results

${verificationSummary}

## Detailed Analysis

${details}

---

## What To Do Next

${score <= 3 ? `This listing appears legitimate. Standard precautions:
- [ ] Visit the property in person before signing anything
- [ ] Verify the landlord's identity matches property records
- [ ] Never pay a deposit until you've seen the property
- [ ] Get everything in writing (lease agreement, move-in costs)
- [ ] Take photos of the property during your visit
- [ ] Use traceable payment methods (check, bank transfer to verified account)` :
score <= 6 ? `This listing has some concerns. Before proceeding:
- [ ] DO NOT send money until all concerns are resolved
- [ ] Visit the property in person \u2014 do not rent sight unseen
- [ ] Verify the landlord owns the property (check county assessor records)
- [ ] Search the landlord's name/phone/email for other listings (scammers reuse info)
- [ ] Ask for a real estate license number if they claim to be an agent
- [ ] Reverse image search the listing photos to check if they're stolen
- [ ] If the landlord can't meet in person, walk away
- [ ] Compare the price to similar rentals in the area \u2014 if it's too good to be true, it probably is` :
`This listing shows strong signs of being a scam. Recommended actions:
- [ ] DO NOT send any money, deposits, or personal information
- [ ] DO NOT provide your Social Security Number or bank details
- [ ] Report the listing to the platform where you found it
- [ ] Report to the FTC at ReportFraud.ftc.gov
- [ ] Report to the FBI's Internet Crime Complaint Center (IC3) at ic3.gov
- [ ] If you've already sent money, contact your bank/payment provider immediately
- [ ] Warn others by posting about the scam (without sharing personal info)`}

---

## Common Rental Scam Tactics

1. **Stolen listings** \u2014 Scammers copy real listings and repost with their contact info
2. **Urgency pressure** \u2014 "Multiple applicants, act now!" to prevent due diligence
3. **Remote landlord** \u2014 "I'm overseas/deployed" so you can't meet or see the property
4. **Unusual payments** \u2014 Wire transfers, gift cards, crypto, or cash apps (untraceable)
5. **Below-market pricing** \u2014 Unrealistically low rent to attract desperate renters
6. **Upfront fees** \u2014 Requesting deposits, application fees, or holding fees before showing

---

*Generated by Rental Scam Detector \u2014 an open-source AI agent for rental listing verification*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Risk assessment saved to output/${sanitized} (${report.length} characters)\n\nSummary: ${emoji} ${label} (${riskScore}/10) \u2014 ${recommendation}`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
