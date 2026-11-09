// DSH-Filable — browser drop-decision logic (pure, testable, single source of
// truth). The client bundle inlines these same small functions because the
// module loader only resolves table words, not sibling files; this module is
// what the unit tests pin.
//
// Two settings switches route each dropped file category: either into the
// session's `sessionfiles/` dir (this plugin's upload path) or into DSH's
// native attachment pipeline. Both default to `sessionfile`, the plugin's
// historical behaviour when no preference has been stored.

/**
 * Build the upload request URL with URL-encoded query parameters.
 * @param {string} sessionId
 * @param {string} name
 */
export function buildUploadUrl(sessionId, name) {
  const params = new URLSearchParams()
  if (sessionId !== '') params.set('session', sessionId)
  params.set('name', name)
  return `/dsh-filable/files?${params.toString()}`
}

/** Whether a drag event carries files at all (text/html drags pass through). */
export function isFileDrag(dataTransfer) {
  return Boolean(dataTransfer) && Array.from(dataTransfer.types).includes('Files')
}

/**
 * Human-readable byte size ("1.2 MB"). */
export function formatBytes(value) {
  const n = Number(value)
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
  const v = n / Math.pow(1024, i)
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

/**
 * Minimal subscription store — the single state mechanism behind toasts and
 * chips (one tested implementation, one React bridge).
 * @returns {{get: () => T, set: (next: T) => void, subscribe: (l: (v: T) => void) => () => void}}
 */
export function subscribeStore(initial) {
  let value = initial
  const listeners = new Set()
  return {
    get: () => value,
    set(next) {
      value = next
      listeners.forEach(listener => listener(value))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/**
 * Plan a dropped batch: every file is taken over (no MIME split) and returned
 * in request order.
 * @param {Array<{type: string}>} files
 * @returns {{takeOver: Array<{type: string}>}}
 */
export function planUploads(files) {
  return { takeOver: Array.from(files || []) }
}

/**
 * Format an `@file` mention for a path under the workspace `sessionfiles/`
 * dir, following the native @-reference grammar: `@path` normally, `@"path"`
 * when the path contains whitespace. Returns null for a path the grammar
 * cannot represent safely (control chars / a stray quote).
 * @param {string} name - the final (deduped) filename on disk.
 * @returns {string | null}
 */
export function sessionfilesRef(name) {
  const path = 'sessionfiles/' + String(name)
  if (/[\u0000-\u001f\u007f-\u009f"]/.test(path)) return null
  return /\s/.test(path) ? `@"${path}"` : `@${path}`
}

/**
 * Append a reference to an existing draft, inserting a single space separator
 * only when the draft is non-empty and does not already end in whitespace.
 * @param {string} draft - current composer draft.
 * @param {string} ref - the reference text to append.
 * @returns {string}
 */
export function appendRef(draft, ref) {
  const d = String(draft || '')
  const sep = d === '' || /\s$/.test(d) ? '' : ' '
  return d + sep + ref
}

// ── file routing settings (two switches in General settings) ─────────────
// `native` hands a drop back to DSH's attachment pipeline; `sessionfile`
// uploads it to the workspace sessionfiles dir through the plugin's route.

/** localStorage key holding both switches. */
export const SETTINGS_KEY = 'dsh-filable:settings'

/** Both categories default to the plugin's existing sessionfiles behaviour. */
export const DEFAULT_SETTINGS = { images: 'sessionfile', files: 'sessionfile' }

/**
 * Classify a dropped file as `images` or `files` (the two switch categories).
 * MIME is authoritative; the extension is the fallback for empty/odd types.
 * @param {{name?: string, type?: string}} file
 * @returns {'images' | 'files'}
 */
export function fileCategory(file) {
  const type = String((file && file.type) || '').toLowerCase()
  if (type.startsWith('image/')) return 'images'
  const name = String((file && file.name) || '')
  return /\.(?:png|jpe?g|gif|webp|avif|bmp|svg|ico|tiff?|heic|heif)$/i.test(name) ? 'images' : 'files'
}

/**
 * Coerce stored/partial settings into the exact two-switch shape.
 * @param {unknown} value
 * @returns {{images: 'native' | 'sessionfile', files: 'native' | 'sessionfile'}}
 */
export function normalizeSettings(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    images: source.images === 'native' ? 'native' : 'sessionfile',
    files: source.files === 'native' ? 'native' : 'sessionfile',
  }
}

/**
 * Read both switches from a Storage-like object, falling back to defaults
 * when storage is unavailable, empty, or holds malformed JSON.
 * @param {{getItem?: (key: string) => string | null} | null | undefined} storage
 */
export function loadSettings(storage) {
  try {
    const raw = storage && typeof storage.getItem === 'function' ? storage.getItem(SETTINGS_KEY) : null
    return normalizeSettings(raw ? JSON.parse(raw) : null)
  } catch (error) {
    return normalizeSettings(null)
  }
}

/**
 * Persist normalized settings and return what was written (a storage failure
 * keeps the in-memory toggle working for the current page).
 * @param {{setItem?: (key: string, value: string) => void} | null | undefined} storage
 * @param {unknown} value
 */
export function saveSettings(storage, value) {
  const next = normalizeSettings(value)
  try {
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(SETTINGS_KEY, JSON.stringify(next))
    }
  } catch (error) { /* private mode / quota: keep the in-memory value */ }
  return next
}

/**
 * Split a dropped batch by the two switches, preserving each side's order.
 * @param {unknown} settings
 * @param {Array<{name?: string, type?: string}>} files
 * @returns {{native: Array<object>, sessionfile: Array<object>}}
 */
export function planDrops(settings, files) {
  const modes = normalizeSettings(settings)
  const native = []
  const sessionfile = []
  Array.from(files || []).forEach(file => {
    if (modes[fileCategory(file)] === 'native') native.push(file)
    else sessionfile.push(file)
  })
  return { native, sessionfile }
}
