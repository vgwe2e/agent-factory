import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_immigration_requirements',
  description:
    'Search for current USCIS form requirements, processing times, fee schedules, policy updates, and eligibility criteria. Use AFTER analyze_immigration_situation to get the latest information about specific forms or immigration categories.',
  parameters: {
    type: 'object',
    properties: {
      form_number: {
        type: 'string',
        description: 'USCIS form number to research (e.g. "I-130", "N-400", "I-485")',
      },
      topic: {
        type: 'string',
        description: 'Specific topic to research (e.g. "processing times", "required documents", "fee waiver", "premium processing")',
      },
      immigration_category: {
        type: 'string',
        description: 'Immigration category to research (e.g. "EB-2 NIW", "family-based", "DACA renewal", "asylum")',
      },
    },
    required: ['topic'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const formNumber = (args.form_number as string) || ''
  const topic = (args.topic as string) || ''
  const category = (args.immigration_category as string) || ''

  if (!topic) {
    return 'Error: topic is required'
  }

  const queries: string[] = []

  if (formNumber) {
    queries.push(`USCIS form ${formNumber} ${topic} 2025 2026 requirements`)
    queries.push(`USCIS ${formNumber} ${topic} instructions filing guide`)
  }
  if (category) {
    queries.push(`USCIS ${category} ${topic} 2025 2026 eligibility requirements`)
  }
  queries.push(`US immigration ${topic} ${formNumber || category || ''} current rules 2025 2026`)

  const allResults: string[] = []
  allResults.push(`## Immigration Requirements Search`)
  if (formNumber) allResults.push(`**Form**: ${formNumber}`)
  allResults.push(`**Topic**: ${topic}`)
  if (category) allResults.push(`**Category**: ${category}`)
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

      while ((match = resultRegex.exec(html)) !== null && results.length < 5) {
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
        allResults.push(`### Search: "${query.slice(0, 80)}"`)
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

  allResults.push('### Key USCIS Resources')
  allResults.push('- **USCIS Forms**: https://www.uscis.gov/forms')
  allResults.push('- **USCIS Processing Times**: https://egov.uscis.gov/processing-times/')
  allResults.push('- **USCIS Fee Schedule**: https://www.uscis.gov/fees')
  allResults.push('- **Visa Bulletin**: https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html')
  allResults.push('- **USCIS Case Status**: https://egov.uscis.gov/casestatus/landing.do')
  allResults.push('- **USCIS Policy Manual**: https://www.uscis.gov/policy-manual')
  allResults.push('')
  allResults.push('**Next**: Use `web_fetch` on the most relevant results, then `write_filing_guide` to generate your personalized filing guide.')

  return allResults.join('\n')
}
