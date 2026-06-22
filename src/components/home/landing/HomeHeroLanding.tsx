'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  HeartHandshake,
  MessageCircle,
  Palette,
  Sparkles,
} from 'lucide-react'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import BrandSticker from './BrandSticker'
import AnimatedDoodle from './AnimatedDoodle'
import type { HomeBanner } from './types'

const proofItems = [
  { icon: HeartHandshake, label: 'Handmade 100%' },
  { icon: Palette, label: 'Custom theo sở thích' },
  { icon: Gift, label: 'Quà tặng xinh xắn' },
  { icon: Sparkles, label: 'Mỗi món một câu chuyện' },
]

export default function HomeHeroLanding({ banners }: { banners: HomeBanner[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const slides = banners.length > 0 ? banners : [{
    id: 0,
    image_url: '/logo.webp',
    title: 'Mushroomie handmade',
    subtitle: null,
    description: null,
    button_text: null,
    button_link: null,
    secondary_button_text: null,
    secondary_button_link: null,
    link: null,
    text_position: 'center',
    text_size: 'medium',
    brightness: 100,
    sort_order: 0,
    status: 'active',
  }]

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [paused, slides.length, current])

  const previous = () => setCurrent((value) => (value - 1 + slides.length) % slides.length)
  const next = () => setCurrent((value) => (value + 1) % slides.length)

  return (
    <section
      className="relative overflow-hidden bg-secondary pt-3 md:pt-5"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      {/* Decorative floats — purely presentational */}
      <Sparkles
        aria-hidden
        className="animate-float-soft pointer-events-none absolute left-[6%] top-[14%] h-6 w-6 text-coral/70"
      />
      <span
        aria-hidden
        className="animate-float-soft pointer-events-none absolute right-[8%] top-[22%] h-4 w-4 rounded-full bg-yellow"
      />
      <Sparkles
        aria-hidden
        className="animate-float-soft pointer-events-none absolute right-[14%] bottom-[12%] h-5 w-5 text-primary/40"
      />

      <div
        className="brand-container relative overflow-hidden rounded-[24px] border-[1.5px] border-[#f0e0d6] bg-white shadow-strong"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="relative overflow-hidden bg-secondary aspect-[4/3] sm:aspect-auto sm:h-[300px] md:h-[540px]"
          aria-roledescription="carousel"
          aria-label="Bộ sưu tập Mushroomie"
          aria-live="polite"
        >
          {/* Soft diagonal paper texture behind banners — presentational */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'repeating-linear-gradient(45deg,#fbf0e9,#fbf0e9 13px,#fff 13px,#fff 26px)', opacity: 0.5 }}
          />
          {slides.map((banner, index) => {
            const active = index === current
            return (
              <article
                key={banner.id}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-500 ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
              >
                <SafeImage
                  src={getPublicImageUrl(banner.image_url, 'banner')}
                  fallbackSrc="/logo.webp"
                  imageKind="banner"
                  alt={banner.title || 'Phụ kiện handmade Mushroomie'}
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes="(max-width: 640px) 100vw, 1280px"
                  className={banner.id === 0 ? 'object-contain p-12 md:p-24' : 'object-contain'}
                />
                {banner.link && (
                  <Link href={banner.link} className="absolute inset-0" aria-label={banner.title || 'Mở bộ sưu tập'} />
                )}
              </article>
            )
          })}

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                aria-label="Banner trước"
                className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-[#f0e0d6] bg-white/95 text-text shadow-card transition-transform hover:-translate-y-1/2 hover:scale-105 hover:bg-pink min-h-[44px] min-w-[44px]"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Banner tiếp theo"
                className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-[#f0e0d6] bg-white/95 text-text shadow-card transition-transform hover:-translate-y-1/2 hover:scale-105 hover:bg-pink min-h-[44px] min-w-[44px]"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 right-3 z-20 flex rounded-full border-[1.5px] border-[#f0e0d6] bg-white/90 p-1 shadow-card md:bottom-[204px]">
                {slides.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Chuyển đến banner ${index + 1}`}
                    aria-current={index === current}
                    className="grid h-10 min-w-10 place-items-center"
                  >
                    <span className={`h-2 rounded-full bg-primary transition-[width,opacity] ${index === current ? 'w-6 opacity-100' : 'w-2 opacity-35'}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="brand-container relative grid grid-cols-2 rounded-b-[24px] border-x-[1.5px] border-b-[1.5px] border-[#f0e0d6] bg-white sm:grid-cols-4">
        {proofItems.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={`flex min-h-20 items-center gap-3 px-4 py-3 hover-lift ${index % 2 === 0 ? 'border-r border-[#f0e0d6]' : ''} ${index < 2 ? 'border-b border-[#f0e0d6] sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-pink text-primary">
              <Icon size={18} />
            </span>
            <span className="font-heading text-xs leading-5 text-text sm:text-sm">{label}</span>
          </div>
        ))}
      </div>


    </section>
  )
}
