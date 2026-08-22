// JI-Filable — browser drop-decision logic (pure, testable, single source of
// truth). The client bundle inlines these same small functions because the
// module loader only resolves table words, not sibling files; this module is
// what the unit tests pin.

/** The four image media types the built-in attachment flow accepts. */
export const IMAGE_WHITELIST = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Classify a dropped file's MIME type: whitelisted images keep the existing
 * attachment flow; everything else (including svg/tiff/bmp/heic and any
 * non-image type) is taken over by ji-filable.
 * @returns 'pass' | 'take-over'
 */
export function classifyFile(fileType) {
  return IMAGE_WHITELIST.includes(fileType) ? 'pass' : 'take-over'
}

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
 * Classify a whole dropped batch by MIME types.
 * @param {Array<string>} fileTypes
 * @returns 'all-images' | 'all-others' | 'mixed'
 */
export function classifyBatch(fileTypes) {
  const types = Array.from(fileTypes || [])
  if (types.length === 0) return 'all-others'
  const hasImage = types.some(type => IMAGE_WHITELIST.includes(type))
  const hasOther = types.some(type => !IMAGE_WHITELIST.includes(type))
  if (hasImage && hasOther) return 'mixed'
  return hasImage ? 'all-images' : 'all-others'
}

/**
 * Collect the MIME types visible on a DataTransfer before drop. Chrome exposes
 * item.type on dragenter/dragover; when nothing is visible yet the caller must
 * fall back to drop-time classification via dataTransfer.files.
 * @returns {Array<string>}
 */
export function dragTypes(dataTransfer) {
  const items = dataTransfer && dataTransfer.items ? Array.from(dataTransfer.items) : []
  return items
    .map(item => (item && typeof item.type === 'string' ? item.type : ''))
    .filter(type => type !== '')
}

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
 * Plan a dropped batch: split into the files ji-filable takes over and the
 * whitelisted images that keep the existing flow.
 * @param {Array<{type: string}>} files
 * @returns {{takeOver: Array<{type: string}>, skippedImages: number}}
 */
export function planUploads(files) {
  const all = Array.from(files || [])
  const takeOver = all.filter(file => classifyFile(file.type) === 'take-over')
  return { takeOver, skippedImages: all.length - takeOver.length }
}
