import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'verify_rental_listing',
  description:
    'Verify a rental listing by cross-referencing the property address, landlord/management company, contact information, and listed price against web sources. Searches for property records, scam reports, landlord reviews, and comparable rental prices in the area. Use after fetch_rental_listing.',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The property address from the listing',
      },
      landlord_or_company: {
        type: 'string',
        description: 'The landlord name or property management company',
      },
      contact_email: {
        type: 'string',
        description: 'Contact email from the listing (if available)',
      },
      contact_phone: {
        type: 'string',
        description: 'Contact phone number from the listing (if available)',
      },
      listed_price: {
        type: 'string',
        description: 'The monthly rent price from the listing',
      },
      city_state: {
        type: 'string',
        description: 'City and state for comparable price searches',
      },
    },
    required: [],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RentalScamDetector/1.0)' },
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
  const address = (args.address as string || '').trim()
  const landlord = (args.landlord_or_company as string || '').trim()
  const email = (args.contact_email as string || '').trim()
  const phone = (args.contact_phone as string || '').trim()
  const price = (args.listed_price as string || '').trim()
  const cityState = (args.city_state as string || '').trim()

  const sections: string[] = []
  sections.push('# Rental Listing Verification\n')

  // 1. Verify the property address exists
  if (address) {
    sections.push('## Property Address Verification')
    const addressResults = await searchDDG(`"${address}" property real estate`)
    if (addressResults.length > 0) {
      sections.push(`Found web results for "${address}":`)
      addressResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })

      // Check if address appears on major real estate sites
      const onRealEstateSite = addressResults.some(r =>
        /zillow|realtor\.com|redfin|trulia|apartments\.com/i.test(r.url)
      )
      if (onRealEstateSite) {
        sections.push('\n\u2705 Address found on major real estate platform (property appears to exist).')
      }
    } else {
      sections.push(`\u26a0\ufe0f No web results found for "${address}" — property may not exist or address may be incorrect.`)
    }

    // Search for the address + scam reports
    const scamResults = await searchDDG(`"${address}" scam fraud fake rental`)
    if (scamResults.length > 0) {
      const relevant = scamResults.filter(r =>
        r.snippet.toLowerCase().includes('scam') ||
        r.snippet.toLowerCase().includes('fraud') ||
        r.snippet.toLowerCase().includes('fake')
      )
      if (relevant.length > 0) {
        sections.push('\n\u26a0\ufe0f **SCAM REPORTS FOUND for this address:**')
        relevant.forEach((r, i) => {
          sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        })
      }
    }
  }

  // 2. Verify the landlord / property management company
  if (landlord) {
    sections.push('\n## Landlord / Management Company Verification')

    // General search
    const landlordResults = await searchDDG(`"${landlord}" property management rental landlord`)
    if (landlordResults.length > 0) {
      sections.push(`Found web results for "${landlord}":`)
      landlordResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push(`\u26a0\ufe0f No web presence found for "${landlord}" — could not verify as a real landlord/company.`)
    }

    // Reviews / complaints
    const reviewResults = await searchDDG(`"${landlord}" review complaint scam rating`)
    if (reviewResults.length > 0) {
      sections.push('\n### Reviews & Complaints')
      const negative = reviewResults.filter(r =>
        /scam|complaint|terrible|avoid|warning|fraud|ripoff|rip.off/i.test(r.snippet)
      )
      if (negative.length > 0) {
        sections.push('\u26a0\ufe0f **Negative reviews or complaints found:**')
        negative.forEach((r, i) => {
          sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        })
      } else {
        sections.push('No major complaints found in web search.')
        reviewResults.slice(0, 2).forEach((r, i) => {
          sections.push(`${i + 1}. **${r.title}**\n   ${r.snippet}`)
        })
      }
    }
  }

  // 3. Check contact email
  if (email) {
    sections.push('\n## Email Verification')
    const emailDomain = email.split('@')[1]

    if (/^(gmail|yahoo|hotmail|outlook|aol|protonmail|icloud)\./i.test(emailDomain || '')) {
      sections.push(`\u26a0\ufe0f **Personal email domain** (${emailDomain}) — legitimate property managers typically use company email addresses.`)
    } else if (emailDomain) {
      sections.push(`\u2705 Company email domain: ${emailDomain}`)
      const domainResults = await searchDDG(`"${emailDomain}" property management company`)
      if (domainResults.length > 0) {
        sections.push('Domain appears in web results:')
        domainResults.slice(0, 2).forEach((r, i) => {
          sections.push(`${i + 1}. ${r.title} — ${r.snippet}`)
        })
      } else {
        sections.push(`\u26a0\ufe0f Could not verify the email domain "${emailDomain}" as a known business.`)
      }
    }

    // Check email in scam databases
    const emailScam = await searchDDG(`"${email}" scam fraud report`)
    if (emailScam.length > 0) {
      const relevant = emailScam.filter(r =>
        r.snippet.toLowerCase().includes(email.toLowerCase())
      )
      if (relevant.length > 0) {
        sections.push('\n\u26a0\ufe0f **Email found in scam reports:**')
        relevant.forEach((r, i) => {
          sections.push(`${i + 1}. **${r.title}**\n   ${r.snippet}`)
        })
      }
    }
  }

  // 4. Check phone number
  if (phone) {
    sections.push('\n## Phone Number Verification')
    const phoneResults = await searchDDG(`"${phone}" scam spam fraud report`)
    if (phoneResults.length > 0) {
      const flagged = phoneResults.filter(r =>
        /scam|spam|fraud|robocall|fake|warning/i.test(r.snippet)
      )
      if (flagged.length > 0) {
        sections.push('\u26a0\ufe0f **Phone number flagged in scam/spam reports:**')
        flagged.forEach((r, i) => {
          sections.push(`${i + 1}. **${r.title}**\n   ${r.snippet}`)
        })
      } else {
        sections.push('Phone number not found in scam databases (positive signal).')
      }
    } else {
      sections.push('Phone number not found in scam databases.')
    }
  }

  // 5. Compare price to area averages
  if (price && (cityState || address)) {
    sections.push('\n## Price Comparison')
    const location = cityState || address
    const priceResults = await searchDDG(`average rent "${location}" 2025 2026 apartment`)
    if (priceResults.length > 0) {
      sections.push(`Rental price context for ${location}:`)
      priceResults.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.snippet}`)
      })
      sections.push(`\nListed price: ${price}`)
      sections.push('Compare the listed price against the averages above. Prices significantly below market average are a common scam signal.')
    }
  }

  if (!address && !landlord && !email && !phone) {
    return 'Error: Provide at least one of: address, landlord_or_company, contact_email, or contact_phone to verify.'
  }

  return sections.join('\n')
}
