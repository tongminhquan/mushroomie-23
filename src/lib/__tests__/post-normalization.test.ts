import { beforeEach, describe, expect, it, vi } from 'vitest'

const inspectImageForRenderMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/server-image', () => ({
  inspectImageForRender: inspectImageForRenderMock,
}))

import {
  buildPostContentMetrics,
  extractTagNames,
  normalizeOptionalPostImage,
  normalizePostContent,
  normalizeStoredPostImage,
  serializePostForEditor,
  serializeStringArray,
} from '@/lib/post-normalization'

describe('post normalization', () => {
  beforeEach(() => {
    inspectImageForRenderMock.mockImplementation(async (value: string | null | undefined) => ({
      exists: Boolean(value),
      issue: value ? null : 'missing-file',
      renderSrc: value || '/images/product-placeholder.png',
    }))
  })

  it('sanitizes stored content and normalizes embedded upload paths', () => {
    const result = normalizePostContent('<p onclick="bad()">Hi<img src="public/uploads/post.jpg"></p><script>bad()</script>')

    expect(result).toContain('src="/uploads/post.jpg"')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('<script')
  })

  it('normalizes required and optional post image values', () => {
    expect(normalizeStoredPostImage('post.webp')).toBe('/uploads/post.webp')
    expect(normalizeStoredPostImage('')).toBe('')
    expect(normalizeOptionalPostImage('post.webp')).toBe('/uploads/post.webp')
    expect(normalizeOptionalPostImage('   ')).toBeNull()
  })

  it('extracts tag names from supported relation and editor shapes', () => {
    expect(extractTagNames([
      ' handmade ',
      { name: 'cá nhân hóa' },
      { tag: { name: 'vòng tay' } },
      null,
      { unsupported: true },
    ])).toEqual(['handmade', 'cá nhân hóa', 'vòng tay'])
    expect(extractTagNames('handmade')).toEqual([])
  })

  it('serializes string arrays and returns content metrics', () => {
    expect(serializeStringArray([' one ', '', 3, 'two'])).toBe('["one","two"]')
    expect(serializeStringArray('  raw  ')).toBe('raw')
    expect(serializeStringArray([])).toBeNull()
    expect(buildPostContentMetrics('<p>một hai ba</p>')).toMatchObject({ readingTime: 1, wordCount: 3 })
    expect(buildPostContentMetrics(null)).toEqual({ content: '', readingTime: null, wordCount: null })
  })

  it('serializes complete editor image and tag state', async () => {
    const post = {
      id: 1,
      content: '<p>Hello</p>',
      featured_image: 'featured.webp',
      og_image: null,
      twitter_image: '/uploads/twitter.webp',
      tags: [{ tag: { name: 'gift' } }],
    }

    const result = await serializePostForEditor(post)

    expect(result).toMatchObject({
      id: 1,
      featured_image: '/uploads/featured.webp',
      featured_image_exists: true,
      og_image: '',
      og_image_exists: false,
      twitter_image: '/uploads/twitter.webp',
      tags: ['gift'],
    })
    expect(inspectImageForRenderMock).toHaveBeenCalledTimes(3)
  })
})
