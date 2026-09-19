import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  product: { count: vi.fn(), findMany: vi.fn() },
  category: { findMany: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({ prisma: db }))

import { getGiftFinderData } from '@/lib/gift-finder-server'
import { parseGiftFilters } from '@/lib/gift-finder'

describe('gift finder data', () => {
  beforeEach(() => {
    db.product.count.mockResolvedValue(25)
    db.category.findMany.mockResolvedValue([{ id: 1, name: 'Vòng tay', slug: 'vong-tay' }])
    db.product.findMany.mockResolvedValue([{
      id: 1, name: 'Vòng tay nấm', slug: 'vong-tay-nam', price: '120000', sale_price: '90000',
      stock: 3, is_customizable: true, is_featured: true, featured_image: null,
      category: { name: 'Vòng tay', slug: 'vong-tay' }, images: [],
    }])
  })

  it('bounds the query, uses the same filters for count and rows, and serializes prices', async () => {
    const data = await getGiftFinderData(parseGiftFilters({ budget: '100000', custom: '1', page: '9999' }))
    expect(data.status).toBe('ready')
    expect(data.page).toBe(3)
    expect(data.total).toBe(25)
    expect(db.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: db.product.count.mock.calls[0][0].where, take: 12, skip: 24,
      orderBy: [{ is_featured: 'desc' }, { id: 'desc' }],
      select: expect.objectContaining({ price: true, sale_price: true, images: expect.objectContaining({ take: 1 }) }),
    }))
    expect(data.products[0]).toMatchObject({ price: 120000, sale_price: 90000 })
  })

  it('does not load products for an empty result', async () => {
    db.product.count.mockResolvedValue(0)
    const data = await getGiftFinderData(parseGiftFilters({ page: '12' }))
    expect(data).toMatchObject({ status: 'ready', page: 1, total: 0, products: [] })
    expect(db.product.findMany).not.toHaveBeenCalled()
  })

  it('distinguishes a database outage from an empty catalog and does not log credentials', async () => {
    db.product.count.mockRejectedValue(new Error('private connection details'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const data = await getGiftFinderData(parseGiftFilters({}))
    expect(data.status).toBe('unavailable')
    expect(log).toHaveBeenCalledWith({ event: 'gift_finder_query_failed', errorType: 'Error' })
    expect(JSON.stringify(log.mock.calls)).not.toContain('private connection details')
  })
})
