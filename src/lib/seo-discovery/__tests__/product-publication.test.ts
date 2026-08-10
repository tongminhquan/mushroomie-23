import { Prisma, type Product } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import * as publicationModule from '@/lib/seo-discovery/publication'

type ProductImagePublicationState = {
  image_url: string
  sort_order: number
}

type ProductPublicationState = Product & {
  images: ProductImagePublicationState[]
}

type ProductPublicationPredicate = (
  existing: ProductPublicationState,
  saved: ProductPublicationState,
) => boolean

const activeProduct: ProductPublicationState = {
  id: 24,
  name: 'Móc khóa nấm pixel',
  slug: 'moc-khoa-nam-pixel',
  short_description: 'Móc khóa handmade cá nhân hóa',
  description: '<p>Mô tả sản phẩm công khai</p>',
  price: new Prisma.Decimal('120000'),
  sale_price: new Prisma.Decimal('99000'),
  sku: 'MK-NAM-01',
  stock: 8,
  status: 'active',
  is_customizable: true,
  is_featured: false,
  featured_image: '/uploads/moc-khoa-nam.webp',
  category_id: 3,
  created_at: new Date('2026-08-01T00:00:00.000Z'),
  updated_at: new Date('2026-08-10T04:00:00.000Z'),
  images: [
    { image_url: '/uploads/moc-khoa-nam-1.webp', sort_order: 0 },
    { image_url: '/uploads/moc-khoa-nam-2.webp', sort_order: 1 },
  ],
}

const materialChanges: Record<string, Partial<ProductPublicationState>> = {
  name: { name: 'Móc khóa nấm pixel mới' },
  slug: { slug: 'moc-khoa-nam-pixel-moi' },
  short_description: { short_description: 'Mô tả ngắn mới' },
  description: { description: '<p>Mô tả chi tiết mới</p>' },
  price: { price: new Prisma.Decimal('130000') },
  sale_price: { sale_price: new Prisma.Decimal('109000') },
  sku: { sku: 'MK-NAM-02' },
  stock: { stock: 0 },
  is_customizable: { is_customizable: false },
  is_featured: { is_featured: true },
  featured_image: { featured_image: '/uploads/moc-khoa-nam-moi.webp' },
  category_id: { category_id: 4 },
  images: {
    images: [
      { image_url: '/uploads/moc-khoa-nam-2.webp', sort_order: 0 },
      { image_url: '/uploads/moc-khoa-nam-1.webp', sort_order: 1 },
    ],
  },
}

function predicate(): ProductPublicationPredicate {
  const candidate = (
    publicationModule as typeof publicationModule & {
      shouldRecordProductPublication?: ProductPublicationPredicate
    }
  ).shouldRecordProductPublication

  expect(candidate).toBeTypeOf('function')
  return candidate as ProductPublicationPredicate
}

describe('shouldRecordProductPublication', () => {
  it('does not record an unchanged active product fetched as fresh Prisma values', () => {
    const saved = {
      ...activeProduct,
      price: new Prisma.Decimal(activeProduct.price.toString()),
      sale_price: new Prisma.Decimal(activeProduct.sale_price!.toString()),
      updated_at: new Date('2026-08-11T04:00:00.000Z'),
      images: activeProduct.images.map((image) => ({ ...image })),
    }

    expect(predicate()(activeProduct, saved)).toBe(false)
  })

  it.each(Object.entries(materialChanges))(
    'records an active product when public field %s changes',
    (_field, change) => {
      expect(predicate()(activeProduct, {
        ...activeProduct,
        ...change,
        updated_at: new Date('2026-08-11T04:00:00.000Z'),
      })).toBe(true)
    },
  )

  it.each(['inactive', 'draft'])(
    'records a %s to active transition',
    (status) => {
      expect(predicate()(
        { ...activeProduct, status },
        activeProduct,
      )).toBe(true)
    },
  )

  it.each(['inactive', 'draft'])(
    'does not record when the saved product becomes %s',
    (status) => {
      expect(predicate()(
        activeProduct,
        { ...activeProduct, status, name: 'Hidden material edit' },
      )).toBe(false)
    },
  )

  it('ignores identity and timestamp bookkeeping fields', () => {
    expect(predicate()(activeProduct, {
      ...activeProduct,
      id: 99,
      created_at: new Date('2020-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-08-11T04:00:00.000Z'),
    })).toBe(false)
  })
})
