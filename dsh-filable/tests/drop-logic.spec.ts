/**
 * T05 — client drop-decision logic (lib/drop-logic.js is the single source of
 * truth; the client bundle inlines the same small functions).
 */
import { describe, expect, it } from 'vitest'
import { appendRef, buildUploadUrl, formatBytes, isFileDrag, planUploads, sessionfilesRef, subscribeStore } from '../lib/drop-logic.js'

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
