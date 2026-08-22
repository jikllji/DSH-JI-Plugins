// JI-Filable — host half.
// R4: upload is a thin orchestrator over the exported persistStream atomic
// writer (deep module, internal seam, directly unit-testable). Error codes
// are contract constants (see CONTEXT.md 协议契约). No index, no tools, no
// management routes: files are plain workspace files.
import { createHash, randomBytes } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'
import { once } from 'node:events'
import { basename, isAbsolute, join } from 'node:path'

export const name = 'JI-Filable'
export const inject = ['webServer']

/** Protocol error codes (contract — client maps these to localized text). */
export const ERR_TOO_LARGE = 'too-large'
export const ERR_SHA_MISMATCH = 'sha-mismatch'

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024
const FILES_DIR = 'sessionfiles'

export function apply(ctx, config = {}) {
  // Cordis passes config = null when the row has no config; default only
  // covers undefined.
  const cfg = config ?? {}
  const maxBytes = Number(cfg.maxBytes) > 0 ? Number(cfg.maxBytes) : DEFAULT_MAX_BYTES
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/ji-filable/files',
    handler: (req, res) => handleFiles(ctx, maxBytes, req, res),
  }), 'ji-filable: /ji-filable/files')
}

async function handleFiles(ctx, maxBytes, req, res) {
  const url = new URL(req.url || '/', 'http://localhost')
  if (req.method === 'POST' && url.pathname === '/ji-filable/files') {
    await upload(ctx, maxBytes, url, req, res)
    return
  }
  send(res, 404, { ok: false, error: 'not found' })
}

async function upload(ctx, maxBytes, url, req, res) {
  let responded = false
  const respond = (status, body) => {
    if (responded) return
    responded = true
    send(res, status, body)
  }
  if (!trusted(req)) return respond(403, { ok: false, error: 'untrusted origin' })
  const sessionId = url.searchParams.get('session') || ''
  const name = (url.searchParams.get('name') || 'file').slice(0, 255)
  const expected = String(req.headers['x-sha256'] || '').toLowerCase()
  const workspace = resolveWorkspace(ctx, sessionId)
  if (workspace === null) return respond(400, { ok: false, error: 'session workspace unknown' })
  const dir = join(workspace, FILES_DIR)
  try {
    const { path, size, sha256 } = await persistStream(req, { dir, name, maxBytes, expectedHash: expected })
    respond(201, { ok: true, file: { name: basename(path), size, sha256 } })
  } catch (error) {
    if (error?.code === ERR_TOO_LARGE) respond(413, { ok: false, error: 'file too large' })
    else if (error?.code === ERR_SHA_MISMATCH) respond(400, { ok: false, error: 'sha256 mismatch' })
    else respond(500, { ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

/**
 * Atomic writer (deep module). Streams raw bytes into <dir>/<sanitized unique
 * name>, computing sha256 while writing; tmp + rename so the destination never
 * shows a partial file. Returns { path, size, sha256 }.
 * @param {import('node:stream').Readable} req - async-iterable byte source
 * @param {{dir: string, name: string, maxBytes: number, expectedHash?: string}} options
 * @throws {{code: 'too-large'}} after draining the source past maxBytes
 * @throws {{code: 'sha-mismatch'}} when expectedHash is set and differs
 */
export async function persistStream(req, { dir, name, maxBytes, expectedHash = '' }) {
  await mkdir(dir, { recursive: true })
  const finalPath = uniquePath(dir, sanitizeName(name))
  const tmp = join(dir, `.tmp-${randomBytes(8).toString('hex')}`)
  const hash = createHash('sha256')
  let out = null
  let size = 0
  try {
    for await (const chunk of req) {
      size += chunk.length
      if (size > maxBytes) {
        req.resume() // drain the remainder so the connection stays reusable
        const error = new Error('file too large')
        error.code = ERR_TOO_LARGE
        throw error
      }
      hash.update(chunk)
      if (out === null) out = createWriteStream(tmp, { flags: 'wx' })
      if (!out.write(chunk)) await once(out, 'drain')
    }
    // Zero-byte uploads never reach the stream creation above — create it here.
    if (out === null) out = createWriteStream(tmp, { flags: 'wx' })
    await new Promise((resolve, reject) => {
      out.once('error', reject)
      out.end(() => resolve())
    })
    const sha256 = hash.digest('hex')
    if (expectedHash !== '' && expectedHash !== sha256) {
      const error = new Error('sha256 mismatch')
      error.code = ERR_SHA_MISMATCH
      throw error
    }
    await rename(tmp, finalPath)
    return { path: finalPath, size, sha256 }
  } finally {
    // Close the handle before deleting — on Windows rm of an open file fails.
    // 'close' may already have fired by now, so wait with a bounded race.
    if (out !== null) {
      out.destroy()
      if (!out.closed) {
        await Promise.race([
          new Promise(resolve => out.once('close', resolve)),
          new Promise(resolve => setTimeout(resolve, 250)),
        ]).catch(() => { /* already closed */ })
      }
    }
    await rm(tmp, { force: true }).catch(() => { /* best-effort cleanup */ })
  }
}

/** Authoritative-only workspace resolution: the session's header.cwd. No
 * client-reported fallback — an unknown session must fail closed rather than
 * allow writes outside its workspace. */
function resolveWorkspace(ctx, sessionId) {
  try {
    const sessions = ctx.get('sessions')
    const cwd = sessions?.get(sessionId)?.header?.cwd
    if (typeof cwd === 'string' && cwd !== '' && isAbsolute(cwd)) return cwd
  } catch { /* not resolvable */ }
  return null
}

/** Strip path-hostile characters and leading dots; keep the extension. */
function sanitizeName(name) {
  const cleaned = name.replace(/[\\/:*?"<>|\r\n]/g, '_').replace(/^\.+/, '')
  return cleaned === '' ? 'file' : cleaned.slice(0, 200)
}

/** Avoid clobbering an existing file: "name (1).ext", "name (2).ext", … */
function uniquePath(dir, name) {
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let candidate = name
  let n = 1
  while (existsSync(join(dir, candidate))) {
    candidate = `${stem} (${n})${ext}`
    n += 1
  }
  return join(dir, candidate)
}

/** Loopback-only trust fence: plugin routes have no /api trust fence of their own. */
function trusted(req) {
  const raw = String(req.headers.host || '').toLowerCase()
  const host = raw.startsWith('[') ? raw.slice(1, raw.indexOf(']')) : raw.split(':')[0]
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    const hostname = new URL(origin).hostname.toLowerCase()
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'
  } catch {
    return false
  }
}

function send(res, status, body) {
  if (res.headersSent) return
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}
