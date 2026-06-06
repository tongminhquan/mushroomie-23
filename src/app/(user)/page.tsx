import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeAnimatedContent from '@/components/home/HomeAnimatedContent'
import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
  description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ. Vòng tay, móc khóa, charm và phụ kiện nhỏ xinh được làm thủ công 100%.',
}

export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const [featuredProducts, posts, reviews, categories, banners] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'active', is_featured: true },
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      take: 8,
    }).then(products => products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      sale_price: p.sale_price ? Number(p.sale_price) : null,
      featured_image: p.featured_image,
      is_customizable: p.is_customizable,
      stock: p.stock,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      images: p.images.map(img => ({ image_url: img.image_url }))
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
      select: { id: true, name: true, slug: true, image_url: true, icon: true }
    }).catch(() => []),
    prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: { sort_order: 'asc' }
    }).catch(() => []),
  ])

  const fallbackHero = (
    <section className="bg-secondary py-4 md:py-6">
      <div className="brand-container grid min-h-[460px] overflow-hidden rounded-[18px] border border-neutral-200 bg-primary shadow-strong lg:min-h-[520px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 flex min-w-0 flex-col justify-center overflow-hidden px-5 py-8 text-white sm:px-10 lg:px-14 lg:py-12">
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.12em] text-yellow">Mushroomie handmade</p>
          <h1 className="text-balance break-words font-heading text-[2rem] leading-[1.08] sm:text-5xl lg:text-6xl">
            Từ từng hạt nhỏ, tạo phong cách riêng.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            Vòng tay, charm và móc khóa được làm thủ công, phối theo sở thích và câu chuyện riêng của bạn.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/san-pham" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-extrabold text-primary shadow-card hover:bg-yellow hover:text-text">Khám phá sản phẩm</Link>
            <Link href="/lien-he" className="rounded-xl border border-white/60 px-5 py-3 text-center text-sm font-extrabold text-white hover:bg-white hover:text-primary">Custom món riêng</Link>
          </div>
        </div>
        <div className="relative hidden min-h-full bg-pink lg:block">
          <Image
            src="/logo.png"
            alt="Logo Mushroomie"
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-12 sm:p-20"
          />
        </div>
      </div>
    </section>
  )

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Mushroomie Handmade',
    image: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    '@id': `${process.env.NEXT_PUBLIC_APP_URL}`,
    url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    telephone: '+84848744060',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Hẻm 2 tổ 11, Phường Trảng Dài',
      addressLocality: 'Biên Hòa',
      addressRegion: 'Đồng Nai',
      addressCountry: 'VN'
    }
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Mushroomie',
    alternateName: ['Mushroomie Handmade'],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/`
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <HomeHeroCarousel banners={banners} fallbackHero={fallbackHero} />
      <HomeAnimatedContent
        featuredProducts={JSON.parse(JSON.stringify(featuredProducts))}
        posts={JSON.parse(JSON.stringify(posts))}
        reviews={JSON.parse(JSON.stringify(reviews))}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  )
}
