import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'check_repayment_options',
  description:
    'Compare income-driven repayment (IDR) plans side by side, estimate monthly payments, calculate total cost over the life of each plan, and determine which plan leads to the fastest forgiveness. Use after analyze_loan_situation.',
  parameters: {
    type: 'object',
    properties: {
      income: {
        type: 'string',
        description: 'Annual gross income (AGI)',
      },
      family_size: {
        type: 'string',
        description: 'Number of people in household',
      },
      total_balance: {
        type: 'string',
        description: 'Total federal loan balance',
      },
      loan_type: {
        type: 'string',
        description: '"undergrad", "grad", "mixed", or "parent_plus"',
      },
      interest_rate: {
        type: 'string',
        description: 'Weighted average interest rate (e.g. "5.5%"). If unknown, 5.5% will be used.',
      },
      years_already_paid: {
        type: 'string',
        description: 'Years of qualifying payments already made',
      },
      pursuing_pslf: {
        type: 'string',
        description: '"yes" if pursuing PSLF (changes forgiveness timeline from 20-25 years to 10 years)',
      },
    },
    required: ['income', 'total_balance'],
  },
}

// 2025 Federal Poverty Guidelines
const FPL_2025: Record<number, number> = {
  1: 15650, 2: 21150, 3: 26650, 4: 32150, 5: 37650,
  6: 43150, 7: 48650, 8: 54150,
}

function getFPL(size: number): number {
  if (size <= 0) return FPL_2025[1]
  if (size >= 8) return FPL_2025[8] + (size - 8) * 5500
  return FPL_2025[size] || FPL_2025[1]
}

interface PlanEstimate {
  name: string
  monthlyPayment: number
  discretionaryPct: number
  fplMultiplier: number
  forgivenessYears: number
  eligible: boolean
  reason: string
  interestSubsidy: string
  totalPaid: number
  amountForgiven: number
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const incomeStr = (args.income as string) || ''
  const familySizeStr = (args.family_size as string) || '1'
  const balanceStr = (args.total_balance as string) || ''
  const loanType = ((args.loan_type as string) || 'mixed').toLowerCase()
  const rateStr = (args.interest_rate as string) || '5.5%'
  const yearsPaidStr = (args.years_already_paid as string) || '0'
  const pursuingPSLF = ((args.pursuing_pslf as string) || 'no').toLowerCase() === 'yes'

  const income = parseFloat(incomeStr.replace(/[$,]/g, '')) || 0
  const familySize = parseInt(familySizeStr) || 1
  const balance = parseFloat(balanceStr.replace(/[$,]/g, '')) || 0
  const rate = parseFloat(rateStr.replace('%', '')) / 100 || 0.055
  const yearsPaid = parseFloat(yearsPaidStr) || 0
  const isParentPlus = loanType.includes('parent')
  const isGrad = loanType.includes('grad')
  const isUndergrad = loanType.includes('undergrad')

  if (!income || !balance) {
    return 'Error: income and total_balance are required'
  }

  const fpl = getFPL(familySize)

  // Calculate standard 10-year payment for comparison
  const monthlyRate = rate / 12
  const standardMonthly = Math.round(balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -120)))

  // Calculate each IDR plan
  const plans: PlanEstimate[] = []

  // SAVE
  const saveDiscretionary = Math.max(0, income - fpl * 2.25)
  const savePct = isGrad ? 0.10 : isUndergrad ? 0.05 : 0.075 // mixed estimate
  const saveMonthly = Math.round(saveDiscretionary * savePct / 12)
  const saveForgivenessYears = pursuingPSLF ? 10 : (isUndergrad ? 20 : 25)
  const saveYearsLeft = Math.max(0, saveForgivenessYears - yearsPaid)
  const saveTotalPaid = saveMonthly * saveYearsLeft * 12
  plans.push({
    name: 'SAVE',
    monthlyPayment: saveMonthly,
    discretionaryPct: savePct * 100,
    fplMultiplier: 2.25,
    forgivenessYears: saveForgivenessYears,
    eligible: !isParentPlus,
    reason: isParentPlus ? 'Not available for Parent PLUS loans' : '⚠️ Currently blocked by litigation',
    interestSubsidy: 'Government pays 100% of unpaid interest (if payment covers principal)',
    totalPaid: saveTotalPaid,
    amountForgiven: Math.max(0, balance - saveTotalPaid + balance * rate * saveYearsLeft * 0.3),
  })

  // PAYE
  const payeDiscretionary = Math.max(0, income - fpl * 1.5)
  const payeMonthly = Math.min(Math.round(payeDiscretionary * 0.10 / 12), standardMonthly)
  const payeForgivenessYears = pursuingPSLF ? 10 : 20
  const payeYearsLeft = Math.max(0, payeForgivenessYears - yearsPaid)
  const payeTotalPaid = payeMonthly * payeYearsLeft * 12
  plans.push({
    name: 'PAYE',
    monthlyPayment: payeMonthly,
    discretionaryPct: 10,
    fplMultiplier: 1.5,
    forgivenessYears: payeForgivenessYears,
    eligible: !isParentPlus,
    reason: isParentPlus ? 'Not available for Parent PLUS loans' : 'Must be new borrower (no loans before Oct 2007, new loan after Oct 2011)',
    interestSubsidy: 'Government pays 50% of unpaid interest for first 3 years on subsidized loans',
    totalPaid: payeTotalPaid,
    amountForgiven: Math.max(0, balance - payeTotalPaid + balance * rate * payeYearsLeft * 0.5),
  })

  // IBR
  const ibrDiscretionary = Math.max(0, income - fpl * 1.5)
  const ibrPctNew = 0.10
  const ibrPctOld = 0.15
  const ibrMonthlyNew = Math.min(Math.round(ibrDiscretionary * ibrPctNew / 12), standardMonthly)
  const ibrMonthlyOld = Math.min(Math.round(ibrDiscretionary * ibrPctOld / 12), standardMonthly)
  const ibrForgivenessNew = pursuingPSLF ? 10 : 20
  const ibrForgivenessOld = pursuingPSLF ? 10 : 25
  const ibrYearsLeftNew = Math.max(0, ibrForgivenessNew - yearsPaid)
  const ibrTotalPaidNew = ibrMonthlyNew * ibrYearsLeftNew * 12
  plans.push({
    name: 'IBR (new borrower)',
    monthlyPayment: ibrMonthlyNew,
    discretionaryPct: 10,
    fplMultiplier: 1.5,
    forgivenessYears: ibrForgivenessNew,
    eligible: !isParentPlus,
    reason: isParentPlus ? 'Not available for Parent PLUS' : 'New borrower = no loans before July 1, 2014',
    interestSubsidy: 'Government pays 50% of unpaid interest for first 3 years on subsidized loans',
    totalPaid: ibrTotalPaidNew,
    amountForgiven: Math.max(0, balance - ibrTotalPaidNew + balance * rate * ibrYearsLeftNew * 0.5),
  })
  const ibrYearsLeftOld = Math.max(0, ibrForgivenessOld - yearsPaid)
  const ibrTotalPaidOld = ibrMonthlyOld * ibrYearsLeftOld * 12
  plans.push({
    name: 'IBR (old borrower)',
    monthlyPayment: ibrMonthlyOld,
    discretionaryPct: 15,
    fplMultiplier: 1.5,
    forgivenessYears: ibrForgivenessOld,
    eligible: !isParentPlus,
    reason: isParentPlus ? 'Not available for Parent PLUS' : 'Pre-July 2014 borrower',
    interestSubsidy: 'Government pays 50% of unpaid interest for first 3 years on subsidized loans',
    totalPaid: ibrTotalPaidOld,
    amountForgiven: Math.max(0, balance - ibrTotalPaidOld + balance * rate * ibrYearsLeftOld * 0.5),
  })

  // ICR
  const icrDiscretionary = Math.max(0, income - fpl * 1.0)
  const icrMonthly = Math.round(icrDiscretionary * 0.20 / 12)
  const icrForgivenessYears = pursuingPSLF ? 10 : 25
  const icrYearsLeft = Math.max(0, icrForgivenessYears - yearsPaid)
  const icrTotalPaid = icrMonthly * icrYearsLeft * 12
  plans.push({
    name: 'ICR',
    monthlyPayment: icrMonthly,
    discretionaryPct: 20,
    fplMultiplier: 1.0,
    forgivenessYears: icrForgivenessYears,
    eligible: true,
    reason: 'Available for all Direct Loans including consolidated Parent PLUS',
    interestSubsidy: 'None — all unpaid interest capitalizes',
    totalPaid: icrTotalPaid,
    amountForgiven: Math.max(0, balance - icrTotalPaid + balance * rate * icrYearsLeft * 0.7),
  })

  // Build comparison table
  const results: string[] = []
  results.push('## Repayment Plan Comparison')
  results.push('')
  results.push(`**Income**: $${income.toLocaleString()} | **Family size**: ${familySize} | **Balance**: $${balance.toLocaleString()} | **Rate**: ${(rate * 100).toFixed(1)}%`)
  results.push(`**Federal Poverty Level**: $${fpl.toLocaleString()} (${familySize}-person household)`)
  if (pursuingPSLF) results.push('**Pursuing PSLF**: Yes (10-year forgiveness)')
  if (yearsPaid > 0) results.push(`**Years already paid**: ${yearsPaid}`)
  results.push('')

  results.push(`**Standard 10-year payment**: $${standardMonthly}/mo (total: $${(standardMonthly * 120).toLocaleString()})`)
  results.push('')

  results.push('| Plan | Monthly | % of Discretionary | FPL Threshold | Forgiveness | Eligible? |')
  results.push('|------|---------|-------------------|---------------|-------------|-----------|')
  for (const p of plans) {
    const eligIcon = p.eligible ? '✅' : '❌'
    results.push(`| ${p.name} | $${p.monthlyPayment} | ${p.discretionaryPct}% | ${p.fplMultiplier * 100}% FPL | ${p.forgivenessYears} years | ${eligIcon} |`)
  }
  results.push('')

  // Lowest payment
  const eligible = plans.filter(p => p.eligible)
  if (eligible.length > 0) {
    const lowest = eligible.reduce((a, b) => a.monthlyPayment < b.monthlyPayment ? a : b)
    const fastest = eligible.reduce((a, b) => a.forgivenessYears < b.forgivenessYears ? a : b)

    results.push('### Recommendations')
    results.push('')
    results.push(`💰 **Lowest payment**: ${lowest.name} at **$${lowest.monthlyPayment}/mo** (saves $${standardMonthly - lowest.monthlyPayment}/mo vs. standard)`)
    if (fastest.name !== lowest.name) {
      results.push(`⏱️ **Fastest forgiveness**: ${fastest.name} — forgiveness in ${fastest.forgivenessYears} years`)
    }
    results.push('')

    if (pursuingPSLF) {
      results.push('**For PSLF**: Choose the plan with the **lowest payment** — you want to minimize what you pay before the 10-year forgiveness. Every dollar you pay above the minimum is money you could have had forgiven.')
    } else {
      results.push('**Without PSLF**: Consider total cost vs. forgiveness amount. Lower payments mean more forgiveness but also more interest accrual. Use the Loan Simulator at StudentAid.gov for exact projections.')
    }
    results.push('')
  }

  // $0 payment check
  if (eligible.some(p => p.monthlyPayment === 0)) {
    results.push('### 💡 $0 Payment Plans')
    results.push('')
    results.push('Based on your income and family size, you may qualify for **$0 monthly payments** on some IDR plans. $0 payments still count as qualifying payments toward forgiveness (including PSLF)!')
    results.push('')
  }

  // Interest subsidy comparison
  results.push('### Interest Subsidy Comparison')
  results.push('')
  for (const p of eligible) {
    results.push(`- **${p.name}**: ${p.interestSubsidy}`)
  }
  results.push('')

  // Notes
  results.push('### Important Notes')
  results.push('')
  results.push('- These are **estimates** based on current income. IDR payments are recertified annually and change with income.')
  results.push('- Married filing jointly: spouse\'s income is included in AGI for all plans except IBR (married filing separately).')
  results.push('- If income increases significantly, payments may rise above the standard payment cap (PAYE, IBR) or become substantial (SAVE, ICR).')
  results.push('- Use the official Loan Simulator at StudentAid.gov for exact projections with your actual loan data.')
  results.push('')
  results.push('**Next**: Use `write_forgiveness_guide` to generate your personalized application guide with step-by-step instructions.')

  return results.join('\n')
}
