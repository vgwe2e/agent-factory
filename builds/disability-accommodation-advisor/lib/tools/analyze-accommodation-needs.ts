import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_accommodation_needs',
  description:
    'Analyze a person\'s disability accommodation situation to determine their rights under ADA, Section 504, and state laws. Identifies the applicable legal framework (workplace, education, housing, public accommodation), recommends specific accommodations, and outlines the interactive process. Use this as the FIRST step.',
  parameters: {
    type: 'object',
    properties: {
      context: {
        type: 'string',
        description: 'Where the accommodation is needed: "workplace", "college", "k12_school", "housing", "public_place", or "government_service"',
      },
      disability_type: {
        type: 'string',
        description: 'General category (no private medical details needed): e.g. "mobility", "vision", "hearing", "mental_health", "chronic_pain", "learning_disability", "adhd", "autism", "ptsd", "invisible_disability", "other"',
      },
      current_barriers: {
        type: 'string',
        description: 'What specific barriers or challenges are you facing? e.g. "can\'t sit for long periods", "need flexible schedule for medical appointments", "noise sensitivity in open office", "need extended time on tests"',
      },
      employer_or_institution: {
        type: 'string',
        description: 'Name of employer, school, landlord, or entity (optional)',
      },
      state: {
        type: 'string',
        description: 'State of residence (some states have stronger protections)',
      },
      request_status: {
        type: 'string',
        description: '"not_yet_requested", "requested_and_denied", "requested_and_waiting", "retaliation"',
      },
      employer_size: {
        type: 'string',
        description: 'For workplace: approximate number of employees ("under_15", "15_to_50", "50_plus", "government")',
      },
    },
    required: ['context', 'disability_type', 'current_barriers'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const context = ((args.context as string) || '').toLowerCase()
  const disabilityType = ((args.disability_type as string) || '').toLowerCase()
  const barriers = (args.current_barriers as string) || ''
  const entity = (args.employer_or_institution as string) || ''
  const state = (args.state as string) || ''
  const requestStatus = ((args.request_status as string) || 'not_yet_requested').toLowerCase()
  const employerSize = ((args.employer_size as string) || '').toLowerCase()

  if (!context || !disabilityType || !barriers) {
    return 'Error: context, disability_type, and current_barriers are required'
  }

  const results: string[] = []
  results.push('## Accommodation Needs Analysis')
  results.push('')
  results.push(`**Context**: ${context}`)
  results.push(`**Disability type**: ${disabilityType}`)
  results.push(`**Current barriers**: ${barriers}`)
  if (entity) results.push(`**Entity**: ${entity}`)
  if (state) results.push(`**State**: ${state}`)
  results.push(`**Request status**: ${requestStatus.replace(/_/g, ' ')}`)
  results.push('')

  // Applicable Laws
  results.push('### Applicable Laws')
  results.push('')

  if (context === 'workplace') {
    results.push('**Federal Laws:**')
    if (employerSize === 'under_15') {
      results.push('- ⚠️ **ADA Title I** applies to employers with **15+ employees**. Your employer may be below this threshold.')
      results.push('- However, your **state disability discrimination law** may cover smaller employers — use `search_accommodation_laws` to check.')
    } else {
      results.push('- **ADA Title I** (Americans with Disabilities Act) — Employers with 15+ employees must provide reasonable accommodations unless it causes undue hardship.')
    }
    results.push('- **Rehabilitation Act §501/§503** — Federal government and federal contractors must provide accommodations.')
    results.push('- **FMLA** (Family and Medical Leave Act) — Up to 12 weeks unpaid leave for serious health conditions (50+ employees).')
    results.push('- **PWFA** (Pregnant Workers Fairness Act, 2023) — Accommodations for pregnancy-related conditions.')
    results.push('')
    results.push('**Key Workplace Rights:**')
    results.push('- Employer MUST engage in an **interactive process** — a good-faith dialogue to find effective accommodations')
    results.push('- Employer can ask for **medical documentation** but CANNOT ask for your complete medical records')
    results.push('- Employer CANNOT deny an accommodation just because it costs money — must show **undue hardship**')
    results.push('- Employer CANNOT retaliate against you for requesting an accommodation')
    results.push('- You do NOT need to use the words "ADA" or "reasonable accommodation" — just explain what you need and why')
  } else if (context === 'college') {
    results.push('**Federal Laws:**')
    results.push('- **ADA Title II** (public colleges) / **Title III** (private colleges) — Must provide reasonable accommodations')
    results.push('- **Section 504 of the Rehabilitation Act** — Any institution receiving federal funding must accommodate students with disabilities')
    results.push('')
    results.push('**Key College Rights:**')
    results.push('- You MUST self-identify and register with the **Disability Services Office** (DSO/ODS)')
    results.push('- You MUST provide documentation of your disability (but the school cannot require excessive documentation)')
    results.push('- Common academic accommodations: extended test time, note-taking services, reduced course load, alternative testing location, accessible materials')
    results.push('- Colleges do NOT need to fundamentally alter academic requirements — but must provide equal access')
    results.push('- Accommodations are NOT retroactive — request them BEFORE you need them')
  } else if (context === 'k12_school') {
    results.push('**Federal Laws:**')
    results.push('- **IDEA** (Individuals with Disabilities Education Act) — Free Appropriate Public Education (FAPE) for K-12 students')
    results.push('- **Section 504** — Accommodations for students with disabilities in federally funded schools')
    results.push('- **ADA Title II** — Public schools must be accessible')
    results.push('')
    results.push('**Key K-12 Rights:**')
    results.push('- Schools must evaluate students suspected of having a disability at **no cost** to parents')
    results.push('- **IEP** (Individualized Education Program) — For students qualifying under IDEA (specialized instruction)')
    results.push('- **504 Plan** — For students who need accommodations but not specialized instruction')
    results.push('- Parents have the right to participate in all IEP/504 meetings')
    results.push('- Parents can request an **Independent Educational Evaluation** (IEE) if they disagree with the school\'s evaluation')
  } else if (context === 'housing') {
    results.push('**Federal Laws:**')
    results.push('- **Fair Housing Act** — Landlords must provide reasonable accommodations and modifications')
    results.push('- **ADA Title III** — Public and common areas must be accessible')
    results.push('- **Section 504** — Federally funded housing (HUD, Section 8) must accommodate')
    results.push('')
    results.push('**Key Housing Rights:**')
    results.push('- Landlord MUST allow **reasonable modifications** (you may need to pay for them in private housing)')
    results.push('- Landlord MUST make **reasonable accommodations** to rules/policies (e.g., allowing service animal despite no-pet policy)')
    results.push('- Landlord CANNOT charge extra deposit for service/assistance animals')
    results.push('- Applies to almost ALL housing (exemptions only for owner-occupied buildings with 4 or fewer units)')
  } else {
    results.push('- **ADA Title III** — Public accommodations (businesses, restaurants, stores, healthcare) must be accessible')
    results.push('- **ADA Title II** — State and local government services must be accessible')
    results.push('- **Section 504** — Federally funded programs must accommodate')
  }
  results.push('')

  // Suggested Accommodations
  results.push('### Suggested Accommodations')
  results.push('')
  results.push('Based on your described barriers, consider requesting:')
  results.push('')

  const accommodations: string[] = []
  const barriersLower = barriers.toLowerCase()

  // Mobility
  if (disabilityType.includes('mobil') || barriersLower.includes('walk') || barriersLower.includes('stand') || barriersLower.includes('sit') || barriersLower.includes('stairs')) {
    accommodations.push('- Ergonomic workstation / adjustable desk (sit-stand)')
    accommodations.push('- Accessible parking space closer to entrance')
    accommodations.push('- Relocated workspace to ground floor / near elevator')
    accommodations.push('- Permission to take breaks to stand/stretch/walk')
    accommodations.push('- Remote work option to reduce commuting')
  }

  // Mental health / PTSD
  if (disabilityType.includes('mental') || disabilityType.includes('ptsd') || disabilityType.includes('anxiety') || disabilityType.includes('depress') || barriersLower.includes('stress') || barriersLower.includes('overwhelm')) {
    accommodations.push('- Flexible scheduling for therapy/medical appointments')
    accommodations.push('- Modified break schedule')
    accommodations.push('- Private/quiet workspace')
    accommodations.push('- Written (rather than verbal) instructions')
    accommodations.push('- Modified supervision methods')
    accommodations.push('- Temporary job restructuring during crisis')
    accommodations.push('- Remote work / hybrid schedule')
    accommodations.push('- Leave for mental health treatment (FMLA if eligible)')
  }

  // ADHD / Learning disability
  if (disabilityType.includes('adhd') || disabilityType.includes('learning') || disabilityType.includes('dyslexia')) {
    accommodations.push('- Extended time on tests/exams (typically 1.5x-2x)')
    accommodations.push('- Reduced-distraction testing environment')
    accommodations.push('- Written instructions and task lists')
    accommodations.push('- Noise-canceling headphones')
    accommodations.push('- Flexible deadlines where possible')
    accommodations.push('- Assistive technology (text-to-speech, speech-to-text)')
    accommodations.push('- Note-taking services or recording lectures')
    accommodations.push('- Breaking large projects into smaller milestones')
  }

  // Autism
  if (disabilityType.includes('autis') || disabilityType.includes('asd')) {
    accommodations.push('- Quiet workspace / sensory-friendly environment')
    accommodations.push('- Written communication preference over verbal')
    accommodations.push('- Advance notice of schedule changes')
    accommodations.push('- Clear, literal instructions')
    accommodations.push('- Noise-canceling headphones')
    accommodations.push('- Flexible lighting (reduced fluorescent)')
    accommodations.push('- Modified social requirements (alternative to team-building events)')
    accommodations.push('- Remote work option')
  }

  // Chronic pain
  if (disabilityType.includes('chronic') || disabilityType.includes('pain') || disabilityType.includes('fibro') || barriersLower.includes('pain') || barriersLower.includes('fatigue')) {
    accommodations.push('- Ergonomic equipment (chair, keyboard, mouse)')
    accommodations.push('- Flexible work schedule / part-time option')
    accommodations.push('- Remote work to reduce physical demands')
    accommodations.push('- Frequent rest breaks')
    accommodations.push('- Modified job duties (reduce physical tasks)')
    accommodations.push('- Temperature control in workspace')
  }

  // Vision
  if (disabilityType.includes('vision') || disabilityType.includes('blind') || disabilityType.includes('low vision')) {
    accommodations.push('- Screen reader / magnification software')
    accommodations.push('- Large-print materials')
    accommodations.push('- Braille materials')
    accommodations.push('- Adjusted lighting / anti-glare screen')
    accommodations.push('- Audio descriptions for visual content')
    accommodations.push('- Guide dog / service animal accommodation')
  }

  // Hearing
  if (disabilityType.includes('hearing') || disabilityType.includes('deaf')) {
    accommodations.push('- Sign language interpreter')
    accommodations.push('- Real-time captioning (CART services)')
    accommodations.push('- Written communication for meetings')
    accommodations.push('- Visual alerts instead of auditory')
    accommodations.push('- Assistive listening devices')
    accommodations.push('- Video relay service (VRS) for phone calls')
  }

  // Noise sensitivity
  if (barriersLower.includes('noise') || barriersLower.includes('sensory') || barriersLower.includes('open office') || barriersLower.includes('distract')) {
    accommodations.push('- Private office or enclosed workspace')
    accommodations.push('- Noise-canceling headphones (employer-provided)')
    accommodations.push('- White noise machine')
    accommodations.push('- Remote work option')
    accommodations.push('- Relocation to quieter area')
  }

  // Flexible schedule
  if (barriersLower.includes('medical appointment') || barriersLower.includes('treatment') || barriersLower.includes('schedule') || barriersLower.includes('flexible')) {
    accommodations.push('- Flexible start/end times')
    accommodations.push('- Modified schedule for medical appointments')
    accommodations.push('- Intermittent FMLA leave')
    accommodations.push('- Compressed work week')
    accommodations.push('- Make-up time for medical absences')
  }

  if (accommodations.length > 0) {
    accommodations.forEach(a => results.push(a))
  } else {
    results.push('- Review the JAN (Job Accommodation Network) database for specific accommodation ideas: askjan.org')
    results.push('- Describe your specific functional limitations for more targeted suggestions')
  }
  results.push('')

  // Interactive Process
  results.push('### The Interactive Process')
  results.push('')

  if (requestStatus === 'not_yet_requested') {
    results.push('**You haven\'t requested yet — here\'s how to start:**')
    results.push('')
    results.push('1. **Write a formal accommodation request letter** (use `write_accommodation_request` to generate one)')
    results.push('2. **Submit it in writing** — email or letter to HR/Disability Services/landlord')
    results.push('3. **Keep a copy** of everything you submit')
    results.push('4. **You do NOT need to use legal terms** — just explain what you need and why')
    results.push('5. **You DO need to mention your disability** — but you don\'t need to share your diagnosis. Say "I have a medical condition that affects [function]"')
    results.push('6. **Be prepared for a dialogue** — the employer/school may suggest alternatives')
    results.push('7. **Get documentation ready** — a letter from your doctor describing your limitations and recommended accommodations')
  } else if (requestStatus.includes('denied')) {
    results.push('**Your request was denied — here are your options:**')
    results.push('')
    results.push('1. **Ask for the denial in writing** with specific reasons')
    results.push('2. **Propose alternatives** — the law requires an interactive process, not a one-time decision')
    results.push('3. **File an internal appeal** / request a meeting with HR leadership')
    results.push('4. **File a complaint with the EEOC** (workplace) or OCR (education) — see below')
    results.push('5. **Consult a disability rights attorney** — many offer free consultations')
    results.push('6. **Contact your state disability rights organization** — they often provide free legal assistance')
  } else if (requestStatus.includes('retaliation')) {
    results.push('**⚠️ Retaliation for requesting accommodation is ILLEGAL under the ADA.**')
    results.push('')
    results.push('1. **Document everything** — emails, texts, witness names, dates, specific actions')
    results.push('2. **File an EEOC charge** — you have 180 days (300 in some states) from the retaliatory act')
    results.push('3. **Consult a disability rights attorney ASAP** — retaliation claims are strong and attorneys take them on contingency')
    results.push('4. **Do not resign** if possible — it\'s harder to prove retaliation if you leave voluntarily')
    results.push('5. **Keep doing your job well** — document your performance to counter any pretextual claims')
  }
  results.push('')

  // Filing Complaints
  results.push('### Where to File Complaints')
  results.push('')
  if (context === 'workplace') {
    results.push('1. **EEOC** (Equal Employment Opportunity Commission)')
    results.push('   - File within 180 days (300 in states with local agencies)')
    results.push('   - Online: eeoc.gov/filing-charge-discrimination')
    results.push('   - Free — no attorney needed to file')
    results.push('2. **State civil rights agency** — many states have agencies with broader protections')
    results.push('3. **Federal lawsuit** — after receiving EEOC "right to sue" letter')
  } else if (context === 'college' || context === 'k12_school') {
    results.push('1. **OCR** (Office for Civil Rights, Dept. of Education)')
    results.push('   - File within 180 days of discrimination')
    results.push('   - Online: www2.ed.gov/about/offices/list/ocr/complaintintro.html')
    results.push('   - Free — OCR investigates on your behalf')
    results.push('2. **State education agency** — for IDEA/IEP violations')
    results.push('3. **Due process hearing** — for IEP/504 disputes (K-12)')
  } else if (context === 'housing') {
    results.push('1. **HUD** (Department of Housing and Urban Development)')
    results.push('   - File within 1 year of discrimination')
    results.push('   - Online: hud.gov/program_offices/fair_housing_equal_opp/online-complaint')
    results.push('   - Free — HUD investigates')
    results.push('2. **State fair housing agency**')
    results.push('3. **Federal lawsuit** — within 2 years')
  }
  results.push('')

  results.push('---')
  results.push('**Disclaimer**: This analysis is for informational purposes only and is NOT legal advice. Disability rights law is complex. For denied accommodations or retaliation, consult a disability rights attorney — many offer free consultations.')

  return results.join('\n')
}
