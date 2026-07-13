import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { LOCAL_SEO_LAST_MODIFIED, PUBLISHED_LOCAL_PAGES } from '@/lib/local-seo'
import { isCatalogCategory } from '@/lib/catalog-seo'

// Regenerate the sitemap at most once an hour (ISR) so newly published posts /
// products and slug fixes appear without needing a full redeploy. The query is
// small and runs at most once per window, not per request.
export const revalidate = 3600

// A sitemap <loc> must be a single, well-formed path segment. Skip slugs that are
// empty or contain characters that would produce a broken/duplicate URL — e.g. a
// slug accidentally stored as a full "https://..." URL would otherwise emit
// `${baseUrl}/tin-tuc/https://.../` (a 404 in the sitemap).
function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && !/[\s/?#]/.test(slug) && !slug.includes('://')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/san-pham`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tin-tuc`, changeFrequency: 'weekly', priority: 0.8 },
    // /cau-chuyen 307-redirects to /gioi-thieu, so the canonical /gioi-thieu (below)
    // is the sitemap entry — listing the alias would put a redirect URL in the sitemap.
    { url: `${baseUrl}/gioi-thieu`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/lien-he`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/chinh-sach-giao-hang`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/chinh-sach-doi-tra`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/chinh-sach-bao-mat`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/chinh-sach-quy-dinh`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/chinh-sach-tra-gop`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/dieu-khoan-dich-vu`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Landing pages Local SEO (Đồng Nai / Biên Hòa / TP.HCM)
  const localPages: MetadataRoute.Sitemap = PUBLISHED_LOCAL_PAGES.map((p) => ({
    url: `${baseUrl}/${p.slug}`,
    lastModified: LOCAL_SEO_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  let products: MetadataRoute.Sitemap = []
  let posts: MetadataRoute.Sitemap = []
  let categories: MetadataRoute.Sitemap = []

  try {
    const [productList, postList, categoryList] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, select: { slug: true, updated_at: true } }),
      prisma.post.findMany({ where: { status: 'published' }, select: { slug: true, updated_at: true } }),
      prisma.category.findMany({
        where: { type: 'product' },
        select: { slug: true, updated_at: true },
      }),
    ])

    products = productList.filter((p) => isValidSlug(p.slug)).map((p) => ({
      url: `${baseUrl}/san-pham/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

    posts = postList.filter((p) => isValidSlug(p.slug)).map((p) => ({
      url: `${baseUrl}/tin-tuc/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    categories = categoryList.filter((c) => isValidSlug(c.slug) && isCatalogCategory(c.slug)).map((c) => ({
      url: `${baseUrl}/san-pham?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {}

  return [...staticPages, ...localPages, ...categories, ...products, ...posts]
}
