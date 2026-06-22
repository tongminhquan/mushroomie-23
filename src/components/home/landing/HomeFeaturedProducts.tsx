import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import ProductCard from '@/components/product/ProductCard'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeProduct } from './types'

export default function HomeFeaturedProducts({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null

  return (
    <section
      className="relative overflow-hidden bg-secondary py-16 md:py-24"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      {/* Decorative floats */}
      <span
        aria-hidden
        className="animate-float-soft pointer-events-none absolute left-[6%] top-24 hidden text-3xl opacity-80 md:block"
      >
        🍓
      </span>
      <span
        aria-hidden
        className="animate-float-soft pointer-events-none absolute right-[7%] top-32 hidden text-3xl opacity-80 md:block"
        style={{ animationDelay: '1.2s' }}
      >
        🔑
      </span>

      <BrandContainer className="relative">
        <LandingSectionHeader
          eyebrow="Đang được yêu thích"
          title="Những món nhỏ có cá tính thật to"
          description="Thiết kế nổi bật, dễ phối và có thể thêm dấu ấn riêng cho bạn hoặc người nhận quà."
          align="center"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 flex justify-center md:mt-12">
          <Link
            href="/san-pham"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Xem bộ sưu tập <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </BrandContainer>
    </section>
  )
}
