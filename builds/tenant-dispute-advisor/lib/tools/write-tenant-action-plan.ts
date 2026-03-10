import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_tenant_action_plan',
  description:
    'Generate and save a comprehensive tenant action plan with demand letters, escalation steps, and legal resources. Use this as the final step after analyzing the dispute and researching rights.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the plan (e.g. "tenant-action-plan-march2026.md")',
      },
      tenant_name: {
        type: 'string',
        description: 'Tenant name',
      },
      landlord_name: {
        type: 'string',
        description: 'Landlord or property management company name',
      },
      property_address: {
        type: 'string',
        description: 'Rental property address',
      },
      state: {
        type: 'string',
        description: 'State',
      },
      dispute_analysis: {
        type: 'string',
        description: 'Results from analyze_tenant_dispute',
      },
      rights_research: {
        type: 'string',
        description: 'Summary of applicable tenant rights from search_tenant_rights',
      },
      landlord_research: {
        type: 'string',
        description: 'Summary of landlord record from research_landlord_record',
      },
      dispute_type: {
        type: 'string',
        description: 'Primary dispute type: "habitability", "security_deposit", "eviction", "rent_increase", "harassment", "retaliation"',
      },
      specific_issue: {
        type: 'string',
        description: 'Brief description of the specific issue',
      },
      rent_amount: {
        type: 'string',
        description: 'Monthly rent amount',
      },
      deposit_amount: {
        type: 'string',
        description: 'Security deposit amount (if deposit dispute)',
      },
    },
    required: ['filename', 'landlord_name', 'dispute_type'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const tenantName = (args.tenant_name as string) || '[Your Name]'
  const landlordName = (args.landlord_name as string) || '[Landlord Name]'
  const propertyAddress = (args.property_address as string) || '[Property Address]'
  const state = (args.state as string) || '[State]'
  const disputeAnalysis = (args.dispute_analysis as string) || ''
  const rightsResearch = (args.rights_research as string) || ''
  const landlordResearch = (args.landlord_research as string) || ''
  const disputeType = (args.dispute_type as string) || 'general'
  const specificIssue = (args.specific_issue as string) || ''
  const rent = (args.rent_amount as string) || '[rent amount]'
  const deposit = (args.deposit_amount as string) || '[deposit amount]'

  if (!filename || !landlordName || !disputeType) {
    return 'Error: filename, landlord_name, and dispute_type are required'
  }

  const today = new Date().toISOString().split('T')[0]
  const isHabitability = disputeType.includes('habitab')
  const isDeposit = disputeType.includes('deposit')
  const isEviction = disputeType.includes('evict')
  const isHarassment = disputeType.includes('harass')

  const report = `# Tenant Action Plan
## ${tenantName} vs. ${landlordName}

**Prepared**: ${today}
**Property**: ${propertyAddress}
**State**: ${state}
**Dispute type**: ${disputeType}
${specificIssue ? `**Issue**: ${specificIssue}` : ''}
${rent !== '[rent amount]' ? `**Monthly rent**: ${rent}` : ''}

---

## Important Disclaimer

**This plan is for informational purposes only. It is NOT legal advice.** Landlord-tenant law varies significantly by state and city. For eviction defense or disputes involving large amounts, consult a tenant rights attorney or your local legal aid organization. Many provide free consultations.

---

${disputeAnalysis ? `## Your Dispute Analysis

${disputeAnalysis}

---

` : ''}${rightsResearch ? `## Your Rights (${state})

${rightsResearch}

---

` : ''}${landlordResearch ? `## ${landlordName} — Record

${landlordResearch}

---

` : ''}## Step 1: Document Everything (Do This Now)

- [ ] **Photograph/video** the issue (with date stamps)
- [ ] **Email** the landlord describing the problem (creates written record)
- [ ] **Save ALL communications** — texts, emails, letters, voicemails
- [ ] **Keep a log** — date, time, what happened, any witnesses
- [ ] **Get witness statements** from neighbors if applicable
- [ ] **Request inspection** from code enforcement if habitability issue
- [ ] **DO NOT** withhold rent without following proper legal procedure for your state
- [ ] **DO NOT** make repairs yourself until you've sent proper written notice

## Step 2: Send Formal Demand Letter

Send via email AND certified mail (return receipt requested). Keep copies.

---

**DEMAND LETTER**

${tenantName}
${propertyAddress}
[City, State ZIP]

${today}

${landlordName}
[Landlord Address]

**SENT VIA CERTIFIED MAIL, RETURN RECEIPT REQUESTED**

**RE: ${isHabitability ? 'Demand for Repair — Warranty of Habitability Violation' : isDeposit ? 'Demand for Security Deposit Return' : isEviction ? 'Response to Eviction Notice — Tenant\'s Rights' : isHarassment ? 'Demand to Cease Harassment' : 'Formal Complaint — Tenant Rights Violation'} — ${propertyAddress}**

Dear ${landlordName}:

I am writing as the tenant of ${propertyAddress} regarding ${specificIssue || 'the ongoing issue at the property'}.

${isHabitability ? `The property has the following condition(s) that violate the warranty of habitability:

${specificIssue ? `- ${specificIssue}` : '- [Describe specific conditions — e.g., "No hot water since March 1", "Mold in bathroom ceiling", "Broken front door lock"]'}

I have notified you of this issue on [date(s) of prior notice] and you have failed to make repairs within a reasonable time. Under ${state} landlord-tenant law, you are required to maintain the premises in a habitable condition.

**I demand that you complete all necessary repairs within 14 days of receiving this letter.**

If repairs are not completed within this timeframe, I intend to exercise my legal remedies, which may include:
- Repair and deduct: Having the repairs made and deducting the cost from rent
- Rent withholding: Withholding rent until repairs are completed (deposited in escrow)
- Reporting to code enforcement for inspection
- Filing a complaint with [${state} tenant protection agency]
- Pursuing damages in small claims court` : ''}${isDeposit ? `I vacated the property on [move-out date]. My security deposit of ${deposit} has not been returned within the timeframe required by ${state} law.

Under ${state} landlord-tenant law, you are required to return my security deposit (minus legitimate deductions with an itemized list) within [deadline — check your state's specific deadline].

**I demand that you return my full security deposit of ${deposit} within 14 days of receiving this letter**, along with an itemized statement of any deductions.

If I do not receive my deposit by [date 14 days from today], I intend to:
- File a claim in small claims court for the deposit amount plus penalty damages
- Report to the [${state} consumer protection agency]
- ${state} law may entitle me to double or triple damages for bad-faith withholding` : ''}${isHarassment ? `Your conduct constitutes landlord harassment under ${state} law:

${specificIssue ? `- ${specificIssue}` : '- [Describe specific harassing behavior — e.g., "Entering the unit without notice", "Threatening to change the locks", "Shutting off utilities"]'}

This behavior is illegal. Under ${state} landlord-tenant law, you are prohibited from harassing, threatening, or retaliating against tenants.

**I demand that you immediately cease all harassing conduct.**

If this behavior continues, I will:
- Report to local law enforcement
- File a complaint with [${state} tenant protection agency]
- Pursue a restraining order if necessary
- Seek damages in court for harassment and any actual losses` : ''}${!isHabitability && !isDeposit && !isHarassment && !isEviction ? `${specificIssue || '[Describe the issue in detail]'}

I am requesting that you resolve this matter within 14 days of receiving this letter. If I do not receive a satisfactory response, I will pursue all available legal remedies.` : ''}

I have documented this issue with photographs, written communications, and other evidence. I am prepared to present this evidence in any legal proceeding.

Please respond to this letter within **14 days**.

Sincerely,

${tenantName}
[Phone]
[Email]

---

## Step 3: Escalate If No Resolution

### Code Enforcement / Building Inspector
- Contact your local building or housing department to request an inspection
- Inspectors can issue violations that FORCE the landlord to make repairs
- This creates an official record for any future legal action

### Tenant Rights Organizations
- **Legal aid**: https://www.lawhelp.org/ (free legal help by state)
- **Tenant unions**: Search "${state} tenant union" for local organizations
- **HUD complaints**: https://www.hud.gov/topics/rental_assistance/tenantrights

### Small Claims Court
- Filing fee: typically $30-75
- No attorney needed
- Bring all your documentation: photos, letters, receipts, the demand letter and certified mail receipt
- Can recover: deposit, rent overpayment, repair costs, statutory penalties (2x-3x in some states)

${isEviction ? `### Eviction Defense
- **DO NOT ignore the court date** — show up or you lose by default
- **Request a continuance** if you need more time
- **Possible defenses**:
  - Improper notice (wrong form, wrong timeline, wrong service method)
  - Landlord retaliation (you complained about conditions first)
  - Habitability violations (landlord failed to maintain the property)
  - Discrimination
  - Landlord accepted rent after filing
- **Emergency rental assistance**: Search "${state} emergency rental assistance"
- **Legal aid**: https://www.lawhelp.org/ — many provide free eviction defense
` : ''}
## Escalation Timeline

| Day | Action |
|-----|--------|
| Day 1 | Document everything, send demand letter (certified mail + email) |
| Day 3 | Request code enforcement inspection (if habitability) |
| Day 14 | If no response: follow up with second demand letter |
| Day 21 | If still no resolution: contact legal aid for consultation |
| Day 30 | File in small claims court or tenant protection agency |
${isEviction ? '| ASAP | Respond to eviction notice within the deadline — DO NOT wait |\n| Court date | Appear with all documentation and defenses prepared |' : ''}

---

## Know Your Rights — Quick Reference

### Your Landlord CANNOT:
- Evict you without proper written notice AND court order
- Change the locks, remove your belongings, or shut off utilities (self-help eviction is ILLEGAL)
- Enter your unit without proper notice (24-48 hours in most states)
- Retaliate against you for exercising your legal rights
- Discriminate based on protected characteristics
- Withhold your security deposit without itemized deductions

### Your Landlord MUST:
- Maintain the property in habitable condition
- Make repairs within a reasonable time after written notice
- Return your security deposit within the state deadline
- Give proper written notice before entry, rent increases, or lease termination
- Provide working plumbing, heating, electricity, and safety features

### You Should:
- **Always communicate in writing** (email counts)
- **Keep copies of everything**
- **Never withhold rent** without following your state's proper procedure
- **Know your state's specific rules** — general rights vary by jurisdiction
- **Seek legal help early** — many tenant rights organizations are free

---

## Helpful Resources

- **LawHelp.org**: https://www.lawhelp.org/ — Free legal help by state and topic
- **HUD Tenant Rights**: https://www.hud.gov/topics/rental_assistance/tenantrights
- **Nolo Tenant Rights**: https://www.nolo.com/legal-encyclopedia/renters-rights
- **Eviction Lab**: https://evictionlab.org/ — Eviction data and resources
- **Legal Aid Finder**: https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help
- **Fair Housing Complaint**: https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint

---

*Generated by Tenant Dispute Advisor — a free, open-source AI agent that helps renters understand their rights and resolve landlord disputes. Not legal advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Action plan saved to output/${sanitized} (${report.length} characters)\n\nYour tenant action plan against ${landlordName} is ready! It includes a demand letter, documentation checklist, escalation guide, and legal resources for ${state}.`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
