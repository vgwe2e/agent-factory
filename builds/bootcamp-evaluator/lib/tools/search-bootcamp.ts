import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'search_bootcamp',
  description:
    'Search for a coding bootcamp or online course across the web to find its website, Course Report page, Reddit discussions, and review site presence. Start here. Provide the bootcamp name and optionally the program type (full-stack, data science, UX, etc.).',
  parameters: {
    type: 'object',
    properties: {
      bootcamp_name: {
        type: 'string',
        description: 'The bootcamp or course name (e.g. "App Academy", "Le Wagon", "Codecademy Pro")',
      },
      program: {
        type: 'string',
        description: 'Specific program or track (e.g. "full-stack web development", "data science", "UX/UI design")',
      },
      format: {
        type: 'string',
        description: 'Delivery format if known (e.g. "online", "in-person", "hybrid", "self-paced")',
      },
      location: {
        type: 'string',
        description: 'Campus location if applicable (e.g. "San Francisco", "New York", "remote")',
      },
    },
    required: ['bootcamp_name'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BootcampEvaluator/1.0)' },
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
  const bootcampName = (args.bootcamp_name as string || '').trim()
  const program = (args.program as string || '').trim()
  const format = (args.format as string || '').trim()
  const location = (args.location as string || '').trim()

  if (!bootcampName) return 'Error: bootcamp_name is required'

  const sections: string[] = []
  sections.push(`# Bootcamp Search: ${bootcampName}\n`)

  if (program) sections.push(`**Program**: ${program}`)
  if (format) sections.push(`**Format**: ${format}`)
  if (location) sections.push(`**Location**: ${location}`)
  sections.push('')

  // 1. General web presence
  const generalQuery = `"${bootcampName}" ${program} coding bootcamp ${format} ${location}`.trim()
  const generalResults = await searchDDG(generalQuery)
  sections.push('## Web Presence')
  if (generalResults.length > 0) {
    generalResults.forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })

    const hasOfficialSite = generalResults.some(r =>
      !r.url.includes('reddit.com') &&
      !r.url.includes('coursereport.com') &&
      !r.url.includes('switchup.org') &&
      !r.url.includes('quora.com') &&
      !r.url.includes('indeed.com') &&
      !r.url.includes('glassdoor.com')
    )
    if (hasOfficialSite) {
      sections.push('\nAppears to have an official website (positive signal).')
    } else {
      sections.push('\nNo dedicated official website found in top results.')
    }
  } else {
    sections.push(`No web results found for "${bootcampName}". This program may not exist or may operate under a different name.`)
  }

  // 2. Course Report profile
  const courseReportResults = await searchDDG(`site:coursereport.com "${bootcampName}"`)
  sections.push('\n## Course Report')
  if (courseReportResults.length > 0) {
    const profile = courseReportResults.find(r => r.url.includes('coursereport.com/schools/'))
    if (profile) {
      sections.push(`Found Course Report profile: ${profile.url}`)
      sections.push(`   ${profile.snippet}`)
    } else {
      courseReportResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    }
  } else {
    sections.push('No Course Report profile found. Course Report is a major bootcamp review site — absence here is worth noting.')
  }

  // 3. SwitchUp reviews
  const switchupResults = await searchDDG(`site:switchup.org "${bootcampName}"`)
  sections.push('\n## SwitchUp')
  if (switchupResults.length > 0) {
    switchupResults.slice(0, 2).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('No SwitchUp profile found.')
  }

  // 4. Reddit discussions
  const redditResults = await searchDDG(`site:reddit.com "${bootcampName}" bootcamp review experience`)
  sections.push('\n## Reddit Discussions')
  if (redditResults.length > 0) {
    redditResults.slice(0, 4).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('No Reddit discussions found. Reddit is a common source for unfiltered bootcamp reviews.')
  }

  // 5. Pricing search
  const pricingResults = await searchDDG(`"${bootcampName}" tuition cost price ${program}`)
  sections.push('\n## Pricing Information')
  if (pricingResults.length > 0) {
    pricingResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('Could not find pricing information. Be cautious of programs that hide their costs.')
  }

  return sections.join('\n')
}
