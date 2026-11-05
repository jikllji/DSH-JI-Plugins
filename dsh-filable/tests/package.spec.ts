/**
 * T01 smoke tests: the package row must load and mount cleanly through the
 * real vendored Loader (prior art: packages/host/webserver/tests/webserver.spec.ts).
 */
import { describe, expect, it } from 'vitest'
import * as dshFilable from '../dsh/index.js'
import { loadComposition } from './helpers.js'

describe('dsh-filable package (T01)', () => {
  it('host module is a mountable Cordis plugin', () => {
    expect(typeof dshFilable.apply).toBe('function')
    expect(Array.isArray(dshFilable.inject)).toBe(true)
    expect(dshFilable.inject).toContain('webServer')
  })

  it('plugin row mounts through the real Loader without waiting', async () => {
    const comp = await loadComposition()
    try {
      const unloaded = [...comp.context.loader.entries()]
        .filter(entry => entry.fiber === undefined && !entry.disabled)
        .map(entry => entry.options.name)
      expect(unloaded).toEqual([])
    } finally {
      await comp.teardown()
    }
  })
})
