import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_contractor',
  description:
    'Search for a contractor or home service company across the web to find their website, license information, BBB profile, and online presence. Start here. Provide the business name and optionally the state/city and trade (plumber, electrician, roofer, etc.).',
  parameters: {
    type: 'object',
    properties: {
      business_name: {
        type: 'string',
        description: 'The contractor or company name (e.g. "Joe\'s Plumbing", "ABC Roofing LLC")',
      },
      state: {
        type: 'string',
        description: 'State where the contractor operates (e.g. "California", "TX")',
      },
      city: {
        type: 'string',
        description: 'City where the contractor operates (optional)',
      },
      trade: {
        type: 'string',
        description: 'Type of work (e.g. "plumber", "electrician", "general contractor", "roofer")',
      },
      license_number: {
        type: 'string',
        description: 'License number if known (optional)',
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
  const trade = (args.trade as string || '').trim()
  const licenseNumber = (args.license_number as string || '').trim()

  if (!businessName) return 'Error: business_name is required'

  const location = [city, state].filter(Boolean).join(', ')
  const sections: string[] = []
  sections.push(`# Contractor Search: ${businessName}\n`)

  if (location) sections.push(`**Location**: ${location}`)
  if (trade) sections.push(`**Trade**: ${trade}`)
  if (licenseNumber) sections.push(`**License #**: ${licenseNumber}`)
  sections.push('')

  // 1. General web presence search
  const generalQuery = `"${businessName}" ${trade} ${location} contractor`
  const generalResults = await searchDDG(generalQuery)
  sections.push('## Web Presence')
  if (generalResults.length > 0) {
    generalResults.forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })

    // Check for official website
    const hasWebsite = generalResults.some(r =>
      !r.url.includes('yelp.com') &&
      !r.url.includes('bbb.org') &&
      !r.url.includes('google.com') &&
      !r.url.includes('facebook.com') &&
      !r.url.includes('angi.com') &&
      !r.url.includes('homeadvisor.com')
    )
    if (hasWebsite) {
      sections.push('\n\u2705 Appears to have a dedicated website (positive signal).')
    } else {
      sections.push('\n\u26a0\ufe0f No dedicated company website found — only directory listings.')
    }
  } else {
    sections.push(`\u26a0\ufe0f No web results found for "${businessName}" ${location}. This contractor may not have an online presence.`)
  }

  // 2. License verification search
  const licenseQuery = licenseNumber
    ? `"${licenseNumber}" contractor license ${state}`
    : `"${businessName}" contractor license ${state} verify`
  const licenseResults = await searchDDG(licenseQuery)
  sections.push('\n## License Information')
  if (licenseResults.length > 0) {
    licenseResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })

    // Check for state licensing board results
    const stateBoard = licenseResults.some(r =>
      r.url.includes('.gov') || r.url.includes('licensedcheck.com') || r.url.includes('cslb.ca.gov')
    )
    if (stateBoard) {
      sections.push('\n\u2705 Found results from state licensing resources.')
    }
  } else {
    sections.push(`\u26a0\ufe0f Could not find license information for "${businessName}" in ${state || 'any state'}.`)
    sections.push('This could mean: unlicensed, operates under a different name, or license records are not online.')
  }

  // 3. BBB profile search
  const bbbResults = await searchDDG(`site:bbb.org "${businessName}" ${location}`)
  sections.push('\n## Better Business Bureau (BBB)')
  if (bbbResults.length > 0) {
    const bbbProfile = bbbResults.find(r => r.url.includes('bbb.org/us/'))
    if (bbbProfile) {
      sections.push(`\u2705 **BBB Profile found**: ${bbbProfile.url}`)
      sections.push(`   ${bbbProfile.snippet}`)
    } else {
      bbbResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    }
  } else {
    sections.push('No BBB profile found. Not all contractors are BBB-listed — this is informational, not a red flag by itself.')
  }

  // 4. Review site presence
  const reviewResults = await searchDDG(`"${businessName}" ${location} reviews (yelp OR angi OR homeadvisor OR google)`)
  sections.push('\n## Review Site Presence')
  if (reviewResults.length > 0) {
    reviewResults.slice(0, 4).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('\u26a0\ufe0f No review site listings found. This could mean the business is very new or operates informally.')
  }

  return sections.join('\n')
}
