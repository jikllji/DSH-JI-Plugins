/**
 * JI-Theme — 壁纸契约 (wallpaper contract).
 *
 * The single owner of the wallpaper upload contract: what media types are
 * accepted, how big an image may be, what filenames/URLs look like, and the
 * error codes that cross the seam. The host route handler validates against
 * these pure functions; the contract endpoint (`GET /ji-theme/wallpapers/contract`)
 * projects the same constants so the browser half never mirrors them (C1).
 *
 * Pure by construction: no fs, no network, no ctx — unit-testable directly.
 */

import { randomBytes } from 'node:crypto';

export const ROUTE_PREFIX = '/ji-theme/wallpapers';
export const CONTRACT_PATH = '/ji-theme/wallpapers/contract';

// Decoded-image cap (50 MB, spec Q8-B). Base64 inflates by ~4/3, so the JSON
// body cap is that plus JSON/encoding slack.
export const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_BODY_BYTES = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024 * 1024;

export const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
export const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

// Generated names look like <base36stamp>-<12hex>.png (see newFileName).
export const NAME_RE = /^[a-z0-9]+-[a-f0-9]{12}\.(png|jpg|jpeg|webp|gif)$/i;

export const ERROR_CODES = ['TOO_LARGE', 'BAD_PAYLOAD', 'FORBIDDEN', 'NOT_FOUND', 'WRITE_FAILED', 'METHOD_NOT_ALLOWED'];

/** Is this media type acceptable for upload? */
export function isSupportedMediaType(mediaType) {
  return typeof mediaType === 'string' && EXT_BY_MIME[mediaType] !== undefined;
}

/** Is this base64 payload well-formed (not necessarily decode-safe)? */
export function isWellFormedBase64(b64) {
  return typeof b64 === 'string' && BASE64_RE.test(b64);
}

/** Validate an upload payload; returns { ok: true, image } or { ok: false, code } where code ∈ ERROR_CODES. */
export function validateUpload(payload) {
  if (!payload || typeof payload !== 'object') return { ok: false, code: 'BAD_PAYLOAD' };
  const { mediaType, dataBase64 } = payload;
  if (!isSupportedMediaType(mediaType) || !isWellFormedBase64(dataBase64)) return { ok: false, code: 'BAD_PAYLOAD' };
  const image = Buffer.from(dataBase64, 'base64');
  if (image.length === 0) return { ok: false, code: 'BAD_PAYLOAD' };
  if (image.length > MAX_IMAGE_BYTES) return { ok: false, code: 'TOO_LARGE' };
  return { ok: true, image };
}

/** Build a unique filename for a supported mediaType. */
export function newFileName(mediaType) {
  const ext = EXT_BY_MIME[mediaType] || 'png';
  const stamp = Date.now().toString(36);
  const rand = randomBytes(6).toString('hex');
  return stamp + '-' + rand + '.' + ext;
}

/** Extract a validated name from a pathname under the route prefix; null for root/invalid. */
export function parseName(pathname, prefix = ROUTE_PREFIX) {
  const rest = pathname.slice(prefix.length);
  if (rest === '' || rest === '/') return null; // root: contract/info/upload target
  if (!rest.startsWith('/')) return null;
  const name = rest.slice(1);
  if (!NAME_RE.test(name)) return null;
  return name;
}

/** Is this Host header a local one? (missing Host → not local) */
export function isLocalHost(hostHeader) {
  if (!hostHeader) return false;
  const host = String(hostHeader).split(':')[0].toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
}

/** Is this Origin header local? (absent Origin — e.g. curl/node — allowed) */
export function isLocalOrigin(originHeader) {
  if (!originHeader) return true; // non-browser clients (curl/node) send no Origin
  try {
    const host = new URL(String(originHeader)).hostname.toLowerCase();
    return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
  } catch { return false; }
}

/** The JSON projected by GET /ji-theme/wallpapers/contract (Q3-B: client fetches, never mirrors). */
export function contractPayload() {
  return {
    mediaTypes: MEDIA_TYPES.slice(),
    maxImageBytes: MAX_IMAGE_BYTES,
    urlPrefix: ROUTE_PREFIX,
    errorCodes: ERROR_CODES.slice(),
  };
}
