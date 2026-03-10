import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_deductions',
  description:
    'Search for IRS tax deductions relevant to a specific freelance profession or expense category. Returns deduction rules, limits, and IRS form references. Use this to find what deductions apply to the user\'s work situation.',
  parameters: {
    type: 'object',
    properties: {
      profession: {
        type: 'string',
        description: 'The freelancer\'s profession or industry (e.g. "graphic designer", "rideshare driver", "freelance writer", "photographer")',
      },
      expense_category: {
        type: 'string',
        description: 'Specific expense category to research (e.g. "home office", "vehicle", "health insurance", "equipment", "travel"). Optional — if omitted, searches broadly for the profession.',
      },
    },
    required: ['profession'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeductionFinder/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const results: { title: string; url: string; snippet: string }[] = []
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let match
    while ((match = resultRegex.exec(html)) !== null && results.length < 6) {
      const rawUrl = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()
      const snippet = match[3].replace(/<[^>]*>/g, '').trim()
      const urlMatch = rawUrl.match(/uddg=([^&]+)/)
      const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl
      if (title && actualUrl) results.push({ title, url: actualUrl, snippet })
    }
    return results
  } catch {
    return []
  }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const profession = args.profession as string
  const expenseCategory = args.expense_category as string | undefined

  if (!profession) return 'Error: profession is required'

  const sections: string[] = []
  sections.push(`# Tax Deduction Research: ${profession}${expenseCategory ? ` — ${expenseCategory}` : ''}\n`)

  // Search for profession-specific deductions
  const queries: string[] = []
  if (expenseCategory) {
    queries.push(`IRS ${expenseCategory} tax deduction rules freelancer self-employed 2025 2026`)
    queries.push(`Schedule C ${expenseCategory} deduction limits ${profession}`)
  } else {
    queries.push(`IRS tax deductions for freelance ${profession} self-employed 2025 2026`)
    queries.push(`Schedule C deductions ${profession} independent contractor`)
  }

  const allResults: { title: string; url: string; snippet: string }[] = []
  for (const query of queries) {
    const results = await searchDDG(query)
    allResults.push(...results)
  }

  if (allResults.length === 0) {
    return `No deduction information found for "${profession}"${expenseCategory ? ` in category "${expenseCategory}"` : ''}. Try different search terms.`
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })

  sections.push(`## Search Results (${unique.length} sources)\n`)
  for (const r of unique.slice(0, 8)) {
    sections.push(`### ${r.title}`)
    sections.push(`Source: ${r.url}`)
    sections.push(`${r.snippet}\n`)
  }

  sections.push('---')
  sections.push('Use these sources to identify applicable deductions. Fetch the most relevant pages with web_fetch for detailed rules and current limits.')

  return sections.join('\n')
}
