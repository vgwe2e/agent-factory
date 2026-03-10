import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'research_landlord_record',
  description:
    'Research a landlord or property management company\'s complaint history, code violations, and reviews. Use this to understand whether the landlord has a pattern of violations that strengthens the tenant\'s case.',
  parameters: {
    type: 'object',
    properties: {
      landlord_name: {
        type: 'string',
        description: 'Name of the landlord or property management company',
      },
      property_address: {
        type: 'string',
        description: 'Property address or neighborhood',
      },
      city_state: {
        type: 'string',
        description: 'City and state for local records search',
      },
    },
    required: ['landlord_name'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const landlord = (args.landlord_name as string) || ''
  const address = (args.property_address as string) || ''
  const location = (args.city_state as string) || ''

  if (!landlord) {
    return 'Error: landlord_name is required'
  }

  const queries = [
    `"${landlord}" complaints reviews landlord ${location}`,
    `"${landlord}" code violations building department ${location}`,
    `"${landlord}" tenant complaints reddit ${location}`,
    address ? `"${address}" building violations inspection results` : `"${landlord}" property management complaints BBB`,
  ]

  const allResults: string[] = []
  allResults.push(`## Landlord Research: ${landlord}`)
  if (location) allResults.push(`**Location**: ${location}`)
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
        if (query.includes('complaints reviews')) sourceLabel = 'Reviews & Complaints'
        else if (query.includes('code violations')) sourceLabel = 'Code Violations'
        else if (query.includes('reddit')) sourceLabel = 'Tenant Experiences'
        else sourceLabel = 'Property/BBB Records'

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

  allResults.push('### How to Use This Research')
  allResults.push(`- **Pattern of complaints**: If ${landlord} has a history of tenant complaints, it strengthens your case and may show willful negligence.`)
  allResults.push('- **Code violations**: Prior violations show the landlord was on notice of problems. This defeats "I didn\'t know" defenses.')
  allResults.push('- **Other tenants\' experiences**: If others faced similar issues, consider organizing collectively or referring to these cases in your complaint.')
  allResults.push('')

  return allResults.join('\n')
}
