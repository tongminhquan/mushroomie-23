import { prisma } from '@/lib/prisma'
import HomeLanding from '@/components/home/landing/HomeLanding'
import type { Metadata } from 'next'
import { safeJsonLd } from '@/lib/security'

export const metadata: Metadata = {
  title: 'Mushroomie - Phụ kiện handmade cá nhân hóa',
  description: 'Mushroomie mang đến vòng tay, charm, móc khóa và phụ kiện handmade cá nhân hóa. Làm bằng tay, trao bằng tim.',
}

export const revalidate = 3600

export default async function HomePage() {
  const [featuredProducts, posts, reviews, categories, banners] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'active', is_featured: true },
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      take: 8,
    }).then((products) => products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      sale_price: product.sale_price ? Number(product.sale_price) : null,
      featured_image: product.featured_image,
      is_customizable: product.is_customizable,
      stock: product.stock,
      category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
      images: product.images.map((image) => ({ image_url: image.image_url })),
    }))).catch(() => []),
    prisma.post.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, slug: true, excerpt: true, featured_image: true, published_at: true, category: { select: { name: true, slug: true } } },
      orderBy: { published_at: 'desc' },
      take: 3,
    }).catch(() => []),
    prisma.review.findMany({
      where: { status: 'approved', is_featured: true },
      select: { id: true, rating: true, content: true, name: true },
      take: 6,
    }).catch(() => []),
    prisma.category.findMany({
      where: { type: 'product' },
      select: { id: true, name: true, slug: true, image_url: true, icon: true },
    }).catch(() => []),
    prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: { sort_order: 'asc' },
    }).catch(() => []),
  ])

  return (
    <div>
      <h1 className="sr-only">Mushroomie - phụ kiện handmade cá nhân hóa: vòng tay, charm, móc khóa, quà tặng</h1>
      {/* NAP nhất quán qua lib local-seo (địa chỉ Trảng Dài–Đồng Nai, SĐT, sameAs, SearchAction) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema()) }} />
      <HomeLanding
        banners={JSON.parse(JSON.stringify(banners))}
        products={JSON.parse(JSON.stringify(featuredProducts))}
        categories={JSON.parse(JSON.stringify(categories))}
        posts={JSON.parse(JSON.stringify(posts))}
        reviews={JSON.parse(JSON.stringify(reviews))}
      />
      <HomeLocalAreas />
    </div>
  )
}
