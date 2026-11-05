/**
 * DSH-Theme — host half: the DreamSkin package store.
 *
 * DreamSkin (theme.json + optional manifest.json / theme.css / background) is
 * the only theme format. Routes, all under /dsh-theme/packages:
 *
 *   GET    /dsh-theme/packages               -> { version, path, packages }
 *   POST   /dsh-theme/packages               -> { package }   (ZIP body, 64MB cap)
 *   DELETE /dsh-theme/packages/<id>          -> 204
 *   GET    /dsh-theme/packages/<id>/export   -> the package as a ZIP (?raw=1 for source.zip)
 *   GET    /dsh-theme/packages/<id>/files/*  -> one extracted asset (background, theme.css…)
 *
 * Errors cross the seam as { code, message }: the code is the stable contract,
 * the message is a fallback the browser half shows only when its locale has no
 * mapping for the code.
 *
 * Design decisions carried over from the wallpaper era:
 *   - webServer is injected at loader level so the routes exist on cold boot
 *     before the browser asks.
 *   - Writes (POST / DELETE) are fenced by a local Host and, when present, a
 *     local Origin, so a remote page cannot use the user's browser as a
 *     confused deputy.
 *   - Uploads are read with a hard byte cap; the store validates the ZIP.
 */

import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import {
  PACKAGES_PREFIX,
  PACKAGES_DIR,
  MAX_PACKAGE_UPLOAD_BYTES,
  INDEX_VERSION,
  importPackage,
  listPackages,
  removePackage,
  resolvePackageAsset,
  exportPackage,
} from './store.js';

export const inject = ['webServer'];

// Assets are immutable per package id until the package is re-imported; a
// short shared cache keeps 9MB backgrounds from being re-fetched on every
// render without serving stale bytes for long after a re-import.
const ASSET_CACHE_CONTROL = 'public, max-age=600';

// Error envelope: { code, message }.
const ERRORS = {
  BAD_PAYLOAD: { status: 400, message: 'invalid payload' },
  BAD_PACKAGE: { status: 400, message: 'invalid package' },
  TOO_LARGE: { status: 413, message: 'package too large' },
  FORBIDDEN: { status: 403, message: 'forbidden host' },
  NOT_FOUND: { status: 404, message: 'not found' },
  WRITE_FAILED: { status: 500, message: 'write failed' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'method not allowed' },
};

/** Is this Host header a local one? (missing Host → not local) */
function isLocalHost(hostHeader) {
  if (!hostHeader) return false;
  const host = String(hostHeader).split(':')[0].toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
}

/** Is this Origin header local? (absent Origin — e.g. curl/node — allowed) */
function isLocalOrigin(originHeader) {
  if (!originHeader) return true; // non-browser clients (curl/node) send no Origin
  try {
    const host = new URL(String(originHeader)).hostname.toLowerCase();
    return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

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
        // destroying it here would race the sendJson write.
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

function decodeSegment(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function serveFile(res, file, mime, disposition, size) {
  const inline = mime.startsWith('image/') || mime.startsWith('font/');
  const headers = {
    'Content-Type': mime,
    'Cache-Control': ASSET_CACHE_CONTROL,
    // 皮肤包是第三方内容：禁嗅探，非图片/字体一律按附件下发。
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': inline ? 'inline' : 'attachment',
  };
  if (disposition !== undefined) headers['Content-Disposition'] = disposition;
  if (size !== undefined) headers['Content-Length'] = size;
  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
}

export function apply(ctx) {
  // Make sure the store dir exists before any upload lands.
  fs.mkdir(PACKAGES_DIR, { recursive: true }).catch(() => {});

  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: PACKAGES_PREFIX,
    handler: async (req, res) => {
      const method = (req.method || 'GET').toUpperCase();
      let url = null;
      try { url = new URL(req.url || '/', 'http://localhost'); } catch {}
      const pathname = url === null ? '/' : url.pathname;
      const rest = pathname.startsWith(PACKAGES_PREFIX) ? pathname.slice(PACKAGES_PREFIX.length) : '';
      const root = rest === '' || rest === '/';

      if (root && method === 'GET') {
        sendJson(res, 200, { version: INDEX_VERSION, packages: await listPackages() });
        return;
      }

      if (root && method === 'POST') {
        if (!isLocalHost(req.headers.host) || !isLocalOrigin(req.headers.origin)) {
          sendError(res, 'FORBIDDEN');
          return;
        }
        let body;
        try {
          body = await readBody(req, MAX_PACKAGE_UPLOAD_BYTES + 1);
        } catch {
          sendError(res, 'TOO_LARGE');
          return;
        }
        let filename = '';
        try { filename = decodeURIComponent(String(req.headers['x-ji-filename'] || '')); } catch {}
        try {
          const meta = await importPackage(body, { filename });
          sendJson(res, 200, { package: meta });
        } catch (error) {
          // 细节只进日志：响应体里回显 error.message 会泄露内部路径与 fs 错误码。
          if (error) console.warn('[dsh-theme] import failed:', error.message);
          sendJson(res, 400, { code: 'BAD_PACKAGE', message: 'invalid package' });
        }
        return;
      }

      const parts = rest.replace(/^\/+/, '').split('/').filter((part, index) => index === 0 || part.length > 0);
      const id = parts.length > 0 ? decodeSegment(parts[0]) : '';
      if (id === '') { sendError(res, 'NOT_FOUND'); return; }
      const tail = parts.slice(1);

      if (method === 'DELETE' && tail.length === 0) {
        if (!isLocalHost(req.headers.host) || !isLocalOrigin(req.headers.origin)) {
          sendError(res, 'FORBIDDEN');
          return;
        }
        const removed = await removePackage(id);
        if (!removed) { sendError(res, 'NOT_FOUND'); return; }
        res.writeHead(204);
        res.end();
        return;
      }

      if (method === 'GET' && tail.length === 1 && tail[0] === 'export') {
        let raw = false;
        try { raw = url !== null && url.searchParams.get('raw') === '1'; } catch {}
        const exported = await exportPackage(id, { merged: !raw });
        if (exported === null) { sendError(res, 'NOT_FOUND'); return; }
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': exported.buffer.length,
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename="${exported.filename}"`,
        });
        res.end(exported.buffer);
        return;
      }

      if (method === 'GET' && tail.length >= 2 && tail[0] === 'files') {
        const relPath = tail.slice(1).map(decodeSegment).join('/');
        const asset = await resolvePackageAsset(id, relPath);
        if (asset === null) { sendError(res, 'NOT_FOUND'); return; }
        serveFile(res, asset.file, asset.mime, undefined, asset.size);
        return;
      }

      sendError(res, 'NOT_FOUND');
    },
  }), 'dsh-theme.packages');
}
