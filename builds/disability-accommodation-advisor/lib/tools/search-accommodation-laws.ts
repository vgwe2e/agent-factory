import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_accommodation_laws',
  description:
    'Search for state-specific disability accommodation laws, ADA updates, EEOC guidance, and accommodation best practices. Use AFTER analyze_accommodation_needs to get detailed, up-to-date information about the person\'s specific rights.',
  parameters: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State to research disability laws for',
      },
      topic: {
        type: 'string',
        description: 'Specific topic (e.g. "reasonable accommodation interactive process", "mental health workplace accommodations", "service animal housing rights")',
      },
      context: {
        type: 'string',
        description: '"workplace", "education", "housing", or "public"',
      },
    },
    required: ['topic'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const state = (args.state as string) || ''
  const topic = (args.topic as string) || ''
  const context = (args.context as string) || ''

  if (!topic) {
    return 'Error: topic is required'
  }

  const queries: string[] = [
    `ADA ${topic} ${context ? context + ' ' : ''}reasonable accommodation 2025 2026`,
    `${state ? state + ' ' : ''}disability accommodation law ${topic} ${context}`,
    `EEOC ${topic} disability accommodation guidance`,
    `JAN Job Accommodation Network ${topic} accommodation ideas`,
  ]

  const allResults: string[] = []
  allResults.push(`## Accommodation Law Search`)
  if (state) allResults.push(`**State**: ${state}`)
  allResults.push(`**Topic**: ${topic}`)
  if (context) allResults.push(`**Context**: ${context}`)
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
        if (query.includes('ADA')) sourceLabel = 'ADA / Federal Law'
        else if (query.includes('disability accommodation law')) sourceLabel = 'State Laws'
        else if (query.includes('EEOC')) sourceLabel = 'EEOC Guidance'
        else if (query.includes('JAN')) sourceLabel = 'JAN Accommodation Ideas'

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
  allResults.push('- **JAN (Job Accommodation Network)**: https://askjan.org/ — Free, expert guidance on workplace accommodations')
  allResults.push('- **ADA.gov**: https://www.ada.gov/ — Official ADA information and resources')
  allResults.push('- **EEOC Disability Discrimination**: https://www.eeoc.gov/disability-discrimination')
  allResults.push('- **EEOC Reasonable Accommodation**: https://www.eeoc.gov/laws/guidance/enforcement-guidance-reasonable-accommodation-and-undue-hardship-under-ada')
  allResults.push('- **OCR Complaint (Education)**: https://www2.ed.gov/about/offices/list/ocr/complaintintro.html')
  allResults.push('- **HUD Fair Housing**: https://www.hud.gov/program_offices/fair_housing_equal_opp')
  allResults.push('- **Disability Rights Network**: https://www.ndrn.org/about/ndrn-member-agencies/ — Free legal help by state')
  allResults.push('')
  allResults.push('**Next**: Use `web_fetch` on the most relevant results, then `write_accommodation_request` to generate your request.')

  return allResults.join('\n')
}
