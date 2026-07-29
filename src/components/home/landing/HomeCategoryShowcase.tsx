import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import CategoryIcon from '@/components/ui/CategoryIcon'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeCategory } from './types'

export default function HomeCategoryShowcase({ categories }: { categories: HomeCategory[] }) {
  return (
    <section className="relative overflow-hidden bg-theme-section py-16 text-theme-primary md:py-24">
      <span aria-hidden className="pointer-events-none absolute -left-6 top-16 hidden h-14 w-14 rounded-full bg-pink/60 blur-xl md:block" />
      <span aria-hidden className="pointer-events-none absolute right-4 top-28 hidden h-12 w-12 rounded-full bg-yellow/70 blur-xl md:block" />

      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Danh mục"
          title="Bạn đang tìm gì hôm nay?"
          description="Mỗi danh mục là một cách khác để kể câu chuyện riêng bằng hạt, màu và những chiếc charm nhỏ."
        />

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            {categories.slice(0, 8).map((category, index) => (
              <Link
                key={category.id}
                href={`/san-pham?category=${category.slug}`}
                className="theme-transition group flex min-h-[250px] flex-col rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card hover:-translate-y-1 hover:shadow-hover sm:p-6"
              >
                <div
                  className={`mb-6 grid aspect-square w-full place-items-center overflow-hidden rounded-[16px] ${
                    index % 3 === 0 ? 'bg-pink' : index % 3 === 1 ? 'bg-yellow' : 'bg-theme-subtle'
                  }`}
                >
                  <CategoryIcon
                    iconSrc={category.icon || category.image_url}
                    name={category.name}
                    size="xl"
                    imageClassName="max-h-24 max-w-24 transition-transform duration-300 group-hover:scale-105"
                    fallbackClassName="text-primary transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-heading text-xl leading-tight text-theme-primary sm:text-2xl">{category.name}</h3>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-extrabold uppercase tracking-[0.08em] text-accent-kraft transition-colors group-hover:text-primary sm:text-sm">
                  Khám phá <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-8 text-center shadow-card">
            <p className="text-sm text-theme-muted">Các danh mục đang được cập nhật.</p>
          </div>
        )}

        <div className="mt-9">
          <Link
            href="/san-pham"
            className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Xem tất cả sản phẩm <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </BrandContainer>
    </section>
  )
}
