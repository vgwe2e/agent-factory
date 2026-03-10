import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_deduction_report',
  description:
    'Generate and save a comprehensive tax deduction report for a freelancer. Includes all applicable deductions, estimated savings, IRS form references, action items, and common mistakes to avoid.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "freelance-writer-deductions.md")',
      },
      profession: {
        type: 'string',
        description: 'The freelancer\'s profession',
      },
      annual_income: {
        type: 'string',
        description: 'Estimated annual freelance income',
      },
      filing_status: {
        type: 'string',
        description: 'Filing status (single, married_joint, etc.)',
      },
      deductions_summary: {
        type: 'string',
        description: 'Comprehensive summary of all applicable deductions with dollar estimates, formatted as markdown',
      },
      estimated_total_savings: {
        type: 'string',
        description: 'Estimated total tax savings (e.g. "$4,500 – $8,200")',
      },
      action_items: {
        type: 'string',
        description: 'Newline-separated list of specific action items the freelancer should take',
      },
      common_mistakes: {
        type: 'string',
        description: 'Newline-separated list of common tax mistakes freelancers make',
      },
      quarterly_tax_note: {
        type: 'string',
        description: 'Note about estimated quarterly tax payments if applicable',
      },
    },
    required: ['filename', 'profession', 'deductions_summary', 'estimated_total_savings', 'action_items'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const profession = args.profession as string
  const annualIncome = (args.annual_income as string) || 'Not specified'
  const filingStatus = (args.filing_status as string) || 'Not specified'
  const deductionsSummary = args.deductions_summary as string
  const estimatedSavings = args.estimated_total_savings as string
  const actionItems = args.action_items as string
  const commonMistakes = (args.common_mistakes as string) || ''
  const quarterlyNote = (args.quarterly_tax_note as string) || ''

  if (!filename || !profession || !deductionsSummary || !estimatedSavings || !actionItems) {
    return 'Error: filename, profession, deductions_summary, estimated_total_savings, and action_items are required'
  }

  const report = `# Freelancer Tax Deduction Report
## ${profession}

**Prepared**: ${new Date().toISOString().split('T')[0]}
**Annual Income**: ${annualIncome}
**Filing Status**: ${filingStatus}
**Estimated Tax Savings**: ${estimatedSavings}

---

## How to Read This Report

This report identifies tax deductions you may be eligible for as a self-employed ${profession}. Each deduction includes:
- What it is and how it works
- Estimated dollar range for your situation
- Which IRS form to use
- What records to keep

**Important**: This is educational guidance, not tax advice. Consult a CPA for your specific situation.

---

## Your Applicable Deductions

${deductionsSummary}

---

## Estimated Total Tax Savings

**${estimatedSavings}**

This estimate is based on typical ranges for a ${profession} with ${annualIncome} annual income. Your actual savings depend on your specific expenses, deduction methods chosen, and tax bracket.

At the 22% federal tax bracket + 15.3% SE tax rate, every $1,000 in deductions saves you approximately $220-$373 in taxes.

---

## Action Items

Take these steps to maximize your deductions this tax year:

${actionItems.split('\n').filter(Boolean).map((item, i) => `${i + 1}. ${item.trim()}`).join('\n')}

${commonMistakes ? `---

## Common Mistakes to Avoid

${commonMistakes.split('\n').filter(Boolean).map(m => `- ${m.trim()}`).join('\n')}` : ''}

${quarterlyNote ? `---

## Quarterly Estimated Taxes

${quarterlyNote}` : ''}

---

## Key IRS Resources

- **Schedule C** (Form 1040): Profit or Loss From Business — [irs.gov/forms-pubs/about-schedule-c-form-1040](https://www.irs.gov/forms-pubs/about-schedule-c-form-1040)
- **Schedule SE**: Self-Employment Tax — [irs.gov/forms-pubs/about-schedule-se-form-1040](https://www.irs.gov/forms-pubs/about-schedule-se-form-1040)
- **Publication 535**: Business Expenses — [irs.gov/publications/p535](https://www.irs.gov/publications/p535)
- **Publication 587**: Business Use of Your Home — [irs.gov/publications/p587](https://www.irs.gov/publications/p587)
- **Form 1099-NEC**: Nonemployee Compensation — [irs.gov/forms-pubs/about-form-1099-nec](https://www.irs.gov/forms-pubs/about-form-1099-nec)

---

## Record-Keeping Checklist

- [ ] Track all business expenses with receipts (digital photos count)
- [ ] Log business mileage with date, destination, purpose, and miles
- [ ] Keep a home office measurement and usage log
- [ ] Save all 1099 forms received from clients
- [ ] Maintain separate business and personal bank accounts
- [ ] Track business vs. personal use percentage for shared expenses (phone, internet)
- [ ] Save health insurance premium statements
- [ ] Document business purpose for all travel and meal expenses

---

*Generated by Freelancer Deduction Finder — an open-source AI agent that helps freelancers discover tax deductions they may be missing. Not tax advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Report saved to output/${sanitized} (${report.length} characters)\n\nYour tax deduction report for ${profession} is ready! Estimated savings: ${estimatedSavings}.`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
