import { normalizeImageUrl, type PublicImageKind } from '@/lib/image-url'

export { generateSlug } from '@/lib/product-slug'

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`
}

export function formatDate(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) throw new RangeError('Invalid time value')

  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${value.getFullYear()} ${hours}:${minutes}`
}

export function generateOrderCode(): string {
  const prefix = process.env.PAYMENT_PREFIX || 'MSH'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.substring(0, length)}...`
}

export function getPublicImageUrl(
  pathOrUrl?: string | null,
  type: PublicImageKind = 'product',
): string {
  return normalizeImageUrl(pathOrUrl, type)
}
