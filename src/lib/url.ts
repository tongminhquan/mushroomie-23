import { getPublicImageUrl } from '@/lib/utils'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn';

export function toAbsoluteUrl(pathOrUrl?: string | null): string {
  const normalized = getPublicImageUrl(pathOrUrl, 'product')
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return `${SITE_URL}${normalized}`;
}

export function sanitizeCallbackUrl(url?: string | null): string {
  if (!url) return '/'
  const value = url.trim()
  if (!value || /[\u0000-\u001f\\]/.test(value)) return '/'

  if (value.startsWith('/')) {
    return value.startsWith('//') ? '/' : value
  }

  try {
    const target = new URL(value)
    const site = new URL(SITE_URL)
    return target.origin === site.origin ? `${target.pathname}${target.search}${target.hash}` : '/'
  } catch {
    return '/'
  }
}

export function toPublicImageUrl(pathOrUrl?: string | null): string {
  return getPublicImageUrl(pathOrUrl, 'product');
}
