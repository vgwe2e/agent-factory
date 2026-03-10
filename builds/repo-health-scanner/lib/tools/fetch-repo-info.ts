import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'fetch_repo_info',
  description:
    'Fetch comprehensive information about a GitHub repository: README content, star count, recent commits, open issues, license, and general metadata. Accepts a GitHub URL or owner/repo format.',
  parameters: {
    type: 'object',
    properties: {
      repo: {
        type: 'string',
        description: 'GitHub repository — either full URL (https://github.com/owner/repo) or shorthand (owner/repo)',
      },
    },
    required: ['repo'],
  },
}

function parseRepo(input: string): { owner: string; repo: string } | null {
  // Handle full URL
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') }

  // Handle owner/repo format
  const shortMatch = input.match(/^([^/\s]+)\/([^/\s]+)$/)
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] }

  return null
}

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'RepoHealthScanner/1.0',
      Accept: 'application/vnd.github.v3+json',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return null
  return res.json()
}

async function fetchText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RepoHealthScanner/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return ''
    return res.text()
  } catch {
    return ''
  }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const repoInput = args.repo as string
  if (!repoInput) return 'Error: repo is required'

  const parsed = parseRepo(repoInput)
  if (!parsed) return `Error: Could not parse "${repoInput}" as a GitHub repository. Use format: owner/repo or https://github.com/owner/repo`

  const { owner, repo } = parsed
  const sections: string[] = []
  sections.push(`# Repository Info: ${owner}/${repo}\n`)

  // Fetch repo metadata from GitHub API
  const repoData = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}`) as Record<string, unknown> | null

  if (!repoData) {
    return `Error: Could not fetch repository data for ${owner}/${repo}. The repo may not exist, be private, or GitHub API rate limit may be exceeded.`
  }

  // Basic metadata
  sections.push('## Metadata')
  sections.push(`- **Description**: ${repoData.description || 'None'}`)
  sections.push(`- **Stars**: ${repoData.stargazers_count}`)
  sections.push(`- **Forks**: ${repoData.forks_count}`)
  sections.push(`- **Open Issues**: ${repoData.open_issues_count}`)
  sections.push(`- **Language**: ${repoData.language || 'Unknown'}`)
  sections.push(`- **License**: ${(repoData.license as Record<string, unknown>)?.spdx_id || 'None'}`)
  sections.push(`- **Created**: ${repoData.created_at}`)
  sections.push(`- **Last Push**: ${repoData.pushed_at}`)
  sections.push(`- **Default Branch**: ${repoData.default_branch}`)
  sections.push(`- **Archived**: ${repoData.archived}`)
  sections.push(`- **Topics**: ${(repoData.topics as string[])?.join(', ') || 'None'}`)

  // Recent commits
  const commits = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`) as Array<Record<string, unknown>> | null
  if (commits && Array.isArray(commits)) {
    sections.push('\n## Recent Commits (last 5)')
    for (const commit of commits) {
      const c = commit.commit as Record<string, unknown>
      const author = (c.author as Record<string, unknown>)?.name || 'Unknown'
      const date = (c.author as Record<string, unknown>)?.date || ''
      const msg = (c.message as string)?.split('\n')[0] || ''
      sections.push(`- ${date} — ${author}: ${msg}`)
    }
  }

  // Contributors count
  const contributors = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`) as Array<unknown> | null
  if (contributors && Array.isArray(contributors)) {
    sections.push(`\n## Contributors: ${contributors.length}+ (showing first page)`)
  }

  // README
  const readmeContent = await fetchText(`https://raw.githubusercontent.com/${owner}/${repo}/${repoData.default_branch}/README.md`)
  if (readmeContent) {
    sections.push('\n## README (first 2000 chars)')
    sections.push(readmeContent.slice(0, 2000))
  } else {
    sections.push('\n## README\n⚠️ No README.md found — this is a significant health issue.')
  }

  return sections.join('\n')
}
