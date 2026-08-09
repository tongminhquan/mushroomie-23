import type { PublicContentPublication } from './types'

export const PRODUCTION_ORIGIN = 'https://mushroomie.io.vn'

type SluggedPublicContentSource = Exclude<
  PublicContentPublication['source'],
  'sitemap_sync'
>

const PUBLIC_CONTENT_PATHS: Record<SluggedPublicContentSource, string> = {
  post: '/tin-tuc',
  product: '/san-pham',
}

function invalidUrl(): Error {
  return new Error('SEO_DISCOVERY_INVALID_URL')
}

export function assertProductionUrl(value: string): string {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw invalidUrl()
  }

  if (
    parsed.origin !== PRODUCTION_ORIGIN
    || parsed.username !== ''
    || parsed.password !== ''
  ) {
    throw invalidUrl()
  }

  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

export function buildPublicContentUrl(
  source: SluggedPublicContentSource,
  slug: string,
): string {
  const basePath = PUBLIC_CONTENT_PATHS[source]

  if (!basePath || typeof slug !== 'string' || slug.length === 0) {
    throw invalidUrl()
  }

  let encodedSlug: string
  try {
    encodedSlug = encodeURIComponent(slug)
  } catch {
    throw invalidUrl()
  }

  return assertProductionUrl(`${PRODUCTION_ORIGIN}${basePath}/${encodedSlug}`)
}
