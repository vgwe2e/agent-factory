import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_immigration_situation',
  description:
    'Analyze a person\'s immigration situation to determine which USCIS forms they need, their eligibility, and common pitfalls. Takes details about current status, goal, and personal circumstances. Returns form recommendations, eligibility assessment, and key warnings. Use this as the FIRST step.',
  parameters: {
    type: 'object',
    properties: {
      current_status: {
        type: 'string',
        description: 'Current immigration status: e.g. "F-1 student", "H-1B", "B-2 tourist", "green card holder", "undocumented", "DACA", "TPS", "asylee", "refugee", "US citizen sponsoring family"',
      },
      goal: {
        type: 'string',
        description: 'What they want to accomplish: e.g. "get a green card", "become a citizen", "extend my visa", "change status to H-1B", "sponsor my spouse", "get work authorization", "renew DACA", "apply for asylum"',
      },
      country_of_birth: {
        type: 'string',
        description: 'Country of birth (affects visa bulletin priority dates)',
      },
      relationship_basis: {
        type: 'string',
        description: 'If family-based: relationship to the petitioner (e.g. "spouse of US citizen", "child of green card holder", "sibling of US citizen")',
      },
      employer_sponsorship: {
        type: 'string',
        description: 'If employment-based: type of employer sponsorship (e.g. "employer filing PERM", "self-petition EB-2 NIW", "EB-1A extraordinary ability")',
      },
      years_as_permanent_resident: {
        type: 'string',
        description: 'If applying for citizenship: how many years as a permanent resident',
      },
      married_to_us_citizen: {
        type: 'string',
        description: '"yes" or "no" — affects naturalization timeline (3 vs 5 years)',
      },
      criminal_history: {
        type: 'string',
        description: '"none", "minor" (traffic), or "yes" (arrests/convictions)',
      },
      current_location: {
        type: 'string',
        description: '"inside_us" or "outside_us"',
      },
    },
    required: ['current_status', 'goal'],
  },
}

interface FormRec {
  form: string
  name: string
  purpose: string
  fee: string
  processingTime: string
  warnings: string[]
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const currentStatus = ((args.current_status as string) || '').toLowerCase()
  const goal = ((args.goal as string) || '').toLowerCase()
  const country = (args.country_of_birth as string) || ''
  const relationship = ((args.relationship_basis as string) || '').toLowerCase()
  const employerSponsorship = ((args.employer_sponsorship as string) || '').toLowerCase()
  const yearsLPR = (args.years_as_permanent_resident as string) || ''
  const marriedCitizen = ((args.married_to_us_citizen as string) || '').toLowerCase() === 'yes'
  const criminal = ((args.criminal_history as string) || 'none').toLowerCase()
  const location = ((args.current_location as string) || 'inside_us').toLowerCase()

  if (!currentStatus || !goal) {
    return 'Error: current_status and goal are required'
  }

  const results: string[] = []
  results.push('## Immigration Situation Analysis')
  results.push('')
  results.push(`**Current status**: ${currentStatus}`)
  results.push(`**Goal**: ${goal}`)
  if (country) results.push(`**Country of birth**: ${country}`)
  if (relationship) results.push(`**Relationship basis**: ${relationship}`)
  if (employerSponsorship) results.push(`**Employment basis**: ${employerSponsorship}`)
  if (location) results.push(`**Location**: ${location === 'inside_us' ? 'Inside the US' : 'Outside the US'}`)
  results.push('')

  const forms: FormRec[] = []

  // NATURALIZATION
  if (goal.includes('citizen') || goal.includes('naturaliz')) {
    const yearsNeeded = marriedCitizen ? 3 : 5
    forms.push({
      form: 'N-400',
      name: 'Application for Naturalization',
      purpose: 'Apply to become a US citizen',
      fee: '$760 (filing fee + biometrics)',
      processingTime: '8-14 months',
      warnings: [
        `Must have been a permanent resident for at least ${yearsNeeded} years (${marriedCitizen ? '3 years if married to US citizen' : '5 years standard'})`,
        'Must have been physically present in the US for at least half that time',
        'Must have continuous residence — trips over 6 months can break continuity',
        'Must pass English and civics tests',
        criminal !== 'none' ? '⚠️ Criminal history may affect eligibility — consult an attorney' : '',
        'Can file up to 90 days before meeting the residence requirement',
      ].filter(Boolean),
    })
  }

  // GREEN CARD — FAMILY
  if ((goal.includes('green card') || goal.includes('permanent resident') || goal.includes('adjust status')) && (relationship || goal.includes('sponsor') || goal.includes('family'))) {
    forms.push({
      form: 'I-130',
      name: 'Petition for Alien Relative',
      purpose: 'The US citizen or green card holder files this to petition for their relative',
      fee: '$625',
      processingTime: '12-24 months (immediate relative); years for preference categories',
      warnings: [
        'The PETITIONER (US citizen/LPR) files this form, not the beneficiary',
        'Immediate relatives (spouse, parent, unmarried child under 21 of US citizen) have no visa number wait',
        'All other categories have multi-year backlogs — check the Visa Bulletin',
        country.toLowerCase().includes('india') || country.toLowerCase().includes('china') || country.toLowerCase().includes('mexico') || country.toLowerCase().includes('philipp') ?
          `⚠️ ${country} has longer backlogs than most countries` : '',
      ].filter(Boolean),
    })

    if (location === 'inside_us') {
      forms.push({
        form: 'I-485',
        name: 'Application to Register Permanent Residence (Adjustment of Status)',
        purpose: 'Apply for green card while inside the US',
        fee: '$1,440 (includes biometrics)',
        processingTime: '12-24 months',
        warnings: [
          'Can file concurrently with I-130 if you are an immediate relative of a US citizen',
          'Must be in lawful status OR be an immediate relative of a US citizen (some exceptions)',
          'Unlawful presence may trigger 3/10-year bars if you leave the US',
          'Do NOT leave the US without Advance Parole (I-131) while I-485 is pending',
        ],
      })
      forms.push({
        form: 'I-765',
        name: 'Application for Employment Authorization (EAD)',
        purpose: 'Get work authorization while I-485 is pending',
        fee: 'No additional fee when filed with I-485',
        processingTime: '3-7 months',
        warnings: ['File concurrently with I-485 — no extra fee'],
      })
      forms.push({
        form: 'I-131',
        name: 'Application for Travel Document (Advance Parole)',
        purpose: 'Permission to travel outside the US while I-485 is pending',
        fee: 'No additional fee when filed with I-485',
        processingTime: '3-7 months',
        warnings: [
          'Do NOT travel until approved — leaving without Advance Parole abandons your I-485',
          'File concurrently with I-485 — no extra fee',
        ],
      })
    } else {
      forms.push({
        form: 'DS-260',
        name: 'Immigrant Visa Application (Consular Processing)',
        purpose: 'Apply for immigrant visa at US consulate abroad',
        fee: '$325 (consular fee) + $220 (USCIS immigrant fee)',
        processingTime: 'Varies by consulate; 6-18 months after I-130 approval',
        warnings: [
          'This is filed through the National Visa Center (NVC), not USCIS',
          'Wait for NVC to schedule your interview at the consulate',
          'Must provide civil documents (birth certificate, police clearance, medical exam)',
        ],
      })
    }
  }

  // GREEN CARD — EMPLOYMENT
  if ((goal.includes('green card') || goal.includes('permanent resident')) && (employerSponsorship || goal.includes('employ') || goal.includes('eb-') || goal.includes('niw') || goal.includes('perm'))) {
    if (employerSponsorship.includes('perm') || goal.includes('perm')) {
      forms.push({
        form: 'ETA-9089',
        name: 'PERM Labor Certification',
        purpose: 'Employer proves no qualified US workers available for the position',
        fee: 'No filing fee (but employer pays recruitment costs)',
        processingTime: '6-18 months',
        warnings: [
          'Filed by the EMPLOYER, not the employee',
          'Employer must conduct recruitment and prove no qualified US workers',
          'Must be filed before I-140',
          'PERM audit can add 6-12 months',
        ],
      })
    }

    forms.push({
      form: 'I-140',
      name: 'Immigrant Petition for Alien Workers',
      purpose: 'Employer (or self) petitions for employment-based green card',
      fee: '$700',
      processingTime: '6-12 months (or 15 business days with premium processing at $2,805)',
      warnings: [
        employerSponsorship.includes('niw') ? 'EB-2 NIW allows self-petition — no employer or PERM required' : 'Usually filed by employer after PERM approval',
        employerSponsorship.includes('eb-1') || employerSponsorship.includes('extraordinary') ? 'EB-1A allows self-petition for extraordinary ability' : '',
        'Premium processing available ($2,805) for 15-day decision',
        country.toLowerCase().includes('india') ? '⚠️ India EB-2/EB-3 backlog is 10+ years — consider EB-1 or EB-2 NIW' : '',
        country.toLowerCase().includes('china') ? '⚠️ China EB-2/EB-3 has multi-year backlog' : '',
      ].filter(Boolean),
    })

    if (location === 'inside_us') {
      forms.push({
        form: 'I-485',
        name: 'Application to Register Permanent Residence',
        purpose: 'Adjust status to permanent resident',
        fee: '$1,440',
        processingTime: '12-24 months',
        warnings: [
          'Can only file when your priority date is current (check Visa Bulletin)',
          'File I-765 (EAD) and I-131 (Advance Parole) concurrently',
        ],
      })
    }
  }

  // WORK AUTHORIZATION
  if (goal.includes('work') && (goal.includes('authoriz') || goal.includes('permit') || goal.includes('ead'))) {
    forms.push({
      form: 'I-765',
      name: 'Application for Employment Authorization Document (EAD)',
      purpose: 'Apply for or renew work authorization',
      fee: '$410',
      processingTime: '3-7 months',
      warnings: [
        'Must have an eligible category (pending I-485, asylee, DACA, TPS, etc.)',
        'Apply 180 days before current EAD expires for auto-extension',
        currentStatus.includes('f-1') ? 'F-1 students: use OPT (12 months, 24-month STEM extension) — file I-765 with your school\'s DSO' : '',
        currentStatus.includes('h-4') ? 'H-4 spouses: EAD available if H-1B spouse has approved I-140' : '',
      ].filter(Boolean),
    })
  }

  // VISA EXTENSION / CHANGE OF STATUS
  if (goal.includes('extend') || goal.includes('change status') || goal.includes('change to')) {
    forms.push({
      form: 'I-539',
      name: 'Application to Extend/Change Nonimmigrant Status',
      purpose: 'Extend your current visa status or change to a different nonimmigrant status',
      fee: '$370 + $85 biometrics',
      processingTime: '5-12 months',
      warnings: [
        'Must file BEFORE your current status expires',
        'You can remain in the US while the application is pending (but cannot work unless authorized)',
        'Cannot change status if you entered under Visa Waiver Program (VWP/ESTA)',
        currentStatus.includes('b-') ? 'B-1/B-2 extensions are limited — usually max 6 months' : '',
      ].filter(Boolean),
    })
  }

  // H-1B
  if (goal.includes('h-1b') || goal.includes('h1b')) {
    forms.push({
      form: 'I-129',
      name: 'Petition for Nonimmigrant Worker (H-1B)',
      purpose: 'Employer petitions for H-1B specialty occupation visa',
      fee: '$780 + $500 fraud fee + $750/$1,500 ACWIA fee + potential $4,000 H-1B registration',
      processingTime: '3-6 months (or 15 business days with premium processing)',
      warnings: [
        'Filed by the EMPLOYER, not the employee',
        'Annual cap: 65,000 regular + 20,000 US master\'s degree',
        'Registration period: usually March — must be selected in lottery first',
        'Cap-exempt employers (universities, research orgs) can file anytime',
        'H-1B registration fee increased to $215 in 2024',
        currentStatus.includes('f-1') ? 'F-1 to H-1B: if selected in lottery, status changes Oct 1. Cap-gap OPT extension available.' : '',
      ].filter(Boolean),
    })
  }

  // DACA
  if (goal.includes('daca') || currentStatus.includes('daca')) {
    forms.push({
      form: 'I-821D',
      name: 'Consideration of Deferred Action for Childhood Arrivals',
      purpose: 'Apply for or renew DACA',
      fee: '$495 (total with I-765 and I-765WS)',
      processingTime: '4-8 months for renewal',
      warnings: [
        '⚠️ DACA is under active legal challenge — check current status before filing',
        'Renewals: file 120-150 days before expiration',
        'New applications: currently blocked by court order as of 2024 (check for updates)',
        'File I-821D together with I-765 (work permit) and I-765WS (worksheet)',
      ],
    })
  }

  // ASYLUM
  if (goal.includes('asylum')) {
    forms.push({
      form: 'I-589',
      name: 'Application for Asylum and Withholding of Removal',
      purpose: 'Apply for asylum protection in the US',
      fee: 'No filing fee',
      processingTime: 'Varies widely — 6 months to several years',
      warnings: [
        '⚠️ MUST file within 1 year of arrival in the US (with limited exceptions)',
        'No filing fee required',
        'Can apply for EAD 150 days after filing (if no decision)',
        'STRONGLY recommend an attorney — asylum law is extremely complex',
        'Do not return to your country of persecution while asylum is pending',
      ],
    })
  }

  // TPS
  if (goal.includes('tps') || currentStatus.includes('tps')) {
    forms.push({
      form: 'I-821',
      name: 'Application for Temporary Protected Status',
      purpose: 'Apply for or re-register for TPS',
      fee: 'No filing fee (biometrics: $85)',
      processingTime: '3-12 months',
      warnings: [
        'Must be a national of a TPS-designated country',
        'Must have been continuously present and in continuous residence since designation date',
        'Re-registration periods are limited — watch Federal Register notices',
        'File I-765 concurrently for work authorization',
      ],
    })
  }

  // SPONSOR SPOUSE
  if (goal.includes('sponsor') && (goal.includes('spouse') || goal.includes('husband') || goal.includes('wife'))) {
    if (!forms.find(f => f.form === 'I-130')) {
      forms.push({
        form: 'I-130',
        name: 'Petition for Alien Relative',
        purpose: 'Petition for your spouse to get a green card',
        fee: '$625',
        processingTime: '12-18 months',
        warnings: [
          'If married less than 2 years: conditional green card (must file I-751 to remove conditions)',
          'USCIS scrutinizes marriages for fraud — be prepared to prove bona fide marriage',
          'Spouse can file I-485 concurrently if inside the US',
        ],
      })
    }
    forms.push({
      form: 'I-864',
      name: 'Affidavit of Support',
      purpose: 'Prove you can financially support your spouse (125% of poverty guidelines)',
      fee: 'No filing fee',
      processingTime: 'Filed with I-485 or at consular interview',
      warnings: [
        'Must show income at 125% of federal poverty level for household size',
        'Can use joint sponsor if your income is insufficient',
        'This is a legally binding contract — you\'re responsible until spouse becomes a citizen or works 40 quarters',
      ],
    })
  }

  // Build output
  if (forms.length === 0) {
    results.push('### Form Recommendations')
    results.push('')
    results.push('Could not determine specific forms from the information provided. Please provide more details about your current immigration status and what you want to accomplish.')
    results.push('')
    results.push('Use `search_immigration_requirements` to research your specific situation further.')
  } else {
    results.push(`### Recommended Forms (${forms.length})`)
    results.push('')
    results.push('File these in the order listed:')
    results.push('')

    forms.forEach((f, i) => {
      results.push(`#### ${i + 1}. Form ${f.form} — ${f.name}`)
      results.push(`**Purpose**: ${f.purpose}`)
      results.push(`**Filing fee**: ${f.fee}`)
      results.push(`**Processing time**: ${f.processingTime}`)
      if (f.warnings.length > 0) {
        results.push('**Important warnings**:')
        f.warnings.forEach(w => results.push(`- ${w}`))
      }
      results.push('')
    })
  }

  // Common mistakes
  results.push('### Common Filing Mistakes to Avoid')
  results.push('')
  results.push('1. **Wrong form version** — 44% of rejections are caused by outdated forms. Always download from uscis.gov on the day you file.')
  results.push('2. **Wrong fee amount** — USCIS fees changed in 2024. Check the current fee schedule at uscis.gov/fees.')
  results.push('3. **Wrong filing address** — Different forms go to different USCIS service centers. Check the "Where to File" page for each form.')
  results.push('4. **Missing signatures** — Every form must be signed. Missing signature = automatic rejection.')
  results.push('5. **Blank fields** — Write "N/A" for fields that don\'t apply. Don\'t leave them blank.')
  results.push('6. **Missing supporting documents** — Check the form instructions for required evidence.')
  results.push('7. **Not keeping copies** — Copy everything before mailing. Keep originals of supporting documents.')
  results.push('')

  // Criminal history warning
  if (criminal !== 'none') {
    results.push('### ⚠️ Criminal History Warning')
    results.push('')
    results.push('Criminal history can significantly affect immigration applications. Even minor offenses (DUI, shoplifting, drug possession) can lead to denial or deportation. **STRONGLY consult an immigration attorney before filing any application.**')
    results.push('')
  }

  results.push('---')
  results.push('**Disclaimer**: This analysis is for informational purposes only and is NOT legal advice. Immigration law is extremely complex and constantly changing. For important decisions (green card, citizenship, asylum), consult an immigration attorney. Many offer free consultations. Use `search_immigration_requirements` to research current requirements and `write_filing_guide` to generate your personalized guide.')

  return results.join('\n')
}
