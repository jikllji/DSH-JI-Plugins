/**
 * R3 — upload route: raw byte-stream upload into <workspace>/sessionfiles/
 * with the original file name, exercised over real HTTP through the real
 * Loader + real webserver (see helpers.ts). The workspace comes only from the
 * sessions stub's header.cwd — no client-reported fallback. No index, no
 * tools, no management routes.
 */
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { request } from 'node:http'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadComposition, type Composition } from './helpers.js'

let comp: Composition | undefined

afterEach(async () => {
  await comp?.teardown()
  comp = undefined
})

async function start(opts?: { maxBytes?: number }): Promise<Composition> {
  comp = await loadComposition(opts)
  return comp
}

const sha256 = (data: Uint8Array | string): string => createHash('sha256').update(data).digest('hex')

function upload(port: number, session: string, name: string, body: Uint8Array, headers: Record<string, string> = {}): Promise<Response> {
  const params = new URLSearchParams({ session, name })
  const h = { ...headers }
  if (h['x-sha256'] === undefined) h['x-sha256'] = sha256(body)
  return fetch(`http://127.0.0.1:${port}/dsh-filable/files?${params.toString()}`, {
    method: 'POST',
    headers: h,
    body,
  })
}

/** The server sends its response before the finally block finishes tmp cleanup — poll until it is gone. */
async function expectClean(dir: string): Promise<void> {
  const deadline = Date.now() + 3000
  while (Date.now() < deadline) {
    const entries = await readdir(dir).catch(() => [] as string[])
    if (!entries.some(entry => entry.startsWith('.tmp-'))) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`tmp file was not cleaned up in ${dir}`)
}

describe('dsh-filable upload route (R3)', () => {
  it('stores a raw byte stream losslessly under the original name in workspace/sessionfiles', async () => {
    const { port, workspace } = await start()
    const bytes = new TextEncoder().encode('hello dsh-filable — 无损字节流测试')
    const response = await upload(port, 's1', 'hello.txt', bytes)
    expect(response.status).toBe(201)
    const body = await response.json() as { ok: boolean; file: Record<string, unknown> }
    expect(body.ok).toBe(true)
    expect(body.file.name).toBe('hello.txt')
    expect(body.file.size).toBe(bytes.length)
    expect(body.file.sha256).toBe(sha256(bytes))
    const stored = await readFile(join(workspace, 'sessionfiles', 'hello.txt'))
    expect(stored.equals(Buffer.from(bytes))).toBe(true)
  })

  it('accepts zero-byte files', async () => {
    const { port, workspace } = await start()
    const empty = new Uint8Array(0)
    const response = await upload(port, 's1', 'empty.txt', empty)
    expect(response.status).toBe(201)
    const body = await response.json() as { file: { size: number } }
    expect(body.file.size).toBe(0)
    const stored = await readFile(join(workspace, 'sessionfiles', 'empty.txt'))
    expect(stored.length).toBe(0)
  })

  it('rejects a mismatched client sha256 without leaving a file', async () => {
    const { port, workspace } = await start()
    const bytes = new TextEncoder().encode('tampered payload')
    const response = await upload(port, 's1', 'a.bin', bytes, { 'x-sha256': '00'.repeat(32) })
    expect(response.status).toBe(400)
    await expectClean(join(workspace, 'sessionfiles'))
  })

  it('rejects over-limit bodies with 413 and no partial file', async () => {
    const { port, workspace } = await start({ maxBytes: 8 })
    const bytes = new TextEncoder().encode('this payload is way too long for the cap')
    const response = await upload(port, 's1', 'big.bin', bytes)
    expect(response.status).toBe(413)
    await expectClean(join(workspace, 'sessionfiles'))
  })

  it('rejects untrusted Host headers', async () => {
    const { port } = await start()
    const bytes = Buffer.from('evil')
    const result = await new Promise<{ status: number }>((resolve, reject) => {
      const req = request({
        host: '127.0.0.1',
        port,
        path: '/dsh-filable/files?session=s1&name=e.bin',
        method: 'POST',
        headers: { host: 'evil.example', 'content-length': String(bytes.length) },
      }, (res) => {
        res.resume()
        res.on('end', () => resolve({ status: res.statusCode ?? 0 }))
      })
      req.on('error', reject)
      req.end(bytes)
    })
    expect(result.status).toBe(403)
  })

  it('rejects untrusted Origin headers', async () => {
    const { port } = await start()
    const bytes = Buffer.from('evil origin')
    const result = await new Promise<{ status: number }>((resolve, reject) => {
      const req = request({
        host: '127.0.0.1',
        port,
        path: '/dsh-filable/files?session=s1&name=e.bin',
        method: 'POST',
        headers: {
          host: `127.0.0.1:${String(port)}`,
          origin: 'http://evil.example',
          'content-length': String(bytes.length),
        },
      }, (res) => {
        res.resume()
        res.on('end', () => resolve({ status: res.statusCode ?? 0 }))
      })
      req.on('error', reject)
      req.end(bytes)
    })
    expect(result.status).toBe(403)
  })

  it('refuses when the session has no recorded workspace', async () => {
    const { port, workspace } = await start()
    const bytes = new TextEncoder().encode('x')
    // The sessions stub returns no header.cwd for the 'unknown' session.
    const response = await upload(port, 'unknown', 'nope.txt', bytes)
    expect(response.status).toBe(400)
    expect(await readdir(join(workspace, 'sessionfiles')).catch(() => [] as string[])).toEqual([])
  })

  it('avoids clobbering on name collisions', async () => {
    const { port, workspace } = await start()
    const first = new TextEncoder().encode('first version')
    const second = new TextEncoder().encode('second version')
    await upload(port, 's1', 'doc.txt', first)
    await upload(port, 's1', 'doc.txt', second)
    const files = await readdir(join(workspace, 'sessionfiles'))
    expect(files.sort()).toEqual(['doc (1).txt', 'doc.txt'])
    expect((await readFile(join(workspace, 'sessionfiles', 'doc.txt'))).toString()).toBe('first version')
    expect((await readFile(join(workspace, 'sessionfiles', 'doc (1).txt'))).toString()).toBe('second version')
  })

  it('has no management routes (GET/DELETE are 404)', async () => {
    const { port } = await start()
    expect((await fetch(`http://127.0.0.1:${port}/dsh-filable/files`)).status).toBe(404)
    expect((await fetch(`http://127.0.0.1:${port}/dsh-filable/files/${'f'.repeat(64)}?session=s1`, { method: 'DELETE' })).status).toBe(404)
  })
})
