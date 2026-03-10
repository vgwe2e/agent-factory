import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_community',
  description:
    'Analyze the community health of a GitHub repository by checking issue response times, PR activity, community profile (CONTRIBUTING.md, CODE_OF_CONDUCT.md), and external mentions/reviews. Also searches for known problems or alternatives.',
  parameters: {
    type: 'object',
    properties: {
      owner: {
        type: 'string',
        description: 'GitHub repository owner',
      },
      repo: {
        type: 'string',
        description: 'GitHub repository name',
      },
    },
    required: ['owner', 'repo'],
  },
}

async function fetchJSON(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RepoHealthScanner/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function searchDDG(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RepoHealthScanner/1.0)' },
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
  const owner = args.owner as string
  const repo = args.repo as string
  if (!owner || !repo) return 'Error: owner and repo are required'

  const sections: string[] = []
  sections.push(`# Community Analysis: ${owner}/${repo}\n`)

  // Check recent issues and their response times
  const issues = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=10&sort=created&direction=desc`) as Array<Record<string, unknown>> | null

  if (issues && Array.isArray(issues)) {
    const actualIssues = issues.filter(i => !(i.pull_request))
    sections.push(`## Recent Issues (${actualIssues.length} of last 10)`)

    let respondedCount = 0
    for (const issue of actualIssues.slice(0, 5)) {
      const title = issue.title as string
      const state = issue.state as string
      const comments = issue.comments as number
      const created = new Date(issue.created_at as string)
      const stateEmoji = state === 'open' ? '🔵' : '🟢'

      sections.push(`- ${stateEmoji} **${title}** — ${comments} comments (${created.toISOString().split('T')[0]})`)

      if (comments > 0) respondedCount++
    }

    if (actualIssues.length > 0) {
      const responseRate = Math.round((respondedCount / Math.min(actualIssues.length, 5)) * 100)
      sections.push(`\n**Issue response rate**: ${responseRate}% of recent issues have at least one response`)
    }
  } else {
    sections.push('## Issues\nCould not fetch issue data.')
  }

  // Check recent PRs
  const pulls = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=5&sort=created&direction=desc`) as Array<Record<string, unknown>> | null

  if (pulls && Array.isArray(pulls)) {
    sections.push(`\n## Recent Pull Requests`)
    for (const pr of pulls.slice(0, 5)) {
      const title = pr.title as string
      const state = pr.state as string
      const merged = pr.merged_at != null
      const emoji = merged ? '🟣' : state === 'open' ? '🔵' : '🔴'
      sections.push(`- ${emoji} ${title} (${merged ? 'merged' : state})`)
    }
  }

  // Check community profile files
  const communityFiles = ['CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', '.github/ISSUE_TEMPLATE', 'SECURITY.md']
  sections.push('\n## Community Files')
  for (const file of communityFiles) {
    const exists = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`)
    sections.push(`- ${exists ? '✅' : '❌'} ${file}`)
  }

  // Search for external mentions/reviews
  const externalResults = await searchDDG(`"${owner}/${repo}" review OR alternative OR comparison`)
  if (externalResults.length > 0) {
    sections.push('\n## External Mentions')
    externalResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  }

  // Search for known issues
  const issueResults = await searchDDG(`"${owner}/${repo}" problem OR bug OR issue OR broken`)
  if (issueResults.length > 0) {
    sections.push('\n## Known Issues (web mentions)')
    issueResults.slice(0, 3).forEach((r, i) => {
      sections.push(`${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
    })
  }

  return sections.join('\n')
}
