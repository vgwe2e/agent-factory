import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_expenses',
  description:
    'Analyze a freelancer\'s expense categories against IRS deduction rules. Takes the user\'s work profile and expense details, then searches for current IRS limits and rules for each applicable category. Returns structured analysis with deductibility, limits, and requirements.',
  parameters: {
    type: 'object',
    properties: {
      profession: {
        type: 'string',
        description: 'The freelancer\'s profession or business type',
      },
      annual_income: {
        type: 'string',
        description: 'Estimated annual freelance income (e.g. "$50,000")',
      },
      has_home_office: {
        type: 'string',
        description: 'Whether the freelancer uses a home office: "yes", "no", or "unsure"',
      },
      uses_vehicle: {
        type: 'string',
        description: 'Whether the freelancer uses a vehicle for business: "yes", "no", or "unsure"',
      },
      has_health_insurance: {
        type: 'string',
        description: 'Whether the freelancer pays for their own health insurance: "yes", "no", or "unsure"',
      },
      expense_categories: {
        type: 'string',
        description: 'Comma-separated list of expense categories the freelancer has (e.g. "software subscriptions, equipment, travel, meals, phone, internet, office supplies, professional development")',
      },
      filing_status: {
        type: 'string',
        description: 'Tax filing status: "single", "married_joint", "married_separate", "head_of_household". Defaults to "single".',
      },
    },
    required: ['profession', 'expense_categories'],
  },
}

interface DeductionCategory {
  name: string
  applicable: boolean
  deductionType: string
  estimatedRange: string
  irsForm: string
  notes: string
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const profession = args.profession as string
  const annualIncome = (args.annual_income as string) || 'not provided'
  const hasHomeOffice = (args.has_home_office as string) || 'unsure'
  const usesVehicle = (args.uses_vehicle as string) || 'unsure'
  const hasHealthInsurance = (args.has_health_insurance as string) || 'unsure'
  const expenseCategories = (args.expense_categories as string) || ''
  const filingStatus = (args.filing_status as string) || 'single'

  if (!profession || !expenseCategories) {
    return 'Error: profession and expense_categories are required'
  }

  const categories = expenseCategories.split(',').map(c => c.trim()).filter(Boolean)

  const sections: string[] = []
  sections.push(`# Expense Analysis: ${profession}`)
  sections.push(`**Income**: ${annualIncome} | **Filing status**: ${filingStatus}`)
  sections.push(`**Home office**: ${hasHomeOffice} | **Vehicle**: ${usesVehicle} | **Health insurance**: ${hasHealthInsurance}\n`)

  // Build the deduction analysis based on reported categories
  const deductions: DeductionCategory[] = []

  // Always-applicable deductions for self-employed
  deductions.push({
    name: 'Self-Employment Tax Deduction',
    applicable: true,
    deductionType: '50% of SE tax is deductible (above-the-line)',
    estimatedRange: '~7.65% of net earnings',
    irsForm: 'Schedule SE, Line 6 → Schedule 1, Line 15',
    notes: 'Automatic — you always get this. Deducts the employer-equivalent portion of SE tax.',
  })

  deductions.push({
    name: 'Qualified Business Income (QBI) Deduction',
    applicable: true,
    deductionType: 'Up to 20% of qualified business income',
    estimatedRange: 'Up to 20% of net Schedule C income',
    irsForm: 'Form 8995 or 8995-A',
    notes: 'Section 199A deduction. Income phase-outs apply for specified service trades (SSTB) above $191,950 single / $383,900 MFJ (2025 limits).',
  })

  // Home office
  if (hasHomeOffice === 'yes' || hasHomeOffice === 'unsure') {
    deductions.push({
      name: 'Home Office Deduction',
      applicable: hasHomeOffice === 'yes',
      deductionType: 'Simplified: $5/sq ft up to 300 sq ft ($1,500 max). Regular: actual expenses pro-rated by office %.',
      estimatedRange: '$500 – $3,000+',
      irsForm: 'Form 8829 (regular) or Schedule C Line 30 (simplified)',
      notes: hasHomeOffice === 'unsure'
        ? 'POTENTIALLY APPLICABLE: If you have a dedicated space used regularly and exclusively for business, you qualify. Even a desk in a corner counts if it\'s exclusively for work.'
        : 'Must be used regularly and exclusively for business. Simplified method: $5/sq ft (max 300 sq ft = $1,500). Regular method can be higher but requires tracking actual expenses.',
    })
  }

  // Vehicle
  if (usesVehicle === 'yes' || usesVehicle === 'unsure') {
    deductions.push({
      name: 'Vehicle / Mileage Deduction',
      applicable: usesVehicle === 'yes',
      deductionType: 'Standard mileage rate OR actual expenses (gas, insurance, repairs, depreciation)',
      estimatedRange: '$0.70/mile (2025 rate) × business miles',
      irsForm: 'Schedule C, Part IV (Form 4562 if actual expenses)',
      notes: usesVehicle === 'unsure'
        ? 'POTENTIALLY APPLICABLE: If you drive for ANY business purpose (client meetings, supply runs, co-working space), you can deduct. Track mileage!'
        : 'Track every business mile. Standard rate is simpler. Actual expenses method requires full records. Commuting does NOT count, but driving between business locations does.',
    })
  }

  // Health insurance
  if (hasHealthInsurance === 'yes' || hasHealthInsurance === 'unsure') {
    deductions.push({
      name: 'Self-Employed Health Insurance Deduction',
      applicable: hasHealthInsurance === 'yes',
      deductionType: '100% of health, dental, and vision premiums (above-the-line)',
      estimatedRange: '$3,000 – $15,000+ depending on plan and family size',
      irsForm: 'Schedule 1, Line 17',
      notes: hasHealthInsurance === 'unsure'
        ? 'POTENTIALLY APPLICABLE: If you pay for your own health/dental/vision insurance and are NOT eligible for an employer plan (including spouse\'s employer plan), the full premium is deductible.'
        : 'Above-the-line deduction — you get this even if you don\'t itemize. Includes premiums for you, spouse, and dependents. Cannot exceed net SE income.',
    })
  }

  // User-reported expense categories
  const categoryMap: Record<string, { deductionType: string; estimatedRange: string; irsForm: string; notes: string }> = {
    'software': { deductionType: '100% deductible business expense', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 18 (Office expenses) or Line 27a', notes: 'Adobe CC, Figma, GitHub, hosting, project management tools, accounting software — all deductible.' },
    'software subscriptions': { deductionType: '100% deductible business expense', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 18 (Office expenses) or Line 27a', notes: 'Adobe CC, Figma, GitHub, hosting, project management tools, accounting software — all deductible.' },
    'equipment': { deductionType: 'Section 179 deduction or depreciation', estimatedRange: '$500 – $10,000+', irsForm: 'Form 4562, Schedule C Line 13', notes: 'Computers, cameras, monitors, phones — deduct full cost in year 1 via Section 179 (up to $1,220,000 limit for 2025). Or depreciate over useful life.' },
    'travel': { deductionType: '100% deductible (transport + lodging)', estimatedRange: '$1,000 – $10,000+', irsForm: 'Schedule C, Line 24a', notes: 'Airfare, hotels, ground transport for business trips. Must be primarily for business. Keep receipts and document business purpose.' },
    'meals': { deductionType: '50% deductible (business meals)', estimatedRange: '$500 – $3,000', irsForm: 'Schedule C, Line 24b', notes: 'Business meals with clients or while traveling. 50% deductible. Must document: who, where, business purpose. Tip: photograph receipts.' },
    'phone': { deductionType: 'Business % deductible', estimatedRange: '$300 – $1,200', irsForm: 'Schedule C, Line 25', notes: 'Deduct the business-use percentage of your phone bill. If 60% business use, deduct 60%. Keep a log for a sample month to establish percentage.' },
    'internet': { deductionType: 'Business % deductible', estimatedRange: '$300 – $1,500', irsForm: 'Schedule C, Line 25', notes: 'Deduct the business-use percentage. If you have a home office, this percentage may match your home office percentage.' },
    'office supplies': { deductionType: '100% deductible', estimatedRange: '$200 – $1,000', irsForm: 'Schedule C, Line 18', notes: 'Pens, paper, printer ink, desk accessories, postage. Small amounts add up over a year.' },
    'professional development': { deductionType: '100% deductible', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 27a', notes: 'Courses, conferences, workshops, books, certifications — anything that improves skills in your current profession.' },
    'education': { deductionType: '100% deductible if maintains/improves current skills', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 27a', notes: 'Must relate to your current business. Courses for a new career are NOT deductible as business expense.' },
    'marketing': { deductionType: '100% deductible', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 8', notes: 'Website, business cards, social media ads, SEO, portfolio hosting, print materials — all deductible.' },
    'advertising': { deductionType: '100% deductible', estimatedRange: '$500 – $10,000', irsForm: 'Schedule C, Line 8', notes: 'Google Ads, Facebook Ads, print ads, sponsorships. No limit on advertising deductions.' },
    'insurance': { deductionType: '100% deductible business insurance', estimatedRange: '$500 – $3,000', irsForm: 'Schedule C, Line 15', notes: 'Business liability insurance, E&O insurance, professional indemnity. NOT health insurance (that\'s a separate deduction).' },
    'professional services': { deductionType: '100% deductible', estimatedRange: '$500 – $5,000', irsForm: 'Schedule C, Line 17', notes: 'Accountant, attorney, bookkeeper, business consultant fees. Legal fees for business matters.' },
    'coworking': { deductionType: '100% deductible', estimatedRange: '$1,200 – $6,000', irsForm: 'Schedule C, Line 20b', notes: 'Co-working space membership, desk rental. Alternative to home office deduction (can\'t claim both for same workspace).' },
    'retirement': { deductionType: 'Above-the-line deduction', estimatedRange: '$6,500 – $69,000', irsForm: 'Schedule 1, Line 16 (SEP-IRA) or Form 8880', notes: 'SEP-IRA: up to 25% of net SE earnings (max $69,000 for 2025). Solo 401(k): up to $23,500 employee + 25% employer. IRA: up to $7,000 ($8,000 if 50+).' },
    'subscriptions': { deductionType: '100% deductible if business-related', estimatedRange: '$200 – $2,000', irsForm: 'Schedule C, Line 27a', notes: 'Trade publications, industry memberships, professional associations, business magazines.' },
    'shipping': { deductionType: '100% deductible', estimatedRange: '$200 – $5,000', irsForm: 'Schedule C, Line 27a', notes: 'Shipping products to clients, postage, courier services.' },
    'utilities': { deductionType: 'Business % deductible (with home office)', estimatedRange: '$300 – $2,000', irsForm: 'Form 8829', notes: 'Only deductible if you claim the regular home office deduction (not simplified). Pro-rated by office square footage percentage.' },
    'clothing': { deductionType: 'Usually NOT deductible', estimatedRange: '$0', irsForm: 'N/A', notes: 'Regular work clothes are NOT deductible. Only uniforms/costumes/protective gear required for work and not suitable for everyday wear.' },
  }

  sections.push('## Deduction Analysis\n')

  // Always-applicable deductions
  for (const d of deductions) {
    const status = d.applicable ? '✅' : '❓'
    sections.push(`### ${status} ${d.name}`)
    sections.push(`- **Type**: ${d.deductionType}`)
    sections.push(`- **Estimated range**: ${d.estimatedRange}`)
    sections.push(`- **IRS form**: ${d.irsForm}`)
    sections.push(`- **Notes**: ${d.notes}\n`)
  }

  // User-reported categories
  sections.push('## Expense Category Analysis\n')

  for (const cat of categories) {
    const normalized = cat.toLowerCase()
    // Find best match in categoryMap
    let matched = false
    for (const [key, info] of Object.entries(categoryMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        sections.push(`### ✅ ${cat}`)
        sections.push(`- **Type**: ${info.deductionType}`)
        sections.push(`- **Estimated range**: ${info.estimatedRange}`)
        sections.push(`- **IRS form**: ${info.irsForm}`)
        sections.push(`- **Notes**: ${info.notes}\n`)
        matched = true
        break
      }
    }
    if (!matched) {
      sections.push(`### ❓ ${cat}`)
      sections.push(`- **Type**: Potentially deductible — research needed`)
      sections.push(`- **Notes**: Use search_deductions to look up IRS rules for "${cat}" deductions for ${profession}.\n`)
    }
  }

  sections.push('---')
  sections.push('**Disclaimer**: This analysis is for educational purposes only and is not tax advice. Consult a CPA or tax professional for your specific situation. IRS rules and limits may change annually.')

  return sections.join('\n')
}
