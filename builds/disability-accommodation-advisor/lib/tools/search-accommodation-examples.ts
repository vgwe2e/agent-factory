import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_accommodation_examples',
  description:
    'Search for specific accommodation examples, success stories, and JAN (Job Accommodation Network) recommendations for a given disability type and work/school context. Returns practical accommodation ideas and real-world examples of what has worked for others.',
  parameters: {
    type: 'object',
    properties: {
      disability_type: {
        type: 'string',
        description: 'Type of disability or condition (e.g. "ADHD", "chronic pain", "anxiety", "autism", "vision loss")',
      },
      context: {
        type: 'string',
        description: '"workplace", "college", "k12", or "housing"',
      },
      job_type: {
        type: 'string',
        description: 'Type of job or academic program if applicable (e.g. "software engineer", "nurse", "teacher", "engineering student")',
      },
    },
    required: ['disability_type'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const disabilityType = (args.disability_type as string) || ''
  const context = (args.context as string) || 'workplace'
  const jobType = (args.job_type as string) || ''

  if (!disabilityType) {
    return 'Error: disability_type is required'
  }

  const queries = [
    `JAN Job Accommodation Network ${disabilityType} ${context} accommodations`,
    `reasonable accommodations ${disabilityType} ${context} ${jobType} examples`,
    `${disabilityType} ${context} accommodation success stories reddit`,
    `ADA ${disabilityType} accommodation ideas practical ${jobType}`,
  ]

  const allResults: string[] = []
  allResults.push(`## Accommodation Examples: ${disabilityType}`)
  allResults.push(`**Context**: ${context}`)
  if (jobType) allResults.push(`**Role**: ${jobType}`)
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
        if (query.includes('JAN')) sourceLabel = 'JAN Accommodation Database'
        else if (query.includes('examples')) sourceLabel = 'Accommodation Examples'
        else if (query.includes('reddit')) sourceLabel = 'Community Experiences'
        else if (query.includes('ADA')) sourceLabel = 'ADA Resources'

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

  allResults.push('### Tips for Requesting Accommodations')
  allResults.push('- Focus on **functional limitations**, not your diagnosis')
  allResults.push('- Propose **specific, practical solutions** — not just "I need help"')
  allResults.push('- Show how the accommodation enables you to **perform essential functions**')
  allResults.push('- Most accommodations cost **under $500** (JAN research) — many cost nothing')
  allResults.push('- Be open to **alternatives** — the employer/school may suggest a different solution that works')
  allResults.push('')
  allResults.push('**Next**: Use `write_accommodation_request` to generate your formal request letter.')

  return allResults.join('\n')
}
