import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'check_visa_bulletin',
  description:
    'Search for the latest Visa Bulletin priority dates and processing backlogs for a specific immigration category and country. The Visa Bulletin determines when employment-based and family preference green card applicants can file their I-485. Use this when the user needs to know their wait time or filing eligibility.',
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Immigration category: "EB-1", "EB-2", "EB-3", "EB-4", "EB-5", "F1" (unmarried children of citizens), "F2A" (spouse/children of LPR), "F2B" (unmarried children 21+ of LPR), "F3" (married children of citizens), "F4" (siblings of citizens)',
      },
      country: {
        type: 'string',
        description: 'Country of chargeability (usually country of birth): "India", "China", "Mexico", "Philippines", or "all other" (rest of world)',
      },
    },
    required: ['category'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const category = (args.category as string) || ''
  const country = (args.country as string) || 'all other'

  if (!category) {
    return 'Error: category is required'
  }

  const queries = [
    `visa bulletin ${category} ${country} priority date current 2025 2026`,
    `USCIS visa bulletin ${category} processing time backlog ${country}`,
  ]

  const allResults: string[] = []
  allResults.push(`## Visa Bulletin Check: ${category}`)
  allResults.push(`**Country**: ${country}`)
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
        allResults.push(`### Search Results`)
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

  allResults.push('### Understanding the Visa Bulletin')
  allResults.push('')
  allResults.push('- **"Current"** = No wait. You can file I-485 immediately.')
  allResults.push('- **A date** = You can only file if your priority date is BEFORE this date.')
  allResults.push('- **Priority date** = The date your I-140 or I-130 was filed (or PERM for EB-2/EB-3).')
  allResults.push('- **Final Action Date** = When USCIS will make a decision on your case.')
  allResults.push('- **Dates for Filing** = When you can submit your I-485 (usually earlier than Final Action Date).')
  allResults.push('')
  allResults.push('### Key Resources')
  allResults.push('- **Official Visa Bulletin**: https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html')
  allResults.push('- **USCIS Filing Dates Chart**: https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates')
  allResults.push('')

  return allResults.join('\n')
}
