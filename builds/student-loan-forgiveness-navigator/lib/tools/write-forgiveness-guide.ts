import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_forgiveness_guide',
  description:
    'Generate and save a personalized student loan forgiveness guide with application steps, required documents, timeline, and action items. Use this as the final step after analyzing the loan situation and researching programs.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the guide (e.g. "loan-forgiveness-guide.md")',
      },
      borrower_name: {
        type: 'string',
        description: 'Borrower name',
      },
      loan_analysis: {
        type: 'string',
        description: 'Results from analyze_loan_situation',
      },
      program_research: {
        type: 'string',
        description: 'Results from search_forgiveness_programs',
      },
      repayment_comparison: {
        type: 'string',
        description: 'Results from check_repayment_options',
      },
      primary_program: {
        type: 'string',
        description: 'Primary forgiveness program: "pslf", "idr_forgiveness", "save", "teacher", "borrower_defense", "tpd", "closed_school"',
      },
      recommended_plan: {
        type: 'string',
        description: 'Recommended IDR plan: "save", "paye", "ibr", "icr"',
      },
      total_balance: {
        type: 'string',
        description: 'Total loan balance',
      },
      loan_types: {
        type: 'string',
        description: 'Types of loans held',
      },
      employer_type: {
        type: 'string',
        description: 'Employer type for PSLF determination',
      },
      state: {
        type: 'string',
        description: 'State of residence',
      },
    },
    required: ['filename', 'primary_program'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const borrowerName = (args.borrower_name as string) || '[Your Name]'
  const loanAnalysis = (args.loan_analysis as string) || ''
  const programResearch = (args.program_research as string) || ''
  const repaymentComparison = (args.repayment_comparison as string) || ''
  const primaryProgram = ((args.primary_program as string) || 'idr_forgiveness').toLowerCase()
  const recommendedPlan = ((args.recommended_plan as string) || '').toUpperCase()
  const totalBalance = (args.total_balance as string) || '[balance]'
  const loanTypes = (args.loan_types as string) || '[loan types]'
  const employerType = (args.employer_type as string) || ''
  const state = (args.state as string) || '[State]'

  if (!filename || !primaryProgram) {
    return 'Error: filename and primary_program are required'
  }

  const today = new Date().toISOString().split('T')[0]
  const isPSLF = primaryProgram.includes('pslf')
  const isTeacher = primaryProgram.includes('teacher')
  const isBorrowerDefense = primaryProgram.includes('borrower_defense') || primaryProgram.includes('defense')
  const isTPD = primaryProgram.includes('tpd') || primaryProgram.includes('disability')
  const isClosedSchool = primaryProgram.includes('closed')

  const report = `# Student Loan Forgiveness Guide
## Personalized for ${borrowerName}

**Prepared**: ${today}
**Total balance**: ${totalBalance}
**Loan types**: ${loanTypes}
**State**: ${state}
**Primary program**: ${primaryProgram.replace(/_/g, ' ').toUpperCase()}
${recommendedPlan ? `**Recommended IDR plan**: ${recommendedPlan}` : ''}

---

## Important Disclaimer

**This guide is for informational purposes only. It is NOT financial or legal advice.** Student loan rules change frequently. Always verify information at [StudentAid.gov](https://studentaid.gov) and consider consulting a student loan advisor (many nonprofit orgs offer free help). Never pay for forgiveness application assistance — all applications are free.

---

${loanAnalysis ? `## Your Loan Analysis

${loanAnalysis}

---

` : ''}${programResearch ? `## Program Research

${programResearch}

---

` : ''}${repaymentComparison ? `## Repayment Plan Comparison

${repaymentComparison}

---

` : ''}## Step 1: Verify Your Loan Information

Before applying for any program, confirm your loan details:

- [ ] **Log in to StudentAid.gov** with your FSA ID
- [ ] **Review "My Aid" section** — verify loan types, servicer, balances, and disbursement dates
- [ ] **Download your loan data** — save a PDF of your loan summary
- [ ] **Identify your loan servicer(s)** — this is who you'll contact for IDR enrollment and forgiveness applications
- [ ] **Check your repayment status** — are you in repayment, deferment, forbearance, or default?
- [ ] **Request your payment history** from your servicer — you need to know how many qualifying payments you've made

**Your servicer is the company that manages your loans (NOT the Department of Education).** Common servicers: MOHELA, Nelnet, Aidvantage, EdFinancial, Great Lakes, OSLA.

---

${isPSLF ? `## Step 2: Apply for PSLF

### Eligibility Checklist

- [ ] **Direct Loans** (or consolidated into Direct)
- [ ] **Full-time employment** at a qualifying employer (government or 501(c)(3) nonprofit)
- [ ] **Income-driven repayment plan** (SAVE, PAYE, IBR, or ICR)
- [ ] **120 qualifying monthly payments** (do not need to be consecutive)

### Application Steps

1. **Submit the PSLF Form** at [StudentAid.gov/pslf](https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service)
   - This is a combined Employment Certification Form (ECF) + Application for Forgiveness
   - Your employer must sign Section 4

2. **Transfer to MOHELA** — PSLF is administered by MOHELA. If your loans are with a different servicer, they'll transfer automatically after you submit the PSLF form.

3. **Enroll in an IDR plan** if not already — apply at StudentAid.gov or call your servicer
   - For the lowest payment (maximizing forgiveness amount): choose ${recommendedPlan || 'SAVE or PAYE'}
   - IDR application requires income documentation (tax return or paystubs)

4. **Recertify employment annually** — submit a new PSLF form each year and whenever you change employers

5. **Recertify income annually** for your IDR plan — servicer will notify you when due

### Timeline
| Action | When |
|--------|------|
| Submit PSLF form | **Now** |
| Transfer to MOHELA | 2-8 weeks after submission |
| Payment count update | 2-6 months (can be slow) |
| Enroll in IDR plan | **Now** if not already enrolled |
| Annual employment recertification | Every 12 months |
| Annual IDR recertification | When servicer notifies you |
| Forgiveness application | After 120 qualifying payments |

### Common PSLF Mistakes to Avoid
- ❌ Not submitting the PSLF form until you hit 120 payments (submit annually!)
- ❌ Being on a Standard or Graduated plan (these don't qualify — switch to IDR)
- ❌ Having FFEL loans without consolidating to Direct
- ❌ Working part-time (must be full-time: 30+ hours/week)
- ❌ Not counting payments during COVID forbearance (March 2020 - Sept 2023 all count)

` : ''}${!isPSLF && !isTeacher && !isBorrowerDefense && !isTPD && !isClosedSchool ? `## Step 2: Enroll in Income-Driven Repayment

### Choose Your IDR Plan

${recommendedPlan ? `**Recommended**: ${recommendedPlan}` : 'Choose the plan with the lowest monthly payment to maximize forgiveness.'}

### Application Steps

1. **Apply online** at [StudentAid.gov/idr](https://studentaid.gov/manage-loans/repayment/plans/income-driven)
   - Or call your loan servicer to apply by phone

2. **Provide income documentation**:
   - [ ] Most recent federal tax return (IRS Data Retrieval Tool is easiest)
   - [ ] If income changed: recent paystubs or written explanation of current income
   - [ ] Spouse's income (if married filing jointly — married filing separately may exclude spouse's income for IBR)

3. **Consolidate if needed**: If you have FFEL or Perkins loans, consolidate into Direct Consolidation Loan first
   - Apply at [StudentAid.gov/consolidation](https://studentaid.gov/app/launchConsolidation.action)

4. **Processing time**: 2-8 weeks. You may be placed in forbearance during processing.

### IDR Forgiveness Timeline
- **20 years**: SAVE (undergrad), PAYE, IBR (new borrowers)
- **25 years**: SAVE (grad), IBR (old borrowers), ICR
- **10 years**: PSLF (if you switch to a qualifying employer)

` : ''}${isTeacher ? `## Step 2: Apply for Teacher Loan Forgiveness

### Eligibility Checklist

- [ ] **5 consecutive complete years** of full-time teaching at a qualifying low-income school
- [ ] **Direct Loans or FFEL** (not Perkins)
- [ ] Loans were first disbursed after **October 1, 1998**
- [ ] School is on the **Teacher Cancellation Low Income Directory**: [https://studentaid.gov/tcli](https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher)

### Forgiveness Amounts
- **$17,500**: Highly qualified secondary math or science teacher, OR special education teacher
- **$5,000**: Other qualified teachers at eligible schools

### Application Steps

1. **Complete the Teacher Loan Forgiveness Application** — get it from your loan servicer or StudentAid.gov
2. **Get certification** from your school's chief administrative officer
3. **Submit to your servicer** after completing 5 qualifying years

### Pro Tip: Combining Teacher Forgiveness + PSLF
You CAN use both programs:
1. Use Teacher Loan Forgiveness first (years 1-5): get $5,000-$17,500 forgiven
2. Then switch to PSLF counting (need 120 total qualifying payments)
3. The 5 Teacher Forgiveness years do NOT count toward PSLF's 120 payments
4. But the remaining balance gets PSLF forgiveness after 120 payments on IDR

` : ''}${isBorrowerDefense ? `## Step 2: File Borrower Defense Claim

### Application Steps

1. **File online** at [StudentAid.gov/borrower-defense](https://studentaid.gov/manage-loans/forgiveness-cancellation/borrower-defense)
2. **Gather evidence**:
   - [ ] Enrollment agreements and marketing materials
   - [ ] Communications from the school (emails, letters, texts)
   - [ ] Program brochures with job placement or salary claims
   - [ ] Your own records of what you were told vs. what actually happened
   - [ ] News articles about the school's fraud or closure
   - [ ] Complaints from other students (check CFPB, BBB, state AG)

3. **Request forbearance** while your claim is reviewed — this stops payments and collections

4. **Check for group discharge** — if your school has been approved for group relief, you may not need an individual application:
   - Corinthian Colleges (Everest, Heald, WyoTech)
   - ITT Technical Institute
   - DeVry University
   - University of Phoenix
   - Many others — check StudentAid.gov for the full list

### Timeline
- Filing: immediate (online form)
- Processing: 6-24+ months
- If approved: full or partial loan discharge + potential refund of payments

` : ''}${isTPD ? `## Step 2: Apply for TPD Discharge

### Application Steps

1. **Apply at** [DisabilityDischarge.com](https://www.disabilitydischarge.com/)

2. **Choose your certification type**:
   - [ ] **VA determination**: 100% disability or TDIU — may be automatic
   - [ ] **SSA determination**: SSDI or SSI — may be automatic
   - [ ] **Physician certification**: MD or DO completes the form

3. **Submit documentation** based on your certification type

4. **3-year monitoring period** (physician certification only):
   - Must report income annually
   - If income exceeds state poverty guideline, discharge may be revoked
   - VA and SSA certifications do NOT have a monitoring period

### Tax Note
TPD discharge is **TAX-FREE through December 31, 2025**. After that, forgiven amounts may be taxable.

` : ''}## Step 3: Required Documents Checklist

Gather these documents before starting any application:

### Identity & Contact
- [ ] FSA ID (username and password for StudentAid.gov)
- [ ] Government-issued photo ID
- [ ] Social Security Number
- [ ] Current mailing address, phone, email

### Financial
- [ ] Most recent federal tax return (1040)
- [ ] W-2s or 1099s
- [ ] Recent paystubs (if income changed since last tax filing)
- [ ] Spouse's income documentation (if married filing jointly)

### Loan Information
- [ ] Loan servicer name and contact info
- [ ] Current loan balance and interest rates (from StudentAid.gov)
- [ ] Payment history (request from servicer)
- [ ] Consolidation status (if applicable)

${isPSLF ? `### Employment (PSLF)
- [ ] Employer name, address, EIN
- [ ] Employment start date
- [ ] Verification that you work 30+ hours/week
- [ ] Employer signature on PSLF form (HR department or authorized official)
` : ''}${isTeacher ? `### Teaching (Teacher Forgiveness)
- [ ] School name and address
- [ ] Dates of employment (must be 5 consecutive complete years)
- [ ] Subject area taught
- [ ] Certification from chief administrative officer
` : ''}${isBorrowerDefense ? `### School Issue (Borrower Defense)
- [ ] School name and dates of attendance
- [ ] Program enrolled in
- [ ] Evidence of misrepresentation or fraud
- [ ] Marketing materials, enrollment agreements
` : ''}
---

## Common Mistakes to Avoid

| Mistake | Why It Matters |
|---------|---------------|
| Not recertifying IDR income annually | Payments could jump to standard amount |
| Having FFEL loans without consolidating | Not eligible for PSLF or SAVE |
| Paying more than required on IDR | Extra payments don't speed up forgiveness — you're paying money that would be forgiven |
| Going into forbearance unnecessarily | Months in forbearance don't count toward forgiveness (except COVID period) |
| Not submitting PSLF form annually | Payment counts don't update; problems discovered too late |
| Refinancing federal loans into private | Permanently lose ALL forgiveness eligibility |
| Paying a company for forgiveness help | All applications are FREE — never pay for this |
| Missing IDR recertification deadline | Loans could capitalize interest and payments increase |

---

## Forgiveness Timeline

| Action | When |
|--------|------|
| Verify loans at StudentAid.gov | **This week** |
| Apply for IDR plan | **This week** |
${isPSLF ? '| Submit PSLF form | **This week** |\n| Transfer to MOHELA | 2-8 weeks |\n| Payment count update | 2-6 months |\n| Annual recertification | Every 12 months |' : ''}
${isTeacher ? '| Complete 5 years of teaching | [Track your progress] |\n| Submit Teacher Forgiveness form | After 5 complete years |' : ''}
${isBorrowerDefense ? '| File Borrower Defense claim | **This week** |\n| Request forbearance | **This week** |\n| Processing | 6-24+ months |' : ''}
| IDR annual recertification | When servicer notifies you |
| Forgiveness application | After qualifying period ends |

---

## Helpful Resources

- **StudentAid.gov**: https://studentaid.gov/ — Official federal student aid portal
- **Loan Simulator**: https://studentaid.gov/loan-simulator/ — Compare repayment plans with your actual loans
- **PSLF Help Tool**: https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service/pslf-help-tool
- **CFPB Student Loans**: https://www.consumerfinance.gov/consumer-tools/student-loans/
- **NSLDS**: https://nslds.ed.gov/ — National Student Loan Data System (your complete loan history)
- **Borrower Defense**: https://studentaid.gov/manage-loans/forgiveness-cancellation/borrower-defense
- **TPD Discharge**: https://www.disabilitydischarge.com/
- **Free help**: Contact your state's student loan ombudsman or a nonprofit like [TISLA](https://freestudentloanadvice.org/) for free guidance

---

## State Resources (${state})

Search for "${state} state student loan forgiveness" — many states offer additional programs for teachers, healthcare workers, public defenders, and other professions.

---

*Generated by Student Loan Forgiveness Navigator — a free, open-source AI agent that helps borrowers understand their forgiveness options. Not financial or legal advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Forgiveness guide saved to output/${sanitized} (${report.length} characters)\n\nYour personalized student loan forgiveness guide is ready! It includes application steps, document checklists, timeline, and resources for ${primaryProgram.replace(/_/g, ' ').toUpperCase()}.`
  } catch (err) {
    return `Write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
