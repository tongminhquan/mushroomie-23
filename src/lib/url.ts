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
  if (url.startsWith('http') || url.startsWith('//')) {
    // Only allow absolute URLs if they match our domain
    if (url.startsWith(SITE_URL)) return url
    return '/'
  }
  return url.startsWith('/') ? url : `/${url}`
}

export function toPublicImageUrl(pathOrUrl?: string | null): string {
  return getPublicImageUrl(pathOrUrl, 'product');
}
