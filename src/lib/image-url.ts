export type PublicImageKind = 'product' | 'banner' | 'user' | 'post'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.PUBLIC_BASE_URL ||
  'https://mushroomie.io.vn'

const FALLBACK_BY_KIND: Record<PublicImageKind, string> = {
  banner: '/images/banner-placeholder.png',
  post: '/images/product-placeholder.png',
  product: '/images/product-placeholder.png',
  user: '/images/avatar-placeholder.png',
}

const INTERNAL_HOSTS = new Set(
  ['mushroomie.io.vn', 'www.mushroomie.io.vn', readHostname(SITE_URL)].filter(Boolean),
)

export function getImageFallback(kind: PublicImageKind = 'product') {
  return FALLBACK_BY_KIND[kind]
}

export function normalizeImageUrl(
  pathOrUrl?: string | null,
  kind: PublicImageKind = 'product',
): string {
  const fallback = getImageFallback(kind)
  const normalizedValue = normalizeStoredImagePath(pathOrUrl)

  if (!normalizedValue) return fallback
  if (normalizedValue.startsWith('blob:') || normalizedValue.startsWith('data:')) return normalizedValue
  if (normalizedValue.startsWith('/wp-content/uploads/')) return fallback
  if (normalizedValue.startsWith('/var/www/')) return fallback
  return normalizedValue
}

export function normalizeStoredImagePath(pathOrUrl?: string | null): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''

  const value = pathOrUrl.trim()
  if (!value || value === 'null' || value === 'undefined') return ''
  if (value.startsWith('blob:') || value.startsWith('data:')) return value

  const internalPath = extractInternalPath(value)
  if (internalPath) {
    return normalizeLocalImagePath(internalPath, value)
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return normalizeLocalImagePath(value, value)
}

function normalizeLocalImagePath(value: string, fallback: string) {
  const trimmed = value.trim()
  if (!trimmed) return fallback

  const legacyPublicPathIndex = trimmed.indexOf('/public/uploads/')
  if (legacyPublicPathIndex >= 0) {
    return trimmed.slice(legacyPublicPathIndex).replace('/public', '')
  }

  const uploadPathIndex = trimmed.indexOf('/uploads/')
  if (trimmed.startsWith('/var/www/') && uploadPathIndex >= 0) {
    return trimmed.slice(uploadPathIndex)
  }

  if (trimmed.startsWith('/var/www/')) {
    return fallback
  }

  if (trimmed.startsWith('./uploads/')) {
    return `/${trimmed.slice(2)}`
  }

  if (trimmed.startsWith('/public/uploads/')) {
    return trimmed.replace('/public', '')
  }

  if (trimmed.startsWith('public/uploads/')) {
    return `/${trimmed.replace('public/', '')}`
  }

  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed
  }

  if (trimmed.startsWith('/wp-content/uploads/')) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  if (looksLikeUploadFilename(trimmed)) {
    return `/uploads/${trimmed}`
  }

  return fallback
}

function extractInternalPath(value: string) {
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(value)) {
    try {
      return new URL(value).pathname
    } catch {
      return null
    }
  }

  try {
    const parsed = new URL(value)
    return INTERNAL_HOSTS.has(parsed.hostname) ? parsed.pathname : null
  } catch {
    return null
  }
}

function readHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function looksLikeUploadFilename(value: string) {
  return !value.includes('/') && !value.includes('\\') && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value)
}
