import { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  productCreate: vi.fn(),
  productFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  productDelete: vi.fn(),
  logAdminAction: vi.fn(),
  revalidateProduct: vi.fn(),
  recordAndRevalidatePublication: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      create: mocks.productCreate,
      findUnique: mocks.productFindUnique,
      update: mocks.productUpdate,
      delete: mocks.productDelete,
    },
  },
}))

vi.mock('@/lib/admin-logger', () => ({
  logAdminAction: mocks.logAdminAction,
}))

vi.mock('@/lib/product-revalidate', () => ({
  revalidateProduct: mocks.revalidateProduct,
}))

vi.mock('@/lib/seo-discovery/publication', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/seo-discovery/publication')>()
  return {
    ...actual,
    recordAndRevalidatePublication: mocks.recordAndRevalidatePublication,
  }
})

import { POST as createProduct } from '@/app/api/products/route'
import { PUT as updateProduct } from '@/app/api/products/[id]/route'

const SAVED_AT = new Date('2026-08-11T04:30:00.000Z')
const existingProduct = {
  id: 24,
  name: 'Móc khóa nấm',
  slug: 'moc-khoa-nam',
  short_description: 'Mô tả ngắn',
  description: '<p>Mô tả</p>',
  price: new Prisma.Decimal('120000'),
  sale_price: new Prisma.Decimal('99000'),
  sku: 'MK-NAM-01',
  stock: 8,
  status: 'active',
  is_customizable: true,
  is_featured: false,
  featured_image: '/uploads/moc-khoa-nam.webp',
  category_id: 3,
  created_at: new Date('2026-08-01T04:30:00.000Z'),
  updated_at: new Date('2026-08-10T04:30:00.000Z'),
  images: [
    { image_url: '/uploads/moc-khoa-nam-1.webp', sort_order: 0 },
  ],
}

function request(method: 'POST' | 'PUT', body: Record<string, unknown>) {
  return new NextRequest('https://mushroomie.io.vn/api/products', {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  })
}

function updateContext() {
  return { params: Promise.resolve({ id: String(existingProduct.id) }) }
}

describe('product publication routes', () => {
  beforeEach(() => {
    mocks.auth.mockReset()
    mocks.productCreate.mockReset()
    mocks.productFindUnique.mockReset()
    mocks.productUpdate.mockReset()
    mocks.productDelete.mockReset()
    mocks.logAdminAction.mockReset()
    mocks.revalidateProduct.mockReset()
    mocks.recordAndRevalidatePublication.mockReset()

    mocks.auth.mockResolvedValue({
      user: { id: '7', role: 'admin' },
    })
    mocks.logAdminAction.mockResolvedValue(undefined)
    mocks.recordAndRevalidatePublication.mockResolvedValue({ recorded: true })
  })

  it('records an active create from the exact Prisma-saved row after the audit log', async () => {
    const sequence: string[] = []
    const saved = { ...existingProduct, updated_at: SAVED_AT }
    mocks.productCreate.mockResolvedValue(saved)
    mocks.logAdminAction.mockImplementation(async () => {
      sequence.push('log')
    })
    mocks.recordAndRevalidatePublication.mockImplementation(async () => {
      sequence.push('publication')
      return { recorded: true }
    })

    const response = await createProduct(request('POST', {
      name: saved.name,
      slug: saved.slug,
      price: Number(saved.price),
      sale_price: Number(saved.sale_price),
      status: 'active',
    }))

    expect(response.status).toBe(201)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'product',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
      contentUpdatedAt: SAVED_AT,
      reason: 'created',
    })
    expect(sequence).toEqual(['log', 'publication'])
    expect(mocks.revalidateProduct).not.toHaveBeenCalled()
  })

  it('does not enqueue an inactive create and keeps the legacy cache invalidation', async () => {
    const saved = {
      ...existingProduct,
      status: 'inactive',
      updated_at: SAVED_AT,
    }
    mocks.productCreate.mockResolvedValue(saved)

    const response = await createProduct(request('POST', {
      name: saved.name,
      slug: saved.slug,
      price: Number(saved.price),
      sale_price: Number(saved.sale_price),
      status: 'inactive',
    }))

    expect(response.status).toBe(201)
    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
    expect(mocks.revalidateProduct).toHaveBeenCalledOnce()
    expect(mocks.revalidateProduct).toHaveBeenCalledWith(saved.slug)
  })

  it('records inactive to active as activated from the saved row', async () => {
    const existing = { ...existingProduct, status: 'inactive' }
    const saved = { ...existingProduct, status: 'active', updated_at: SAVED_AT }
    mocks.productFindUnique.mockResolvedValue(existing)
    mocks.productUpdate.mockResolvedValue(saved)

    const response = await updateProduct(
      request('PUT', { status: 'active' }),
      updateContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'product',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
      contentUpdatedAt: SAVED_AT,
      reason: 'activated',
    })
    expect(mocks.revalidateProduct).not.toHaveBeenCalled()
  })

  it('invalidates the old slug when activation also saves a new slug', async () => {
    const existing = { ...existingProduct, status: 'inactive' }
    const saved = {
      ...existingProduct,
      slug: 'moc-khoa-nam-moi',
      status: 'active',
      updated_at: SAVED_AT,
    }
    mocks.productFindUnique.mockResolvedValue(existing)
    mocks.productUpdate.mockResolvedValue(saved)

    const response = await updateProduct(
      request('PUT', { slug: saved.slug, status: 'active' }),
      updateContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'product',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam-moi',
      contentUpdatedAt: SAVED_AT,
      reason: 'activated',
    }, {
      previousUrl: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
    })
    expect(mocks.revalidateProduct).not.toHaveBeenCalled()
  })

  it('invalidates both active slug paths while enqueuing only the saved new URL', async () => {
    const saved = {
      ...existingProduct,
      slug: 'moc-khoa-nam-moi',
      updated_at: SAVED_AT,
    }
    mocks.productFindUnique.mockResolvedValue(existingProduct)
    mocks.productUpdate.mockResolvedValue(saved)

    const response = await updateProduct(
      request('PUT', { slug: saved.slug }),
      updateContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith({
      source: 'product',
      sourceId: saved.id,
      url: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam-moi',
      contentUpdatedAt: SAVED_AT,
      reason: 'updated',
    }, {
      previousUrl: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
    })
    expect(mocks.revalidateProduct).not.toHaveBeenCalled()
  })

  it('does not enqueue an updated_at-only active save', async () => {
    const saved = {
      ...existingProduct,
      price: new Prisma.Decimal(existingProduct.price.toString()),
      sale_price: new Prisma.Decimal(existingProduct.sale_price.toString()),
      images: existingProduct.images.map((image) => ({ ...image })),
      updated_at: SAVED_AT,
    }
    mocks.productFindUnique.mockResolvedValue(existingProduct)
    mocks.productUpdate.mockResolvedValue(saved)

    const response = await updateProduct(request('PUT', {}), updateContext())

    expect(response.status).toBe(200)
    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
    expect(mocks.revalidateProduct).toHaveBeenCalledWith(
      existingProduct.slug,
      saved.slug,
    )
  })

  it('does not enqueue deactivation and invalidates the formerly public product', async () => {
    const saved = {
      ...existingProduct,
      status: 'inactive',
      updated_at: SAVED_AT,
    }
    mocks.productFindUnique.mockResolvedValue(existingProduct)
    mocks.productUpdate.mockResolvedValue(saved)

    const response = await updateProduct(
      request('PUT', { status: 'inactive' }),
      updateContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
    expect(mocks.revalidateProduct).toHaveBeenCalledWith(
      existingProduct.slug,
      saved.slug,
    )
  })
})
