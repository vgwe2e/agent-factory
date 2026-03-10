import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'fetch_rental_listing',
  description:
    'Fetch a rental listing from a URL and extract key details: address, price, landlord/contact info, description, and photos. Also analyzes the listing source (Craigslist, Facebook, Zillow, etc.) for platform-specific risk signals. Start here.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL of the rental listing to analyze. If the user provides just an address or description instead of a URL, set this to empty and use the other parameters.',
      },
      address: {
        type: 'string',
        description: 'The property address (if provided directly instead of a URL)',
      },
      price: {
        type: 'string',
        description: 'The listed rental price (if provided directly)',
      },
      description: {
        type: 'string',
        description: 'The listing description text (if provided directly)',
      },
      contact_info: {
        type: 'string',
        description: 'Contact information from the listing: name, email, phone (if provided directly)',
      },
    },
    required: [],
  },
}

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return `HTTP ${res.status}: Could not fetch the listing page.`
    const html = await res.text()

    // Use linkedom + Readability if available, otherwise extract text
    try {
      const { Readability } = await import('@mozilla/readability')
      const { parseHTML } = await import('linkedom')
      const { document } = parseHTML(html)
      const article = new Readability(document as unknown as Document).parse()
      if (article?.textContent) {
        return article.textContent.slice(0, 5000)
      }
    } catch { /* fall through to basic extraction */ }

    // Basic text extraction
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.slice(0, 5000)
  } catch (err) {
    return `Fetch error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const url = (args.url as string || '').trim()
  const address = (args.address as string || '').trim()
  const price = (args.price as string || '').trim()
  const description = (args.description as string || '').trim()
  const contactInfo = (args.contact_info as string || '').trim()

  const sections: string[] = []
  sections.push('# Rental Listing Analysis\n')

  // If URL provided, fetch the listing
  if (url) {
    sections.push(`## Source URL: ${url}\n`)

    // Analyze the platform
    const urlLower = url.toLowerCase()
    if (urlLower.includes('craigslist.org')) {
      sections.push('**Platform**: Craigslist')
      sections.push('\u26a0\ufe0f Craigslist has minimal listing verification. Higher scam risk on this platform.')
    } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      sections.push('**Platform**: Facebook Marketplace')
      sections.push('\u26a0\ufe0f 50% of rental scams reported to the FTC in 2025 started on Facebook. Exercise extra caution.')
    } else if (urlLower.includes('zillow.com')) {
      sections.push('**Platform**: Zillow')
      sections.push('\u2705 Zillow has identity verification for landlords. Lower risk platform.')
    } else if (urlLower.includes('apartments.com')) {
      sections.push('**Platform**: Apartments.com')
      sections.push('\u2705 Apartments.com verifies property managers. Lower risk platform.')
    } else if (urlLower.includes('realtor.com')) {
      sections.push('**Platform**: Realtor.com')
      sections.push('\u2705 MLS-connected platform. Lower risk.')
    } else {
      const domain = url.replace(/^https?:\/\//, '').split('/')[0]
      sections.push(`**Platform**: ${domain}`)
      sections.push('\u26a0\ufe0f Unknown platform — verify listing independently.')
    }

    // Fetch the page content
    sections.push('\n## Listing Content\n')
    const content = await fetchPage(url)
    sections.push(content)
  }

  // Add any directly provided info
  if (address) {
    sections.push(`\n## Property Address\n${address}`)
  }
  if (price) {
    sections.push(`\n## Listed Price\n${price}`)
  }
  if (description) {
    sections.push(`\n## Listing Description\n${description}`)
  }
  if (contactInfo) {
    sections.push(`\n## Contact Information\n${contactInfo}`)
  }

  // Text-based red flag analysis on available content
  const allText = [description, url, address, contactInfo].join(' ').toLowerCase()

  sections.push('\n## Initial Red Flag Scan')

  const redFlags: string[] = []

  // Payment red flags
  if (/wire transfer|western union|zelle|venmo|cash ?app|gift card|bitcoin|crypto|money ?order/i.test(allText)) {
    redFlags.push('Mentions non-traditional payment methods (wire transfer, gift cards, crypto) — MAJOR RED FLAG')
  }

  // Urgency red flags
  if (/act fast|won't last|hurry|urgent|immediate|first come|deposit now|before it's gone/i.test(allText)) {
    redFlags.push('Uses urgency language to pressure quick decisions')
  }

  // Too good to be true
  if (/no credit check|no background check|no lease|month.to.month|no deposit/i.test(allText)) {
    redFlags.push('Unusually relaxed rental requirements — may indicate scam')
  }

  // Can\'t see property
  if (/out of (town|country|state)|can't show|cannot show|overseas|military|deployed/i.test(allText)) {
    redFlags.push('Landlord claims to be unavailable for in-person showing — classic scam indicator')
  }

  // Generic email
  if (/@(gmail|yahoo|hotmail|outlook|aol|protonmail)\./i.test(allText)) {
    redFlags.push('Uses personal email address (not a property management company domain)')
  }

  if (redFlags.length > 0) {
    redFlags.forEach(f => sections.push(`- \u26a0\ufe0f ${f}`))
  } else {
    sections.push('- No obvious text-based red flags detected in the provided information.')
    sections.push('- Further verification needed via web search (next step).')
  }

  if (!url && !address && !description && !contactInfo) {
    return 'Error: Please provide either a listing URL, address, or description to analyze.'
  }

  return sections.join('\n')
}
