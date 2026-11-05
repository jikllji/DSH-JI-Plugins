/**
 * Build the deployable lib/client.js classic-script bundle from
 * lib/client.template.js + lib/drop-logic.js (single source of truth inlined
 * so the tested module equals the running code). Plain Node, no deps.
 *   node scripts/build-client.mjs   → writes lib/client.js
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MARKER = '__DROP_LOGIC_INLINE__'

/** @param {{write?: boolean}} opts */
export function buildClient({ write = true } = {}) {
  const logic = readFileSync(join(ROOT, 'lib', 'drop-logic.js'), 'utf8')
  const stripped = logic.replace(/^export\s+/gm, '').trim()
  const template = readFileSync(join(ROOT, 'lib', 'client.template.js'), 'utf8')
  const parts = template.split(MARKER)
  if (parts.length !== 2) throw new Error(`client.template.js must contain the ${MARKER} marker exactly once (found ${parts.length - 1})`)
  const output = parts.join(stripped)
  if (write) writeFileSync(join(ROOT, 'lib', 'client.js'), output)
  return output
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildClient()
  console.log('built lib/client.js from lib/client.template.js + lib/drop-logic.js')
}
