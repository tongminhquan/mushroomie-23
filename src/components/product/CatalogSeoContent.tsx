import Link from 'next/link'
import { ArrowRight, HeartHandshake, Palette, Sparkles } from 'lucide-react'
import type { CatalogSeoConfig } from '@/lib/catalog-seo'
import BrandContainer from '@/components/ui/BrandContainer'

const icons = [Palette, Sparkles]

export default function CatalogSeoContent({ content }: { content: CatalogSeoConfig }) {
  return (
    <section className="mt-14 border-y border-theme-border bg-theme-section py-12" aria-labelledby="catalog-guide-heading">
      <BrandContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
              Chọn phụ kiện có chủ đích
            </p>
            <h2 id="catalog-guide-heading" className="mt-2 text-balance font-heading text-2xl text-theme-primary md:text-3xl">
              {content.h1}
            </h2>
            <p className="mt-4 text-sm leading-7 text-theme-secondary md:text-base">
              {content.intro}
            </p>
            <Link
              href="/lien-he"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <HeartHandshake size={17} /> Tư vấn mẫu phù hợp
            </Link>
          </div>

          <div className="space-y-7">
            {content.sections.map((section, index) => {
              const Icon = icons[index] || Sparkles
              return (
                <div key={section.title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-light text-primary" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg text-theme-primary">{section.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-theme-secondary">{section.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <nav aria-label="Nội dung và danh mục liên quan" className="mt-9 flex flex-wrap gap-2.5 border-t border-theme-border pt-7">
          {content.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-theme-border bg-theme-subtle px-4 py-2.5 text-sm font-semibold text-theme-secondary transition-colors hover:border-primary hover:text-primary"
            >
              {link.label} <ArrowRight size={14} />
            </Link>
          ))}
        </nav>
      </BrandContainer>
    </section>
  )
}
