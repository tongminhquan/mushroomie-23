import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import ProductCard from '@/components/product/ProductCard'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeProduct } from './types'

export default function HomeFeaturedProducts({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="bg-white py-16 md:py-24">
      <BrandContainer>
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
        <div className="mt-8 flex justify-center">
          <Link
            href="/san-pham"
            className="group inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary px-5 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Xem bộ sưu tập <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </BrandContainer>
    </section>
  )
}
