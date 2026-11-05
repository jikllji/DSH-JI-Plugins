/**
 * Host-side DreamSkin package store.
 *
 * DreamSkin is the only input format: a ZIP whose root holds theme.json and,
 * optionally, manifest.json, theme.css and the background image named by
 * `theme.json#image`. The legacy DSH v2 format (JSON skin manifests, patch CSS,
 * hooks) and the custom-wallpaper store are gone as of v0.6.
 *
 * Every imported ZIP is kept intact as source.zip and extracted under files/
 * so the browser can load the background and stylesheet with ordinary
 * same-origin URLs. index.json (version 2) is the authority the settings UI
 * lists from: each row is the metadata contract the client renders.
 */

import { promises as fs } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readZipEntries } from './zip.js';
import { writeZipEntries } from './zip-write.js';

export const PACKAGES_PREFIX = '/dsh-theme/packages';
export const PACKAGES_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), 'packages');
export const MAX_PACKAGE_UPLOAD_BYTES = 64 * 1024 * 1024;

/** The one theme format this store accepts. */
export const FORMAT = 'dreamskin-v1';
/** Bump when the index row shape changes (v2: DreamSkin-only metadata contract). */
export const INDEX_VERSION = 2;
/** Raw theme.json#appearance values that pass through untouched. */
export const APPEARANCES = ['light', 'dark', 'auto'];

const STORE_DIR = PACKAGES_DIR;
const INDEX_FILE = join(STORE_DIR, 'index.json');
const SOURCE_NAME = 'source.zip';
const FILES_DIR = 'files';
const THEME_NAME = 'theme.json';
const PACKAGE_NAME = 'manifest.json';
const STYLESHEET_NAME = 'theme.css';

const MAX_FILES = 2048;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 128 * 1024 * 1024;
const ID_RE = /^[a-z][a-z0-9-]{0,63}$/;

// 只回图片/字体。任何可执行类型（html/js/svg/css）一律按二进制附件下发，
// 避免第三方皮肤包在 DSH 同源下投递可执行页面。
const MIME = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function number(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function sanitizeId(value) {
  const raw = String(value || '').trim().toLowerCase();
  const slug = raw.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  if (slug.length === 0 || !/^[a-z]/.test(slug)) return null;
  return ID_RE.test(slug) ? slug : null;
}

function fallbackId(filename, buffer) {
  const base = String(filename || '').replace(/\.[^.]+$/, '');
  const slug = sanitizeId(base);
  // 没有文件名或名字不可用时按内容取哈希，避免所有无名包抢同一个 id 互相覆盖。
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  if (slug !== null) return slug;
  return `theme-${hash}`;
}

// Windows 设备名（CON/PRN/AUX/NUL/COM1-9/LPT1-9）即便带扩展名也不能落盘，
// 且段内不允许 ':'（NTFS 会把它解释成备用数据流，rm 删不干净）。
const WIN_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

function normalizeEntryName(rawName) {
  const name = String(rawName || '').replace(/\\/g, '/');
  if (name.length === 0 || name.startsWith('/') || /^[a-z]:/i.test(name)) return null;
  const parts = [];
  for (const part of name.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..' || /[\0-\x1f]/.test(part)) return null;
    if (part.includes(':') || WIN_RESERVED.test(part)) return null;
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

function readJsonObject(entry, label) {
  let parsed;
  try {
    parsed = JSON.parse(entry.toString('utf8'));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  if (!isRecord(parsed)) throw new Error(`${label} must be an object`);
  return parsed;
}

/**
 * DreamSkin is theme.json-driven. manifest.json is optional and only enriches
 * the metadata (version, publisher, license, capabilities); a package with no
 * theme.json is rejected with a plain message instead of being silently
 * dropped, whatever legacy format it may be carrying.
 */
function parseManifest(files) {
  const themeEntry = files.get(THEME_NAME);
  if (themeEntry === undefined) {
    throw new Error('不是 DreamSkin 包：缺少 theme.json（旧的 DSH v2 皮肤格式已不再支持）');
  }
  const theme = readJsonObject(themeEntry, THEME_NAME);
  const packageEntry = files.get(PACKAGE_NAME);
  let packageManifest = null;
  if (packageEntry !== undefined) {
    try {
      const parsed = JSON.parse(packageEntry.toString('utf8'));
      if (isRecord(parsed)) packageManifest = parsed;
    } catch {
      // A damaged manifest.json only costs metadata; theme.json stays authoritative.
    }
  }
  return { theme, packageManifest };
}

function normalizeAppearance(value) {
  const raw = text(value).toLowerCase();
  return APPEARANCES.includes(raw) ? raw : 'auto';
}

/** The background image actually present in files/, or null. */
function backgroundImage(theme, files) {
  const declared = text(theme.image);
  if (declared.length === 0) return null;
  const name = normalizeEntryName(declared);
  if (name === null || !files.has(name)) return null;
  return name;
}

function packageFileUrl(id, relPath) {
  const segments = String(relPath)
    .split('/')
    .filter((part) => part.length > 0)
    .map((part) => encodeURIComponent(part));
  return `${PACKAGES_PREFIX}/${encodeURIComponent(id)}/${FILES_DIR}/${segments.join('/')}`;
}

/** manifest.json capabilities when declared, otherwise derived from what the package ships. */
function capabilitiesOf(packageManifest, files, image) {
  if (packageManifest !== null && Array.isArray(packageManifest.capabilities)) {
    const declared = packageManifest.capabilities
      .map((value) => text(value))
      .filter((value) => value.length > 0);
    if (declared.length > 0) return [...new Set(declared)];
  }
  const derived = [];
  if (image !== null) derived.push('background');
  derived.push('tokens');
  if (files.has(STYLESHEET_NAME)) derived.push('safe-css');
  return derived;
}

/**
 * The v0.6 metadata contract. Field names are consumed verbatim by the client
 * half; do not rename or reorder without bumping INDEX_VERSION.
 */
function buildMeta({ id, theme, packageManifest, source, files, createdAt }) {
  const pkg = packageManifest ?? {};
  const colors = isRecord(theme.colors) ? theme.colors : {};
  const publisherInfo = isRecord(pkg.publisher) ? pkg.publisher : {};
  const provenance = isRecord(pkg.provenance) ? pkg.provenance : {};

  const image = backgroundImage(theme, files);
  const unpackedBytes = [...files.values()].reduce((sum, data) => sum + data.length, 0);

  return {
    id,
    name: text(theme.name) || text(theme.id) || id,
    format: FORMAT,
    appearance: normalizeAppearance(theme.appearance),
    // Package version only: schemaVersion describes the file format, not the release.
    version: text(pkg.version) || text(theme.version) || '',
    accent: text(colors.accent) || text(pkg.accent) || null,
    license: text(pkg.license) || null,
    publisher: text(publisherInfo.displayName) || text(publisherInfo.id) || null,
    attribution: text(provenance.summary) || null,
    themeId: text(pkg.themeId) || text(theme.id) || id,
    capabilities: capabilitiesOf(packageManifest, files, image),
    skinApiVersion: number(pkg.skinApiVersion) ?? number(theme.schemaVersion) ?? 1,
    image,
    imageUrl: image === null ? null : packageFileUrl(id, image),
    theme,
    files: files.size,
    bytes: source.bytes,
    unpackedBytes,
    createdAt,
  };
}

async function readIndex() {
  let damaged = false;
  try {
    const raw = await fs.readFile(INDEX_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && Array.isArray(parsed.packages)) {
      return { version: number(parsed.version) ?? 1, packages: parsed.packages };
    }
    damaged = true;
  } catch (error) {
    damaged = Boolean(error && error.code !== 'ENOENT') || true;
  }
  // 索引缺失或损坏：扫磁盘重建，否则包目录还在但 UI 里全消失、也删不掉。
  const rebuilt = damaged ? await rebuildIndex() : [];
  return { version: INDEX_VERSION, packages: rebuilt };
}

async function rebuildIndex() {
  const entries = await fs.readdir(STORE_DIR, { withFileTypes: true }).catch(() => []);
  const packages = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = await readPackageMeta(entry.name).catch(() => null);
    if (meta) packages.push(meta);
  }
  packages.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  await writeIndex(packages).catch(() => {});
  return packages;
}

// index 的读-改-写必须串行，否则并发导入/删除会互相覆盖，丢行。
let indexQueue = Promise.resolve();
function withIndexLock(task) {
  const run = indexQueue.then(task, task);
  indexQueue = run.catch(() => {});
  return run;
}

async function writeIndex(packages) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const temp = `${INDEX_FILE}.tmp-${randomBytes(4).toString('hex')}`;
  await fs.writeFile(temp, JSON.stringify({ version: INDEX_VERSION, packages }, null, 2) + '\n', 'utf8');
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

function isCurrentMeta(entry) {
  return isRecord(entry)
    && entry.format === FORMAT
    && isRecord(entry.theme)
    && Array.isArray(entry.capabilities);
}

/**
 * Rebuild one index row from the files already extracted on disk. Used to
 * upgrade an index.json written by an older version (v0.5 rows had no `theme`)
 * without asking the user to re-import anything. Returns null when the package
 * directory or its theme.json is gone, so stale rows drop out of the list.
 */
async function upgradeEntry(entry) {
  if (!isRecord(entry) || !ID_RE.test(String(entry.id || ''))) return null;
  const id = entry.id;
  const files = await readStoredFiles(id);
  if (files.size === 0) return null;
  let parsed;
  try {
    parsed = parseManifest(files);
  } catch {
    return null;
  }
  let bytes = number(entry.bytes) ?? 0;
  try {
    bytes = (await fs.stat(join(STORE_DIR, id, SOURCE_NAME))).size;
  } catch {
    // Keep the recorded size when source.zip is absent.
  }
  const createdAt = typeof entry.createdAt === 'string' && entry.createdAt.length > 0
    ? entry.createdAt
    : new Date().toISOString();
  return buildMeta({ id, ...parsed, source: { bytes }, files, createdAt });
}

/**
 * Import one DreamSkin ZIP; replaces an existing package with the same id.
 * @param buffer - ZIP bytes.
 * @param options - optional original filename, used for the id fallback.
 * @returns the stored package metadata.
 */
export function importPackage(buffer, options = {}) {
  return withIndexLock(() => importPackageLocked(buffer, options));
}

async function importPackageLocked(buffer, options = {}) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.length === 0) throw new Error('empty package');
  if (bytes.length > MAX_PACKAGE_UPLOAD_BYTES) throw new Error('package exceeds the upload limit');
  const files = collectEntries(bytes);
  const parsed = parseManifest(files);
  const declaredId = sanitizeId(parsed.theme.id) ?? sanitizeId(parsed.packageManifest?.themeId);
  const id = declaredId ?? fallbackId(options.filename, bytes);
  const source = {
    bytes: bytes.length,
    hash: createHash('sha256').update(bytes).digest('hex'),
  };

  const index = await readIndex();
  const previous = index.packages.find((entry) => isRecord(entry) && entry.id === id);
  const createdAt = previous && typeof previous.createdAt === 'string' && previous.createdAt.length > 0
    ? previous.createdAt
    : new Date().toISOString();
  const meta = buildMeta({ id, ...parsed, source, files, createdAt });

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

  await writeIndex([meta, ...index.packages.filter((entry) => !isRecord(entry) || entry.id !== id)]);
  return meta;
}

/** List imported DreamSkin packages, newest first. */
export async function listPackages() {
  const index = await readIndex();
  let dirty = index.version !== INDEX_VERSION;
  const packages = [];
  for (const entry of index.packages) {
    if (isCurrentMeta(entry)) {
      packages.push(entry);
      continue;
    }
    dirty = true;
    const upgraded = await upgradeEntry(entry);
    if (upgraded !== null) packages.push(upgraded);
  }
  if (dirty) await writeIndex(packages);
  return packages;
}

/** Remove one package directory and its index row. */
export function removePackage(id) {
  return withIndexLock(() => removePackageLocked(id));
}

async function removePackageLocked(id) {
  if (!ID_RE.test(String(id || ''))) return false;
  const index = await readIndex();
  const present = index.packages.some((entry) => isRecord(entry) && entry.id === id);
  if (!present) return false;
  await fs.rm(join(STORE_DIR, id), { recursive: true, force: true });
  await writeIndex(index.packages.filter((entry) => !isRecord(entry) || entry.id !== id));
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

/**
 * Export a package as a ZIP. Merged exports (default) are rebuilt from the
 * extracted files; `{ merged: false }` returns the untouched source.zip.
 */
export async function exportPackage(id, options = {}) {
  if (!ID_RE.test(String(id || ''))) return null;
  const index = await readIndex();
  const present = index.packages.some((entry) => isRecord(entry) && entry.id === id);
  if (!present) return null;
  if (options.merged === false) {
    const source = await exportPath(id);
    if (source === null) return null;
    return { buffer: await fs.readFile(source), filename: `${id}.zip` };
  }
  const files = await readStoredFiles(id);
  if (files.size === 0) return null;
  return { buffer: writeZipEntries(files), filename: `${id}.zip` };
}
