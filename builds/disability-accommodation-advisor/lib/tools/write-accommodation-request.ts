import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_accommodation_request',
  description:
    'Generate and save a formal accommodation request letter and action plan. Includes a professional request letter, documentation checklist, escalation guide, and complaint filing instructions. Use this as the final step after analyzing needs and researching laws.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the plan (e.g. "accommodation-request-march2026.md")',
      },
      requester_name: {
        type: 'string',
        description: 'Person requesting the accommodation',
      },
      entity_name: {
        type: 'string',
        description: 'Name of employer, school, or landlord',
      },
      entity_contact: {
        type: 'string',
        description: 'HR contact, disability services office, or landlord contact',
      },
      context: {
        type: 'string',
        description: '"workplace", "college", "k12", "housing"',
      },
      disability_description: {
        type: 'string',
        description: 'Brief, functional description of limitations (NOT diagnosis — e.g. "a medical condition that affects my ability to concentrate in noisy environments")',
      },
      requested_accommodations: {
        type: 'string',
        description: 'Specific accommodations being requested (comma-separated)',
      },
      situation_analysis: {
        type: 'string',
        description: 'Results from analyze_accommodation_needs',
      },
      law_research: {
        type: 'string',
        description: 'Summary of applicable laws from search_accommodation_laws',
      },
      accommodation_examples: {
        type: 'string',
        description: 'Examples from search_accommodation_examples',
      },
      state: {
        type: 'string',
        description: 'State for state-specific resources',
      },
    },
    required: ['filename', 'context', 'requested_accommodations'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const requesterName = (args.requester_name as string) || '[Your Name]'
  const entityName = (args.entity_name as string) || '[Employer/School/Landlord]'
  const entityContact = (args.entity_contact as string) || '[HR Department / Disability Services / Property Manager]'
  const context = ((args.context as string) || 'workplace').toLowerCase()
  const disabilityDesc = (args.disability_description as string) || 'a medical condition that affects my ability to perform certain functions'
  const requestedAccommodations = (args.requested_accommodations as string) || ''
  const situationAnalysis = (args.situation_analysis as string) || ''
  const lawResearch = (args.law_research as string) || ''
  const accommodationExamples = (args.accommodation_examples as string) || ''
  const state = (args.state as string) || ''

  if (!filename || !requestedAccommodations) {
    return 'Error: filename and requested_accommodations are required'
  }

  const today = new Date().toISOString().split('T')[0]
  const accomList = requestedAccommodations.split(',').map(a => a.trim()).filter(Boolean)
  const isWorkplace = context === 'workplace'
  const isEducation = context === 'college' || context === 'k12'
  const isHousing = context === 'housing'

  const lawRef = isWorkplace ? 'Americans with Disabilities Act (ADA), Title I' :
    isEducation ? 'Section 504 of the Rehabilitation Act and the Americans with Disabilities Act' :
    isHousing ? 'Fair Housing Act and the Americans with Disabilities Act' :
    'Americans with Disabilities Act (ADA)'

  const recipientRole = isWorkplace ? 'Human Resources' :
    context === 'college' ? 'Disability Services Office' :
    context === 'k12' ? 'Special Education Department' :
    isHousing ? 'Property Management' : 'Management'

  const report = `# Accommodation Request Plan
## ${requesterName} — ${entityName}

**Prepared**: ${today}
**Context**: ${context}
**Requested accommodations**: ${requestedAccommodations}

---

## Important Disclaimer

**This plan is for informational purposes only. It is NOT legal advice.** Disability rights law is complex. For denied accommodations or retaliation, consult a disability rights attorney. Many offer free consultations. Your state's Protection & Advocacy organization provides free legal help: https://www.ndrn.org/about/ndrn-member-agencies/

---

${situationAnalysis ? `## Your Situation Analysis

${situationAnalysis}

---

` : ''}${lawResearch ? `## Applicable Laws

${lawResearch}

---

` : ''}${accommodationExamples ? `## Accommodation Examples

${accommodationExamples}

---

` : ''}## Accommodation Request Letter

**Send this via email AND keep a printed copy. If sending by mail, use certified mail with return receipt.**

---

${requesterName}
[Your Address]
[Your Email]
[Your Phone]

${today}

${entityContact}
${entityName}
[Address]

**RE: Formal Request for Reasonable Accommodation Under the ${lawRef}**

Dear ${recipientRole}:

I am writing to formally request reasonable accommodation${isWorkplace ? ' in the workplace' : isEducation ? ' in my academic program' : isHousing ? ' in my housing' : ''} under the ${lawRef}.

I have ${disabilityDesc}. ${isWorkplace ? 'This condition affects my ability to perform certain job functions without accommodation.' : isEducation ? 'This condition affects my ability to fully participate in my academic program without accommodation.' : isHousing ? 'This condition affects my ability to fully use and enjoy my housing without accommodation.' : 'This condition creates barriers that can be addressed with reasonable accommodation.'}

**I am requesting the following accommodations:**

${accomList.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${isWorkplace ? `These accommodations will enable me to perform the essential functions of my position effectively. I am committed to continuing to meet all performance expectations and am requesting these accommodations to ensure I can do so.` : isEducation ? `These accommodations will enable me to access my educational program on an equal basis with other students. They do not fundamentally alter the academic requirements of my program.` : isHousing ? `These accommodations are necessary for me to have equal opportunity to use and enjoy my housing.` : `These accommodations are necessary for me to have equal access.`}

I am happy to provide medical documentation from my healthcare provider to support this request. I am also open to discussing alternative accommodations that may address my functional limitations.

${isWorkplace ? `I understand that the ADA requires an interactive process, and I look forward to working with you to identify effective accommodations. I am available to meet at your convenience to discuss this request.` : isEducation ? `I understand the accommodation process and am prepared to provide any required documentation. I would appreciate meeting to discuss implementation.` : `I look forward to your response. Under the ${isHousing ? 'Fair Housing Act' : 'ADA'}, requests for reasonable accommodation should be processed promptly.`}

Please confirm receipt of this request and let me know the next steps.

${isWorkplace ? `Under the ADA, employers must engage in a timely, good-faith interactive process upon receiving an accommodation request. I trust that ${entityName} will fulfill this obligation.` : ''}

Thank you for your attention to this matter.

Sincerely,

${requesterName}
${isWorkplace ? '[Your Job Title / Department]' : isEducation ? '[Your Student ID / Program]' : '[Your Unit/Address]'}

---

## Documentation Checklist

### What to Prepare

- [ ] **Medical documentation letter** from your healthcare provider stating:
  - You have a disability or medical condition (diagnosis optional — functional limitations matter more)
  - How it limits your ability to ${isWorkplace ? 'perform job functions' : isEducation ? 'participate in academic activities' : 'use your housing'}
  - Specific accommodations they recommend
  - Expected duration (permanent or temporary)
- [ ] **Copy of your request letter** (keep one for your records)
- [ ] **Proof of delivery** — email read receipt or certified mail receipt
- [ ] **Any prior communications** about your disability or accommodation needs
- [ ] **Performance reviews** (if workplace) — to counter any claims that your performance is the issue

### What NOT to Share

- [ ] Do NOT provide your complete medical records
- [ ] Do NOT share information about unrelated conditions
- [ ] Do NOT sign any broad medical release forms — provide only the specific documentation needed
- [ ] Do NOT discuss your accommodation request with coworkers unless you choose to

---

## If Your Request Is Denied

### Step 1: Get It in Writing
- Ask for the denial reason **in writing**
- The employer/school must explain why they believe the accommodation causes undue hardship

### Step 2: Propose Alternatives
- Request a meeting to discuss other accommodation options
- The law requires an **interactive process** — not a one-time decision
- Bring alternative suggestions from JAN (askjan.org) or your doctor

### Step 3: File a Complaint

${isWorkplace ? `**EEOC Complaint (Workplace)**
1. File online: eeoc.gov/filing-charge-discrimination
2. Deadline: **180 days** from the denial (300 in states with local agencies)
3. Free — no attorney required
4. The EEOC will investigate and attempt mediation
5. If unresolved, you receive a "right to sue" letter

**State Civil Rights Agency**
- Search: "${state || '[Your State]'} civil rights agency disability complaint"
- Many states have broader protections than federal ADA` : ''}
${isEducation ? `**OCR Complaint (Education)**
1. File online: www2.ed.gov/about/offices/list/ocr/complaintintro.html
2. Deadline: **180 days** from the denial
3. Free — OCR investigates on your behalf
4. Can result in corrective action against the institution` : ''}
${isHousing ? `**HUD Complaint (Housing)**
1. File online: hud.gov/program_offices/fair_housing_equal_opp/online-complaint
2. Deadline: **1 year** from the denial
3. Free — HUD investigates
4. Can result in damages and policy changes` : ''}

### Step 4: Consult an Attorney
- **Disability Rights [${state || 'Your State'}]** — Your state's Protection & Advocacy organization: https://www.ndrn.org/about/ndrn-member-agencies/
- **EEOC referral list** — Ask the EEOC for attorney referrals
- Many disability rights attorneys work on **contingency** (no upfront cost)

---

## Timeline

| Day | Action |
|-----|--------|
| Day 1 | Send accommodation request letter (email + copy) |
| Day 3 | Confirm receipt if no acknowledgment |
| Day 7 | Follow up if no response |
| Day 14 | If no response: send written follow-up citing legal obligation |
| Day 21 | If denied or ignored: propose alternatives, request meeting |
| Day 30 | If still denied: file complaint (EEOC/OCR/HUD) |
| Day 60 | Consult disability rights attorney if unresolved |

---

## Know Your Rights — Quick Reference

### Your Employer/School/Landlord MUST:
- Engage in a timely, good-faith interactive process
- Consider your requested accommodation (they can offer alternatives)
- Keep your medical information confidential and in a separate file
- Provide accommodations that are effective — not necessarily the exact one you requested

### Your Employer/School/Landlord CANNOT:
- Deny accommodation without showing **undue hardship** (significant difficulty or expense)
- Retaliate against you for requesting an accommodation
- Ask about your diagnosis — only your functional limitations
- Require you to accept an accommodation you don't want
- Disclose your disability to coworkers without your permission

### You Should:
- Put your request **in writing** — verbal requests are legal but harder to prove
- Focus on **functional limitations**, not your diagnosis
- Propose **specific solutions** — not just "I need help"
- Keep **copies of everything**
- Follow up in writing if you don't hear back
- Be open to the **interactive process** — flexibility helps

---

## Helpful Resources

- **JAN (Job Accommodation Network)**: https://askjan.org/ — Free, expert accommodation guidance (call: 1-800-526-7234)
- **ADA National Network**: https://adata.org/ — Regional ADA centers
- **EEOC Disability Discrimination**: https://www.eeoc.gov/disability-discrimination
- **ADA.gov**: https://www.ada.gov/
- **NDRN (Protection & Advocacy)**: https://www.ndrn.org/about/ndrn-member-agencies/
- **OCR Complaint (Education)**: https://www2.ed.gov/about/offices/list/ocr/complaintintro.html
- **HUD Fair Housing**: https://www.hud.gov/program_offices/fair_housing_equal_opp
- **Understood.org**: https://www.understood.org/ — Resources for learning and attention differences

---

*Generated by Disability Accommodation Advisor — a free, open-source AI agent that helps people understand their accommodation rights. Not legal advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Accommodation request plan saved to output/${sanitized} (${report.length} characters)\n\nYour accommodation request plan is ready! It includes a formal request letter, documentation checklist, escalation guide, and complaint filing instructions.`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
