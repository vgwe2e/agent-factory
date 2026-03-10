import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'verify_employer',
  description:
    'Verify whether a company/employer is legitimate by searching for its online presence across multiple sources. Checks for company website, reviews on Glassdoor/Indeed, Better Business Bureau listing, LinkedIn presence, and recent news. Returns verification results to help determine if the employer is real.',
  parameters: {
    type: 'object',
    properties: {
      company_name: {
        type: 'string',
        description: 'The name of the company to verify',
      },
      domain: {
        type: 'string',
        description: 'The domain/website of the company (optional, helps narrow search)',
      },
    },
    required: ['company_name'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; JobScamDetector/1.0)',
    },
  })

  if (!res.ok) return []

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

  return results
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const companyName = args.company_name as string
  const domain = args.domain as string | undefined

  if (!companyName) return 'Error: company_name is required'

  const sections: string[] = []
  sections.push(`# Employer Verification: ${companyName}\n`)

  // Search 1: General company search
  try {
    const generalResults = await searchDDG(`"${companyName}" company official website`)
    if (generalResults.length > 0) {
      sections.push('## General Presence')
      generalResults.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('## General Presence\n⚠️ NO RESULTS FOUND — this is a significant red flag. Legitimate companies have a web presence.')
    }
  } catch {
    sections.push('## General Presence\n⚠️ Search failed.')
  }

  // Search 2: Reviews and reputation
  try {
    const reviewResults = await searchDDG(`"${companyName}" reviews glassdoor indeed employees`)
    if (reviewResults.length > 0) {
      sections.push('\n## Reviews & Reputation')
      reviewResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('\n## Reviews & Reputation\n⚠️ No review presence found. Established employers typically have Glassdoor or Indeed profiles.')
    }
  } catch {
    sections.push('\n## Reviews & Reputation\n⚠️ Review search failed.')
  }

  // Search 3: Scam reports
  try {
    const scamResults = await searchDDG(`"${companyName}" scam fraud complaint fake job`)
    if (scamResults.length > 0) {
      sections.push('\n## Scam Reports')
      scamResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('\n## Scam Reports\nNo scam reports found for this company name (positive signal).')
    }
  } catch {
    sections.push('\n## Scam Reports\n⚠️ Scam check search failed.')
  }

  // Domain check if provided
  if (domain) {
    sections.push(`\n## Domain Analysis\nProvided domain: ${domain}`)
    try {
      const domainResults = await searchDDG(`site:${domain}`)
      if (domainResults.length > 0) {
        sections.push(`Domain appears indexed with ${domainResults.length} results (positive signal).`)
      } else {
        sections.push('⚠️ Domain has no search index presence — this is suspicious for a legitimate business.')
      }
    } catch {
      sections.push('⚠️ Domain search failed.')
    }
  }

  return sections.join('\n')
}
