import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_filing_guide',
  description:
    'Generate and save a comprehensive, personalized immigration filing guide. Includes form-by-form instructions, required documents checklist, fee summary, filing addresses, common mistakes to avoid, and timeline. Always use this as the final step after analyzing the situation and researching requirements.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the guide (e.g. "immigration-guide-i485-march2026.md")',
      },
      applicant_name: {
        type: 'string',
        description: 'Applicant name',
      },
      situation_analysis: {
        type: 'string',
        description: 'Results from analyze_immigration_situation as markdown',
      },
      requirements_research: {
        type: 'string',
        description: 'Summary of requirements found during research',
      },
      visa_bulletin_info: {
        type: 'string',
        description: 'Visa bulletin priority date information if applicable',
      },
      forms_to_file: {
        type: 'string',
        description: 'Comma-separated list of form numbers (e.g. "I-130, I-485, I-765, I-131")',
      },
      immigration_goal: {
        type: 'string',
        description: 'What the applicant wants to accomplish',
      },
      current_status: {
        type: 'string',
        description: 'Applicant current immigration status',
      },
      key_deadlines: {
        type: 'string',
        description: 'Any important deadlines (visa expiration, 1-year asylum deadline, etc.)',
      },
    },
    required: ['filename', 'immigration_goal'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const applicantName = (args.applicant_name as string) || '[Your Name]'
  const situationAnalysis = (args.situation_analysis as string) || ''
  const requirementsResearch = (args.requirements_research as string) || ''
  const visaBulletinInfo = (args.visa_bulletin_info as string) || ''
  const formsToFile = (args.forms_to_file as string) || ''
  const goal = (args.immigration_goal as string) || ''
  const currentStatus = (args.current_status as string) || ''
  const keyDeadlines = (args.key_deadlines as string) || ''

  if (!filename || !goal) {
    return 'Error: filename and immigration_goal are required'
  }

  const today = new Date().toISOString().split('T')[0]
  const formsList = formsToFile.split(',').map(f => f.trim()).filter(Boolean)

  const report = `# Immigration Filing Guide
## ${applicantName}

**Prepared**: ${today}
**Current status**: ${currentStatus || 'See analysis below'}
**Goal**: ${goal}
${formsToFile ? `**Forms to file**: ${formsToFile}` : ''}
${keyDeadlines ? `**Key deadlines**: ${keyDeadlines}` : ''}

---

## Important Disclaimer

**This guide is for informational purposes only. It is NOT legal advice.** Immigration law is extremely complex and constantly changing. Filing errors can result in denial, loss of status, or even deportation. For important applications (green card, citizenship, asylum), **strongly consider consulting an immigration attorney**. Many offer free initial consultations.

**USCIS is the only authoritative source** for current forms, fees, and requirements. Always verify information at uscis.gov before filing.

---

${situationAnalysis ? `## Your Situation Analysis

${situationAnalysis}

---

` : ''}${requirementsResearch ? `## Requirements Research

${requirementsResearch}

---

` : ''}${visaBulletinInfo ? `## Visa Bulletin Information

${visaBulletinInfo}

---

` : ''}## Filing Checklist

### Before You Start

- [ ] Verify you have the **latest form version** — download directly from uscis.gov on the day you file
- [ ] Check the **current fee schedule** at uscis.gov/fees (fees changed in 2024)
- [ ] Determine the correct **filing address** at uscis.gov (varies by form, state, and filing type)
- [ ] Gather all **supporting documents** (see document checklist below)
- [ ] Make **copies of everything** — forms, documents, checks, photos
- [ ] Get **passport-style photos** if required (2x2 inches, white background)
- [ ] Prepare payment — personal check or money order payable to "U.S. Department of Homeland Security"

### Document Checklist

#### Identity Documents
- [ ] Valid passport (copy of bio page)
- [ ] Birth certificate (with certified English translation if not in English)
- [ ] Government-issued photo ID

#### Immigration Documents
- [ ] Current visa / I-94 record (get at i94.cbp.dhs.gov)
- [ ] Previous immigration approvals / EADs / travel documents
- [ ] Any USCIS receipt notices

${formsList.includes('I-485') || formsList.includes('I-130') || goal.toLowerCase().includes('green card') ? `#### For Green Card Applications
- [ ] Passport-style photos (2 copies)
- [ ] Birth certificate with English translation
- [ ] Marriage certificate (if applicable)
- [ ] Divorce decree(s) for any prior marriages
- [ ] Police clearances / court records (if applicable)
- [ ] Medical examination (Form I-693) — must be from USCIS-designated civil surgeon
- [ ] Affidavit of Support (Form I-864) — petitioner must show 125% of poverty level
- [ ] Tax returns (3 years) for Affidavit of Support
- [ ] Employment verification letter
- [ ] Evidence of bona fide marriage (if spouse-based): joint bank accounts, lease, photos, insurance

` : ''}${formsList.includes('N-400') || goal.toLowerCase().includes('citizen') ? `#### For Naturalization (N-400)
- [ ] Copy of green card (front and back)
- [ ] Passport-style photos (2 copies)
- [ ] Travel history for last 5 years (all trips outside US)
- [ ] Employment history for last 5 years
- [ ] Home address history for last 5 years
- [ ] Tax returns (5 years or 3 years if married to US citizen)
- [ ] Marriage/divorce records
- [ ] Study materials for English and civics tests (100 civics questions)
- [ ] Selective Service registration (if male, 18-31)

` : ''}### Filing Steps

1. **Download the latest forms** from uscis.gov — check the form version date in the bottom left corner
2. **Fill out completely** — use black ink for paper forms, or file online if available
3. **Write "N/A"** for any field that doesn't apply — never leave blanks
4. **Sign and date** every form that requires a signature
5. **Prepare your fee** — check, money order, or credit card (Form G-1450 for credit card)
6. **Organize your package**: forms on top, then fee, then supporting documents in the order listed in instructions
7. **Make copies** of everything before mailing
8. **Mail via trackable service** — USPS Priority Mail, FedEx, or UPS (keep tracking number)
9. **Save your receipt notice** (Form I-797C) when you receive it — this is your proof of filing

### After Filing

- [ ] Save your receipt number (starts with IOE, EAC, WAC, LIN, SRC, MSC, or NBC)
- [ ] Check case status at egov.uscis.gov/casestatus
- [ ] Respond to any Request for Evidence (RFE) within the deadline
- [ ] Attend biometrics appointment if scheduled
- [ ] Attend interview if scheduled
- [ ] Maintain valid status while waiting for decision

---

## Fee Summary

${formsList.length > 0 ? formsList.map(f => `- **${f}**: Check current fee at uscis.gov/fees`).join('\n') : '- Check current fees at uscis.gov/fees for your specific forms'}

**Fee waiver**: Form I-912 (Request for Fee Waiver) available for certain forms if you receive means-tested benefits, income below 150% of poverty level, or financial hardship.

---

## Common Mistakes That Cause Rejections

| Mistake | How to Avoid |
|---------|-------------|
| Wrong form version | Download from uscis.gov the day you file |
| Wrong fee | Check uscis.gov/fees — fees changed in 2024 |
| Wrong filing address | Check "Where to File" for your specific form and state |
| Missing signature | Sign every form — check for multiple signature lines |
| Blank fields | Write "N/A" — never leave blanks |
| Missing photos | 2x2 inch, white background, taken within 30 days |
| Expired medical exam | I-693 valid for 2 years from civil surgeon's signature |
| Wrong check payee | "U.S. Department of Homeland Security" (not USCIS) |
| Missing pages | Print ALL pages of the form, even if some are blank |
| No copies | Copy everything before mailing |

---

## Timeline

| Step | Expected Timeline |
|------|------------------|
| File application | Day 1 |
| Receive receipt notice (I-797C) | 2-4 weeks |
| Biometrics appointment | 3-8 weeks after receipt |
| Case processing | See uscis.gov/processing-times |
| Interview (if required) | Varies by office |
| Decision | After interview or processing |

---

## If Something Goes Wrong

### Application Rejected
- Check the rejection notice for the specific reason
- Fix the issue and refile — rejected applications are NOT denied (no negative record)
- Common reasons: wrong fee, wrong form version, missing signature

### Request for Evidence (RFE)
- Respond within the deadline (usually 87 days)
- Address EVERY item requested
- Send by trackable mail
- Include the RFE notice barcode page on top

### Denial
- Read the denial notice carefully for the reason
- Consider filing a motion to reopen (Form I-290B) within 30 days
- Consider filing a motion to reconsider
- Consult an attorney for appeal options

---

## Helpful Resources

- **USCIS Forms**: https://www.uscis.gov/forms
- **USCIS Processing Times**: https://egov.uscis.gov/processing-times/
- **USCIS Fee Schedule**: https://www.uscis.gov/fees
- **Case Status Check**: https://egov.uscis.gov/casestatus/landing.do
- **I-94 Travel Record**: https://i94.cbp.dhs.gov/
- **Visa Bulletin**: https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html
- **USCIS Policy Manual**: https://www.uscis.gov/policy-manual
- **Fee Waiver (I-912)**: https://www.uscis.gov/i-912
- **Find a USCIS Office**: https://www.uscis.gov/about-us/find-a-uscis-office
- **Find Legal Help**: https://www.immigrationadvocates.org/legaldirectory/
- **Free Legal Aid**: https://www.lawhelp.org/ (select "Immigration" topic)

---

*Generated by Immigration Form Navigator — a free, open-source AI agent that helps people navigate US immigration forms. Not legal advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Filing guide saved to output/${sanitized} (${report.length} characters)\n\nYour personalized immigration filing guide is ready! It includes form recommendations, document checklists, fee summary, common mistakes to avoid, and a filing timeline.`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
