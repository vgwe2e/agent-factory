import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'check_domain_reputation',
  description:
    'Check a domain\'s reputation across security databases and the web. Searches for blacklist appearances, malware reports, phishing flags, spam history, Google Safe Browsing status, and any mentions in security incident reports. Use after fetch_domain_info.',
  parameters: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'The domain name to check (e.g. "example.com")',
      },
    },
    required: ['domain'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HauntedDomainChecker/1.0)' },
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

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': 'HauntedDomainChecker/1.0' },
    signal: AbortSignal.timeout(timeout),
  })
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  let domain = (args.domain as string || '').trim().toLowerCase()
  if (!domain) return 'Error: domain is required'

  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')

  const sections: string[] = []
  sections.push(`# Domain Reputation Check: ${domain}\n`)

  // 1. Search for blacklist / spam / malware reports
  const blacklistResults = await searchDDG(`"${domain}" blacklisted spam malware phishing blocked`)
  sections.push('## Blacklist & Security Reports')
  if (blacklistResults.length > 0) {
    const relevant = blacklistResults.filter(r =>
      r.title.toLowerCase().includes(domain) ||
      r.snippet.toLowerCase().includes(domain)
    )
    if (relevant.length > 0) {
      sections.push('\u26a0\ufe0f **Found mentions of this domain in security/blacklist contexts:**')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('No specific blacklist mentions found for this domain (positive signal).')
    }
  } else {
    sections.push('No blacklist or malware reports found in web search (positive signal).')
  }

  // 2. Search for phishing / scam reports
  const phishingResults = await searchDDG(`"${domain}" phishing scam fraud report`)
  sections.push('\n## Phishing & Scam Reports')
  if (phishingResults.length > 0) {
    const relevant = phishingResults.filter(r =>
      r.snippet.toLowerCase().includes(domain)
    )
    if (relevant.length > 0) {
      sections.push('\u26a0\ufe0f **Found phishing/scam mentions:**')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('No phishing or scam reports found specifically for this domain.')
    }
  } else {
    sections.push('No phishing reports found (positive signal).')
  }

  // 3. Google Safe Browsing transparency report lookup
  sections.push('\n## Google Safe Browsing')
  sections.push(`Check manually: https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(domain)}`)

  const gsbResults = await searchDDG(`site:transparencyreport.google.com "${domain}" OR "${domain}" unsafe deceptive site warning`)
  if (gsbResults.length > 0) {
    const flagged = gsbResults.filter(r =>
      r.snippet.toLowerCase().includes('unsafe') ||
      r.snippet.toLowerCase().includes('deceptive') ||
      r.snippet.toLowerCase().includes('dangerous')
    )
    if (flagged.length > 0) {
      sections.push('\u26a0\ufe0f **Google may have flagged this domain:**')
      flagged.forEach((r, i) => {
        sections.push(`${i + 1}. ${r.snippet}`)
      })
    } else {
      sections.push('No Google Safe Browsing warnings found in search.')
    }
  } else {
    sections.push('No Google Safe Browsing issues detected in web search.')
  }

  // 4. Email reputation check — search for spam reports
  const emailResults = await searchDDG(`"${domain}" email spam reputation blacklist sender score`)
  sections.push('\n## Email Reputation')
  if (emailResults.length > 0) {
    const relevant = emailResults.filter(r =>
      r.snippet.toLowerCase().includes(domain)
    )
    if (relevant.length > 0) {
      sections.push('Found email reputation mentions:')
      relevant.forEach((r, i) => {
        sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      })
    } else {
      sections.push('No email reputation issues found.')
    }
  } else {
    sections.push('No email reputation issues found (positive signal).')
  }

  // 5. Check VirusTotal page (can't use API without key, but search for results)
  const vtResults = await searchDDG(`site:virustotal.com "${domain}"`)
  sections.push('\n## VirusTotal')
  sections.push(`Check manually: https://www.virustotal.com/gui/domain/${encodeURIComponent(domain)}`)
  if (vtResults.length > 0) {
    sections.push('VirusTotal has analyzed this domain. Check the link above for detailed results.')
    vtResults.slice(0, 2).forEach((r, i) => {
      sections.push(`${i + 1}. ${r.snippet}`)
    })
  } else {
    sections.push('No VirusTotal results found in web search.')
  }

  // 6. Check for previous use / what the domain was known for
  const historyResults = await searchDDG(`"${domain}" -site:${domain} review history previous`)
  sections.push('\n## Domain History & Mentions')
  if (historyResults.length > 0) {
    sections.push('What the web says about this domain:')
    historyResults.slice(0, 4).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  } else {
    sections.push('No significant web mentions found for this domain.')
  }

  return sections.join('\n')
}
