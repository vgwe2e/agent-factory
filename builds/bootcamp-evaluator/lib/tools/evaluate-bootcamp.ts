import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'evaluate_bootcamp',
  description:
    'Deep evaluation of a coding bootcamp or online course: check alumni outcomes, job placement rates, complaints, instructor credentials, curriculum depth, and pricing vs alternatives. Use after search_bootcamp.',
  parameters: {
    type: 'object',
    properties: {
      bootcamp_name: {
        type: 'string',
        description: 'The bootcamp or course name',
      },
      program: {
        type: 'string',
        description: 'Specific program or track being evaluated',
      },
      website_url: {
        type: 'string',
        description: 'Official website URL if found (optional)',
      },
      price: {
        type: 'string',
        description: 'Tuition price if known (optional, e.g. "$15,000")',
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
  const bootcampName = (args.bootcamp_name as string || '').trim()
  const program = (args.program as string || '').trim()
  const websiteUrl = (args.website_url as string || '').trim()
  const price = (args.price as string || '').trim()

  if (!bootcampName) return 'Error: bootcamp_name is required'

  const sections: string[] = []
  sections.push(`# Bootcamp Evaluation: ${bootcampName}\n`)

  // 1. Job placement rates and outcomes
  const outcomeResults = await searchDDG(`"${bootcampName}" job placement rate outcomes employment report ${program}`)
  sections.push('## Job Placement & Outcomes')
  if (outcomeResults.length > 0) {
    const relevant = outcomeResults.filter(r =>
      /placement|outcome|employment|job|hired|salary|career|graduate/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('Search returned results but none contained specific outcome data.')
      outcomeResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. ${r.title} -- ${r.snippet}`)
      })
    }
  } else {
    sections.push('No job placement or outcome data found. Reputable bootcamps typically publish outcomes reports (CIRR-audited or self-reported).')
  }

  // 2. CIRR outcomes report (Council on Integrity in Results Reporting)
  const cirrResults = await searchDDG(`"${bootcampName}" CIRR outcomes report audit`)
  sections.push('\n## CIRR Outcomes Reporting')
  if (cirrResults.length > 0) {
    const relevant = cirrResults.filter(r =>
      /cirr|integrity|results.report/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      sections.push('Found CIRR-related results (audited outcomes are the gold standard):')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('No CIRR-audited outcomes report found. CIRR is the industry standard for transparent, third-party-audited outcomes.')
    }
  } else {
    sections.push('No CIRR-audited outcomes found. Programs that participate in CIRR are more transparent about graduate results.')
  }

  // 3. Complaints, negative reviews, and scam reports
  const complaintResults = await searchDDG(`"${bootcampName}" complaint scam "waste of money" "not worth it" lawsuit`)
  sections.push('\n## Complaints & Warnings')
  if (complaintResults.length > 0) {
    const relevant = complaintResults.filter(r =>
      /complaint|scam|waste|not worth|terrible|avoid|lawsuit|predatory|misleading|deceptive/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      sections.push('Found complaints or warnings:')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('Search returned results but none contained specific complaints.')
      complaintResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. ${r.title} -- ${r.snippet}`)
      })
    }
  } else {
    sections.push('No complaints, scam reports, or warnings found in web search.')
  }

  // 4. BBB and regulatory complaints
  const bbbResults = await searchDDG(`site:bbb.org "${bootcampName}"`)
  sections.push('\n## BBB / Regulatory')
  if (bbbResults.length > 0) {
    const bbbProfile = bbbResults.find(r => r.url.includes('bbb.org/us/'))
    if (bbbProfile) {
      sections.push(`BBB Profile found: ${bbbProfile.url}`)
      sections.push(`   ${bbbProfile.snippet}`)
    } else {
      bbbResults.slice(0, 2).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    }
  } else {
    sections.push('No BBB profile found. Not all education providers have BBB listings.')
  }

  // 5. State AG or FTC complaints
  const regulatoryResults = await searchDDG(`"${bootcampName}" "attorney general" OR "FTC" OR "consumer protection" OR "state AG" complaint`)
  if (regulatoryResults.length > 0) {
    const relevant = regulatoryResults.filter(r =>
      /attorney general|ftc|consumer protection|settlement|fine|investig/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      sections.push('\nRegulatory actions or investigations found:')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    }
  }

  // 6. Accreditation and legitimacy
  const accreditResults = await searchDDG(`"${bootcampName}" accredited accreditation licensed approved state`)
  sections.push('\n## Accreditation & Legitimacy')
  if (accreditResults.length > 0) {
    const relevant = accreditResults.filter(r =>
      /accredit|licensed|approved|recognized|certified|register/i.test(r.snippet)
    )
    if (relevant.length > 0) {
      relevant.slice(0, 3).forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('Could not confirm accreditation status from web search.')
    }
  } else {
    sections.push('No accreditation information found. Note: most coding bootcamps are not accredited in the traditional sense (like universities), but some have state approval or are licensed vocational schools.')
  }

  // 7. Instructor quality
  const instructorResults = await searchDDG(`"${bootcampName}" instructors teachers curriculum quality ${program}`)
  sections.push('\n## Instructors & Curriculum')
  if (instructorResults.length > 0) {
    instructorResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('Could not find details about instructors or curriculum quality.')
  }

  // 8. Alternatives comparison
  const altQuery = program
    ? `best ${program} bootcamp 2025 2026 alternatives compare`
    : `best coding bootcamp 2025 2026 alternatives compare "${bootcampName}"`
  const altResults = await searchDDG(altQuery)
  sections.push('\n## Alternatives & Comparisons')
  if (altResults.length > 0) {
    altResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('Could not find comparison or alternative program information.')
  }

  // 9. Website quality check (if URL provided)
  if (websiteUrl) {
    sections.push(`\n## Website Check: ${websiteUrl}`)
    try {
      const res = await fetch(websiteUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BootcampEvaluator/1.0)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const html = await res.text()
        const hasOutcomes = /outcome|placement|employ|hired|salary|job/i.test(html)
        const hasPricing = /tuition|pricing|cost|\$[\d,]+|payment plan|ISA|income share/i.test(html)
        const hasCurriculum = /curriculum|syllabus|course content|what you.ll learn|stack|technolog/i.test(html)
        const hasInstructors = /instructor|teacher|mentor|faculty|staff/i.test(html)
        const hasSSL = websiteUrl.startsWith('https')

        sections.push(`- Outcomes/placement data on site: ${hasOutcomes ? 'Yes' : 'Not found'}`)
        sections.push(`- Pricing/tuition information: ${hasPricing ? 'Yes' : 'Not found'}`)
        sections.push(`- Curriculum details: ${hasCurriculum ? 'Yes' : 'Not found'}`)
        sections.push(`- Instructor information: ${hasInstructors ? 'Yes' : 'Not found'}`)
        sections.push(`- HTTPS: ${hasSSL ? 'Yes' : 'No'}`)
      } else {
        sections.push(`Website returned HTTP ${res.status} -- may be down or moved.`)
      }
    } catch (err) {
      sections.push(`Could not fetch website: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // 10. Pricing context
  if (price) {
    sections.push(`\n## Pricing Context`)
    sections.push(`Reported tuition: ${price}`)
    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10)
    if (priceNum > 20000) {
      sections.push('This is on the higher end for coding bootcamps. Make sure outcomes justify the cost.')
    } else if (priceNum > 10000) {
      sections.push('This is in the typical range for full-time immersive bootcamps ($10,000-$20,000).')
    } else if (priceNum > 0) {
      sections.push('This is on the lower end, which could indicate a shorter program, online-only delivery, or less career support.')
    }
  }

  return sections.join('\n')
}
