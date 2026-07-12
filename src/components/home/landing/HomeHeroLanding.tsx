'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  HeartHandshake,
  Palette,
  Sparkles,
} from 'lucide-react'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import type { HomeBanner } from './types'

const fallbackSlide: HomeBanner = {
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
}

const proofItems = [
  { icon: HeartHandshake, label: 'Handmade 100%' },
  { icon: Palette, label: 'Custom theo sở thích' },
  { icon: Gift, label: 'Quà tặng xinh xắn' },
  { icon: Sparkles, label: 'Mỗi món một câu chuyện' },
]

export default function HomeHeroLanding({ banners }: { banners: HomeBanner[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const slides = useMemo(() => {
    const activeBanners = banners
      .filter((banner) => banner.status === 'active')
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)

    return activeBanners.length > 0 ? activeBanners : [fallbackSlide]
  }, [banners])

  useEffect(() => {
    if (current < slides.length) return
    setCurrent(0)
  }, [current, slides.length])

  useEffect(() => {
    if (slides.length < 2 || paused || !hasInteracted) return undefined

    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [hasInteracted, paused, slides.length])

  const previous = () => {
    setHasInteracted(true)
    setCurrent((value) => (value - 1 + slides.length) % slides.length)
  }
  const next = () => {
    setHasInteracted(true)
    setCurrent((value) => (value + 1) % slides.length)
  }
  const selectSlide = (index: number) => {
    setHasInteracted(true)
    setCurrent(index)
  }

  const activeBanner = slides[current] || slides[0]
  const activeHref = activeBanner.link || activeBanner.button_link

  return (
    <section
      className="relative overflow-hidden bg-secondary pt-3 md:pt-5"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      <Sparkles aria-hidden className="pointer-events-none absolute left-[6%] top-[14%] h-6 w-6 animate-float-soft text-coral/70" />
      <span aria-hidden className="pointer-events-none absolute right-[8%] top-[22%] h-4 w-4 animate-float-soft rounded-full bg-yellow" />
      <Sparkles aria-hidden className="pointer-events-none absolute bottom-[12%] right-[14%] h-5 w-5 animate-float-soft text-primary/40" />

      <div
        className="brand-container relative overflow-hidden rounded-[24px] border-[1.5px] border-warm-border bg-white shadow-strong"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="relative aspect-[4/3] overflow-hidden bg-secondary sm:h-[300px] sm:aspect-auto md:h-[540px]"
          aria-roledescription="carousel"
          aria-label="Bộ sưu tập Mushroomie"
          aria-live="polite"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(45deg, #fbf0e9, #fbf0e9 13px, #fff 13px, #fff 26px)',
              opacity: 0.5,
            }}
          />

          <article key={activeBanner.id} className="absolute inset-0 z-10">
            <SafeImage
              src={getPublicImageUrl(activeBanner.image_url, 'banner')}
              fallbackSrc="/logo.webp"
              imageKind="banner"
              alt={activeBanner.title || 'Phụ kiện handmade Mushroomie'}
              fill
              priority={current === 0}
              fetchPriority={current === 0 ? 'high' : 'auto'}
              decoding={current === 0 ? 'sync' : 'async'}
              quality={70}
              sizes="(max-width: 640px) calc(100vw - 20px), (max-width: 1312px) calc(100vw - 32px), 1280px"
              className={activeBanner.id === 0 ? 'object-contain p-12 md:p-24' : 'object-contain'}
            />
            {activeHref && (
              <Link href={activeHref} className="absolute inset-0" aria-label={activeBanner.title || 'Mở bộ sưu tập'} />
            )}
          </article>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                aria-label="Banner trước"
                className="absolute left-3 top-1/2 z-20 grid h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-warm-border bg-white/95 text-text shadow-card transition-transform hover:scale-105 hover:bg-pink"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Banner tiếp theo"
                className="absolute right-3 top-1/2 z-20 grid h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-warm-border bg-white/95 text-text shadow-card transition-transform hover:scale-105 hover:bg-pink"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 right-3 z-20 flex rounded-full border-[1.5px] border-warm-border bg-white/90 p-1 shadow-card md:bottom-[204px]">
                {slides.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => selectSlide(index)}
                    aria-label={`Chuyển đến banner ${index + 1}`}
                    aria-current={index === current}
                    className="grid h-10 min-w-10 place-items-center"
                  >
                    <span
                      className={`h-2 w-6 origin-center rounded-full bg-primary transition-[transform,opacity] ${
                        index === current ? 'scale-x-100 opacity-100' : 'scale-x-[0.333] opacity-35'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="brand-container relative grid grid-cols-2 rounded-b-[24px] border-x-[1.5px] border-b-[1.5px] border-warm-border bg-white sm:grid-cols-4">
        {proofItems.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={`flex min-h-20 items-center gap-3 px-4 py-3 hover-lift ${
              index % 2 === 0 ? 'border-r border-warm-border' : ''
            } ${index < 2 ? 'border-b border-warm-border sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
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
