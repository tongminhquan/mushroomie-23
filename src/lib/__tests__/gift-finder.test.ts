import { describe, expect, it } from 'vitest'
import { buildGiftFinderUrl, buildGiftProductWhere, parseGiftFilters } from '@/lib/gift-finder'

describe('gift finder URL filters', () => {
  it('defaults to all budgets and categories without requiring personalization', () => {
    expect(parseGiftFilters({})).toEqual({ budget: 'any', category: '', customizable: false, page: 1 })
  })

  it('uses the first repeated parameter and preserves the chosen filters in pagination', () => {
    const filters = parseGiftFilters({ budget: ['200000', '500000'], category: 'vong-tay', custom: '1', page: '2' })
    const url = new URL(buildGiftFinderUrl(filters, 3), 'https://mushroomie.io.vn')
    expect(Object.fromEntries(url.searchParams)).toEqual({ budget: '200000', category: 'vong-tay', custom: '1', page: '3' })
    expect(buildGiftFinderUrl(parseGiftFilters({}))).toBe('/chon-qua')
  })

  it.each(['-1', 'Infinity', '1e9', '1.2', '2oops', '9999999999999'])('rejects unsafe page %s', (page) => {
    expect(parseGiftFilters({ page }).page).toBe(1)
  })

  it('rejects unrecognized budget, markup and overlong categories', () => {
    expect(parseGiftFilters({ budget: '__proto__', category: '<script>alert(1)</script>', custom: 'true' }))
      .toEqual({ budget: 'any', category: '', customizable: false, page: 1 })
    expect(parseGiftFilters({ category: 'a'.repeat(192) }).category).toBe('')
  })

  it('keeps valid Unicode category slugs safely URL encoded', () => {
    const filters = parseGiftFilters({ category: 'vòng-tay' })
    expect(new URL(buildGiftFinderUrl(filters), 'https://example.com').searchParams.get('category')).toBe('vòng-tay')
  })
})

describe('gift finder database filter', () => {
  it('always excludes hidden, sold-out and invalid-price products', () => {
    expect(buildGiftProductWhere(parseGiftFilters({}))).toEqual({
      status: 'active', stock: { gt: 0 }, price: { gt: 0 },
    })
  })

  it('includes a valid sale within budget even when the regular price is higher', () => {
    expect(buildGiftProductWhere(parseGiftFilters({ budget: '100000', category: 'vong-tay', custom: '1' })))
      .toEqual({
        status: 'active', stock: { gt: 0 }, price: { gt: 0 },
        category: { slug: 'vong-tay', type: 'product' }, is_customizable: true,
        OR: [{ price: { lte: 100000 } }, { sale_price: { gt: 0, lte: 100000 } }],
      })
  })
})
