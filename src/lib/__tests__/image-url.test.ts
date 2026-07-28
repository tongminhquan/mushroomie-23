import { describe, expect, it } from 'vitest'
import { getImageFallback, normalizeImageUrl, normalizeStoredImagePath } from '@/lib/image-url'

describe('image URL normalization', () => {
  it.each([
    ['public/uploads/item.png', '/uploads/item.png'],
    ['/public/uploads/item.png', '/uploads/item.png'],
    ['./uploads/item.png', '/uploads/item.png'],
    ['uploads/item.png', '/uploads/item.png'],
    ['item.webp', '/uploads/item.webp'],
    ['http://localhost:3001/public/uploads/item.jpg', '/uploads/item.jpg'],
    ['https://mushroomie.io.vn/uploads/item.avif', '/uploads/item.avif'],
    ['C:\\temp\\item.png', 'C:\\temp\\item.png'],
  ])('normalizes stored path %s', (input, expected) => {
    expect(normalizeStoredImagePath(input)).toBe(expected)
  })

  it('keeps safe external, blob, and data URLs unchanged', () => {
    expect(normalizeStoredImagePath('https://cdn.example.com/item.webp')).toBe('https://cdn.example.com/item.webp')
    expect(normalizeImageUrl('blob:https://mushroomie.io.vn/id')).toBe('blob:https://mushroomie.io.vn/id')
    expect(normalizeImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it.each([
    [undefined, 'product'],
    ['null', 'product'],
    ['/wp-content/uploads/legacy.jpg', 'post'],
    ['/var/www/mushroomie/private.jpg', 'banner'],
  ] as const)('uses the correct fallback for unsafe input %s', (input, kind) => {
    expect(normalizeImageUrl(input, kind)).toBe(getImageFallback(kind))
  })

  it('uses distinct user and banner fallbacks', () => {
    expect(getImageFallback('user')).toBe('/logo.webp')
    expect(getImageFallback('banner')).toBe('/images/banner-placeholder.webp')
  })
})
