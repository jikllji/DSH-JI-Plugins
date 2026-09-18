/**
 * Host-side theme package store.
 *
 * Every imported ZIP is kept intact as source.zip and extracted under
 * files/ so the browser can load manifests, stylesheets, hooks, and assets
 * with ordinary same-origin URLs. index.json is the authority the settings
 * UI lists from.
 */

import { promises as fs } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readZipEntries } from './zip.js';
import { writeZipEntries } from './zip-write.js';

export const PACKAGES_PREFIX = '/ji-theme/packages';
export const PACKAGES_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), 'packages');
export const MAX_PACKAGE_UPLOAD_BYTES = 64 * 1024 * 1024;

const STORE_DIR = PACKAGES_DIR;
const INDEX_FILE = join(STORE_DIR, 'index.json');
const SOURCE_NAME = 'source.zip';
const FILES_DIR = 'files';
const OVERRIDES_JSON = 'overrides.json';
const OVERRIDES_CSS = 'overrides.css';

const MAX_FILES = 2048;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 128 * 1024 * 1024;
const ID_RE = /^[a-z][a-z0-9-]{0,63}$/;

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeId(value) {
  const raw = String(value || '').trim().toLowerCase();
  const slug = raw.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  if (slug.length === 0 || !/^[a-z]/.test(slug)) return null;
  return ID_RE.test(slug) ? slug : null;
}

function fallbackId(filename, buffer) {
  const base = String(filename || 'theme').replace(/\.[^.]+$/, '');
  const slug = sanitizeId(base);
  if (slug !== null) return slug;
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  return `theme-${hash}`;
}

function normalizeEntryName(rawName) {
  const name = String(rawName || '').replace(/\\/g, '/');
  if (name.length === 0 || name.startsWith('/') || /^[a-z]:/i.test(name)) return null;
  const parts = [];
  for (const part of name.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..' || /[\0-\x1f]/.test(part)) return null;
    parts.push(part);
  }
  if (parts.length === 0) return null;
  const clean = parts.join('/');
  return clean.length > 240 ? null : clean;
}

function collectEntries(buffer) {
  const entries = readZipEntries(buffer);
  const files = new Map();
  let total = 0;
  for (const [rawName, data] of entries) {
    if (rawName.endsWith('/')) continue;
    const name = normalizeEntryName(rawName);
    if (name === null) continue;
    if (name.startsWith('__MACOSX/') || name === '.DS_Store') continue;
    if (data.length > MAX_FILE_BYTES) throw new Error(`file too large: ${name}`);
    total += data.length;
    if (total > MAX_UNPACKED_BYTES) throw new Error('package unpacks beyond the size limit');
    if (files.size >= MAX_FILES) throw new Error('package has too many files');
    files.set(name, data);
  }
  return files;
}

function parseManifest(files) {
  const skin = files.get('skin.json');
  if (skin !== undefined) {
    const manifest = JSON.parse(skin.toString('utf8'));
    if (!isRecord(manifest)) throw new Error('skin.json must be an object');
    return { format: 'dsh-v2', manifest };
  }
  const theme = files.get('theme.json');
  if (theme !== undefined) {
    const manifest = JSON.parse(theme.toString('utf8'));
    if (!isRecord(manifest)) throw new Error('theme.json must be an object');
    const packageEntry = files.get('manifest.json');
    let packageManifest = null;
    if (packageEntry !== undefined) {
      try {
        const parsed = JSON.parse(packageEntry.toString('utf8'));
        if (isRecord(parsed)) packageManifest = parsed;
      } catch {}
    }
    return { format: 'dreamskin-v1', manifest, packageManifest };
  }
  throw new Error('package must contain skin.json or theme.json');
}

function buildMeta({ id, format, manifest, packageManifest, source, files }) {
  let name = String(manifest.name || manifest.id || id);
  let version = manifest.version === undefined ? '' : String(manifest.version);
  let appearance = '';
  let accent = null;
  let background = null;
  let preview = null;
  let stylesheet = null;
  let patches = null;
  let hooksEntry = null;
  let backgroundMedia = null;
  let license = null;
  let publisher = null;
  let attribution = null;

  if (format === 'dsh-v2') {
    const contributes = isRecord(manifest.contributes) ? manifest.contributes : {};
    stylesheet = typeof contributes.stylesheet === 'string' ? contributes.stylesheet : 'skin.css';
    patches = typeof contributes.patches === 'string' ? contributes.patches : null;
    const facets = isRecord(manifest.facets) ? manifest.facets : {};
    const client = isRecord(facets.client) ? facets.client : {};
    hooksEntry = typeof client.entry === 'string' ? client.entry : null;
    accent = typeof manifest.accent === 'string' ? manifest.accent : null;
    publisher = typeof manifest.author === 'string' ? manifest.author : null;
    license = typeof manifest.license === 'string' ? manifest.license : null;
    attribution = typeof manifest.attribution === 'string' ? manifest.attribution : null;
    const previews = isRecord(manifest.preview) ? manifest.preview : {};
    preview = typeof previews.light === 'string' ? previews.light : (typeof previews.dark === 'string' ? previews.dark : null);
    backgroundMedia = isRecord(contributes.backgroundMedia) ? contributes.backgroundMedia : null;
    if (backgroundMedia !== null) {
      const layer = isRecord(backgroundMedia.light) ? backgroundMedia.light : backgroundMedia.dark;
      if (isRecord(layer) && typeof layer.src === 'string') background = layer.src;
    }
    if (version.length === 0 && manifest.skinManifestVersion !== undefined) version = String(manifest.skinManifestVersion);
  } else {
    const colors = isRecord(manifest.colors) ? manifest.colors : {};
    accent = typeof colors.accent === 'string' ? colors.accent : null;
    appearance = manifest.appearance === 'light' ? 'light' : 'dark';
    background = typeof manifest.image === 'string' ? manifest.image : null;
    stylesheet = 'theme.css';
    if (packageManifest !== null) {
      if (version.length === 0 && packageManifest.version !== undefined) version = String(packageManifest.version);
      license = typeof packageManifest.license === 'string' ? packageManifest.license : null;
      const publisherInfo = isRecord(packageManifest.publisher) ? packageManifest.publisher : {};
      publisher = typeof publisherInfo.displayName === 'string' ? publisherInfo.displayName : (typeof publisherInfo.id === 'string' ? publisherInfo.id : null);
      const provenance = isRecord(packageManifest.provenance) ? packageManifest.provenance : {};
      attribution = typeof provenance.summary === 'string' ? provenance.summary : null;
    }
    if (version.length === 0 && manifest.schemaVersion !== undefined) version = String(manifest.schemaVersion);
  }

  const unpackedBytes = [...files.values()].reduce((sum, data) => sum + data.length, 0);
  return {
    id,
    format,
    name,
    version,
    appearance,
    accent,
    background,
    preview,
    stylesheet,
    patches,
    hooksEntry,
    backgroundMedia,
    license,
    publisher,
    attribution,
    source,
    files: files.size,
    bytes: source.bytes,
    unpackedBytes,
    createdAt: new Date().toISOString(),
  };
}

async function readIndex() {
  try {
    const raw = await fs.readFile(INDEX_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && Array.isArray(parsed.packages)) return parsed;
  } catch {
    // Missing or damaged index: rebuild lazily from the store directory.
  }
  return { version: 1, packages: [] };
}

async function writeIndex(index) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const temp = `${INDEX_FILE}.tmp-${randomBytes(4).toString('hex')}`;
  await fs.writeFile(temp, JSON.stringify(index, null, 2), 'utf8');
  await fs.rename(temp, INDEX_FILE);
}

async function writeFiles(dir, files) {
  const filesRoot = join(dir, FILES_DIR);
  for (const [name, data] of files) {
    const target = resolve(filesRoot, name);
    if (!target.startsWith(filesRoot + sep)) throw new Error(`path escapes the package directory: ${name}`);
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }
}

/**
 * Import one ZIP buffer; replaces an existing package with the same id.
 * @param buffer - ZIP bytes.
 * @param options - optional original filename, used for id fallback.
 * @returns the stored package metadata.
 */
export async function importPackage(buffer, options = {}) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.length === 0) throw new Error('empty package');
  if (bytes.length > MAX_PACKAGE_UPLOAD_BYTES) throw new Error('package exceeds the upload limit');
  const files = collectEntries(bytes);
  const { format, manifest, packageManifest } = parseManifest(files);
  const declaredId = sanitizeId(manifest.id);
  const id = declaredId ?? fallbackId(options.filename, bytes);
  const source = {
    bytes: bytes.length,
    hash: createHash('sha256').update(bytes).digest('hex'),
  };
  const meta = buildMeta({ id, format, manifest, packageManifest, source, files });

  await fs.mkdir(STORE_DIR, { recursive: true });
  const finalDir = join(STORE_DIR, id);
  const tempDir = join(STORE_DIR, `.tmp-${id}-${randomBytes(4).toString('hex')}`);
  await fs.mkdir(tempDir, { recursive: true });
  try {
    await fs.writeFile(join(tempDir, SOURCE_NAME), bytes);
    await writeFiles(tempDir, files);
    await fs.rm(finalDir, { recursive: true, force: true });
    await fs.rename(tempDir, finalDir);
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }

  const index = await readIndex();
  index.packages = [meta, ...index.packages.filter((entry) => entry.id !== id)];
  await writeIndex(index);
  return meta;
}

/** List imported packages, newest first. */
export async function listPackages() {
  const index = await readIndex();
  return Promise.all(index.packages.map(async (entry) => ({
    ...entry,
    hasOverrides: await hasOverrides(entry),
  })));
}

async function hasOverrides(entry) {
  const file = entry.format === 'dsh-v2'
    ? join(STORE_DIR, entry.id, OVERRIDES_CSS)
    : join(STORE_DIR, entry.id, OVERRIDES_JSON);
  try {
    const stat = await fs.stat(file);
    return stat.isFile() && stat.size > 0;
  } catch { return false; }
}

/** Remove one package directory and its index row. */
export async function removePackage(id) {
  if (!ID_RE.test(String(id || ''))) return false;
  const index = await readIndex();
  const present = index.packages.some((entry) => entry.id === id);
  if (!present) return false;
  await fs.rm(join(STORE_DIR, id), { recursive: true, force: true });
  index.packages = index.packages.filter((entry) => entry.id !== id);
  await writeIndex(index);
  return true;
}

/** Resolve one extracted asset inside a package; null when missing/unsafe. */
export async function resolvePackageAsset(id, relPath) {
  if (!ID_RE.test(String(id || ''))) return null;
  const name = normalizeEntryName(relPath);
  if (name === null) return null;
  const root = resolve(STORE_DIR, id, FILES_DIR);
  const file = resolve(root, name);
  if (!file.startsWith(root + sep)) return null;
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) return null;
    return { file, size: stat.size, mime: MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

/** Absolute path to the original uploaded ZIP, or null when absent. */
export async function exportPath(id) {
  if (!ID_RE.test(String(id || ''))) return null;
  const file = join(STORE_DIR, id, SOURCE_NAME);
  try {
    const stat = await fs.stat(file);
    return stat.isFile() ? file : null;
  } catch {
    return null;
  }
}

/** Read the override layer for one package; null when absent or the package is unknown. */
export async function readPackageOverrides(id) {
  if (!ID_RE.test(String(id || ''))) return null;
  const index = await readIndex();
  const entry = index.packages.find((candidate) => candidate.id === id);
  if (entry === undefined) return null;
  const base = join(STORE_DIR, id);
  if (entry.format === 'dsh-v2') {
    try { return { css: await fs.readFile(join(base, OVERRIDES_CSS), 'utf8') }; } catch { return null; }
  }
  try {
    const parsed = JSON.parse(await fs.readFile(join(base, OVERRIDES_JSON), 'utf8'));
    return isRecord(parsed) ? { theme: parsed } : null;
  } catch { return null; }
}

/** Write the override layer for one package; false when the package is unknown. */
export async function writePackageOverrides(id, payload) {
  if (!ID_RE.test(String(id || ''))) return false;
  const index = await readIndex();
  const entry = index.packages.find((candidate) => candidate.id === id);
  if (entry === undefined) return false;
  const base = join(STORE_DIR, id);
  const temp = join(base, `.overrides-${randomBytes(4).toString('hex')}`);
  if (entry.format === 'dsh-v2') {
    const css = isRecord(payload) && typeof payload.css === 'string' ? payload.css : '';
    await fs.writeFile(temp, css, 'utf8');
    await fs.rename(temp, join(base, OVERRIDES_CSS));
  } else {
    const theme = isRecord(payload) && isRecord(payload.theme) ? payload.theme : {};
    await fs.writeFile(temp, JSON.stringify(theme, null, 2), 'utf8');
    await fs.rename(temp, join(base, OVERRIDES_JSON));
  }
  return true;
}

/** Remove the override layer for one package; false when the package is unknown. */
export async function removePackageOverrides(id) {
  if (!ID_RE.test(String(id || ''))) return false;
  const index = await readIndex();
  const entry = index.packages.find((candidate) => candidate.id === id);
  if (entry === undefined) return false;
  const file = entry.format === 'dsh-v2'
    ? join(STORE_DIR, id, OVERRIDES_CSS)
    : join(STORE_DIR, id, OVERRIDES_JSON);
  await fs.rm(file, { force: true });
  return true;
}

async function readStoredFiles(id) {
  const root = join(STORE_DIR, id, FILES_DIR);
  const files = new Map();
  const walk = async (dir, prefix) => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await walk(full, rel);
      else files.set(rel, await fs.readFile(full));
    }
  };
  await walk(root, '');
  return files;
}

/**
 * Export a package. Merged exports (default) fold the override layer into the
 * original files; raw exports return the untouched source.zip.
 */
export async function exportPackage(id, options = {}) {
  if (!ID_RE.test(String(id || ''))) return null;
  const index = await readIndex();
  const entry = index.packages.find((candidate) => candidate.id === id);
  if (entry === undefined) return null;
  if (options.merged === false) {
    const source = await exportPath(id);
    if (source === null) return null;
    return { buffer: await fs.readFile(source), filename: `${id}.zip` };
  }
  const files = await readStoredFiles(id);
  const overrides = await readPackageOverrides(id);
  if (overrides !== null) {
    if (entry.format === 'dsh-v2') {
      if (typeof overrides.css === 'string' && overrides.css.trim().length > 0) {
        const stylesheet = entry.stylesheet || 'skin.css';
        const existing = files.get(stylesheet);
        const merged = existing === undefined
          ? Buffer.from(overrides.css, 'utf8')
          : Buffer.concat([existing, Buffer.from('\n/* ji-theme overrides */\n' + overrides.css, 'utf8')]);
        files.set(stylesheet, merged);
      }
    } else if (isRecord(overrides.theme)) {
      const themeEntry = files.get('theme.json');
      if (themeEntry !== undefined) {
        let theme = {};
        try { const parsed = JSON.parse(themeEntry.toString('utf8')); if (isRecord(parsed)) theme = parsed; } catch {}
        const merged = Object.assign({}, theme, overrides.theme);
        delete merged.packageId;
        delete merged.hasOverrides;
        files.set('theme.json', Buffer.from(JSON.stringify(merged, null, 2) + '\n', 'utf8'));
      }
    }
  }
  return { buffer: writeZipEntries(files), filename: `${id}.zip` };
}
