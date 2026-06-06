import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CreditCard, Gem, Palette, PackageCheck } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import PostCard from '@/components/blog/PostCard'
import BrandContainer from '@/components/ui/BrandContainer'
import SectionHeader from '@/components/ui/SectionHeader'

interface Product {
  id: number
  name: string
  slug: string
  price: number
  sale_price?: number | null
  featured_image?: string | null
  is_customizable?: boolean
  stock?: number
  category?: { name: string; slug: string } | null
  images?: { image_url: string }[]
}

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  published_at: Date | string | null
  category: { name: string; slug: string } | null
}

interface Review {
  id: number
  rating: number
  content: string
  name: string
}

interface Category {
  id: number
  name: string
  slug: string
  image_url: string | null
  icon: string | null
}

interface HomeContentProps {
  featuredProducts: Product[]
  posts: Post[]
  reviews: Review[]
  categories: Category[]
}

const promises = [
  { icon: Gem, title: 'Làm thủ công', text: 'Mỗi món được ráp và hoàn thiện bằng tay.' },
  { icon: Palette, title: 'Custom theo bạn', text: 'Chọn màu, charm và ghi chú cho món riêng.' },
  { icon: PackageCheck, title: 'Đóng gói kỹ', text: 'Kiểm tra từng chi tiết trước khi gửi đi.' },
  { icon: CreditCard, title: 'Thanh toán gọn', text: 'COD hoặc quét QR, xác nhận tự động.' },
]

export default function HomeAnimatedContent({ featuredProducts, posts, reviews, categories }: HomeContentProps) {
  return (
    <>
      <section className="bg-white py-12 md:py-16">
        <BrandContainer>
          <SectionHeader
            eyebrow="Chọn theo sở thích"
            title="Bắt đầu từ món bạn thích"
            description="Mỗi danh mục là một cách khác để kể câu chuyện của riêng bạn."
            action={<Link href="/san-pham" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:gap-3">Xem tất cả <ArrowRight size={17} /></Link>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/san-pham?category=${category.slug}`}
                className={`group relative min-h-40 overflow-hidden rounded-[18px] border border-neutral-200 bg-secondary p-4 transition hover:-translate-y-1 hover:border-pink hover:shadow-hover ${
                  index === 0 ? 'sm:col-span-2 md:col-span-1 lg:col-span-2' : ''
                }`}
              >
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-white">
                  {category.image_url ? (
                    <Image src={category.image_url} alt={category.name} fill unoptimized={category.image_url.startsWith('/uploads/')} sizes="(max-width: 640px) 50vw, 260px" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center font-heading text-4xl text-primary/25">M</div>
                  )}
                </div>
                <h3 className="font-heading text-lg leading-tight text-text">{category.name}</h3>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">Khám phá <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </BrandContainer>
      </section>

      {featuredProducts.length > 0 && (
        <section className="paper-surface py-14 md:py-20">
          <BrandContainer>
            <SectionHeader
              eyebrow="Được yêu thích"
              title="Những món nhỏ đang được chọn nhiều"
              description="Các thiết kế nổi bật, dễ phối và có thể thêm dấu ấn riêng."
              action={<Link href="/san-pham" className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-extrabold text-primary hover:bg-primary hover:text-white">Xem bộ sưu tập <ArrowRight size={16} /></Link>}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </BrandContainer>
        </section>
      )}

      <section className="bg-white py-14 md:py-20">
        <BrandContainer>
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="brand-kicker mb-4">Làm theo cách Mushroomie</p>
              <h2 className="text-balance font-heading text-3xl leading-[1.1] text-text md:text-5xl">
                Không chỉ là phụ kiện. Đó là món đồ mang dấu riêng.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-500 md:text-base">
                Từ màu dây, hạt, charm đến lời nhắn nhỏ, Mushroomie giúp bạn ghép thành một món đồ hợp với người nhận và khoảnh khắc muốn nhớ.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/lien-he" className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(228,29,29,0.18)] hover:bg-primary-dark">Custom món riêng</Link>
                <Link href="/gioi-thieu" className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-extrabold text-text hover:border-primary hover:text-primary">Đọc câu chuyện</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {promises.map(({ icon: Icon, title, text }, index) => (
                <div key={title} className={`rounded-[18px] border border-neutral-200 p-5 ${index === 1 || index === 2 ? 'bg-secondary' : 'bg-white'}`}>
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary"><Icon size={22} /></div>
                  <h3 className="text-sm font-extrabold text-text">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </BrandContainer>
      </section>

      {reviews.length > 0 && (
        <section className="bg-pink/45 py-14 md:py-20">
          <BrandContainer>
            <SectionHeader eyebrow="Khách kể thật" title="Những lời nhắn sau khi mở hộp" />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((review, index) => (
                <figure key={review.id} className={`rounded-[18px] bg-white p-6 shadow-card ${index === 1 ? 'md:-translate-y-4' : ''}`}>
                  <div className="mb-4 text-sm tracking-[0.18em] text-primary" aria-label={`${review.rating} trên 5 sao`}>{'★'.repeat(review.rating)}</div>
                  <blockquote className="text-sm leading-7 text-neutral-700">“{review.content}”</blockquote>
                  <figcaption className="mt-5 border-t border-neutral-100 pt-4 text-sm font-extrabold text-text">{review.name}</figcaption>
                </figure>
              ))}
            </div>
          </BrandContainer>
        </section>
      )}

      {posts.length > 0 && (
        <section className="bg-white py-14 md:py-20">
          <BrandContainer>
            <SectionHeader
              eyebrow="Góc handmade"
              title="Chuyện nhỏ, mẹo hay và cảm hứng phối đồ"
              action={<Link href="/tin-tuc" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary">Xem bài viết <ArrowRight size={16} /></Link>}
            />
            <div className="grid gap-5 md:grid-cols-3">
              {posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          </BrandContainer>
        </section>
      )}

      <section className="bg-primary py-12 text-white md:py-16">
        <BrandContainer className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-yellow">Một món chỉ thuộc về bạn</p>
            <h2 className="max-w-2xl text-balance font-heading text-3xl leading-[1.15] md:text-4xl">Kể Mushroomie nghe ý tưởng, tụi mình cùng làm nó thành thật.</h2>
          </div>
          <Link href="/lien-he" className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-center text-sm font-extrabold text-primary shadow-strong hover:bg-yellow hover:text-text">Bắt đầu custom</Link>
        </BrandContainer>
      </section>
    </>
  )
}
