/**
 * R4 — build-client drift test: the deployed lib/client.js must equal the
 * generated output (tested module = running code). A drift here means someone
 * hand-edited the generated bundle or forgot to rebuild after editing the
 * template/drop-logic.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildClient } from '../scripts/build-client.mjs'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('build-client drift (R4)', () => {
  it('deployed lib/client.js equals the generated output', () => {
    const generated = buildClient({ write: false })
    const deployed = readFileSync(join(PKG, 'lib', 'client.js'), 'utf8')
    expect(generated).toBe(deployed)
  })

  it('generated output has no leftover inline marker', () => {
    const generated = buildClient({ write: false })
    expect(generated.split('__DROP_LOGIC_INLINE__').length).toBe(1)
  })
})
