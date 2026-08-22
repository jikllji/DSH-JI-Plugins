/**
 * JI-Theme — host half.
 *
 * Wallpaper-as-files: the browser half uploads wallpaper bytes as base64 JSON,
 * the host stores them as real files under <plugin-dir>/wallpapers/ and serves
 * them back over HTTP so CSS `background-image: url(...)` works. localStorage
 * keeps only the URL reference (theme.background = "/ji-theme/wallpapers/<name>").
 *
 * Routes (registered on the webServer service, prefix /ji-theme/wallpapers):
 *   GET    /ji-theme/wallpapers/contract  -> { mediaTypes, maxImageBytes, urlPrefix, errorCodes }
 *   POST   /ji-theme/wallpapers          { mediaType, dataBase64 } -> { url }
 *   GET    /ji-theme/wallpapers          -> { path }  (storage location for UI)
 *   GET    /ji-theme/wallpapers/<name>   -> image bytes, correct content-type
 *   DELETE /ji-theme/wallpapers/<name>   -> remove the file (idempotent)
 *
 * Errors cross the seam as { code, message } (Q4-A): the code is the stable
 * contract (see lib/contract.js ERROR_CODES), the message is a fallback the
 * browser half shows only when its locale has no mapping for the code.
 *
 * Design decisions (from the wallpaper-files spec + C1 architecture review):
 *   - The wallpaper contract (media types, size cap, name rules, error codes)
 *     lives ONLY in lib/contract.js and is projected at /contract — the browser
 *     half fetches it at runtime instead of mirroring it (Q3-B).
 *   - Host is the single authority for validation (Q2-A); the browser half does
 *     no local pre-checking (Q5-B).
 *   - No compression, no dedup: every upload gets a unique name, original bytes.
 *   - Atomic write (tmp + rename) so concurrent uploads never expose partial files.
 *   - webServer is injected at loader level so the route exists on cold boot
 *     before the browser asks (dsh-undo-savepoint's exact lesson).
 *   - Content-type is set from the extension: the built-in frontend-static MIME
 *     map has no image types, so the route must provide them itself.
 */

import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import {
  ROUTE_PREFIX,
  CONTRACT_PATH,
  MAX_BODY_BYTES,
  MIME_BY_EXT,
  contractPayload,
  isLocalHost,
  isLocalOrigin,
  newFileName,
  parseName,
  validateUpload,
} from './contract.js';

export const inject = ['webServer'];

const PLUGIN_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const WALLPAPER_DIR = join(PLUGIN_DIR, 'wallpapers');

// Error envelope: { code, message }. code is the contract; message is the
// fallback shown only when the browser's locale lacks a mapping (Q4-A).
const ERRORS = {
  TOO_LARGE: { status: 413, message: 'image too large (max 50MB)' },
  BAD_PAYLOAD: { status: 400, message: 'invalid payload' },
  FORBIDDEN: { status: 403, message: 'forbidden host' },
  NOT_FOUND: { status: 404, message: 'not found' },
  WRITE_FAILED: { status: 500, message: 'write failed' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'method not allowed' },
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function sendError(res, code) {
  const e = ERRORS[code] || ERRORS.BAD_PAYLOAD;
  sendJson(res, e.status, { code, message: e.message });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        // Reject but leave the socket for the handler to answer with 413;
        // destroying it here would race the sendJson write (spec c3).
        settled = true;
        reject(Object.assign(new Error('request body too large'), { statusCode: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!settled) { settled = true; resolve(Buffer.concat(chunks)); } });
    req.on('error', (err) => { if (!settled) { settled = true; reject(err); } });
  });
}

// Resolve a validated name inside the wallpaper dir, rejecting anything that
// escapes it. The regex already forbids traversal; this is belt-and-braces.
function safeResolve(name) {
  const base = resolve(WALLPAPER_DIR);
  const file = resolve(base, name);
  return file.startsWith(base + '\\') || file.startsWith(base + '/') ? file : null;
}

export function apply(ctx) {
  // Make sure the storage dir exists before any upload lands.
  fs.mkdir(WALLPAPER_DIR, { recursive: true }).catch(() => {});

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (req, res) => {
      const method = (req.method || 'GET').toUpperCase();
      let pathname = '/';
      try { pathname = new URL(req.url || '/', 'http://localhost').pathname; } catch {}

      // Contract endpoint (C1 / Q3-B): the browser half fetches the wallpaper
      // contract at runtime; it never mirrors these constants.
      if (method === 'GET' && pathname === CONTRACT_PATH) {
        sendJson(res, 200, contractPayload());
        return;
      }

      // Root info: storage path for the settings line (Q11-B).
      if (method === 'GET' && (pathname === ROUTE_PREFIX || pathname === ROUTE_PREFIX + '/')) {
        sendJson(res, 200, { path: WALLPAPER_DIR });
        return;
      }

      // Upload: { mediaType, dataBase64 } -> { url }
      if (method === 'POST' && (pathname === ROUTE_PREFIX || pathname === ROUTE_PREFIX + '/')) {
        // Trust fence: Host must be local and any Origin must match (spec a1).
        if (!isLocalHost(req.headers.host) || !isLocalOrigin(req.headers.origin)) { sendError(res, 'FORBIDDEN'); return; }
        let body;
        try { body = await readBody(req, MAX_BODY_BYTES); }
        catch (err) { const code = err && err.statusCode ? err.statusCode : 500; sendJson(res, code, { code: 'TOO_LARGE', message: 'request body too large' }); return; }
        let payload = null;
        try { payload = JSON.parse(body.toString('utf8')); } catch {}
        const verdict = validateUpload(payload);
        if (!verdict.ok) { sendError(res, verdict.code); return; }
        const { image } = verdict;
        const name = newFileName(payload.mediaType);
        const finalPath = resolve(WALLPAPER_DIR, name);
        const tmpPath = finalPath + '.tmp-' + randomBytes(4).toString('hex');
        try {
          await fs.mkdir(WALLPAPER_DIR, { recursive: true });
          await fs.writeFile(tmpPath, image);
          await fs.rename(tmpPath, finalPath);
        } catch (err) {
          await fs.unlink(tmpPath).catch(() => {});
          sendError(res, 'WRITE_FAILED');
          return;
        }
        sendJson(res, 200, { url: ROUTE_PREFIX + '/' + name });
        return;
      }

      // Named file: GET (serve) / DELETE (remove)
      const name = parseName(pathname);
      if (name === null) { sendError(res, 'NOT_FOUND'); return; }
      const file = safeResolve(name);
      if (file === null) { sendError(res, 'FORBIDDEN'); return; }

      if (method === 'DELETE') {
        try { await fs.unlink(file); } catch (err) { if (err.code !== 'ENOENT') { sendError(res, 'WRITE_FAILED'); return; } }
        res.writeHead(204); res.end();
        return;
      }

      if (method === 'GET') {
        let stat;
        try { stat = await fs.stat(file); } catch { sendError(res, 'NOT_FOUND'); return; }
        const ext = name.split('.').pop().toLowerCase();
        const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': stat.size,
          // Names are unique per upload, so URLs are immutable.
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        createReadStream(file).pipe(res);
        return;
      }

      sendError(res, 'METHOD_NOT_ALLOWED');
    },
  }), 'ji-theme.wallpapers');
}
