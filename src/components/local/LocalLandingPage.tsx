import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, MapPin, MessageCircle, PackageCheck, Phone, Send, ShoppingBag, Sparkles } from 'lucide-react'
import { safeJsonLd } from '@/lib/security'
import {
  BRAND,
  breadcrumbSchema,
  deliveryNote,
  faqPageSchema,
  getLocalFaqs,
  getRelatedPages,
  localBusinessSchema,
  localServiceSchema,
  type LocalPage,
} from '@/lib/local-seo'
import { getAreaDelivery, getAreaNote } from '@/lib/local-area-content'

/**
 * Template landing page Local SEO cho Mushroomie.
 * Server component → HTML + JSON-LD render sẵn cho SEO. Giữ đúng tông thương hiệu
 * (nền kem, đỏ #e41d1d làm accent, heading Paytone One), không nặng, mobile-first.
 */
export default function LocalLandingPage({ page }: { page: LocalPage }) {
  const related = getRelatedPages(page.slug)
  const faqs = getLocalFaqs(page)
  const areaNote = getAreaNote(page.slug)
  const areaDelivery = getAreaDelivery(page.area)
  const crumbs = [
    { name: 'Trang chủ', url: '/' },
    { name: page.crumb, url: `/${page.slug}` },
  ]

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* ScrollReveal/ScrollMotion mount ở src/app/(user)/layout.tsx cho mọi trang public. */}
      {/* JSON-LD: LocalBusiness + Breadcrumb + Service (self-contained để @id resolve) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(localServiceSchema(page)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPageSchema(faqs)) }} />

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

      {/* Thông tin địa phương hiển thị đồng nhất với LocalBusiness schema */}
      <section data-reveal className="brand-container mt-8" aria-labelledby="local-contact-heading">
        <div className="grid gap-5 rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card sm:p-6 lg:grid-cols-[1.5fr_0.75fr_0.75fr]">
          <div>
            <h2 id="local-contact-heading" className="flex items-center gap-2 font-heading text-base text-neutral-900">
              <MapPin size={17} className="text-primary" /> {BRAND.name} tại Đồng Nai
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {BRAND.formattedAddress}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Mở bản đồ và đi theo chỉ dẫn đến đúng ghim tại địa chỉ trên. Vui lòng liên hệ trước khi bạn muốn hẹn nhận trực tiếp.
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
              {BRAND.nearbyLandmarks.map((landmark) => (
                <li key={landmark.name} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>
                    Từ <strong className="text-neutral-800">{landmark.name}</strong>
                    {' '}({landmark.addressHint}) khoảng {landmark.distanceKm} km,
                    {' '}{landmark.travelTime} tùy giao thông.
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={BRAND.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline"
            >
              Xem vị trí trên bản đồ <ArrowRight size={14} className="ml-1" />
            </a>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base text-neutral-900">
              <Clock size={17} className="text-primary" /> Giờ phản hồi
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {BRAND.openingHours.opens}–{BRAND.openingHours.closes} mỗi ngày, từ thứ Hai đến Chủ nhật.
            </p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base text-neutral-900">
              <Phone size={17} className="text-primary" /> Tư vấn đặt hàng
            </h2>
            <a
              href={`tel:${BRAND.phoneE164}`}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-neutral-700 hover:text-primary"
            >
              {BRAND.phoneDisplay}
            </a>
            <p className="text-xs leading-relaxed text-neutral-500">Nên liên hệ trước nếu bạn muốn hẹn nhận trực tiếp.</p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section data-reveal className="brand-container mt-8">
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

      {page.intentSections && page.intentSections.length > 0 && (
        <section data-reveal className="brand-container mt-9" aria-labelledby="local-intent-heading">
          <div className="border-y border-warm-border py-7 sm:py-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">Tư vấn trước khi đặt</p>
            <h2 id="local-intent-heading" className="mt-2 max-w-3xl font-heading text-xl text-neutral-900 md:text-2xl">
              Thông tin giúp bạn chọn đúng sản phẩm
            </h2>
            <div className="mt-6 grid gap-7 lg:grid-cols-2 lg:gap-10">
              {page.intentSections.map((section) => (
                <article key={section.title}>
                  <h3 className="font-heading text-base leading-snug text-neutral-900">{section.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quy trình đặt hàng rõ ràng cho truy vấn có ý định mua */}
      <section data-reveal className="brand-container mt-8" aria-labelledby="order-process-heading">
        <h2 id="order-process-heading" className="font-heading text-xl text-neutral-900">
          Đặt phụ kiện handmade theo yêu cầu như thế nào?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Ba bước gọn để {BRAND.name} hiểu đúng ý tưởng, xác nhận chi phí và hoàn thiện sản phẩm trước khi giao đến {page.area}.
        </p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          <li className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pink text-primary" aria-hidden>
              <Send size={18} />
            </span>
            <h3 className="mt-3 font-heading text-base text-neutral-900">1. Gửi ý tưởng</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">Cho {BRAND.name} biết màu, charm, size, dịp tặng và khoảng ngân sách bạn mong muốn.</p>
          </li>
          <li className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3cf] text-[#9b6500]" aria-hidden>
              <CheckCircle2 size={18} />
            </span>
            <h3 className="mt-3 font-heading text-base text-neutral-900">2. Chốt mẫu và chi phí</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">Hai bên xác nhận cách phối, nội dung chữ, thời gian hoàn thiện và tổng chi phí trước khi làm.</p>
          </li>
          <li className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf8ef] text-[#237a43]" aria-hidden>
              <PackageCheck size={18} />
            </span>
            <h3 className="mt-3 font-heading text-base text-neutral-900">3. Làm và giao sản phẩm</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{BRAND.name} làm thủ công, kiểm tra chi tiết rồi hẹn nhận hoặc gửi qua đơn vị vận chuyển.</p>
          </li>
        </ol>
      </section>

      {/* Giao hàng địa phương + USP */}
      <section data-reveal className="brand-container mt-8">
        <div className="rounded-[18px] border-[1.5px] border-[#ffe7a3] bg-[#fffdf5] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg text-neutral-900">
            <Sparkles size={18} className="text-primary" /> Đặt hàng &amp; giao đến {page.area}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{deliveryNote(page.area, page.onlineOnly)}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{areaDelivery.summary}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{areaDelivery.pickup}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Sản phẩm được <strong>làm thủ công</strong>. Nhiều mẫu hỗ trợ <strong>cá nhân hóa</strong> theo màu sắc, charm hoặc kiểu dáng — đúng tinh thần “{BRAND.slogan}”.
          </p>
        </div>
      </section>

      {/* Nội dung riêng của từng khu vực — phần KHÔNG dùng chung giữa các landing page.
          Xem src/lib/local-area-content.ts để biết vì sao khối này tồn tại. */}
      {areaNote && (
        <section data-reveal className="brand-container mt-8" aria-labelledby="area-note-heading">
          <div className="rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 sm:p-6">
            <h2 id="area-note-heading" className="font-heading text-lg text-neutral-900">
              Điều nên biết khi đặt tại {page.area}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{areaNote}</p>
          </div>
        </section>
      )}

      {/* Internal links: sản phẩm + custom + liên hệ */}
      <section data-reveal className="brand-container mt-8">
        <h2 className="font-heading text-lg text-neutral-900">Xem thêm tại {BRAND.name}</h2>
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
        <section data-reveal className="brand-container mt-8">
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

      <section data-reveal className="brand-container mt-8" aria-labelledby="local-faq-heading">
        <h2 id="local-faq-heading" className="font-heading text-xl text-neutral-900">
          Câu hỏi thường gặp
        </h2>
        <div className="mt-4 divide-y divide-neutral-200 rounded-[18px] border-[1.5px] border-warm-border bg-white px-5 shadow-card sm:px-6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold text-neutral-800 marker:content-none">
                {faq.question}
                <span className="shrink-0 text-xl font-normal text-primary transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="max-w-3xl pb-1 pr-8 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section data-reveal className="brand-container mt-10">
        <div className="rounded-[24px] bg-[linear-gradient(120deg,#e41d1d,#ff6b6b)] p-7 text-center text-white shadow-strong sm:p-9">
          <h2 className="font-heading text-xl md:text-2xl">Sẵn sàng tạo phụ kiện của riêng bạn?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/90">
            Nhắn {BRAND.name} để được tư vấn phối màu, charm và kiểu dáng — hoặc đặt vòng custom theo gu riêng của bạn.
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
