import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'verify_contractor',
  description:
    'Deep verification of a contractor: check for complaints, lawsuits, disciplinary actions, review patterns, and insurance claims. Also compares the contractor against common scam patterns. Use after search_contractor.',
  parameters: {
    type: 'object',
    properties: {
      business_name: {
        type: 'string',
        description: 'The contractor or company name',
      },
      state: {
        type: 'string',
        description: 'State where the contractor operates',
      },
      city: {
        type: 'string',
        description: 'City where the contractor operates',
      },
      owner_name: {
        type: 'string',
        description: 'Owner or principal name if known (optional)',
      },
      website_url: {
        type: 'string',
        description: 'Company website URL if found (optional)',
      },
    },
    required: ['business_name'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContractorTrustChecker/1.0)' },
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
      if (title && actualUrl) results.push({ title, url: actualUrl, snippet })
    }
    return results
  } catch {
    return []
  }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const businessName = (args.business_name as string || '').trim()
  const state = (args.state as string || '').trim()
  const city = (args.city as string || '').trim()
  const ownerName = (args.owner_name as string || '').trim()
  const websiteUrl = (args.website_url as string || '').trim()

  if (!businessName) return 'Error: business_name is required'

  const location = [city, state].filter(Boolean).join(', ')
  const sections: string[] = []
  sections.push(`# Contractor Verification: ${businessName}\n`)

  // 1. Complaints and negative reviews
  const complaintResults = await searchDDG(`"${businessName}" ${location} complaint scam fraud "rip off" warning`)
  sections.push('## Complaints & Warnings')
  if (complaintResults.length > 0) {
    const relevant = complaintResults.filter(r =>
      /complaint|scam|fraud|rip.?off|warning|terrible|worst|avoid|lawsuit|sue/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      sections.push('\u26a0\ufe0f **Found complaints or warnings:**')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('Search returned results but none contained specific complaints against this contractor.')
      complaintResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. ${r.title} — ${r.snippet}`)
      })
    }
  } else {
    sections.push('\u2705 No complaints, scam reports, or warnings found in web search.')
  }

  // 2. Legal issues / lawsuits
  const legalResults = await searchDDG(`"${businessName}" ${state} lawsuit court case "disciplinary action"`)
  sections.push('\n## Legal & Disciplinary History')
  if (legalResults.length > 0) {
    const relevant = legalResults.filter(r =>
      /lawsuit|court|disciplin|violation|fine|suspend|revok|judgment/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      sections.push('\u26a0\ufe0f **Found legal/disciplinary mentions:**')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('No specific legal or disciplinary actions found.')
    }
  } else {
    sections.push('No lawsuit or disciplinary records found in web search (positive signal).')
  }

  // 3. Owner background (if provided)
  if (ownerName) {
    const ownerResults = await searchDDG(`"${ownerName}" contractor ${location} license review`)
    sections.push(`\n## Owner: ${ownerName}`)
    if (ownerResults.length > 0) {
      ownerResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push(`No web results found for owner "${ownerName}".`)
    }
  }

  // 4. Insurance & bonding verification
  const insuranceResults = await searchDDG(`"${businessName}" ${state} insured bonded licensed insurance`)
  sections.push('\n## Insurance & Bonding')
  if (insuranceResults.length > 0) {
    const mentions = insuranceResults.filter(r =>
      /insured|bonded|insurance|liability|workers.comp/i.test(r.snippet)
    )
    if (mentions.length > 0) {
      sections.push('Found insurance/bonding mentions:')
      mentions.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. ${r.title} — ${r.snippet}`)
      })
    } else {
      sections.push('Could not confirm insurance/bonding status from web search.')
      sections.push('\u26a0\ufe0f Always ask to see proof of liability insurance and workers comp before hiring.')
    }
  } else {
    sections.push('Could not verify insurance/bonding status online.')
    sections.push('\u26a0\ufe0f Always ask for a certificate of insurance before work begins.')
  }

  // 5. How long in business
  const historyResults = await searchDDG(`"${businessName}" ${location} "years in business" OR established OR founded OR "since"`)
  sections.push('\n## Business History')
  if (historyResults.length > 0) {
    historyResults.slice(0, 2).forEach((r, i) => {
      sections.push(`${i + 1}. ${r.title} — ${r.snippet}`)
    })
  } else {
    sections.push('Could not determine how long the business has been operating.')
  }

  // 6. Website quality check (if URL provided)
  if (websiteUrl) {
    sections.push(`\n## Website Check: ${websiteUrl}`)
    try {
      const res = await fetch(websiteUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContractorTrustChecker/1.0)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const html = await res.text()
        const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(html)
        const hasAddress = /\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|dr|drive|rd|road|ln|lane)/i.test(html)
        const hasLicense = /license|licensed|lic\s*#|lic\s*no/i.test(html)
        const hasInsurance = /insured|insurance|bonded/i.test(html)
        const hasSSL = websiteUrl.startsWith('https')

        sections.push(`- Phone number on site: ${hasPhone ? '\u2705 Yes' : '\u26a0\ufe0f Not found'}`)
        sections.push(`- Physical address on site: ${hasAddress ? '\u2705 Yes' : '\u26a0\ufe0f Not found'}`)
        sections.push(`- License mentioned: ${hasLicense ? '\u2705 Yes' : 'Not found'}`)
        sections.push(`- Insurance mentioned: ${hasInsurance ? '\u2705 Yes' : 'Not found'}`)
        sections.push(`- HTTPS: ${hasSSL ? '\u2705 Yes' : '\u26a0\ufe0f No'}`)
      } else {
        sections.push(`Website returned HTTP ${res.status} — may be down or moved.`)
      }
    } catch (err) {
      sections.push(`Could not fetch website: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return sections.join('\n')
}
