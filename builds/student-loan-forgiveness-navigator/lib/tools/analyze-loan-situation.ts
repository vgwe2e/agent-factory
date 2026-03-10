import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_loan_situation',
  description:
    'Analyze a borrower\'s student loan situation to determine which forgiveness programs they may qualify for, which repayment plans could lower their payments, and what actions to take. Use this as the FIRST step.',
  parameters: {
    type: 'object',
    properties: {
      loan_types: {
        type: 'string',
        description: 'Types of loans: "direct", "ffel", "perkins", "private", "parent_plus", "grad_plus", or comma-separated combination',
      },
      total_balance: {
        type: 'string',
        description: 'Total loan balance (e.g. "$45,000")',
      },
      monthly_payment: {
        type: 'string',
        description: 'Current monthly payment amount',
      },
      income: {
        type: 'string',
        description: 'Annual gross income (or household AGI)',
      },
      family_size: {
        type: 'string',
        description: 'Number of people in household (for IDR calculation)',
      },
      employer_type: {
        type: 'string',
        description: '"government", "nonprofit_501c3", "nonprofit_other", "for_profit", "military", "teacher", "healthcare", "other"',
      },
      years_of_payments: {
        type: 'string',
        description: 'How many years of payments made (approximate)',
      },
      repayment_plan: {
        type: 'string',
        description: 'Current plan: "standard", "graduated", "extended", "ibr", "paye", "save", "icr", "unknown"',
      },
      loan_status: {
        type: 'string',
        description: '"in_repayment", "in_school", "grace_period", "deferment", "forbearance", "default", "consolidated"',
      },
      state: {
        type: 'string',
        description: 'State of residence (some states have additional programs)',
      },
      school_issue: {
        type: 'string',
        description: 'If the school closed, defrauded you, or misled you — describe the issue',
      },
      disability: {
        type: 'string',
        description: '"yes" if you have a total and permanent disability',
      },
    },
    required: ['loan_types', 'total_balance'],
  },
}

// 2025 Federal Poverty Guidelines (48 contiguous states)
const FPL_2025: Record<number, number> = {
  1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650,
  6: 43150, 7: 48650, 8: 54150,
}

function getFPL(familySize: number): number {
  if (familySize <= 0) return FPL_2025[1]
  if (familySize >= 8) return FPL_2025[8] + (familySize - 8) * 5500
  return FPL_2025[familySize] || FPL_2025[1]
}

// Estimate IDR payment (simplified — actual calculation uses AGI from tax return)
function estimateIDRPayment(plan: string, income: number, familySize: number, balance: number): { monthly: number; description: string } {
  const fpl = getFPL(familySize)

  if (plan === 'SAVE') {
    // SAVE: 5% of discretionary income for undergrad, 10% for grad
    // Discretionary = income - 225% FPL
    const discretionary = Math.max(0, income - fpl * 2.25)
    const monthlyUndergrad = Math.round(discretionary * 0.05 / 12)
    const monthlyGrad = Math.round(discretionary * 0.10 / 12)
    return {
      monthly: monthlyUndergrad,
      description: `SAVE: $${monthlyUndergrad}/mo (undergrad only) or $${monthlyGrad}/mo (grad). Based on income minus 225% FPL ($${Math.round(fpl * 2.25).toLocaleString()}). Note: SAVE is currently blocked by litigation — check status.`,
    }
  }
  if (plan === 'PAYE') {
    // PAYE: 10% of discretionary income (income - 150% FPL)
    const discretionary = Math.max(0, income - fpl * 1.5)
    const monthly = Math.round(discretionary * 0.10 / 12)
    return { monthly, description: `PAYE: $${monthly}/mo. 10% of discretionary income (income minus 150% FPL). Cap: never more than standard 10-year payment.` }
  }
  if (plan === 'IBR') {
    // IBR: 15% of discretionary (old borrowers) or 10% (new borrowers after July 2014)
    const discretionary = Math.max(0, income - fpl * 1.5)
    const monthlyOld = Math.round(discretionary * 0.15 / 12)
    const monthlyNew = Math.round(discretionary * 0.10 / 12)
    return { monthly: monthlyNew, description: `IBR: $${monthlyNew}/mo (new borrower) or $${monthlyOld}/mo (pre-July 2014). 10-15% of discretionary income.` }
  }
  if (plan === 'ICR') {
    // ICR: 20% of discretionary income or 12-year fixed adjusted for income, whichever is less
    const discretionary = Math.max(0, income - fpl * 1.0)
    const monthly = Math.round(discretionary * 0.20 / 12)
    return { monthly, description: `ICR: $${monthly}/mo. 20% of discretionary income (income minus 100% FPL). Only IDR plan available for Parent PLUS (after consolidation).` }
  }

  // Standard 10-year
  const rate = 0.05 // approximate weighted average
  const n = 120
  const monthlyRate = rate / 12
  const standard = Math.round(balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)))
  return { monthly: standard, description: `Standard 10-year: $${standard}/mo` }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const loanTypesRaw = ((args.loan_types as string) || '').toLowerCase()
  const balance = (args.total_balance as string) || 'unknown'
  const payment = (args.monthly_payment as string) || 'unknown'
  const incomeStr = (args.income as string) || ''
  const familySizeStr = (args.family_size as string) || '1'
  const employerType = ((args.employer_type as string) || '').toLowerCase()
  const yearsStr = (args.years_of_payments as string) || '0'
  const currentPlan = ((args.repayment_plan as string) || 'unknown').toLowerCase()
  const loanStatus = ((args.loan_status as string) || 'in_repayment').toLowerCase()
  const state = (args.state as string) || ''
  const schoolIssue = (args.school_issue as string) || ''
  const disability = ((args.disability as string) || '').toLowerCase()

  if (!loanTypesRaw) {
    return 'Error: loan_types is required (e.g. "direct", "ffel", "parent_plus")'
  }

  const hasDirect = loanTypesRaw.includes('direct')
  const hasFFEL = loanTypesRaw.includes('ffel')
  const hasPerkins = loanTypesRaw.includes('perkins')
  const hasPrivate = loanTypesRaw.includes('private')
  const hasParentPlus = loanTypesRaw.includes('parent_plus') || loanTypesRaw.includes('parent plus')
  const hasGradPlus = loanTypesRaw.includes('grad_plus') || loanTypesRaw.includes('grad plus')
  const hasFederal = hasDirect || hasFFEL || hasPerkins || hasParentPlus || hasGradPlus

  const isPublicService = employerType.includes('government') || employerType.includes('nonprofit') || employerType.includes('501c3') || employerType.includes('military')
  const isTeacher = employerType.includes('teacher')
  const years = parseFloat(yearsStr) || 0
  const income = parseFloat(incomeStr.replace(/[$,]/g, '')) || 0
  const familySize = parseInt(familySizeStr) || 1
  const balanceNum = parseFloat(balance.replace(/[$,]/g, '')) || 0
  const isInDefault = loanStatus.includes('default')

  const results: string[] = []
  results.push('## Student Loan Forgiveness Analysis')
  results.push('')
  results.push(`**Loan type(s)**: ${loanTypesRaw}`)
  results.push(`**Total balance**: ${balance}`)
  results.push(`**Current payment**: ${payment}`)
  results.push(`**Income**: ${incomeStr || 'not provided'}`)
  results.push(`**Family size**: ${familySize}`)
  results.push(`**Employer**: ${employerType || 'not specified'}`)
  results.push(`**Years of payments**: ${years}`)
  results.push(`**Current plan**: ${currentPlan}`)
  results.push(`**Status**: ${loanStatus}`)
  if (state) results.push(`**State**: ${state}`)
  results.push('')

  if (hasPrivate && !hasFederal) {
    results.push('### ⚠️ Private Loans')
    results.push('')
    results.push('**Private student loans are NOT eligible for ANY federal forgiveness programs.** This includes PSLF, IDR forgiveness, SAVE, TEACH, and Borrower Defense.')
    results.push('')
    results.push('Options for private loans:')
    results.push('- **Refinancing**: May lower your interest rate (but you lose federal protections)')
    results.push('- **Negotiation**: Contact your servicer about hardship programs or settlement')
    results.push('- **Bankruptcy**: Difficult but possible — must prove "undue hardship" (Brunner test or totality of circumstances)')
    results.push('- **State consumer protection**: Some states have borrower protections for private loans')
    results.push('')
    return results.join('\n')
  }

  if (hasPrivate) {
    results.push('### ⚠️ Note: Private Loans')
    results.push('Your private loans are NOT eligible for federal forgiveness. The analysis below applies only to your federal loans.')
    results.push('')
  }

  // PSLF Analysis
  results.push('### Public Service Loan Forgiveness (PSLF)')
  results.push('')
  if (isPublicService) {
    const remainingPayments = Math.max(0, 120 - Math.round(years * 12))
    const remainingYears = (remainingPayments / 12).toFixed(1)
    results.push(`✅ **You may qualify!** You work for a ${employerType} employer.`)
    results.push('')
    results.push('**PSLF requirements:**')
    results.push('1. Work full-time for a qualifying employer (government or 501(c)(3) nonprofit)')
    results.push('2. Have Direct Loans (or consolidate FFEL/Perkins into Direct)')
    results.push('3. Be on an income-driven repayment plan (IDR)')
    results.push('4. Make 120 qualifying monthly payments (10 years)')
    results.push('')
    if (hasDirect) {
      results.push('✅ You have Direct Loans — eligible for PSLF')
    } else if (hasFFEL || hasPerkins) {
      results.push('⚠️ **You need to consolidate** your FFEL/Perkins loans into a Direct Consolidation Loan to qualify for PSLF. Apply at StudentAid.gov.')
      results.push('**Warning**: Consolidation resets your payment count unless you qualify for the IDR Account Adjustment (check current status).')
    }
    if (hasParentPlus) {
      results.push('⚠️ **Parent PLUS loans**: Must be consolidated into Direct Consolidation, then enrolled in ICR (only qualifying IDR plan for Parent PLUS). PSLF-eligible after consolidation.')
    }
    results.push('')
    results.push(`**Your progress**: ~${Math.round(years * 12)} payments made, ~${remainingPayments} remaining (~${remainingYears} years)`)
    if (remainingPayments <= 24) {
      results.push('🎉 **You are close!** Submit your PSLF form NOW to get your payment count certified.')
    }
    results.push('')
    results.push('**Action**: Submit the PSLF Form (combined Employment Certification + Application) at StudentAid.gov. Do this annually and whenever you change employers.')
  } else {
    results.push('❌ Based on your employer type, you do not currently qualify for PSLF.')
    results.push('PSLF requires full-time employment at a government agency or 501(c)(3) nonprofit.')
    if (employerType.includes('for_profit')) {
      results.push('**Tip**: If you switch to a qualifying employer in the future, your qualifying payments start from that point.')
    }
  }
  results.push('')

  // IDR Forgiveness
  results.push('### Income-Driven Repayment (IDR) Forgiveness')
  results.push('')
  results.push('All IDR plans forgive the remaining balance after 20-25 years of payments:')
  results.push('- **SAVE**: 20 years (undergrad) or 25 years (grad). ⚠️ Currently blocked by litigation — check status.')
  results.push('- **PAYE**: 20 years')
  results.push('- **IBR**: 20 years (new borrowers after July 2014) or 25 years (older borrowers)')
  results.push('- **ICR**: 25 years')
  results.push('')

  if (income > 0) {
    results.push('**Estimated IDR payments based on your income:**')
    results.push('')
    for (const plan of ['SAVE', 'PAYE', 'IBR', 'ICR']) {
      const est = estimateIDRPayment(plan, income, familySize, balanceNum)
      results.push(`- ${est.description}`)
    }
    results.push('')

    // Check if low-balance SAVE applies
    if (balanceNum > 0 && balanceNum <= 12000) {
      results.push('💡 **Low-balance SAVE shortcut**: Borrowers with $12,000 or less in original principal get forgiveness after just **10 years** on SAVE (if reinstated). Each additional $1,000 adds 1 year.')
    } else if (balanceNum > 12000 && balanceNum <= 20000) {
      const saveYears = 10 + Math.ceil((balanceNum - 12000) / 1000)
      results.push(`💡 **SAVE early forgiveness**: With your balance, forgiveness could come after **${saveYears} years** on SAVE (instead of 20-25), if the plan is reinstated.`)
    }
    results.push('')
  }

  const idrYearsLeft = Math.max(0, 20 - years)
  results.push(`**Your progress**: ~${years} years of payments. ~${idrYearsLeft.toFixed(0)} years until 20-year IDR forgiveness.`)
  results.push('')
  results.push('**Tax note**: IDR forgiveness was previously taxed as income. Under current law (American Rescue Plan), forgiveness through 2025 is TAX-FREE. After 2025, it may become taxable again unless extended.')
  results.push('')

  // Teacher Loan Forgiveness
  if (isTeacher || employerType.includes('teacher')) {
    results.push('### Teacher Loan Forgiveness')
    results.push('')
    results.push('✅ **You may qualify for Teacher Loan Forgiveness!**')
    results.push('')
    results.push('**Requirements:**')
    results.push('1. Teach full-time for 5 consecutive years at a qualifying low-income school')
    results.push('2. Have Direct or FFEL loans (not Perkins)')
    results.push('3. Loans must have been taken out after October 1, 1998')
    results.push('')
    results.push('**Forgiveness amounts:**')
    results.push('- **Up to $17,500**: Highly qualified math, science, or special education teachers')
    results.push('- **Up to $5,000**: Other qualifying teachers')
    results.push('')
    results.push('**Important**: Teacher Forgiveness and PSLF can be combined — use Teacher Forgiveness first (5 years), then switch to PSLF counting (need 120 total qualifying payments).')
    results.push('')
  }

  // Borrower Defense
  if (schoolIssue) {
    results.push('### Borrower Defense to Repayment')
    results.push('')
    results.push('✅ **You may qualify for Borrower Defense!**')
    results.push(`You reported a school issue: "${schoolIssue}"`)
    results.push('')
    results.push('**Borrower Defense applies if your school:**')
    results.push('- Made misrepresentations about job placement rates, graduation rates, or program quality')
    results.push('- Engaged in aggressive or deceptive recruiting')
    results.push('- Violated state consumer protection laws')
    results.push('- Closed while you were enrolled or shortly after')
    results.push('')
    results.push('**How to apply:**')
    results.push('1. File at StudentAid.gov/borrower-defense')
    results.push('2. Provide evidence (marketing materials, enrollment agreements, communications)')
    results.push('3. Request forbearance while your claim is reviewed')
    results.push('4. If approved: loans discharged + possible refund of payments made')
    results.push('')
    results.push('**Processing time**: 6-24+ months. Group discharges (like Corinthian, ITT Tech, DeVry) may be automatic — check if your school is on the list.')
    results.push('')
  }

  // Closed School Discharge
  if (schoolIssue && schoolIssue.toLowerCase().includes('closed')) {
    results.push('### Closed School Discharge')
    results.push('')
    results.push('If your school closed while you were enrolled (or within 180 days of withdrawal), you may qualify for **automatic discharge** of your federal loans.')
    results.push('- Check the closed school list at StudentAid.gov')
    results.push('- You may also qualify for a refund of payments already made')
    results.push('')
  }

  // Total and Permanent Disability
  if (disability === 'yes') {
    results.push('### Total and Permanent Disability (TPD) Discharge')
    results.push('')
    results.push('✅ **You may qualify for TPD Discharge!**')
    results.push('')
    results.push('**Eligibility**: Documented total and permanent disability certified by:')
    results.push('- A physician (MD or DO)')
    results.push('- The VA (100% disability rating or TDIU)')
    results.push('- The SSA (SSDI or SSI determination)')
    results.push('')
    results.push('**How to apply**: DisabilityDischarge.com')
    results.push('- VA determinations may result in automatic discharge')
    results.push('- SSA determinations may result in automatic discharge')
    results.push('- Physician certification requires a 3-year monitoring period')
    results.push('')
    results.push('**Tax**: TPD discharge is TAX-FREE through 2025.')
    results.push('')
  }

  // Default-specific guidance
  if (isInDefault) {
    results.push('### ⚠️ Your Loans Are in Default')
    results.push('')
    results.push('**Defaulted loans are NOT eligible for forgiveness programs until you resolve the default.** Options:')
    results.push('')
    results.push('1. **Fresh Start Program** (if still available): One-time on-ramp to return defaulted loans to good standing. Check StudentAid.gov/freshstart')
    results.push('2. **Loan Rehabilitation**: Make 9 voluntary payments over 10 months. Default is removed from credit report.')
    results.push('3. **Direct Consolidation**: Consolidate defaulted loans into new Direct Consolidation Loan. Faster but default stays on credit report.')
    results.push('')
    results.push('**After resolving default**, you can enroll in IDR and pursue PSLF or IDR forgiveness. Fresh Start and rehabilitation preserve prior payment counts.')
    results.push('')
  }

  // FFEL consolidation reminder
  if (hasFFEL && !hasDirect) {
    results.push('### ⚠️ FFEL Loan Consolidation')
    results.push('')
    results.push('Your FFEL loans are **not directly eligible** for PSLF or SAVE/PAYE. You need to consolidate into a Direct Consolidation Loan.')
    results.push('- Apply at StudentAid.gov')
    results.push('- **IDR Account Adjustment**: Check if you qualify for credit toward IDR/PSLF forgiveness for time spent repaying FFEL loans')
    results.push('')
  }

  results.push('### Recommended Next Steps')
  results.push('')
  results.push('1. **Verify your loan details** at StudentAid.gov (log in with FSA ID)')
  results.push('2. **Check your servicer** — know who services your loans (Mohela, Nelnet, Aidvantage, EdFinancial, etc.)')
  results.push('3. **Get your payment count** — request an IDR/PSLF payment count from your servicer')
  results.push('4. Use `search_forgiveness_programs` for current program status and eligibility details')
  results.push('5. Use `check_repayment_options` to compare IDR plan payments')
  results.push('6. Use `write_forgiveness_guide` to generate your personalized application guide')
  results.push('')
  results.push('---')
  results.push('**Disclaimer**: This analysis is for informational purposes only and is NOT financial or legal advice. Student loan rules change frequently. Verify all information at StudentAid.gov and consult a student loan advisor for complex situations.')

  return results.join('\n')
}
