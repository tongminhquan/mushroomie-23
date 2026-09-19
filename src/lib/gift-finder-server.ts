import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { buildGiftProductWhere, GIFT_PAGE_SIZE, type GiftFilters } from '@/lib/gift-finder'

const productSelect = {
  id: true, name: true, slug: true, price: true, sale_price: true,
  featured_image: true, stock: true, is_customizable: true, is_featured: true,
  category: { select: { name: true, slug: true } },
  images: { select: { image_url: true }, orderBy: { sort_order: 'asc' }, take: 1 },
} satisfies Prisma.ProductSelect

type GiftProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>
export type GiftProduct = Omit<GiftProductRecord, 'price' | 'sale_price'> & {
  price: number
  sale_price: number | null
}
export interface GiftFinderData {
  status: 'ready' | 'unavailable'
  categories: { id: number; name: string; slug: string }[]
  products: GiftProduct[]
  total: number
  page: number
}

export async function getGiftFinderData(filters: GiftFilters): Promise<GiftFinderData> {
  try {
    const where = buildGiftProductWhere(filters)
    const [total, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { type: 'product' }, select: { id: true, name: true, slug: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
    ])
    const page = Math.min(filters.page, Math.max(1, Math.ceil(total / GIFT_PAGE_SIZE)))
    const records = total === 0 ? [] : await prisma.product.findMany({
      where, select: productSelect,
      orderBy: [{ is_featured: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * GIFT_PAGE_SIZE, take: GIFT_PAGE_SIZE,
    })
    return {
      status: 'ready', categories, total, page,
      products: records.map((product) => ({
        ...product, price: Number(product.price),
        sale_price: product.sale_price == null ? null : Number(product.sale_price),
      })),
    }
  } catch (error) {
    console.error({ event: 'gift_finder_query_failed', errorType: error instanceof Error ? error.name : 'UnknownError' })
    return { status: 'unavailable', categories: [], products: [], total: 0, page: filters.page }
  }
}
