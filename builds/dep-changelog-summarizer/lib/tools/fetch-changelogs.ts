import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'fetch_changelogs',
  description:
    'Fetch recent release notes and changelogs for a specific npm/PyPI package from its GitHub repository. Searches for the package, finds its repo, and extracts the latest release notes. Focus on breaking changes and migration notes.',
  parameters: {
    type: 'object',
    properties: {
      package_name: {
        type: 'string',
        description: 'Name of the package (e.g. "react", "express", "django")',
      },
      current_version: {
        type: 'string',
        description: 'The current version installed (e.g. "^18.2.0")',
      },
      ecosystem: {
        type: 'string',
        description: 'Package ecosystem: "npm", "pypi", or "rubygems"',
      },
    },
    required: ['package_name'],
  },
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DepChangelog/1.0)' },
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
}

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DepChangelog/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return ''

    const html = await res.text()
    const { Readability } = await import('@mozilla/readability')
    const { parseHTML } = await import('linkedom')
    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const article = reader.parse()

    if (article?.textContent) {
      return article.textContent.trim().slice(0, 5000)
    }

    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
  } catch {
    return ''
  }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const packageName = args.package_name as string
  const currentVersion = (args.current_version as string) || 'unknown'
  const ecosystem = (args.ecosystem as string) || 'npm'

  if (!packageName) return 'Error: package_name is required'

  const sections: string[] = []
  sections.push(`# Changelog: ${packageName} (current: ${currentVersion})\n`)

  // Try GitHub releases page first
  const searchQuery = `${packageName} github releases changelog`
  const searchResults = await searchDDG(searchQuery)

  let releasesUrl = ''
  let changelogContent = ''

  // Find GitHub releases URL
  for (const result of searchResults) {
    if (result.url.includes('github.com') && (result.url.includes('/releases') || result.url.includes('/blob'))) {
      releasesUrl = result.url
      break
    }
  }

  if (releasesUrl) {
    sections.push(`## Source: ${releasesUrl}\n`)
    changelogContent = await fetchPage(releasesUrl)
  }

  // Fallback: try npm/PyPI page
  if (!changelogContent) {
    let registryUrl = ''
    if (ecosystem === 'npm') {
      registryUrl = `https://www.npmjs.com/package/${packageName}`
    } else if (ecosystem === 'pypi') {
      registryUrl = `https://pypi.org/project/${packageName}/`
    }

    if (registryUrl) {
      sections.push(`## Source: ${registryUrl}\n`)
      changelogContent = await fetchPage(registryUrl)
    }
  }

  // Also search for breaking changes specifically
  const breakingResults = await searchDDG(`${packageName} breaking changes migration guide ${currentVersion}`)

  if (changelogContent) {
    sections.push('## Recent Release Notes\n')
    sections.push(changelogContent.slice(0, 3000))
  } else {
    sections.push('## Release Notes\nCould not fetch release notes directly.\n')
  }

  if (breakingResults.length > 0) {
    sections.push('\n## Related Resources (Breaking Changes / Migration)')
    breakingResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  }

  sections.push(`\n---\nAnalyze the above and summarize: latest version, key changes since ${currentVersion}, any breaking changes, and urgency level (critical/high/medium/low).`)

  return sections.join('\n')
}
