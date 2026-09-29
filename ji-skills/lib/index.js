// ji-skills — host half.
//
// Skills live in the host skill registry, not in a preset: a preset is a
// composition row (DSH 0.1.7+), so it owns no directory. A preset's own skills
// are read through its scope lease — the same contract DSH's session skill
// catalog uses (packages/api/session-controller/src/skill-catalog.ts).
//
// Global is the deployment's user-level skill roots: the very directories every
// preset's `skill-filesystem` row scans (`<dshHome>/skills` + `<agentsHome>/skills`,
// see packages/skill/skill-filesystem/src/index.ts). Reading them directly is
// both simpler and truer than intersecting preset catalogs — it needs no preset
// list, and it still holds when a deployment has a single preset.

import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'ji-skills'
export const inject = ['webServer', 'agentPresets']

/** Identity of one skill. The name is the handle every surface uses (this page,
 * `skills.lookup`, the @-mention grammar); `path` is provider-supplied and
 * optional, so it cannot be the cross-scope identity. */
function keyOf(skill) {
  return String(skill.name)
}

/** First row per identity, order preserved. */
function dedupe(rows) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = keyOf(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** One skill as the settings page reads it. */
function toSkill(skill) {
  return {
    name: String(skill.name),
    description: skill.description === undefined ? '' : String(skill.description),
  }
}

/** The user-level roots every preset's `skill-filesystem` row scans.
 * Defaults mirror that row's config (`$DSH_HOME` or `~/.dsh`). */
function userSkillRoots() {
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join(homedir(), '.agents')
  return [join(dshHome, 'skills'), join(agentsHome, 'skills')]
}

/** `name`/`description` out of a SKILL.md's leading YAML frontmatter.
 * ponytail: single-line scalars only — block scalars (`>-`, `|`) come out
 * verbatim, which no skill here uses. */
function frontmatter(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return {}
  const meta = {}
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') break
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (match === null) continue
    let value = match[2].trim()
    const quoted =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    if (quoted) value = value.slice(1, -1)
    meta[match[1]] = value
  }
  return meta
}

/** Every skill under the user roots, sorted by name. */
async function readUserSkills() {
  const rows = []
  for (const root of userSkillRoots()) {
    let entries
    try {
      entries = await readdir(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const file = entry.isDirectory()
        ? join(root, entry.name, 'SKILL.md')
        : entry.isFile() && entry.name.endsWith('.md')
          ? join(root, entry.name)
          : undefined
      if (file === undefined) continue
      let text
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue // 目录里没有 SKILL.md：那不是一个技能
      }
      const meta = frontmatter(text)
      const fallback = entry.isDirectory() ? entry.name : entry.name.replace(/\.md$/, '')
      rows.push({ name: String(meta.name ?? fallback), description: String(meta.description ?? '') })
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

/** The "global" group plus one group per declared preset holding what that
 * preset adds on top of it.
 * @param {{ get: (name: string) => unknown, agentPresets?: object }} ctx
 */
export async function listSkills(ctx) {
  const skills = ctx.get('skills')
  if (skills === undefined) return { groups: [] }

  // A deployment-level provider (a repository plugin, a host `skill-filesystem`
  // row) lands in the host layer, which is global by construction.
  const hostRows = await skills.list({}).catch(() => [])

  let presets = []
  try {
    presets = await ctx.agentPresets.list()
  } catch {
    presets = []
  }

  const reads = []
  for (const preset of presets) {
    let rows = []
    let lease
    try {
      lease = await ctx.agentPresets.acquireScope(preset.id)
      rows = await skills.list({ scope: lease.key })
    } catch {
      rows = []
    } finally {
      if (lease !== undefined) await lease[Symbol.asyncDispose]()
    }
    reads.push({ preset, rows })
  }

  const globalRows = dedupe([...hostRows, ...(await readUserSkills())])
  const globalKeys = new Set(globalRows.map(keyOf))

  const groups = [{ id: 'global', label: 'Global', skills: globalRows.map(toSkill) }]
  for (const { preset, rows } of reads) {
    groups.push({
      id: preset.id,
      label: preset.name || preset.id,
      skills: dedupe(rows.filter((row) => !globalKeys.has(keyOf(row)))).map(toSkill),
    })
  }
  return { groups }
}

export function apply(ctx) {
  const webServer = ctx.webServer

  const send = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  }

  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: '/api/skills-settings',
    handler: async (req, res) => {
      try {
        const url = new URL(req.url ?? '/', 'http://dsh.local')
        const path = url.pathname
        const method = (req.method ?? 'GET').toUpperCase()
        if (method === 'GET' && path === '/api/skills-settings/list') {
          const data = await listSkills(ctx)
          return send(res, 200, data)
        }
        return send(res, 404, { ok: false, error: 'not-found' })
      } catch (err) {
        return send(res, 500, { ok: false, error: String(err?.message ?? err) })
      }
    },
  }), 'dsh-skills-settings.rest')
}
