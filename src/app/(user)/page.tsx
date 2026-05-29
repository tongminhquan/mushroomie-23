import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/product/ProductCard'
import PostCard from '@/components/blog/PostCard'
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel'
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

  const categoryIcons: Record<string, string> = {
    'vong-tay': '💛',
    'moc-khoa': '🔑',
    'charm': '✨',
    'phu-kien': '🌈',
  }

  const fallbackHero = (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-primary via-red-600 to-pink-500 flex items-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['top-10 left-10', 'top-1/4 right-20', 'bottom-20 left-1/4', 'bottom-10 right-10', 'top-1/2 left-1/3'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} text-5xl opacity-20`} style={{ animation: `bounce 2s ease-in-out ${i * 0.5}s infinite` }}>
            {['🍄', '✨', '💛', '🌸', '🧶'][i]}
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            <span>🍄</span> Handmade với tình yêu thương
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Phụ kiện nhỏ,<br />
            <span className="text-yellow-300">cảm xúc lớn</span>
          </h1>
          <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-8">
            Mỗi sản phẩm Mushroomie được làm thủ công 100%, cá nhân hóa theo phong cách, cảm xúc và câu chuyện riêng của bạn.
          </p>
          <div className="flex flex-wrap gap-4">
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
      {/* HERO CAROUSEL */}
      <HomeHeroCarousel banners={banners} fallbackHero={fallbackHero} />

      {/* CATEGORIES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-3">Danh mục sản phẩm</h2>
            <p className="text-neutral-500">Tìm kiếm phụ kiện ưng ý của bạn</p>
          </div>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/san-pham?category=${cat.slug}`}
                  className="group bg-gradient-to-br from-primary-light to-white rounded-2xl p-6 text-center hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                  {cat.image_url ? (
                    <div className="mx-auto w-16 h-16 mb-4 rounded-xl overflow-hidden shadow-sm border border-neutral-100 bg-white p-1">
                       <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="text-4xl mb-3">{categoryIcons[cat.slug] || '💛'}</div>
                  )}
                  <h3 className="font-heading font-bold text-neutral-900 group-hover:text-primary transition-colors">{cat.name}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{ slug: 'vong-tay', name: 'Vòng tay' }, { slug: 'moc-khoa', name: 'Móc khóa' }, { slug: 'charm', name: 'Charm' }, { slug: 'phu-kien', name: 'Phụ kiện' }].map((cat) => (
                <Link key={cat.slug} href={`/san-pham?category=${cat.slug}`}
                  className="group bg-gradient-to-br from-primary-light to-white rounded-2xl p-6 text-center hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="text-4xl mb-3">{categoryIcons[cat.slug]}</div>
                  <h3 className="font-heading font-bold text-neutral-900 group-hover:text-primary transition-colors">{cat.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-2">Sản phẩm nổi bật</h2>
                <p className="text-neutral-500">Những chiếc phụ kiện được yêu thích nhất</p>
              </div>
              <Link href="/san-pham" className="text-primary font-semibold hover:underline hidden md:block">Xem tất cả →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY MUSHROOMIE */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-3">Vì sao chọn Mushroomie?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🧵', title: 'Thủ công 100%', desc: 'Mỗi sản phẩm được làm bằng tay từ những nguyên liệu chất lượng như hạt charm, dây cước, dây polyester.' },
              { emoji: '🎨', title: 'Cá nhân hóa', desc: 'Bạn tự chọn charm, màu sắc, kiểu dây theo phong cách cá nhân. Không có hai sản phẩm giống nhau!' },
              { emoji: '💛', title: 'Cảm xúc thật', desc: 'Mỗi sản phẩm là kỷ niệm, cá tính, câu chuyện riêng. Không chỉ là đồ vật, mà là một phần của bạn.' },
            ].map((item) => (
              <div key={item.title} className="bg-secondary rounded-2xl p-8 text-center hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="font-heading font-bold text-xl text-neutral-900 mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER PROCESS */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold mb-3">Quy trình đặt hàng cá nhân hóa</h2>
            <p className="text-white/80">Đơn giản, nhanh chóng, dễ thương</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '01', emoji: '🛒', title: 'Chọn sản phẩm', desc: 'Duyệt sản phẩm và chọn loại phụ kiện phù hợp' },
              { num: '02', emoji: '🎨', title: 'Tùy chỉnh', desc: 'Chọn charm, màu sắc, kiểu dây và ghi chú cá nhân' },
              { num: '03', emoji: '💳', title: 'Thanh toán', desc: 'Chuyển khoản ngân hàng qua QR code dễ tiện' },
              { num: '04', emoji: '🚚', title: 'Nhận hàng', desc: 'Mushroomie làm và gửi đến tay bạn trong 3-5 ngày' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <div className="text-white/60 text-sm font-bold mb-2 tracking-wider">BƯỚC {step.num}</div>
                <h3 className="font-heading font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed px-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="py-16 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-3">Khách hàng nói gì về Mushroomie?</h2>
              <div className="flex justify-center gap-1 text-yellow-400 text-xl">{'★'.repeat(5)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-6 shadow-card hover:shadow-hover transition-all">
                  <div className="flex gap-1 text-yellow-400 text-sm mb-3">{'★'.repeat(review.rating)}</div>
                  <p className="text-neutral-700 text-sm leading-relaxed mb-4 italic">"{review.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-neutral-900">{review.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BLOG PREVIEW */}
      {posts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-2">Tin tức mới nhất</h2>
                <p className="text-neutral-500">Tips & tricks cho tín đồ handmade</p>
              </div>
              <Link href="/tin-tuc" className="text-primary font-semibold hover:underline hidden md:block">Xem tất cả →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => <PostCard key={post.id} post={post as any} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-light to-secondary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">🍄</div>
          <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-4">Sẵn sàng tạo nên câu chuyện của bạn?</h2>
          <p className="text-neutral-500 mb-8">Hãy để Mushroomie giúp bạn có một món phụ kiện thủ công không ai có, thật sự là của bạn.</p>
          <Link href="/san-pham" className="bg-primary text-white px-8 py-4 rounded-full font-bold text-base hover:bg-primary-dark transition-colors shadow-lg inline-block">
            Bắt đầu ngay →
          </Link>
        </div>
      </section>
    </div>
  )
}
