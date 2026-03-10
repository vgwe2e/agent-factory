import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_evaluation_report',
  description:
    'Generate and save a bootcamp evaluation report. Includes an overall score (1-10), pros/cons, and an enroll/skip recommendation. Always end here.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the report (e.g. "app-academy-evaluation.md")',
      },
      bootcamp_name: {
        type: 'string',
        description: 'The bootcamp or course name',
      },
      program: {
        type: 'string',
        description: 'Specific program or track evaluated',
      },
      format: {
        type: 'string',
        description: 'Delivery format (online, in-person, hybrid, self-paced)',
      },
      price: {
        type: 'string',
        description: 'Tuition cost',
      },
      overall_score: {
        type: 'string',
        description: 'Overall score from 1 (avoid) to 10 (excellent)',
      },
      recommendation: {
        type: 'string',
        description: 'Recommendation: ENROLL / CONSIDER WITH CAUTION / SKIP',
      },
      red_flags: {
        type: 'string',
        description: 'Newline-separated list of red flags and concerns',
      },
      green_flags: {
        type: 'string',
        description: 'Newline-separated list of positive signals',
      },
      outcomes_summary: {
        type: 'string',
        description: 'Summary of job placement and outcomes data',
      },
      curriculum_summary: {
        type: 'string',
        description: 'Summary of curriculum quality and relevance',
      },
      value_assessment: {
        type: 'string',
        description: 'Assessment of value for money (price vs outcomes)',
      },
      details: {
        type: 'string',
        description: 'Detailed analysis explaining the evaluation',
      },
      alternatives: {
        type: 'string',
        description: 'Suggested alternative programs to consider',
      },
    },
    required: ['filename', 'bootcamp_name', 'overall_score', 'recommendation', 'red_flags', 'green_flags', 'details'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const bootcampName = args.bootcamp_name as string
  const program = (args.program as string) || 'Not specified'
  const format = (args.format as string) || 'Not specified'
  const price = (args.price as string) || 'Not specified'
  const overallScore = args.overall_score as string
  const recommendation = args.recommendation as string
  const redFlags = args.red_flags as string
  const greenFlags = args.green_flags as string
  const outcomesSummary = (args.outcomes_summary as string) || 'See details below.'
  const curriculumSummary = (args.curriculum_summary as string) || 'See details below.'
  const valueAssessment = (args.value_assessment as string) || 'See details below.'
  const details = args.details as string
  const alternatives = (args.alternatives as string) || 'No alternatives identified.'

  if (!filename || !bootcampName || !overallScore || !recommendation || !details) {
    return 'Error: filename, bootcamp_name, overall_score, recommendation, and details are required'
  }

  const score = parseInt(overallScore, 10)
  const emoji = score >= 7 ? '\ud83d\udfe2' : score >= 4 ? '\ud83d\udfe1' : '\ud83d\udd34'
  const label = score >= 7 ? 'RECOMMENDED' : score >= 4 ? 'MIXED SIGNALS' : 'NOT RECOMMENDED'

  const report = `# Bootcamp Evaluation: ${bootcampName}

## ${emoji} Overall Score: ${overallScore}/10 \u2014 ${label}

| Field | Value |
|-------|-------|
| **Program** | ${bootcampName} |
| **Track** | ${program} |
| **Format** | ${format} |
| **Tuition** | ${price} |
| **Recommendation** | **${recommendation}** |
| **Evaluated** | ${new Date().toISOString().split('T')[0]} |

---

## Red Flags

${redFlags.split('\n').filter(Boolean).map(f => `- \u26a0\ufe0f ${f.trim()}`).join('\n') || '- None identified'}

## Green Flags

${greenFlags.split('\n').filter(Boolean).map(s => `- \u2705 ${s.trim()}`).join('\n') || '- None identified'}

## Job Placement & Outcomes

${outcomesSummary}

## Curriculum & Instruction

${curriculumSummary}

## Value for Money

${valueAssessment}

## Detailed Analysis

${details}

## Alternatives to Consider

${alternatives}

---

## Before You Enroll: Checklist

${score >= 7 ? `This program looks solid. Standard due diligence before committing:
- [ ] Attend a free info session or trial class if offered
- [ ] Talk to at least 2 recent graduates (find them on LinkedIn, not from the bootcamp's referral list)
- [ ] Verify published job placement numbers -- ask for CIRR-audited data
- [ ] Understand the full cost: tuition + living expenses + opportunity cost of not working
- [ ] Read the enrollment agreement carefully, especially refund and deferral policies
- [ ] Check if the bootcamp offers career services (resume help, mock interviews, employer network)
- [ ] Understand financing options: ISA terms, loan interest rates, payment plans
- [ ] Make sure the tech stack taught matches what employers in your target market want` :
score >= 4 ? `This program has mixed signals. Do more research before committing:
- [ ] Talk to at least 3-5 recent graduates -- ask specifically about job search timeline
- [ ] Request specific, verifiable job placement data (not marketing claims)
- [ ] Check if any regulatory complaints exist with your state education department
- [ ] Get the refund policy in writing -- know your exit options
- [ ] Compare the price and curriculum against at least 2-3 alternatives
- [ ] Search for the bootcamp name + "review" + "reddit" for unfiltered opinions
- [ ] Check Glassdoor for reviews from instructors and staff (high turnover = red flag)
- [ ] If they use an ISA, calculate the true total cost at different salary levels
- [ ] Ask about the student-to-instructor ratio and how much 1-on-1 help is available
- [ ] Be wary if they pressure you to enroll quickly or offer expiring discounts` :
`This program has significant concerns. Strongly recommended actions:
- [ ] DO NOT enroll until the red flags above are resolved
- [ ] Research at least 3 alternative programs for comparison
- [ ] Check with your state's department of education for any complaints or violations
- [ ] If they claim specific job placement rates, ask for third-party verification
- [ ] Look into free or low-cost alternatives (freeCodeCamp, The Odin Project, CS50, etc.)
- [ ] If their primary pitch is an ISA with "no upfront cost," calculate the true repayment amount
- [ ] Be extremely cautious of programs that:
  - Hide their pricing until after a sales call
  - Use high-pressure enrollment tactics
  - Show only cherry-picked testimonials
  - Cannot provide verifiable outcomes data
  - Have a pattern of negative reviews about the same issues
- [ ] If you've already had a bad experience, consider filing complaints with:
  - Your state's department of education
  - Better Business Bureau (bbb.org)
  - Federal Trade Commission (reportfraud.ftc.gov)
  - Consumer Financial Protection Bureau (if financing is involved)`}

---

## Red Flags in Bootcamp Marketing

1. **Inflated placement rates** \u2014 "95% job placement" claims without CIRR auditing or clear methodology
2. **Cherry-picked testimonials** \u2014 Only showing the best outcomes, hiding typical graduate experience
3. **Hidden pricing** \u2014 Must talk to a "admissions advisor" (salesperson) to learn the cost
4. **High-pressure sales** \u2014 "Class starts Monday, spots are limited, sign today for a discount"
5. **ISA fine print** \u2014 Income Share Agreements can cost far more than upfront tuition at higher salaries
6. **Outdated curriculum** \u2014 Teaching technologies that employers have moved away from
7. **No career services** \u2014 Bootcamp's job is not done at graduation; post-grad support matters
8. **Instructor churn** \u2014 High staff turnover signals management problems and inconsistent quality

---

*Generated by Bootcamp Evaluator \u2014 an open-source AI agent for coding bootcamp due diligence*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Evaluation report saved to output/${sanitized} (${report.length} characters)\n\nSummary: ${emoji} ${label} (${overallScore}/10) \u2014 ${recommendation}`
  } catch (err) {
    return `Report write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
