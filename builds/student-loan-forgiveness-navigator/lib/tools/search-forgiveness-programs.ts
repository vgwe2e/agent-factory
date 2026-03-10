import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_forgiveness_programs',
  description:
    'Search for current information on specific student loan forgiveness programs, eligibility rules, deadlines, and recent policy changes. Use AFTER analyze_loan_situation to get detailed, up-to-date information on programs the borrower may qualify for.',
  parameters: {
    type: 'object',
    properties: {
      program: {
        type: 'string',
        description: 'Program to research: "pslf", "save", "paye", "ibr", "idr_forgiveness", "teacher", "borrower_defense", "closed_school", "tpd", "fresh_start", "idr_account_adjustment"',
      },
      specific_question: {
        type: 'string',
        description: 'Specific question to research (e.g. "SAVE plan litigation status 2026", "PSLF qualifying employer requirements")',
      },
      state: {
        type: 'string',
        description: 'State for state-specific loan forgiveness programs',
      },
    },
    required: ['program'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const program = ((args.program as string) || '').toLowerCase()
  const question = (args.specific_question as string) || ''
  const state = (args.state as string) || ''

  if (!program) {
    return 'Error: program is required'
  }

  const programNames: Record<string, string> = {
    pslf: 'Public Service Loan Forgiveness',
    save: 'SAVE Plan',
    paye: 'Pay As You Earn',
    ibr: 'Income-Based Repayment',
    idr_forgiveness: 'IDR Forgiveness',
    teacher: 'Teacher Loan Forgiveness',
    borrower_defense: 'Borrower Defense to Repayment',
    closed_school: 'Closed School Discharge',
    tpd: 'Total and Permanent Disability Discharge',
    fresh_start: 'Fresh Start Program',
    idr_account_adjustment: 'IDR Account Adjustment',
  }

  const programName = programNames[program] || program

  const queries: string[] = [
    `${programName} student loan forgiveness 2025 2026 eligibility requirements`,
    `${programName} student loan ${question || 'latest news changes'}`,
    `${programName} how to apply step by step`,
    state ? `${state} state student loan forgiveness programs 2025 2026` : `${programName} student loan forgiveness deadline updates`,
  ]

  const allResults: string[] = []
  allResults.push(`## ${programName} — Research`)
  if (question) allResults.push(`**Question**: ${question}`)
  allResults.push('')

  for (const query of queries) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgenticHarness/1.0)' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue

      const html = await res.text()
      const results: { title: string; url: string; snippet: string }[] = []
      const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
      let match

      while ((match = resultRegex.exec(html)) !== null && results.length < 4) {
        const rawUrl = match[1]
        const title = match[2].replace(/<[^>]*>/g, '').trim()
        const snippet = match[3].replace(/<[^>]*>/g, '').trim()
        const urlMatch = rawUrl.match(/uddg=([^&]+)/)
        const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl

        if (title && actualUrl) {
          results.push({ title, url: actualUrl, snippet })
        }
      }

      if (results.length > 0) {
        let sourceLabel = 'Web'
        if (query.includes('eligibility requirements')) sourceLabel = 'Eligibility & Requirements'
        else if (query.includes('latest news') || query.includes(question)) sourceLabel = 'Latest Updates'
        else if (query.includes('how to apply')) sourceLabel = 'Application Guide'
        else if (query.includes('state student loan')) sourceLabel = `State Programs (${state})`
        else sourceLabel = 'Additional Info'

        allResults.push(`### ${sourceLabel}`)
        results.forEach((r, i) => {
          allResults.push(`${i + 1}. **${r.title}**`)
          allResults.push(`   ${r.url}`)
          allResults.push(`   ${r.snippet}`)
        })
        allResults.push('')
      }
    } catch {
      // Skip failed searches
    }
  }

  allResults.push('### Key Resources')
  allResults.push('- **StudentAid.gov**: https://studentaid.gov/ — Official federal student aid site')
  allResults.push('- **PSLF Help Tool**: https://studentaid.gov/manage-loans/forgiveness-cancellation/public-service/pslf-help-tool')
  allResults.push('- **Loan Simulator**: https://studentaid.gov/loan-simulator/')
  allResults.push('- **CFPB Student Loans**: https://www.consumerfinance.gov/consumer-tools/student-loans/')
  allResults.push('- **NSLDS (loan history)**: https://nslds.ed.gov/')
  allResults.push('')
  allResults.push('**Next**: Use `web_fetch` on relevant results for detailed information, then `write_forgiveness_guide` to generate your personalized guide.')

  return allResults.join('\n')
}
