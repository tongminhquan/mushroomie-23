import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/san-pham`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tin-tuc`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/lien-he`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  let products: MetadataRoute.Sitemap = []
  let posts: MetadataRoute.Sitemap = []

  try {
    const [productList, postList] = await Promise.all([
      prisma.product.findMany({ where: { status: 'active' }, select: { slug: true, updated_at: true } }),
      prisma.post.findMany({ where: { status: 'published' }, select: { slug: true, updated_at: true } }),
    ])

    products = productList.map((p) => ({
      url: `${baseUrl}/san-pham/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    posts = postList.map((p) => ({
      url: `${baseUrl}/tin-tuc/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticPages, ...products, ...posts]
}
