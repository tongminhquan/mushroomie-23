import { describe, expect, it } from 'vitest'
import { getUploadVariantUrl, uploadVariantLoader } from '@/lib/image-variants'

describe('responsive upload variants', () => {
  it.each([
    [96, '/uploads/product-384.webp'],
    [384, '/uploads/product-384.webp'],
    [640, '/uploads/product-750.webp'],
    [750, '/uploads/product-750.webp'],
    [828, '/uploads/product.webp'],
  ])('maps a requested width of %i to the nearest generated source', (width, expected) => {
    expect(getUploadVariantUrl('/uploads/product.webp', width)).toBe(expected)
  })

  it.each([
    ['/logo.webp', 384],
    ['https://cdn.example.com/product.webp', 384],
    ['/uploads/product.png', 384],
    ['/uploads/product-750.webp', 384],
  ])('leaves unsupported or already-derived sources unchanged', (src, width) => {
    expect(getUploadVariantUrl(src, width)).toBe(src)
  })

  it('keeps the requested width in custom-loader URLs for Next Image', () => {
    expect(uploadVariantLoader({ src: '/uploads/product.webp', width: 640 }))
      .toBe('/uploads/product-750.webp?w=640')
  })
})
