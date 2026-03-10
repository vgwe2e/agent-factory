import { readFile } from 'fs/promises'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'scan_dependencies',
  description:
    'Scan a project\'s dependency file (package.json, requirements.txt, or Gemfile) and extract a list of dependencies with their current versions. Returns a structured list ready for changelog lookup. Use this as the first step.',
  parameters: {
    type: 'object',
    properties: {
      filepath: {
        type: 'string',
        description: 'Path to the dependency file (e.g. "package.json", "./requirements.txt")',
      },
    },
    required: ['filepath'],
  },
}

interface Dep {
  name: string
  version: string
  type: string
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filepath = args.filepath as string
  if (!filepath) return 'Error: filepath is required'

  try {
    const content = await readFile(filepath, 'utf-8')
    const deps: Dep[] = []

    if (filepath.endsWith('package.json')) {
      const pkg = JSON.parse(content)

      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          deps.push({ name, version: String(version), type: 'production' })
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          deps.push({ name, version: String(version), type: 'dev' })
        }
      }
    } else if (filepath.endsWith('requirements.txt')) {
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
      for (const line of lines) {
        const match = line.match(/^([a-zA-Z0-9_.-]+)\s*(?:==|>=|~=|!=|<=)?\s*(.*)$/)
        if (match) {
          deps.push({ name: match[1], version: match[2] || 'latest', type: 'production' })
        }
      }
    } else if (filepath.endsWith('Gemfile')) {
      const lines = content.split('\n').filter(l => l.trim().startsWith('gem '))
      for (const line of lines) {
        const match = line.match(/gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"'])?/)
        if (match) {
          deps.push({ name: match[1], version: match[2] || 'latest', type: 'production' })
        }
      }
    } else {
      return `Error: Unsupported file format. Supported: package.json, requirements.txt, Gemfile`
    }

    if (deps.length === 0) {
      return 'No dependencies found in the specified file.'
    }

    const lines = [`# Dependencies found in ${filepath}`, `Total: ${deps.length}`, '']
    const prod = deps.filter(d => d.type === 'production')
    const dev = deps.filter(d => d.type === 'dev')

    if (prod.length > 0) {
      lines.push(`## Production (${prod.length})`)
      prod.forEach(d => lines.push(`- ${d.name}@${d.version}`))
    }
    if (dev.length > 0) {
      lines.push(`\n## Dev (${dev.length})`)
      dev.forEach(d => lines.push(`- ${d.name}@${d.version}`))
    }

    lines.push('\nUse fetch_changelogs to look up recent changes for the most critical dependencies.')

    return lines.join('\n')
  } catch (err) {
    return `Error reading ${filepath}: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
