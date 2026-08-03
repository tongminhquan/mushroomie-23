import Link from 'next/link'
import { ArrowRight, Gift, Sparkles } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import ProductCard from '@/components/product/ProductCard'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeProduct } from './types'

export default function HomeFeaturedProducts({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-theme-section py-16 text-theme-primary md:py-24">
      <Sparkles aria-hidden className="pointer-events-none absolute left-[6%] top-24 hidden h-7 w-7 text-theme-accent/70 md:block" />
      <Gift aria-hidden className="pointer-events-none absolute right-[7%] top-32 hidden h-7 w-7 text-kraft/70 md:block" />

      <BrandContainer className="relative">
        <LandingSectionHeader
          eyebrow="Best Seller"
          title="Sản phẩm nổi bật"
          description="Được yêu thích nhất — thiết kế nổi bật, dễ phối và có thể thêm dấu ấn riêng."
          align="center"
        />
        <div data-batch-reveal className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
