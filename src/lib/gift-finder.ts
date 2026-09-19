import type { Prisma } from '@prisma/client'

export const GIFT_PAGE_SIZE = 12
export const GIFT_BUDGETS = [
  { value: 'any', label: 'Chưa giới hạn', maximum: null },
  { value: '100000', label: 'Tối đa 100.000đ', maximum: 100000 },
  { value: '200000', label: 'Tối đa 200.000đ', maximum: 200000 },
  { value: '300000', label: 'Tối đa 300.000đ', maximum: 300000 },
  { value: '500000', label: 'Tối đa 500.000đ', maximum: 500000 },
] as const

export type GiftSearchParams = Record<string, string | string[] | undefined>
export interface GiftFilters {
  budget: (typeof GIFT_BUDGETS)[number]['value']
  category: string
  customizable: boolean
  page: number
}

export function parseGiftFilters(params: GiftSearchParams): GiftFilters {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
  const budget = GIFT_BUDGETS.find((option) => option.value === first(params.budget))?.value ?? 'any'
  const category = first(params.category) ?? ''
  const rawPage = first(params.page) ?? '1'
  const page = /^\d{1,5}$/.test(rawPage) ? Number(rawPage) : 1

  return {
    budget,
    category: category.length <= 191 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(category) ? category : '',
    customizable: first(params.custom) === '1',
    page: page >= 1 && page <= 10000 ? page : 1,
  }
}

export function buildGiftFinderUrl(filters: GiftFilters, page = filters.page) {
  const query = new URLSearchParams()
  if (filters.budget !== 'any') query.set('budget', filters.budget)
  if (filters.category) query.set('category', filters.category)
  if (filters.customizable) query.set('custom', '1')
  if (page > 1) query.set('page', String(page))
  return query.size ? `/chon-qua?${query.toString()}` : '/chon-qua'
}

export function buildGiftProductWhere(filters: GiftFilters): Prisma.ProductWhereInput {
  const maximum = GIFT_BUDGETS.find((option) => option.value === filters.budget)?.maximum
  const where: Prisma.ProductWhereInput = { status: 'active', stock: { gt: 0 }, price: { gt: 0 } }
  if (filters.category) where.category = { slug: filters.category, type: 'product' }
  if (filters.customizable) where.is_customizable = true

  if (maximum != null) {
    // Equivalent to resolveDisplayPrice(...) <= maximum for a positive regular price:
    // if regular is over budget, a positive sale within budget is necessarily lower.
    // Invalid sale prices (zero, negative, or above regular) cannot create false matches.
    where.OR = [{ price: { lte: maximum } }, { sale_price: { gt: 0, lte: maximum } }]
  }
  return where
}
