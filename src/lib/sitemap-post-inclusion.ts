const POST_CANONICAL_BASE_URL = 'https://mushroomie.io.vn/tin-tuc'

type SitemapPostDirective = {
  slug: string
  robotsIndex: boolean
  canonicalUrl: string | null
}

export function shouldIncludePostInSitemap({
  slug,
  robotsIndex,
  canonicalUrl,
}: SitemapPostDirective): boolean {
  if (!robotsIndex) return false

  const canonical = canonicalUrl?.trim()
  if (!canonical) return true

  const selfCanonical = `${POST_CANONICAL_BASE_URL}/${slug}`
  const canonicalWithoutTrailingSlash = canonical.endsWith('/') ? canonical.slice(0, -1) : canonical

  return canonicalWithoutTrailingSlash === selfCanonical
}
