import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_comparable_sales',
  description:
    'Search for comparable home sales near a specific property address. Returns recent sales data from real estate search engines to help determine if a property tax assessment is accurate. Use this to find "comps" — similar homes that sold recently in the same area.',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The property address to find comparables for (e.g. "123 Main St, Springfield, IL 62701")',
      },
      property_type: {
        type: 'string',
        description: 'Type of property (e.g. "single family", "condo", "townhouse"). Helps narrow comparable searches.',
      },
      bedrooms: {
        type: 'string',
        description: 'Number of bedrooms (e.g. "3"). Used to find similar-sized comparables.',
      },
      square_feet: {
        type: 'string',
        description: 'Approximate square footage (e.g. "1800"). Used to find similar-sized comparables.',
      },
    },
    required: ['address'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PropertyTaxAdvisor/1.0)' },
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
  const address = args.address as string
  const propertyType = (args.property_type as string) || 'single family'
  const bedrooms = args.bedrooms as string | undefined
  const squareFeet = args.square_feet as string | undefined

  if (!address) return 'Error: address is required'

  // Extract city/state/zip from address for area-based searches
  const parts = address.split(',').map(p => p.trim())
  const cityStateZip = parts.length > 1 ? parts.slice(1).join(', ') : address

  const sections: string[] = []
  sections.push(`# Comparable Sales Research: ${address}\n`)
  sections.push(`**Property type**: ${propertyType}`)
  if (bedrooms) sections.push(`**Bedrooms**: ${bedrooms}`)
  if (squareFeet) sections.push(`**Square footage**: ${squareFeet}`)
  sections.push('')

  // Run multiple searches to find comparable sales
  const sizeFilter = squareFeet ? `${parseInt(squareFeet) - 300}-${parseInt(squareFeet) + 300} sqft` : ''
  const bedFilter = bedrooms ? `${bedrooms} bedroom` : ''
  const queries = [
    `${address} property value Zillow Redfin 2025 2026`,
    `recently sold homes near ${cityStateZip} ${bedFilter} ${sizeFilter} ${propertyType}`.trim(),
    `${cityStateZip} home sales comparable properties ${propertyType} 2024 2025`,
  ]

  const allResults: { title: string; url: string; snippet: string }[] = []
  for (const query of queries) {
    const results = await searchDDG(query)
    allResults.push(...results)
  }

  if (allResults.length === 0) {
    return `No comparable sales data found for "${address}". Try using web_search with more specific queries like "recently sold homes near [city]" or search Zillow/Redfin directly.`
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allResults.filter(r => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })

  sections.push(`## Search Results (${unique.length} sources)\n`)
  for (const r of unique.slice(0, 10)) {
    sections.push(`### ${r.title}`)
    sections.push(`Source: ${r.url}`)
    sections.push(`${r.snippet}\n`)
  }

  sections.push('---')
  sections.push('Use web_fetch on the most relevant Zillow/Redfin/Realtor.com links to get specific sale prices, dates, and property details for comparable homes.')
  sections.push('Look for homes that are similar in: size (±300 sqft), bedrooms (±1), lot size, age, condition, and neighborhood.')

  return sections.join('\n')
}
