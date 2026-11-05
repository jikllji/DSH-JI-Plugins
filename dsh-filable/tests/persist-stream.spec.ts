/**
 * R4 — direct unit tests for the persistStream atomic writer (deep module,
 * internal seam). These pin the branches that used to live inside the HTTP
 * upload handler and could only be observed via polling.
 */
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { ERR_SHA_MISMATCH, ERR_TOO_LARGE, persistStream } from '../dsh/index.js'

let root: string | undefined

afterEach(async () => {
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

async function tempDir(): Promise<string> {
  root = await mkdtemp(join(tmpdir(), 'dsh-filable-writer-'))
  return root
}

const sha256 = (data: Uint8Array | string): string => createHash('sha256').update(data).digest('hex')
const MB = 1024 * 1024

describe('persistStream (R4)', () => {
  it('streams bytes atomically under the original name with no tmp left behind', async () => {
    const dir = await tempDir()
    const bytes = Buffer.from('hello persistStream — 无损')
    const result = await persistStream(Readable.from([bytes]), { dir, name: 'a.txt', maxBytes: MB })
    expect(result.sha256).toBe(sha256(bytes))
    expect(result.size).toBe(bytes.length)
    expect(result.path).toBe(join(dir, 'a.txt'))
    expect((await readFile(join(dir, 'a.txt'))).equals(bytes)).toBe(true)
    expect(await readdir(dir)).toEqual(['a.txt'])
  })

  it('accepts zero-byte files', async () => {
    const dir = await tempDir()
    const result = await persistStream(Readable.from([]), { dir, name: 'e.txt', maxBytes: MB })
    expect(result.size).toBe(0)
    expect(result.sha256).toBe(sha256(''))
    expect((await readFile(join(dir, 'e.txt'))).length).toBe(0)
  })

  it('avoids clobbering with "name (1).ext"', async () => {
    const dir = await tempDir()
    await persistStream(Readable.from([Buffer.from('one')]), { dir, name: 'd.txt', maxBytes: MB })
    const second = await persistStream(Readable.from([Buffer.from('two')]), { dir, name: 'd.txt', maxBytes: MB })
    expect(second.path).toBe(join(dir, 'd (1).txt'))
    expect((await readFile(join(dir, 'd (1).txt'))).toString()).toBe('two')
    expect((await readdir(dir)).sort()).toEqual(['d (1).txt', 'd.txt'])
  })

  it('throws too-large past the cap and leaves no tmp', async () => {
    const dir = await tempDir()
    await expect(
      persistStream(Readable.from([Buffer.alloc(64, 1)]), { dir, name: 'b.bin', maxBytes: 8 }),
    ).rejects.toMatchObject({ code: ERR_TOO_LARGE })
    expect(await readdir(dir)).toEqual([])
  })

  it('throws sha-mismatch and leaves no tmp', async () => {
    const dir = await tempDir()
    await expect(
      persistStream(Readable.from([Buffer.from('payload')]), { dir, name: 'm.bin', maxBytes: MB, expectedHash: '00'.repeat(64) }),
    ).rejects.toMatchObject({ code: ERR_SHA_MISMATCH })
    expect(await readdir(dir)).toEqual([])
  })
})
