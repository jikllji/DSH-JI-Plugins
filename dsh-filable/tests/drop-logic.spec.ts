/**
 * T05 — client drop-decision logic (lib/drop-logic.js is the single source of
 * truth; the client bundle inlines the same small functions).
 */
import { describe, expect, it } from 'vitest'
import {
  appendRef,
  buildUploadUrl,
  DEFAULT_SETTINGS,
  fileCategory,
  formatBytes,
  isFileDrag,
  loadSettings,
  normalizeSettings,
  planDrops,
  planUploads,
  saveSettings,
  SETTINGS_KEY,
  sessionfilesRef,
  subscribeStore,
} from '../lib/drop-logic.js'

describe('buildUploadUrl', () => {
  it('encodes the name and includes session when present', () => {
    const url = buildUploadUrl('s1', '我的 文件.txt')
    expect(url).toContain('/dsh-filable/files?')
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('session')).toBe('s1')
    expect(params.get('name')).toBe('我的 文件.txt')
  })

  it('omits session when empty', () => {
    expect(buildUploadUrl('', 'a.bin')).not.toContain('session=')
  })
})

describe('isFileDrag', () => {
  it('detects file drags only', () => {
    expect(isFileDrag({ types: ['Files'] })).toBe(true)
    expect(isFileDrag({ types: ['text/html', 'Files'] })).toBe(true)
    expect(isFileDrag({ types: ['text/plain'] })).toBe(false)
    expect(isFileDrag(null)).toBe(false)
  })
})

describe('formatBytes', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('subscribeStore', () => {
  it('notifies subscribers on set and stops after unsubscribe', () => {
    const store = subscribeStore(0)
    const seen: number[] = []
    const off = store.subscribe(value => { seen.push(value) })
    store.set(1)
    store.set(2)
    off()
    store.set(3)
    expect(store.get()).toBe(3)
    expect(seen).toEqual([1, 2])
  })
})

describe('planUploads', () => {
  // R7 — every dropped file is taken over, images included: the composer's
  // image flow no longer receives drops at all. Input order is preserved.
  it('takes over every dropped file, images included', () => {
    const files = [{ type: 'image/png' }, { type: 'text/plain' }, { type: 'application/pdf' }, { type: 'image/gif' }]
    expect(planUploads(files).takeOver.map(file => file.type))
      .toEqual(['image/png', 'text/plain', 'application/pdf', 'image/gif'])
  })

  it('handles empty, image-only and missing input', () => {
    expect(planUploads([])).toEqual({ takeOver: [] })
    expect(planUploads([{ type: 'image/png' }])).toEqual({ takeOver: [{ type: 'image/png' }] })
    expect(planUploads(undefined)).toEqual({ takeOver: [] })
  })

  it('returns a copy so a caller cannot mutate the source list', () => {
    const files = [{ type: 'image/png' }]
    expect(planUploads(files).takeOver).not.toBe(files)
  })
})

describe('sessionfilesRef (R6)', () => {
  it('emits a plain @path for a normal name', () => {
    expect(sessionfilesRef('report.pdf')).toBe('@sessionfiles/report.pdf')
  })

  it('quotes a path with whitespace using the native @"path"', () => {
    expect(sessionfilesRef('我的 文件.txt')).toBe('@"sessionfiles/我的 文件.txt"')
  })

  it('returns null for a path the grammar cannot represent', () => {
    expect(sessionfilesRef('a"b.txt')).toBeNull()
  })
})

describe('appendRef (R6)', () => {
  it('adds a single space separator when the draft ends in a non-space character', () => {
    expect(appendRef('帮我看看', '@sessionfiles/report.pdf')).toBe('帮我看看 @sessionfiles/report.pdf')
  })

  it('does not add a separator for an empty draft or one ending in whitespace', () => {
    expect(appendRef('', '@sessionfiles/report.pdf')).toBe('@sessionfiles/report.pdf')
    expect(appendRef('帮我看看 ', '@sessionfiles/report.pdf')).toBe('帮我看看 @sessionfiles/report.pdf')
  })
})

describe('fileCategory', () => {
  it('classifies image MIME types first', () => {
    expect(fileCategory({ name: 'photo.bin', type: 'image/png' })).toBe('images')
    // A non-image MIME still falls through to the extension fallback.
    expect(fileCategory({ name: 'photo.png', type: 'application/octet-stream' })).toBe('images')
  })

  it('falls back to the extension when the type is missing', () => {
    expect(fileCategory({ name: 'photo.JPG' })).toBe('images')
    expect(fileCategory({ name: 'scan.jpeg', type: '' })).toBe('images')
    expect(fileCategory({ name: 'diagram.svg' })).toBe('images')
    expect(fileCategory({ name: 'notes.txt', type: '' })).toBe('files')
    expect(fileCategory({ name: 'no-extension' })).toBe('files')
    expect(fileCategory({ name: 'trap.png.exe' })).toBe('files')
  })

  it('tolerates missing files', () => {
    expect(fileCategory(undefined)).toBe('files')
    expect(fileCategory({})).toBe('files')
  })
})

describe('settings persistence', () => {
  it('exposes stable key and defaults', () => {
    expect(SETTINGS_KEY).toBe('dsh-filable:settings')
    expect(DEFAULT_SETTINGS).toEqual({ images: 'sessionfile', files: 'sessionfile' })
  })

  it('normalizes partial and malformed values', () => {
    expect(normalizeSettings({ images: 'native', files: 'native' })).toEqual({ images: 'native', files: 'native' })
    expect(normalizeSettings({ images: 'native' })).toEqual({ images: 'native', files: 'sessionfile' })
    expect(normalizeSettings({ images: 'NATIVE', files: 'elsewhere' })).toEqual({ images: 'sessionfile', files: 'sessionfile' })
    expect(normalizeSettings(null)).toEqual({ images: 'sessionfile', files: 'sessionfile' })
  })

  it('loads from storage, defaulting on missing/invalid data', () => {
    const store = (raw: string | null) => ({ getItem: (key: string) => (key === SETTINGS_KEY ? raw : null) })
    expect(loadSettings(store(JSON.stringify({ images: 'native' })))).toEqual({ images: 'native', files: 'sessionfile' })
    expect(loadSettings(store(null))).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(store('not json'))).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings({ getItem: () => { throw new Error('denied') } })).toEqual(DEFAULT_SETTINGS)
  })

  it('saves normalized settings and survives storage failures', () => {
    const writes: Array<[string, string]> = []
    const storage = { setItem: (key: string, value: string) => { writes.push([key, value]) } }
    expect(saveSettings(storage, { images: 'native', files: 'bogus' })).toEqual({ images: 'native', files: 'sessionfile' })
    expect(writes).toEqual([[SETTINGS_KEY, JSON.stringify({ images: 'native', files: 'sessionfile' })]])
    expect(saveSettings(null, { files: 'native' })).toEqual({ images: 'sessionfile', files: 'native' })
    expect(saveSettings({ setItem: () => { throw new Error('quota') } }, { images: 'native' }))
      .toEqual({ images: 'native', files: 'sessionfile' })
  })
})

describe('planDrops', () => {
  const image = { name: 'a.png', type: 'image/png' }
  const doc = { name: 'a.pdf', type: 'application/pdf' }
  const text = { name: 'a.txt', type: 'text/plain' }

  it('defaults to persisting every file through sessionfiles', () => {
    const plan = planDrops(undefined, [image, doc, text])
    expect(plan.native).toEqual([])
    expect(plan.sessionfile).toEqual([image, doc, text])
  })

  it('splits image and other-file categories independently', () => {
    const plan = planDrops({ images: 'native', files: 'sessionfile' }, [image, doc, text])
    expect(plan.native).toEqual([image])
    expect(plan.sessionfile).toEqual([doc, text])

    const reverse = planDrops({ images: 'sessionfile', files: 'native' }, [image, doc, text])
    expect(reverse.native).toEqual([doc, text])
    expect(reverse.sessionfile).toEqual([image])
  })

  it('sends everything native when both switches are on', () => {
    const plan = planDrops({ images: 'native', files: 'native' }, [image, doc])
    expect(plan.native).toEqual([image, doc])
    expect(plan.sessionfile).toEqual([])
  })

  it('preserves order within each side and tolerates missing input', () => {
    const plan = planDrops({ images: 'native', files: 'native' }, [image, doc, image])
    expect(plan.native).toEqual([image, doc, image])
    expect(planDrops({}, undefined)).toEqual({ native: [], sessionfile: [] })
    expect(planDrops({}, [])).toEqual({ native: [], sessionfile: [] })
  })
})
