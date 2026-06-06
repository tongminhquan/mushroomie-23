'use client'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Truck, Gem, Palette, CreditCard } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'

const PostCard = dynamic(() => import('@/components/blog/PostCard'), {
  ssr: true,
})

interface HomeContentProps {
  featuredProducts: any[]
  posts: any[]
  reviews: any[]
  categories: any[]
}

const categoryIcons: Record<string, string> = {
  'vong-tay': '💛',
  'moc-khoa': '🔑',
  'charm': '✨',
  'phu-kien': '🌈',
}

export default function HomeAnimatedContent({ featuredProducts, posts, reviews, categories }: HomeContentProps) {
  return (
    <>
      {/* CATEGORIES */}
      <section className="py-8 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold uppercase text-primary mb-6 text-center">Danh mục nổi bật</h2>
          {categories.length > 0 ? (
            <div className="flex flex-nowrap md:flex-wrap md:justify-center overflow-x-auto gap-4 md:gap-8 pb-4 hide-scrollbar snap-x">
              <StaggerChildren animation="zoom-in" staggerDelay={50} className="flex gap-4 md:gap-8 min-w-max md:min-w-0 px-2 md:px-0">
                {categories.map((cat: any) => (
                  <Link key={cat.id} href={`/san-pham?category=${cat.slug}`}
                    className="group flex flex-col items-center w-20 md:w-28 flex-shrink-0 snap-start">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-accent-peach flex items-center justify-center mb-3 overflow-hidden group-hover:border-primary group-hover:shadow-md transition-all">
                      {cat.image_url ? (
                         <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 64px, 80px" />
                      ) : (
                        <div className="text-3xl group-hover:scale-110 transition-transform">{cat.icon || categoryIcons[cat.slug] || '💛'}</div>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-xs md:text-sm text-neutral-700 text-center line-clamp-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                  </Link>
                ))}
              </StaggerChildren>
            </div>
          ) : (
            <div className="flex justify-center gap-8">
              <StaggerChildren animation="zoom-in" staggerDelay={50} className="flex gap-8">
                {[{ slug: 'vong-tay', name: 'Vòng tay' }, { slug: 'moc-khoa', name: 'Móc khóa' }, { slug: 'charm', name: 'Charm' }, { slug: 'phu-kien', name: 'Phụ kiện' }].map((cat) => (
                  <Link key={cat.slug} href={`/san-pham?category=${cat.slug}`}
                    className="group flex flex-col items-center w-24">
                    <div className="w-20 h-20 rounded-full bg-secondary shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-2 border-accent-peach flex items-center justify-center mb-3 group-hover:border-primary transition-all">
                      <div className="text-3xl group-hover:scale-110 transition-transform">{categoryIcons[cat.slug]}</div>
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-neutral-700 group-hover:text-primary transition-colors">{cat.name}</h3>
                  </Link>
                ))}
              </StaggerChildren>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-10 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <h2 className="font-heading text-xl font-bold uppercase text-primary flex items-center gap-2">
                  <span className="text-2xl animate-pulse">🔥</span> SẢN PHẨM NỔI BẬT
                </h2>
                <Link href="/san-pham" className="text-sm font-semibold text-primary hover:underline hidden md:block">
                  Xem tất cả &gt;&gt;
                </Link>
              </div>
              <div className="p-4 md:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  <StaggerChildren animation="fade-up" staggerDelay={50}>
                    {featuredProducts.map((product) => (
                      <ProductCard key={product.id} product={product as any} />
                    ))}
                  </StaggerChildren>
                </div>
                <div className="md:hidden text-center mt-6">
                  <Link href="/san-pham" className="text-sm font-semibold text-primary hover:underline">
                    Xem tất cả sản phẩm &gt;&gt;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHY MUSHROOMIE — Brand values with Lucide icons */}
      <section className="py-14 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up" className="text-center mb-8">
            <h2 className="font-heading text-xl md:text-2xl font-bold uppercase text-primary">Tại sao chọn Mushroomie?</h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AnimateOnScroll animation="fade-up" delay={0}>
              <div className="bg-white rounded-2xl p-5 md:p-6 text-center shadow-card hover:shadow-hover hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-peach/50 flex items-center justify-center">
                  <Truck size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm uppercase text-neutral-800 mb-1">Giao hàng tận nơi</h3>
                <p className="text-xs text-neutral-500 hidden md:block">Ship COD toàn quốc, nhanh chóng</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={100}>
              <div className="bg-white rounded-2xl p-5 md:p-6 text-center shadow-card hover:shadow-hover hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-mint/50 flex items-center justify-center">
                  <Gem size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm uppercase text-neutral-800 mb-1">Thủ công 100%</h3>
                <p className="text-xs text-neutral-500 hidden md:block">Làm bằng tay với tình yêu thương</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="bg-white rounded-2xl p-5 md:p-6 text-center shadow-card hover:shadow-hover hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-peach/50 flex items-center justify-center">
                  <Palette size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm uppercase text-neutral-800 mb-1">Cá nhân hóa</h3>
                <p className="text-xs text-neutral-500 hidden md:block">Tự chọn charm và màu sắc</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={300}>
              <div className="bg-white rounded-2xl p-5 md:p-6 text-center shadow-card hover:shadow-hover hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-mint/50 flex items-center justify-center">
                  <CreditCard size={28} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm uppercase text-neutral-800 mb-1">Thanh toán dễ dàng</h3>
                <p className="text-xs text-neutral-500 hidden md:block">QR Code tự động hoặc COD</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll animation="fade-up" className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-md">
                <span>💬</span> ĐÁNH GIÁ
              </div>
              <h2 className="font-heading text-3xl font-bold text-primary mb-3">Khách hàng nói gì về Mushroomie?</h2>
              <div className="flex justify-center gap-1 text-yellow-400 text-xl">{'★'.repeat(5)}</div>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StaggerChildren animation="fade-up" staggerDelay={120}>
                {reviews.map((review: any) => (
                  <div key={review.id} className="bg-secondary rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 relative border border-accent-peach/30">
                    <div className="absolute top-4 right-4 text-primary/10 text-5xl font-serif">&ldquo;</div>
                    <div className="flex gap-1 text-yellow-400 text-sm mb-3">{'★'.repeat(review.rating)}</div>
                    <p className="text-neutral-600 text-sm leading-relaxed mb-4 italic relative z-10">&ldquo;{review.content}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-accent-peach/30">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm text-neutral-800">{review.name}</span>
                    </div>
                  </div>
                ))}
              </StaggerChildren>
            </div>
          </div>
        </section>
      )}

      {/* BLOG PREVIEW */}
      {posts.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase text-primary">
                Tin tức & Mẹo vặt
              </h2>
              <Link href="/tin-tuc" className="text-sm font-semibold text-primary hover:underline hidden md:block">
                Xem tất cả &gt;&gt;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <StaggerChildren animation="fade-up" staggerDelay={120}>
                {posts.map((post: any) => <PostCard key={post.id} post={post as any} />)}
              </StaggerChildren>
            </div>
          </div>
        </section>
      )}

      {/* CTA — Brand personality with handmade elements */}
      <section className="py-14 bg-accent-peach/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 left-8 text-4xl opacity-20 rotate-12">✨</div>
        <div className="absolute bottom-4 right-12 text-4xl opacity-20 -rotate-12">🍄</div>
        <div className="absolute top-1/2 left-1/4 text-3xl opacity-10">💛</div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-sm border border-accent-peach">
            ✨ HANDMADE WITH LOVE ✨
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900 mb-4">Bạn cần tìm phụ kiện độc đáo?</h2>
          <p className="text-neutral-600 mb-8 text-sm md:text-base max-w-lg mx-auto">
            Mushroomie sẽ giúp bạn thiết kế những món đồ thủ công không ai có, thật sự là của riêng bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/san-pham" className="bg-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-primary-dark transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95">
              Khám phá sản phẩm
            </Link>
            <Link href="/lien-he" className="border-2 border-primary text-primary px-8 py-3 rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all">
              Custom món riêng
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
