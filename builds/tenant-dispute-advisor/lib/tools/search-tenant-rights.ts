import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_tenant_rights',
  description:
    'Search for state-specific and city-specific tenant rights, landlord-tenant laws, rent control rules, and eviction procedures. Use AFTER analyze_tenant_dispute to get detailed, up-to-date legal information for the tenant\'s specific jurisdiction.',
  parameters: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State to research tenant rights for',
      },
      city: {
        type: 'string',
        description: 'City (important for rent control and local ordinances)',
      },
      topic: {
        type: 'string',
        description: 'Specific topic to research (e.g. "security deposit return deadline", "repair and deduct law", "eviction notice requirements", "rent control limits")',
      },
    },
    required: ['state', 'topic'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const state = (args.state as string) || ''
  const city = (args.city as string) || ''
  const topic = (args.topic as string) || ''

  if (!state || !topic) {
    return 'Error: state and topic are required'
  }

  const location = city ? `${city} ${state}` : state

  const queries: string[] = [
    `${location} tenant rights ${topic} law 2025 2026`,
    `${location} landlord tenant ${topic} statute code`,
    `${state} renter rights ${topic} legal aid`,
    `${topic} tenant law ${state} what to do`,
  ]

  const allResults: string[] = []
  allResults.push(`## Tenant Rights Search: ${location}`)
  allResults.push(`**Topic**: ${topic}`)
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
        if (query.includes('tenant rights')) sourceLabel = 'Tenant Rights'
        else if (query.includes('statute code')) sourceLabel = 'Legal Code'
        else if (query.includes('legal aid')) sourceLabel = 'Legal Aid Resources'
        else if (query.includes('what to do')) sourceLabel = 'Practical Guidance'

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
  allResults.push('- **LawHelp.org**: https://www.lawhelp.org/ — Free legal help by state')
  allResults.push('- **HUD Tenant Rights**: https://www.hud.gov/topics/rental_assistance/tenantrights')
  allResults.push('- **Nolo Tenant Rights**: https://www.nolo.com/legal-encyclopedia/renters-rights')
  allResults.push('- **Legal Aid Finder**: https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help')
  allResults.push('- **Eviction Lab**: https://evictionlab.org/ — Eviction data and resources')
  allResults.push('')
  allResults.push('**Next**: Use `web_fetch` on relevant results, then `write_tenant_action_plan` to generate your action plan.')

  return allResults.join('\n')
}
