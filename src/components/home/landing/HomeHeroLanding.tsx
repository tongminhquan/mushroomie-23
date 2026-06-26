'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Gift, Palette, Sparkles, HeartHandshake } from 'lucide-react'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import type { HomeBanner } from './types'

const proofItems = [
  { emoji: '✋', label: 'Handmade 100%', sub: 'tỉ mỉ từng chi tiết' },
  { emoji: '✨', label: 'Custom theo sở thích', sub: 'màu · charm · thông điệp' },
  { emoji: '🎁', label: 'Quà tặng xinh xắn', sub: 'gói quà miễn phí' },
  { emoji: '📖', label: 'Mỗi món một câu chuyện', sub: 'mang dấu ấn của bạn' },
]

export default function HomeHeroLanding({ banners }: { banners: HomeBanner[] }) {
  const [current, setCurrent] = useState(0)
  const activeBanners = banners.filter((b) => b.status === 'active')
  const heroImage = activeBanners[0]
    ? getPublicImageUrl(activeBanners[0].image_url, 'banner')
    : null

  useEffect(() => {
    if (activeBanners.length < 2) return
    const timer = window.setInterval(() => {
      setCurrent((v) => (v + 1) % activeBanners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [activeBanners.length])

  return (
    <section
      className="relative overflow-hidden bg-secondary pt-6 pb-0 md:pt-10"
      style={{ background: 'radial-gradient(ellipse 140% 80% at 60% 0%, #ffeee6 0%, var(--color-secondary) 70%)' }}
    >
      {/* Decorative floats */}
      <span aria-hidden className="animate-float-soft pointer-events-none absolute left-[4%] top-[18%] text-2xl select-none">❤</span>
      <span aria-hidden className="animate-float-soft pointer-events-none absolute right-[6%] top-[12%] h-3 w-3 rounded-full bg-yellow opacity-80 delay-300 select-none" />
      <Sparkles aria-hidden className="animate-float-soft pointer-events-none absolute right-[16%] bottom-[20%] h-5 w-5 text-coral/50 delay-700" />

      <div className="brand-container">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">

          {/* Left — headline + CTAs + stats */}
          <div className="py-4 md:py-10">
            {/* Eyebrow */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ece0d6] bg-white/80 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-kraft shadow-card">
              <span>🍄</span> Handmade · Cá nhân hóa
            </div>

            {/* H1 */}
            <h1 className="mb-4 font-heading text-4xl leading-[1.05] text-text sm:text-5xl lg:text-[56px]">
              Từ từng hạt nhỏ,{' '}
              <span className="text-primary">tạo phong cách riêng</span>
            </h1>

            <p className="mb-2 max-w-md text-base leading-7 text-neutral-600">
              Vòng tay, charm & phụ kiện handmade — custom theo màu sắc, charm và câu chuyện của riêng bạn.
            </p>
            <p className="mb-7 text-sm font-bold text-primary">Làm bằng tay, trao bằng tim.</p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/san-pham"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(228,29,29,0.3)] transition hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0"
              >
                Khám phá sản phẩm <ArrowRight size={16} />
              </Link>
              <Link
                href="/san-pham?customizable=true"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-primary px-6 text-sm font-extrabold text-primary transition hover:bg-pink/50"
              >
                ✨ Custom món riêng
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap gap-6 border-t border-[#ece0d6] pt-6 text-sm">
              <div>
                <p className="font-heading text-2xl text-text">5.000+</p>
                <p className="text-xs text-neutral-500">đơn đã trao đi</p>
              </div>
              <div>
                <p className="font-heading text-2xl text-text">100%</p>
                <p className="text-xs text-neutral-500">làm thủ công</p>
              </div>
              <div>
                <p className="font-heading text-2xl text-text">4.9★</p>
                <p className="text-xs text-neutral-500">đánh giá</p>
              </div>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border-[1.5px] border-[#ece0d6] bg-white shadow-hover md:max-w-none">
              <div className="relative aspect-[4/3]">
                {/* diagonal texture behind */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'repeating-linear-gradient(45deg,#fbf0e9,#fbf0e9 13px,#fff 13px,#fff 26px)', opacity: 0.6 }}
                />
                {activeBanners.length > 0 ? (
                  activeBanners.map((banner, i) => (
                    <div
                      key={banner.id}
                      className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                      <SafeImage
                        src={getPublicImageUrl(banner.image_url, 'banner')}
                        fallbackSrc="/logo.webp"
                        imageKind="banner"
                        alt={banner.title || 'Phụ kiện handmade Mushroomie'}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 768px) 90vw, 50vw"
                        className="object-contain p-4"
                      />
                    </div>
                  ))
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SafeImage src="/logo.webp" fallbackSrc="/logo.webp" alt="Mushroomie" fill sizes="50vw" className="object-contain p-12" />
                  </div>
                )}
              </div>

              {/* Floating badge — gift wrap */}
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-2xl border border-[#ece0d6] bg-white px-3 py-2 shadow-card">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-yellow text-base">🎁</span>
                <div>
                  <p className="text-xs font-extrabold text-text">Free gift wrap</p>
                  <p className="text-[10px] text-neutral-400">cho mọi đơn ♡</p>
                </div>
              </div>

              {/* Floating CTA — mini game */}
              <Link
                href="/mini-game"
                className="absolute bottom-3 left-3 flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 shadow-[0_4px_14px_rgba(228,29,29,0.35)] transition hover:bg-primary-dark"
              >
                <span className="text-sm">🎮</span>
                <div>
                  <p className="text-xs font-extrabold text-white">Chơi game</p>
                  <p className="text-[10px] text-white/75">nhận voucher xinh</p>
                </div>
              </Link>

              {/* Dot indicators */}
              {activeBanners.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrent(i)}
                      aria-label={`Ảnh ${i + 1}`}
                      className={`h-1.5 rounded-full transition-[width] bg-white ${i === current ? 'w-5 opacity-100' : 'w-1.5 opacity-50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proof items bar */}
      <div className="brand-container mt-8">
        <div className="grid grid-cols-2 overflow-hidden rounded-t-[20px] border-[1.5px] border-b-0 border-[#ece0d6] bg-white sm:grid-cols-4">
          {proofItems.map(({ emoji, label, sub }, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-4 sm:py-5 ${
                i % 2 === 0 ? 'border-r border-[#ece0d6]' : ''
              } ${i < 2 ? 'border-b border-[#ece0d6] sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-pink text-xl">{emoji}</span>
              <div>
                <p className="text-xs font-extrabold leading-5 text-text sm:text-sm">{label}</p>
                <p className="text-[10px] text-neutral-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
