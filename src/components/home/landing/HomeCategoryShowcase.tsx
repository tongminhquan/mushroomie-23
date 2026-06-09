import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import CategoryIcon from '@/components/ui/CategoryIcon'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeCategory } from './types'

export default function HomeCategoryShowcase({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Chọn món hợp mood"
          title="Bắt đầu từ món bạn thích"
          description="Mỗi danh mục là một cách khác để kể câu chuyện riêng bằng hạt, màu và những chiếc charm nhỏ."
        />

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories.slice(0, 4).map((category, index) => (
              <Link
                key={category.id}
                href={`/san-pham?category=${category.slug}`}
                className={`group flex min-h-[250px] flex-col rounded-[18px] border border-neutral-200 p-4 transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-hover sm:p-5 ${
                  index % 3 === 0 ? 'bg-pink' : index % 3 === 1 ? 'bg-yellow' : 'bg-white'
                }`}
              >
                <div className="mb-6 grid aspect-square w-full place-items-center overflow-hidden rounded-[14px] border border-white/60 bg-white/80">
                  <CategoryIcon
                    iconSrc={category.icon || category.image_url}
                    name={category.name}
                    size="lg"
                    imageClassName="h-24 w-24 max-h-24 max-w-24 transition-transform duration-300 group-hover:scale-105"
                    fallbackClassName="text-primary"
                  />
                </div>
                <h3 className="font-heading text-xl leading-tight text-text sm:text-2xl">{category.name}</h3>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-extrabold text-primary sm:text-sm">
                  Khám phá <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">Các danh mục đang được cập nhật.</p>
          </div>
        )}

        <div className="mt-7">
          <Link
            href="/san-pham"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-text px-5 text-sm font-extrabold text-white hover:bg-primary"
          >
            Xem tất cả sản phẩm <ArrowRight size={17} />
          </Link>
        </div>
      </BrandContainer>
    </section>
  )
}
