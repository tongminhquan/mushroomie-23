import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
import HomeAnimatedContent from '@/components/home/HomeAnimatedContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
  description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ. Vòng tay, móc khóa, charm và phụ kiện nhỏ xinh được làm thủ công 100%.',
}

export default async function HomePage() {
  const [featuredProducts, posts, reviews, categories, banners] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'active', is_featured: true },
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      take: 8,
    }).then(products => products.map(p => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price ? Number(p.sale_price) : null
    }))).catch(() => []),
    prisma.post.findMany({
      where: { status: 'published' },
      include: { category: true },
      orderBy: { published_at: 'desc' },
      take: 3,
    }).catch(() => []),
    prisma.review.findMany({
      where: { status: 'approved', is_featured: true },
      take: 6,
    }).catch(() => []),
    prisma.category.findMany({ where: { type: 'product' } }).catch(() => []),
    prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: { sort_order: 'asc' }
    }).catch(() => []),
  ])

  const fallbackHero = (
    <section className="relative min-h-[90vh] gradient-primary flex items-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full" />
        {['top-10 left-10', 'top-1/4 right-20', 'bottom-20 left-1/4', 'bottom-10 right-10', 'top-1/2 left-1/3'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} text-5xl opacity-20 animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
            {['🍄', '✨', '💛', '🌸', '🧶'][i]}
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm shadow-lg animate-[fadeInDown_0.8s_ease-out]">
            <span>🍄</span> Handmade với tình yêu thương
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
            Phụ kiện nhỏ,<br />
            <span className="text-yellow-300">cảm xúc lớn</span>
          </h1>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-8 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
            Mỗi sản phẩm Mushroomie được làm thủ công 100%, cá nhân hóa theo phong cách, cảm xúc và câu chuyện riêng của bạn.
          </p>
          <div className="flex flex-wrap gap-4 animate-[fadeInUp_0.8s_ease-out_0.6s_both]">
            <Link href="/san-pham" className="bg-white text-primary px-8 py-4 rounded-full font-bold text-base hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl active:scale-95">
              Khám phá ngay →
            </Link>
            <Link href="/lien-he" className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-base hover:bg-white hover:text-primary transition-all">
              Tự thiết kế phụ kiện
            </Link>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div>
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
