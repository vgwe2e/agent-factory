import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_estate_laws',
  description:
    'Search for state-specific digital estate laws, including RUFADAA adoption, fiduciary access to digital assets, and estate planning requirements. Use after analyze_digital_estate.',
  parameters: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State to research digital estate laws for',
      },
      topic: {
        type: 'string',
        description: 'Specific topic: "rufadaa", "digital_assets_law", "fiduciary_access", "power_of_attorney_digital", "will_requirements"',
      },
    },
    required: ['state'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const state = (args.state as string) || ''
  const topic = (args.topic as string) || 'digital assets estate law'

  if (!state) {
    return 'Error: state is required'
  }

  const queries: string[] = [
    `${state} RUFADAA digital assets fiduciary access law`,
    `${state} digital estate planning law requirements 2025`,
    `${state} ${topic} statute`,
    `${state} power of attorney digital assets online accounts`,
  ]

  const allResults: string[] = []
  allResults.push(`## ${state} — Digital Estate Laws`)
  if (topic !== 'digital assets estate law') allResults.push(`**Topic**: ${topic}`)
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
        if (query.includes('RUFADAA')) sourceLabel = 'RUFADAA / Digital Assets Law'
        else if (query.includes('estate planning')) sourceLabel = 'Estate Planning Requirements'
        else if (query.includes('statute')) sourceLabel = 'Legal Code'
        else sourceLabel = 'Power of Attorney'

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

  allResults.push('### Key Concepts')
  allResults.push('- **RUFADAA** (Revised Uniform Fiduciary Access to Digital Assets Act): Adopted by 49+ states. Gives fiduciaries (executors, agents, trustees) legal authority to manage digital assets.')
  allResults.push('- **Priority order**: Platform\'s terms of service > user\'s online tool (e.g., Google Inactive Account Manager) > will/trust provisions > state default law')
  allResults.push('- **Power of Attorney**: Can include digital asset management authority if drafted properly')
  allResults.push('- **Digital will clause**: Should explicitly name a digital executor and grant access authority')
  allResults.push('')
  allResults.push('**Next**: Use `write_estate_plan` to generate your comprehensive digital estate plan.')

  return allResults.join('\n')
}
