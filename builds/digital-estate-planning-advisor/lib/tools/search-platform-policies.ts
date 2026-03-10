import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_platform_policies',
  description:
    'Search for a specific platform\'s legacy, memorialization, data download, and account succession policies. Use after analyze_digital_estate to get detailed, current information on platforms the user cares about.',
  parameters: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        description: 'Platform name (e.g. "Google", "Facebook", "Coinbase", "Steam")',
      },
      topic: {
        type: 'string',
        description: 'Specific topic: "legacy_contact", "memorialization", "data_download", "account_deletion", "transfer_after_death", "inactive_account"',
      },
    },
    required: ['platform'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const platform = (args.platform as string) || ''
  const topic = (args.topic as string) || 'legacy after death'

  if (!platform) {
    return 'Error: platform is required'
  }

  const queries: string[] = [
    `${platform} account after death legacy contact memorialization policy 2025`,
    `${platform} ${topic} how to set up`,
    `${platform} download data export account deceased`,
    `${platform} estate executor access digital assets`,
  ]

  const allResults: string[] = []
  allResults.push(`## ${platform} — Legacy & Succession Policies`)
  if (topic) allResults.push(`**Topic**: ${topic}`)
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
        if (query.includes('legacy contact memorialization')) sourceLabel = 'Legacy & Memorialization'
        else if (query.includes('how to set up')) sourceLabel = 'Setup Guide'
        else if (query.includes('download data export')) sourceLabel = 'Data Export'
        else sourceLabel = 'Estate Access'

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

  allResults.push('**Next**: Use `web_fetch` on relevant results for detailed instructions, then `write_estate_plan` to generate your digital estate plan.')

  return allResults.join('\n')
}
