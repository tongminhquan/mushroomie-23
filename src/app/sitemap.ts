import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

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
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/san-pham`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tin-tuc`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cau-chuyen`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/mini-game`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/lien-he`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  let products: MetadataRoute.Sitemap = []
  let posts: MetadataRoute.Sitemap = []
  let categories: MetadataRoute.Sitemap = []

  try {
    const [productList, postList, categoryList] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, select: { slug: true, updated_at: true } }),
      prisma.post.findMany({ where: { status: 'published' }, select: { slug: true, updated_at: true } }),
      prisma.category.findMany({ where: { type: 'product' }, select: { slug: true } }),
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

    categories = categoryList.filter((c) => isValidSlug(c.slug)).map((c) => ({
      url: `${baseUrl}/san-pham?category=${encodeURIComponent(c.slug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {}

  return [...staticPages, ...categories, ...products, ...posts]
}
