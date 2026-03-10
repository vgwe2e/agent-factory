import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'fetch_domain_info',
  description:
    'Fetch foundational data about a domain: RDAP/WHOIS registration info, Wayback Machine historical snapshots, and DNS records. This reveals domain age, previous ownership, and what the domain was used for in the past. Start here.',
  parameters: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'The domain name to check (e.g. "example.com"). Do not include http:// or paths.',
      },
    },
    required: ['domain'],
  },
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

  // Strip protocol and paths
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')

  const sections: string[] = []
  sections.push(`# Domain Info: ${domain}\n`)

  // 1. RDAP lookup (replacing WHOIS)
  try {
    const res = await fetchWithTimeout(`https://rdap.org/domain/${encodeURIComponent(domain)}`)
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>
      sections.push('## Registration (RDAP)')

      // Events (registration, expiration, last changed)
      const events = data.events as Array<{ eventAction: string; eventDate: string }> | undefined
      if (events) {
        for (const ev of events) {
          const date = new Date(ev.eventDate).toISOString().split('T')[0]
          sections.push(`- **${ev.eventAction}**: ${date}`)
        }

        // Calculate domain age
        const regEvent = events.find(e => e.eventAction === 'registration')
        if (regEvent) {
          const ageDays = Math.floor((Date.now() - new Date(regEvent.eventDate).getTime()) / (1000 * 60 * 60 * 24))
          const ageYears = (ageDays / 365).toFixed(1)
          sections.push(`- **Domain age**: ${ageDays} days (~${ageYears} years)`)
          if (ageDays < 90) {
            sections.push('- \u26a0\ufe0f **Very new domain** (< 90 days) — higher risk')
          }
        }
      }

      // Status
      const status = data.status as string[] | undefined
      if (status && status.length > 0) {
        sections.push(`- **Status**: ${status.join(', ')}`)
        if (status.includes('pendingDelete') || status.includes('redemptionPeriod')) {
          sections.push('- \u26a0\ufe0f **Domain is in deletion/redemption** — previous owner abandoned it')
        }
      }

      // Nameservers
      const nameservers = data.nameservers as Array<{ ldhName: string }> | undefined
      if (nameservers && nameservers.length > 0) {
        sections.push(`- **Nameservers**: ${nameservers.map(ns => ns.ldhName).join(', ')}`)
      }

      // Registrar
      const entities = data.entities as Array<{ roles: string[]; vcardArray?: unknown[] }> | undefined
      if (entities) {
        const registrar = entities.find(e => e.roles?.includes('registrar'))
        if (registrar?.vcardArray) {
          const vcard = registrar.vcardArray as unknown[]
          if (Array.isArray(vcard[1])) {
            const fn = (vcard[1] as unknown[][]).find(
              (v: unknown[]) => v[0] === 'fn'
            )
            if (fn) {
              sections.push(`- **Registrar**: ${fn[3]}`)
            }
          }
        }
      }
    } else {
      sections.push(`## Registration (RDAP)\nRDAP lookup returned HTTP ${res.status}. Domain may not be registered or TLD not supported.`)
    }
  } catch (err) {
    sections.push(`## Registration (RDAP)\nRDAP lookup failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // 2. Wayback Machine CDX API — check historical snapshots
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=20&fl=timestamp,statuscode,mimetype&collapse=timestamp:6`
    const res = await fetchWithTimeout(cdxUrl, 15000)
    if (res.ok) {
      const data = await res.json() as string[][]
      sections.push('\n## Wayback Machine History')

      if (data.length > 1) {
        const snapshots = data.slice(1) // skip header row
        sections.push(`- **Total snapshots found**: ${snapshots.length} (showing monthly collapsed)`)

        const firstTs = snapshots[0][0]
        const lastTs = snapshots[snapshots.length - 1][0]
        const firstDate = `${firstTs.slice(0, 4)}-${firstTs.slice(4, 6)}-${firstTs.slice(6, 8)}`
        const lastDate = `${lastTs.slice(0, 4)}-${lastTs.slice(4, 6)}-${lastTs.slice(6, 8)}`
        sections.push(`- **First archived**: ${firstDate}`)
        sections.push(`- **Last archived**: ${lastDate}`)

        // Show recent snapshots
        sections.push('\n### Recent snapshots:')
        snapshots.slice(-10).forEach(snap => {
          const ts = snap[0]
          const date = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`
          const status = snap[1] || '?'
          sections.push(`- ${date} (HTTP ${status})`)
        })

        sections.push(`\nView full history: https://web.archive.org/web/*/${domain}`)
      } else {
        sections.push('- **No archived snapshots found** — domain has no web history')
        sections.push('- This could mean the domain is new, or was never used for a website')
      }
    }
  } catch (err) {
    sections.push(`\n## Wayback Machine History\nFailed to fetch: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  // 3. DNS check via public DNS-over-HTTPS (Cloudflare)
  try {
    const dnsTypes = ['A', 'MX', 'NS', 'TXT']
    sections.push('\n## DNS Records')

    for (const type of dnsTypes) {
      try {
        const res = await fetchWithTimeout(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
          5000
        )
        if (res.ok) {
          const text = await res.text()
          try {
            const data = JSON.parse(text) as { Answer?: Array<{ type: number; data: string }> }
            if (data.Answer && data.Answer.length > 0) {
              sections.push(`\n### ${type} Records`)
              data.Answer.forEach(record => {
                sections.push(`- ${record.data}`)
              })

              // Flag parking/redirect services in A records
              if (type === 'A') {
                const parkingIps = ['34.102.136.180', '185.230.63.', '198.185.159.']
                const ips = data.Answer.map(r => r.data)
                const isParked = ips.some(ip => parkingIps.some(p => ip.startsWith(p)))
                if (isParked) {
                  sections.push('- \u26a0\ufe0f **IP suggests domain may be parked or using a redirect service**')
                }
              }

              // Check for SPF/DMARC in TXT records
              if (type === 'TXT') {
                const hasSPF = data.Answer.some(r => r.data.includes('v=spf1'))
                const hasDMARC = data.Answer.some(r => r.data.includes('v=DMARC'))
                if (hasSPF) sections.push('- \u2705 SPF record found (email authentication configured)')
                if (hasDMARC) sections.push('- \u2705 DMARC record found (email authentication configured)')
              }
            }
          } catch { /* JSON parse error — skip */ }
        }
      } catch { /* individual DNS query failed — skip */ }
    }
  } catch { /* DNS section failed */ }

  return sections.join('\n')
}
