'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Navigation } from 'lucide-react'
import Button from '@/components/ui/Button'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import SafeEmail from '@/components/ui/SafeEmail'
import { BRAND } from '@/lib/local-seo'

const LINE = '#f0e0d6' // warm hairline từ Claude Design

// Liên kết Local SEO trong thân trang liên hệ (nội bộ, anchor tự nhiên)
const LOCAL_LINKS = [
  { href: '/phu-kien-handmade-dong-nai', label: 'Phụ kiện handmade Đồng Nai' },
  { href: '/vong-tay-custom-dong-nai', label: 'Vòng tay custom Đồng Nai' },
  { href: '/moc-khoa-handmade-dong-nai', label: 'Móc khóa handmade Đồng Nai' },
  { href: '/qua-tang-ca-nhan-hoa-dong-nai', label: 'Quà tặng cá nhân hóa Đồng Nai' },
]

const socials = [
  { name: 'Facebook', ...BRAND.socials.facebook, emoji: '📘', chip: '#e7f0ff' },
  { name: 'Instagram', ...BRAND.socials.instagram, emoji: '📸', chip: '#ffe7f3' },
  { name: 'TikTok', ...BRAND.socials.tiktok, emoji: '🎵', chip: '#eaeaea' },
  { name: 'Shopee', ...BRAND.socials.shopee, emoji: '🛒', chip: '#ffeede' },
]

const infoItems = [
  { emoji: '📍', chip: '#ffd6d6', label: 'Địa chỉ', value: <>{BRAND.formattedAddress}</> },
  { emoji: '✉️', chip: '#ffe7a3', label: 'Email', value: <SafeEmail email={BRAND.email} /> },
  { emoji: '☎️', chip: '#ffece6', label: 'Hotline / Zalo', value: <a href={`tel:${BRAND.phoneE164}`} className="hover:text-primary">{BRAND.phoneDisplay}</a> },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) setErrors(data.error || {})
    else setSuccess(true)
    setIsLoading(false)
  }

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl text-sm bg-[#fffdfb] outline-none transition-colors border-[1.5px] ${
      hasError ? 'border-red-400' : 'border-[#e2d3c8] focus:border-primary focus:ring-4 focus:ring-primary/10'
    }`

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* Hero */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
      >
        <span aria-hidden className="pointer-events-none select-none absolute left-[13%] top-[34%] text-2xl text-coral animate-float-soft">❤</span>
        <span aria-hidden className="pointer-events-none select-none absolute right-[15%] top-[28%] text-xl text-accent-mint animate-float-soft" style={{ animationDelay: '1.2s' }}>★</span>
        <div className="relative max-w-2xl mx-auto px-6 pt-12 pb-10">
          <div className="text-5xl mb-3 animate-float-soft" aria-hidden>🍄</div>
          <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-3">Liên hệ</span>
          <h1 className="font-heading text-3xl md:text-[44px] leading-tight text-neutral-900 mb-3">Ghé Nhà Nấm nhỏ ♡</h1>
          <p className="m-0 mx-auto max-w-md text-[15px] leading-relaxed text-neutral-500">
            Có câu hỏi, muốn custom đặc biệt hay chỉ muốn nói &ldquo;hi&rdquo;? Nhắn cho chúng mình nhé! {BRAND.name} ở{' '}
            <strong className="text-neutral-700">{BRAND.formattedAddress}</strong> và giao online đến TP.HCM.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`tel:${BRAND.phoneE164}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
            >
              📞 Gọi {BRAND.phoneDisplay}
            </a>
            <a
              href={BRAND.socials.facebook.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
            >
              💬 Nhắn tin tư vấn
            </a>
            <a
              href={BRAND.socials.shopee.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-warm-border bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
            >
              🛒 Mua trên Shopee
            </a>
          </div>
        </div>
      </section>

      {/* Social tiles */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid gap-3.5 grid-cols-2 md:grid-cols-4">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.name} của ${BRAND.name}`}
              className="hover-lift block text-center bg-white rounded-[20px] p-5 border-[1.5px] shadow-card"
              style={{ borderColor: LINE }}
            >
              <span
                aria-hidden
                className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[14px] text-2xl"
                style={{ background: s.chip }}
              >
                {s.emoji}
              </span>
              <div className="font-heading text-[15px] text-neutral-900">{s.name}</div>
              <div className="mt-0.5 text-[11.5px] text-neutral-400">{s.handle}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Form + Info */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 grid gap-6 items-start lg:grid-cols-[1.2fr_0.8fr]">
        {/* Form */}
        <AnimateOnScroll animation="fade-up">
          <div className="bg-white rounded-[24px] p-6 md:p-7 border-[1.5px] shadow-card" style={{ borderColor: LINE }}>
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="text-5xl mb-4" aria-hidden>✅</div>
                <h2 className="font-heading text-xl mb-2 text-neutral-900">Đã gửi thành công!</h2>
                <p className="text-neutral-500 text-sm">{BRAND.name} sẽ phản hồi bạn trong vòng 24h. Cảm ơn đã liên hệ ♡</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-heading text-xl mb-1 text-neutral-900">Gửi lời nhắn cho {BRAND.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ct-name" className="block text-xs font-semibold mb-1.5 text-neutral-700">Họ tên</label>
                    <input id="ct-name" type="text" required value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Tên của bạn…" className={inputCls(!!errors.name)} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                  </div>
                  <div>
                    <label htmlFor="ct-phone" className="block text-xs font-semibold mb-1.5 text-neutral-700">Số điện thoại</label>
                    <input id="ct-phone" type="tel" value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="09xx xxx xxx" className={inputCls(!!errors.phone)} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="ct-email" className="block text-xs font-semibold mb-1.5 text-neutral-700">Email</label>
                    <input id="ct-email" type="email" required value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="ban@email.com" className={inputCls(!!errors.email)} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="ct-message" className="block text-xs font-semibold mb-1.5 text-neutral-700">Nội dung</label>
                    <textarea id="ct-message" required rows={4} value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Mình muốn custom một chiếc vòng tay tặng bạn thân…"
                      className={`${inputCls(!!errors.message)} resize-none`} />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message[0]}</p>}
                  </div>
                </div>

                {/* Honeypot (chống spam) — giữ nguyên */}
                <div className="absolute opacity-0 -z-50 h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off"
                    value={(form as any).website || ''}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
                </div>

                <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                  Gửi lời nhắn ♡
                </Button>
              </form>
            )}
          </div>
        </AnimateOnScroll>

        {/* Info column */}
        <AnimateOnScroll animation="fade-up" delay={120}>
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-[20px] p-5 border-[1.5px] shadow-card" style={{ borderColor: LINE }}>
              {infoItems.map((it) => (
                <div key={it.label} className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
                  <span aria-hidden className="grid h-9 w-9 flex-none place-items-center rounded-[11px] text-lg" style={{ background: it.chip }}>{it.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-neutral-400">{it.label}</div>
                    <div className="text-sm font-semibold text-neutral-900 leading-snug mt-0.5 break-words">{it.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[18px] p-4 bg-primary-light">
              <h3 className="font-heading text-primary mb-1.5">🎨 Tự thiết kế phụ kiện?</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Cho mình biết ý tưởng của bạn — {BRAND.name} tư vấn miễn phí và giúp bạn tạo chiếc phụ kiện độc nhất vô nhị.</p>
            </div>

            <div className="flex items-center gap-3 rounded-[18px] p-4 bg-secondary border-[1.5px] border-dashed border-[#d9b89e]">
              <span aria-hidden className="text-xl">🕘</span>
              <div className="text-[12.5px] text-neutral-600 leading-snug">
                <strong className="text-accent-kraft">Giờ phản hồi:</strong> 8:00–21:00 mỗi ngày (T2–CN). Thường rep trong vài giờ ♡
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Map */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <AnimateOnScroll animation="fade-up">
          <div className="bg-white rounded-[20px] p-2 border-[1.5px] shadow-card overflow-hidden" style={{ borderColor: LINE }}>
            <div className="p-4 sm:p-5">
              <h2 className="flex items-center gap-2 font-heading text-xl text-neutral-900">
                <MapPin size={20} className="text-primary" /> Đường đến {BRAND.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
                {BRAND.name} ở {BRAND.formattedAddress}. Trước khi đến, bạn hãy mở bản đồ và đi theo chỉ dẫn đến đúng ghim tại địa chỉ này.
              </p>
              <a
                href={BRAND.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <Navigation size={17} /> Mở chỉ đường trên Google Maps
              </a>
            </div>
            <iframe
              title={`Bản đồ ${BRAND.name}`}
              src={BRAND.mapEmbedUrl}
              width="100%"
              height="420"
              style={{ border: 0, borderRadius: '0.75rem' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </AnimateOnScroll>
      </section>

      {/* Khu vực phục vụ + internal links (Local SEO) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <AnimateOnScroll animation="fade-up">
          <div className="rounded-[20px] bg-white p-6 border-[1.5px] shadow-card" style={{ borderColor: LINE }}>
            <h2 className="font-heading text-xl text-neutral-900">{BRAND.name} phục vụ khu vực nào?</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {BRAND.name} làm phụ kiện handmade cá nhân hóa tại <strong>{BRAND.formattedAddress}</strong>, phục vụ khách ở{' '}
              <strong>Biên Hòa</strong> và các khu vực lân cận, đồng thời nhận đặt online giao đến <strong>TP.HCM</strong>. Bạn có thể
              đặt vòng tay, móc khóa, charm và quà tặng custom theo màu sắc, kiểu dáng và cá tính riêng.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {LOCAL_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center rounded-full border-[1.5px] border-warm-border bg-secondary px-4 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/san-pham"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-bold text-white shadow-[0_10px_24px_rgba(228,29,29,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-dark motion-reduce:transform-none"
              >
                Xem tất cả sản phẩm ♡
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  )
}
