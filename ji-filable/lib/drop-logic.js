// JI-Filable — browser drop-decision logic (pure, testable, single source of
// truth). The client bundle inlines these same small functions because the
// module loader only resolves table words, not sibling files; this module is
// what the unit tests pin.
//
// Every dropped file is taken over, images included: they all land in the
// session's `sessionfiles/` dir, so no MIME split exists any more.

/**
 * Build the upload request URL with URL-encoded query parameters.
 * @param {string} sessionId
 * @param {string} name
 */
export function buildUploadUrl(sessionId, name) {
  const params = new URLSearchParams()
  if (sessionId !== '') params.set('session', sessionId)
  params.set('name', name)
  return `/ji-filable/files?${params.toString()}`
}

/** Whether a drag event carries files at all (text/html drags pass through). */
export function isFileDrag(dataTransfer) {
  return Boolean(dataTransfer) && Array.from(dataTransfer.types).includes('Files')
}

/**

/** Human-readable byte size ("1.2 MB"). */
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
