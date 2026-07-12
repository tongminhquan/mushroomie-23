import Link from 'next/link'
import { ArrowRight, MapPin, MessageCircle, ShoppingBag, Sparkles } from 'lucide-react'
import { safeJsonLd } from '@/lib/security'
import {
  BRAND,
  breadcrumbSchema,
  deliveryNote,
  getRelatedPages,
  localServiceSchema,
  type LocalPage,
} from '@/lib/local-seo'

/**
 * Template landing page Local SEO cho Mushroomie.
 * Server component → HTML + JSON-LD render sẵn cho SEO. Giữ đúng tông thương hiệu
 * (nền kem, đỏ #e41d1d làm accent, heading Paytone One), không nặng, mobile-first.
 */
export default function LocalLandingPage({ page }: { page: LocalPage }) {
  const related = getRelatedPages(page.slug)
  const crumbs = [
    { name: 'Trang chủ', url: '/' },
    { name: page.crumb, url: `/${page.slug}` },
  ]

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* JSON-LD: Breadcrumb + Service (LocalBusiness đặt ở layout gốc) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(localServiceSchema(page)) }} />

      {/* Breadcrumb hiển thị */}
      <nav aria-label="Breadcrumb" className="brand-container pt-5 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-primary">Trang chủ</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-neutral-700">{page.crumb}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="brand-container mt-4">
        <div
          className="rounded-[24px] border-[1.5px] border-warm-border bg-white p-6 shadow-card sm:p-9"
          style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, #ffffff)' }}
        >
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
            <MapPin size={13} /> {page.area}
          </p>
          <h1 className="font-heading text-2xl leading-tight text-neutral-900 md:text-4xl">{page.h1}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-600">{page.intro}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={page.cta.href}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-card transition-transform hover:-translate-y-0.5 hover:bg-primary-dark motion-reduce:transform-none"
            >
              {page.cta.label} <ArrowRight size={16} />
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-warm-border bg-white px-5 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle size={16} /> Nhắn tin tư vấn
            </Link>
            <a
              href={BRAND.shopee}
              target="_blank"
              rel="noopener nofollow"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#ffd6c4] bg-[#fff3ec] px-5 py-3 text-sm font-bold text-[#ee4d2d] transition-colors hover:bg-[#ffe7db]"
            >
              <ShoppingBag size={16} /> Mua trên Shopee
            </a>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="brand-container mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {page.highlights.map((h) => (
            <div key={h.title} className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card">
              <div className="mb-2 text-2xl" aria-hidden>{h.emoji}</div>
              <h2 className="font-heading text-base text-neutral-900">{h.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Giao hàng địa phương + USP */}
      <section className="brand-container mt-8">
        <div className="rounded-[18px] border-[1.5px] border-[#ffe7a3] bg-[#fffdf5] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg text-neutral-900">
            <Sparkles size={18} className="text-primary" /> Đặt hàng &amp; giao đến {page.area}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{deliveryNote(page.area, page.onlineOnly)}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Tất cả sản phẩm đều <strong>handmade 100%</strong> và có thể <strong>cá nhân hóa</strong> theo màu sắc, charm, kiểu dáng — đúng tinh thần “{BRAND.slogan}”.
          </p>
        </div>
      </section>

      {/* Internal links: sản phẩm + custom + liên hệ */}
      <section className="brand-container mt-8">
        <h2 className="font-heading text-lg text-neutral-900">Xem thêm tại Mushroomie</h2>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {page.productLinks.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-warm-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
            >
              {l.label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </section>

      {/* Related local pages */}
      {related.length > 0 && (
        <section className="brand-container mt-8">
          <h2 className="font-heading text-lg text-neutral-900">Khu vực &amp; sản phẩm liên quan</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group rounded-[16px] border-[1.5px] border-warm-border bg-white p-4 shadow-card transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
              >
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><MapPin size={12} /> {r.area}</span>
                <p className="mt-1 font-heading text-sm leading-snug text-neutral-900 group-hover:text-primary">{r.crumb}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="brand-container mt-10">
        <div className="rounded-[24px] bg-[linear-gradient(120deg,#e41d1d,#ff6b6b)] p-7 text-center text-white shadow-strong sm:p-9">
          <h2 className="font-heading text-xl md:text-2xl">Sẵn sàng tạo phụ kiện của riêng bạn?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/90">
            Nhắn Mushroomie để được tư vấn phối màu, charm và kiểu dáng — hoặc đặt vòng custom theo gu riêng của bạn.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/lien-he" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5 motion-reduce:transform-none">
              Đặt vòng custom
            </Link>
            <Link href={page.cta.href} className="rounded-full border-[1.5px] border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
              {page.cta.label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
