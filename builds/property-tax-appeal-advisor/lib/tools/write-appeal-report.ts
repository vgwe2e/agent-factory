import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_appeal_report',
  description:
    'Generate and save a comprehensive property tax appeal report. Includes assessment analysis, comparable sales evidence, county-specific appeal process, deadlines, and a draft appeal letter. Always use this as the final step after gathering all data.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "123-main-st-appeal.md")',
      },
      address: {
        type: 'string',
        description: 'The property address',
      },
      owner_name: {
        type: 'string',
        description: 'Property owner name (for the appeal letter)',
      },
      assessed_value: {
        type: 'string',
        description: 'Current assessed value (e.g. "$350,000")',
      },
      proposed_value: {
        type: 'string',
        description: 'Proposed fair market value based on comps (e.g. "$310,000")',
      },
      annual_tax: {
        type: 'string',
        description: 'Current annual property tax amount',
      },
      estimated_savings: {
        type: 'string',
        description: 'Estimated annual tax savings if appeal succeeds',
      },
      comparable_sales_summary: {
        type: 'string',
        description: 'Formatted summary of comparable sales used as evidence, as markdown',
      },
      assessment_errors: {
        type: 'string',
        description: 'Any factual errors found in the assessment (wrong sqft, bedroom count, etc.). Use "None found" if none.',
      },
      appeal_process: {
        type: 'string',
        description: 'County-specific appeal process details: where to file, deadlines, required forms, hearing info',
      },
      county_assessor_info: {
        type: 'string',
        description: 'County assessor contact info: office name, address, phone, website',
      },
      state: {
        type: 'string',
        description: 'State where the property is located',
      },
      appeal_letter: {
        type: 'string',
        description: 'Draft appeal letter text customized for this property',
      },
    },
    required: ['filename', 'address', 'assessed_value', 'proposed_value', 'comparable_sales_summary', 'appeal_process', 'state'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const address = args.address as string
  const ownerName = (args.owner_name as string) || '[Your Name]'
  const assessedValue = args.assessed_value as string
  const proposedValue = args.proposed_value as string
  const annualTax = (args.annual_tax as string) || 'See your tax bill'
  const estimatedSavings = (args.estimated_savings as string) || 'Varies by jurisdiction'
  const comparableSales = args.comparable_sales_summary as string
  const assessmentErrors = (args.assessment_errors as string) || 'None found'
  const appealProcess = args.appeal_process as string
  const assessorInfo = (args.county_assessor_info as string) || 'See your county assessor\'s website'
  const state = args.state as string
  const appealLetter = (args.appeal_letter as string) || ''

  if (!filename || !address || !assessedValue || !proposedValue || !comparableSales || !appealProcess || !state) {
    return 'Error: filename, address, assessed_value, proposed_value, comparable_sales_summary, appeal_process, and state are required'
  }

  const today = new Date().toISOString().split('T')[0]

  const report = `# Property Tax Appeal Report
## ${address}

**Prepared**: ${today}
**State**: ${state}
**Current Assessed Value**: ${assessedValue}
**Proposed Fair Market Value**: ${proposedValue}
**Current Annual Tax**: ${annualTax}
**Estimated Annual Savings**: ${estimatedSavings}

---

## Executive Summary

This report provides evidence and guidance for appealing the property tax assessment on **${address}**. Based on comparable sales analysis, the current assessment of **${assessedValue}** appears to exceed the property's fair market value of approximately **${proposedValue}**. This report includes comparable sales evidence, the appeal process for your jurisdiction, and a draft appeal letter.

**Important**: This report is for informational purposes only. It is not legal or tax advice. Consult a property tax attorney or licensed appraiser for professional guidance.

---

## Assessment Errors

${assessmentErrors}

${assessmentErrors !== 'None found' ? '⚠️ **Factual errors in your assessment can be corrected directly** — contact your county assessor\'s office. You may not need a formal appeal if the error is obvious (wrong square footage, extra bedroom counted, etc.).\n' : ''}
---

## Comparable Sales Evidence

The following recently sold properties are comparable to yours in size, location, age, and condition:

${comparableSales}

---

## Your County's Appeal Process

${appealProcess}

---

## County Assessor Contact Information

${assessorInfo}

---

${appealLetter ? `## Draft Appeal Letter

*Customize this letter with your specific details before submitting.*

---

${appealLetter}

---

` : ''}## Tips for a Successful Appeal

### Before Filing
1. **Verify your property record card** — Request it from the assessor's office and check every detail (square footage, bedrooms, bathrooms, lot size, year built, condition rating)
2. **Gather 3-5 comparable sales** — Same neighborhood, similar size (±300 sqft), sold within 6-12 months of the assessment date
3. **Take photos** — Document any condition issues that reduce value (deferred maintenance, needed repairs, functional obsolescence)
4. **Check the assessment ratio** — Some states assess at a percentage of market value (e.g., 33% in Illinois). Make sure you're comparing apples to apples.

### During the Appeal
5. **Be professional and factual** — Present data, not emotions
6. **Bring organized evidence** — Printed comp sheets, photos, property record with errors highlighted
7. **Know your number** — Have a specific proposed value supported by your evidence
8. **Don't volunteer unnecessary information** — Stick to your case

### After the Appeal
9. **Request written confirmation** — Get the decision in writing
10. **Check your next tax bill** — Verify the reduction was applied
11. **Mark your calendar** — You can appeal again next year if values change

---

## Key Facts About Property Tax Appeals

- **No risk**: In most jurisdictions, an appeal can only lower your assessment or leave it unchanged — it cannot increase it
- **Success rate**: 30-94% of homeowners who appeal get a reduction (varies by jurisdiction)
- **Average savings**: $539-$774 per year for successful appeals
- **Only 5% appeal**: Most homeowners don't know they can challenge their assessment
- **Free to file**: Most jurisdictions don't charge a filing fee for the first level of appeal
- **Annual opportunity**: You can appeal every year if you believe your assessment is too high

---

## Resources

- **Your county assessor's website**: Look up your property record, assessment details, and appeal forms
- **Your state's property tax appeal board**: The second level of appeal if the county denies your case
- **IAAO (International Association of Assessing Officers)**: Standards for property valuation — [iaao.org](https://www.iaao.org)
- **National Taxpayers Union Foundation**: Property tax appeal guides — [ntu.org](https://www.ntu.org)

---

*Generated by Property Tax Appeal Advisor — a free, open-source AI agent that helps homeowners determine if they're overassessed and guides them through the appeal process. Not legal or tax advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Report saved to output/${sanitized} (${report.length} characters)\n\nYour property tax appeal report for ${address} is ready! Estimated savings: ${estimatedSavings}.`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
