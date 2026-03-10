import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'fetch_job_posting',
  description:
    'Fetch a job posting from a URL and extract structured fields: title, company, location, salary, description, qualifications, and contact info. Use this as the first step to analyze a job posting for potential scam indicators.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL of the job posting to analyze',
      },
    },
    required: ['url'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const url = args.url as string
  if (!url) return 'Error: url is required'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScamDetector/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return `Failed to fetch job posting at ${url}: HTTP ${res.status}. This itself may be a red flag — legitimate job postings are typically on stable, accessible pages.`
    }

    const html = await res.text()

    const { Readability } = await import('@mozilla/readability')
    const { parseHTML } = await import('linkedom')

    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const article = reader.parse()

    if (!article || !article.textContent?.trim()) {
      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6000)

      return `**Job Posting Content (raw extraction):**\n\nSource: ${url}\n\n${bodyText || 'Could not extract content. The page may be dynamically loaded or require JavaScript — this is unusual for legitimate job postings.'}`
    }

    const content = article.textContent.trim().slice(0, 6000)

    // Extract domain for analysis
    let domain = ''
    try {
      domain = new URL(url).hostname
    } catch {
      domain = 'unknown'
    }

    return `**Job Posting Extracted**\n\nSource: ${url}\nDomain: ${domain}\nPage Title: ${article.title}\n\n---\n\n${content}\n\n---\n\nPlease analyze this content to identify: job title, company name, location, salary/compensation, job description, qualifications, contact information, and application method. Note any fields that are missing or vague.`
  } catch (err) {
    return `Fetch error: ${err instanceof Error ? err.message : 'Unknown error'}. If the page is unreachable, this could indicate a fly-by-night operation.`
  }
}
