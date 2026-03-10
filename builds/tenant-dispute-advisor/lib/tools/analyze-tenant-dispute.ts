import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_tenant_dispute',
  description:
    'Analyze a tenant\'s dispute situation to classify the type of dispute, determine applicable rights, and recommend actions. Takes the tenant\'s description of what\'s happening, their state, and lease details. Returns dispute classification, legal position assessment, and recommended next steps. Use this as the FIRST step.',
  parameters: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State where the rental property is located',
      },
      dispute_description: {
        type: 'string',
        description: 'Describe what\'s happening in detail: what the landlord did/didn\'t do, how long it\'s been going on, any communications you\'ve had, what you\'ve tried so far',
      },
      dispute_type: {
        type: 'string',
        description: 'If known: "habitability", "security_deposit", "eviction", "rent_increase", "harassment", "discrimination", "lease_violation", "illegal_entry", "retaliation", "other"',
      },
      rent_amount: {
        type: 'string',
        description: 'Monthly rent amount',
      },
      lease_type: {
        type: 'string',
        description: '"month_to_month", "fixed_term", "no_written_lease", or lease end date',
      },
      has_written_lease: {
        type: 'string',
        description: '"yes" or "no"',
      },
      has_documented_issue: {
        type: 'string',
        description: '"yes" if you have photos, emails, or written complaints to the landlord; "no" if not',
      },
      landlord_response: {
        type: 'string',
        description: 'How has the landlord responded? "no_response", "refused", "promised_but_didnt", "hostile", "threatened_eviction"',
      },
    },
    required: ['state', 'dispute_description'],
  },
}

// Dispute type classification based on keywords
function classifyDispute(description: string, explicitType: string): string[] {
  if (explicitType && explicitType !== 'other') return [explicitType]

  const types: string[] = []
  const d = description.toLowerCase()

  // Habitability
  if (d.includes('repair') || d.includes('fix') || d.includes('broken') || d.includes('mold') || d.includes('leak') || d.includes('heat') || d.includes('hot water') || d.includes('pest') || d.includes('rodent') || d.includes('cockroach') || d.includes('plumb') || d.includes('electric') || d.includes('roof') || d.includes('sewage') || d.includes('unsafe') || d.includes('hazard') || d.includes('smoke detector') || d.includes('lock') || d.includes('flood')) {
    types.push('habitability')
  }

  // Security deposit
  if (d.includes('deposit') || d.includes('security') || d.includes('move out') || d.includes('deduction') || d.includes('refund') || d.includes('move-out')) {
    types.push('security_deposit')
  }

  // Eviction
  if (d.includes('evict') || d.includes('notice to quit') || d.includes('notice to vacate') || d.includes('kicked out') || d.includes('leave') || d.includes('30 day') || d.includes('3 day') || d.includes('pay or quit') || d.includes('cure or quit') || d.includes('unlawful detainer')) {
    types.push('eviction')
  }

  // Rent increase
  if (d.includes('rent increase') || d.includes('raised rent') || d.includes('raising rent') || d.includes('rent hike') || d.includes('rent control') || d.includes('rent stabiliz')) {
    types.push('rent_increase')
  }

  // Harassment / Illegal entry
  if (d.includes('harass') || d.includes('threaten') || d.includes('intimidat') || d.includes('enter') || d.includes('privacy') || d.includes('without permission') || d.includes('showed up') || d.includes('let themselves in') || d.includes('key') || d.includes('notice') || d.includes('barge')) {
    types.push('harassment')
  }

  // Retaliation
  if (d.includes('retaliat') || d.includes('revenge') || d.includes('complained') || d.includes('reported') || d.includes('code enforcement') || d.includes('health department') || d.includes('after I')) {
    types.push('retaliation')
  }

  // Discrimination
  if (d.includes('discriminat') || d.includes('race') || d.includes('religion') || d.includes('disabil') || d.includes('family') || d.includes('children') || d.includes('national origin') || d.includes('sexual orient') || d.includes('gender') || d.includes('service animal') || d.includes('emotional support')) {
    types.push('discrimination')
  }

  if (types.length === 0) types.push('general')
  return types
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const state = (args.state as string) || ''
  const description = (args.dispute_description as string) || ''
  const explicitType = (args.dispute_type as string) || ''
  const rent = (args.rent_amount as string) || 'unknown'
  const leaseType = (args.lease_type as string) || 'unknown'
  const hasLease = ((args.has_written_lease as string) || 'unknown').toLowerCase()
  const hasDocumented = ((args.has_documented_issue as string) || 'no').toLowerCase()
  const landlordResponse = ((args.landlord_response as string) || '').toLowerCase()

  if (!state || !description) {
    return 'Error: state and dispute_description are required'
  }

  const disputeTypes = classifyDispute(description, explicitType)

  const results: string[] = []
  results.push('## Tenant Dispute Analysis')
  results.push('')
  results.push(`**State**: ${state}`)
  results.push(`**Dispute type(s)**: ${disputeTypes.join(', ')}`)
  results.push(`**Monthly rent**: ${rent}`)
  results.push(`**Lease type**: ${leaseType}`)
  results.push(`**Written lease**: ${hasLease}`)
  results.push(`**Documentation**: ${hasDocumented === 'yes' ? 'Has evidence' : 'Needs documentation'}`)
  results.push('')

  // Dispute-specific analysis
  for (const type of disputeTypes) {
    results.push(`### ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Analysis`)
    results.push('')

    if (type === 'habitability') {
      results.push('**Your rights (general — state-specific rules vary):**')
      results.push('- Landlords have a **warranty of habitability** — they must maintain the property in livable condition')
      results.push('- This includes: working plumbing, heating, hot water, electricity, pest control, structural safety, weatherproofing, smoke detectors, working locks')
      results.push('- The warranty exists **even if your lease says otherwise** — tenants cannot waive habitability rights')
      results.push('')
      results.push('**Your remedies (vary by state — use `search_tenant_rights` for specifics):**')
      results.push('1. **Repair and deduct**: Fix the issue yourself and deduct the cost from rent (allowed in most states with proper notice)')
      results.push('2. **Rent withholding**: Stop paying rent until repairs are made (requires proper procedure — escrow account in some states)')
      results.push('3. **Rent reduction**: Negotiate reduced rent while the issue persists')
      results.push('4. **Code enforcement**: Report to local building/health department for inspection')
      results.push('5. **Constructive eviction**: If the property is uninhabitable, you may be able to break your lease without penalty')
      results.push('6. **Sue for damages**: Small claims court for repair costs, rent reductions, moving costs, or property damage')
      results.push('')
      results.push('**Key requirement**: You MUST give the landlord **written notice** and **reasonable time to repair** before using self-help remedies. "Reasonable" is typically 14-30 days for non-emergencies, 24-72 hours for emergencies.')
    }

    if (type === 'security_deposit') {
      results.push('**Your rights (general — state-specific rules vary):**')
      results.push('- Landlords must return your deposit within a **specific deadline** after move-out (varies: 14-60 days by state)')
      results.push('- Landlords can only deduct for **actual damages beyond normal wear and tear**')
      results.push('- Landlords MUST provide an **itemized list** of deductions (required in most states)')
      results.push('- Failing to return the deposit on time or provide itemization may entitle you to **double or triple damages** (penalty varies by state)')
      results.push('')
      results.push('**Common illegal deductions:**')
      results.push('- Normal wear and tear (paint fading, carpet wear from normal use, minor nail holes)')
      results.push('- Cleaning fees if you left the unit in reasonable condition')
      results.push('- Pre-existing damage (take photos at move-in AND move-out!)')
      results.push('- Entire deposit forfeiture without itemization')
      results.push('')
      results.push('**Your remedies:**')
      results.push('1. Send a **formal demand letter** (use `write_tenant_action_plan` to generate one)')
      results.push('2. File in **small claims court** if landlord doesn\'t respond (usually $30-75 filing fee)')
      results.push('3. You may be entitled to **penalty damages** (2x or 3x deposit in many states) for bad-faith withholding')
    }

    if (type === 'eviction') {
      results.push('**Your rights (general — state-specific rules vary):**')
      results.push('- Landlords CANNOT evict you without proper **written notice** and **court order**')
      results.push('- **Self-help eviction is illegal** in ALL states — landlord cannot change locks, remove belongings, shut off utilities, or physically remove you')
      results.push('- You have the right to **contest the eviction** in court')
      results.push('- You may have **defenses**: landlord retaliation, habitability violations, improper notice, discrimination')
      results.push('')
      results.push('**Common eviction notice types:**')
      results.push('- **Pay or Quit** (3-14 days): Pay overdue rent or move out')
      results.push('- **Cure or Quit** (varies): Fix a lease violation or move out')
      results.push('- **Unconditional Quit** (varies): You must leave — no chance to fix (for severe violations)')
      results.push('- **No-Cause** (30-60 days): Month-to-month tenants; not allowed in some rent-controlled areas')
      results.push('')
      results.push('**Important:**')
      results.push('- **DO NOT ignore an eviction notice** — respond within the deadline or you lose by default')
      results.push('- **DO NOT move out** until you\'ve consulted your options — you may have valid defenses')
      results.push('- An eviction on your record makes future renting very difficult — fight if you have grounds')
    }

    if (type === 'rent_increase') {
      results.push('**Your rights (general — state-specific rules vary):**')
      results.push('- **Month-to-month**: Landlord CAN raise rent with proper written notice (usually 30-60 days)')
      results.push('- **Fixed-term lease**: Landlord CANNOT raise rent during the lease term unless the lease allows it')
      results.push('- **Rent control cities**: Increases may be capped (typically 3-10% per year) — check your city\'s rules')
      results.push('')
      results.push('**Rent control jurisdictions (partial list):**')
      results.push('- California (statewide cap: 5% + CPI or 10% max), New York City, San Francisco, Los Angeles, Oakland')
      results.push('- Oregon (statewide: 7% + CPI), Washington DC, Jersey City, parts of New Jersey')
      results.push('')
      results.push('**Your remedies:**')
      results.push('1. Check if rent control applies (use `search_tenant_rights` for your area)')
      results.push('2. Verify proper notice was given')
      results.push('3. Negotiate with landlord (especially if long-term tenant)')
      results.push('4. File a complaint if the increase violates rent control ordinance')
    }

    if (type === 'harassment') {
      results.push('**Your rights (general — state-specific rules vary):**')
      results.push('- Landlords must give **written notice** before entering (24-48 hours in most states)')
      results.push('- Landlords can only enter for: repairs, inspections, emergencies, showings (with notice)')
      results.push('- **Landlord harassment is illegal** — this includes: threats, intimidation, shutting off utilities, removing doors/windows, excessive entry, verbal abuse')
      results.push('')
      results.push('**Your remedies:**')
      results.push('1. Send a **written cease-and-desist** demanding the behavior stop')
      results.push('2. **Document everything** — dates, times, photos, witnesses')
      results.push('3. **Call police** for illegal entry, threats, or utility shutoff')
      results.push('4. **File a complaint** with code enforcement or tenant protection agency')
      results.push('5. **Sue for damages** in small claims court')
      results.push('6. **Break the lease** if harassment makes the unit unlivable (constructive eviction)')
    }

    if (type === 'retaliation') {
      results.push('**Your rights:**')
      results.push('- **Landlord retaliation is illegal in most states** — landlords cannot punish you for:')
      results.push('  - Complaining about habitability issues')
      results.push('  - Reporting to code enforcement or health department')
      results.push('  - Joining a tenant union')
      results.push('  - Exercising any legal right')
      results.push('- Retaliation includes: rent increase, eviction, service reduction, harassment')
      results.push('- Many states presume retaliation if adverse action occurs within **6-12 months** of a complaint')
      results.push('')
      results.push('**Your remedies:**')
      results.push('1. **Document the timeline** — when you complained and when the retaliation started')
      results.push('2. **Write a letter** citing the anti-retaliation law in your state')
      results.push('3. **File a complaint** with your local tenant protection agency')
      results.push('4. **Raise it as a defense** if landlord files eviction — retaliatory eviction is illegal')
    }

    if (type === 'discrimination') {
      results.push('**Your rights under the Fair Housing Act:**')
      results.push('- Protected classes: race, color, national origin, religion, sex, familial status, disability')
      results.push('- Many states add: sexual orientation, gender identity, source of income, age, marital status')
      results.push('')
      results.push('**File a complaint:**')
      results.push('1. **HUD**: hud.gov/program_offices/fair_housing_equal_opp/online-complaint (within 1 year)')
      results.push('2. **State fair housing agency**')
      results.push('3. **Local fair housing organization** — often provides free legal help')
    }

    results.push('')
  }

  // Documentation guidance
  if (hasDocumented !== 'yes') {
    results.push('### ⚠️ You Need to Document')
    results.push('')
    results.push('Your case is much stronger with evidence. Start NOW:')
    results.push('- [ ] **Photos/videos** of the issue (with timestamps)')
    results.push('- [ ] **Written communications** — send landlord an email or text describing the issue (creates a paper trail)')
    results.push('- [ ] **Call log** — date, time, what was discussed')
    results.push('- [ ] **Witness statements** from neighbors if applicable')
    results.push('- [ ] **Code enforcement reports** if you\'ve reported')
    results.push('- [ ] **Medical records** if health is affected (mold, lead, pests)')
    results.push('')
  }

  // Landlord response assessment
  if (landlordResponse) {
    results.push('### Landlord Response Assessment')
    results.push('')
    if (landlordResponse.includes('no_response') || landlordResponse.includes('ignore')) {
      results.push('**No response** — This strengthens your case. Send a formal written demand with a deadline. If still no response, escalate to code enforcement or small claims court.')
    }
    if (landlordResponse.includes('refuse')) {
      results.push('**Refusal** — Document the refusal in writing. You may now pursue self-help remedies (repair and deduct, rent withholding) in most states, or file a complaint with code enforcement.')
    }
    if (landlordResponse.includes('promise') || landlordResponse.includes('didn')) {
      results.push('**Promised but didn\'t follow through** — Send a written follow-up setting a firm deadline. This pattern strengthens your case if you need to go to court.')
    }
    if (landlordResponse.includes('hostile') || landlordResponse.includes('threaten')) {
      results.push('**Hostile/threatening response** — This may constitute landlord harassment, which is illegal. Document everything. If you feel unsafe, contact police. This behavior strengthens any legal claim you make.')
    }
    results.push('')
  }

  results.push('### Recommended Actions')
  results.push('')
  results.push('1. **Document everything** — photos, emails, call logs, witnesses')
  results.push('2. **Send written notice** to landlord describing the issue and requesting resolution (use `write_tenant_action_plan`)')
  results.push('3. **Research your state\'s specific rules** using `search_tenant_rights`')
  results.push('4. **Set a deadline** — give landlord a reasonable time to respond (14-30 days for non-emergencies)')
  results.push('5. **Escalate if needed** — code enforcement, small claims court, or tenant legal aid')
  results.push('')
  results.push('---')
  results.push('**Disclaimer**: This analysis is for informational purposes only and is NOT legal advice. Tenant-landlord law varies significantly by state and city. For eviction defense or disputes involving large amounts, consult a tenant rights attorney or your local legal aid organization.')

  return results.join('\n')
}
