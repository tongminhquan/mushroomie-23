import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { normalizeImageUrl, type PublicImageKind } from '@/lib/image-url'

export { generateSlug } from '@/lib/product-slug'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`
}

export function formatDate(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return format(value, 'dd/MM/yyyy HH:mm', { locale: vi })
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
