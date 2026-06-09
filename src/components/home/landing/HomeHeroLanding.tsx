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
    }, 12000)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const previous = () => setCurrent((value) => (value - 1 + slides.length) % slides.length)
  const next = () => setCurrent((value) => (value + 1) % slides.length)

  return (
    <section className="overflow-hidden bg-secondary pt-3 md:pt-5">
      <div
        className="brand-container relative overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-strong"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="relative hidden overflow-hidden bg-pink sm:block sm:h-[300px] md:h-[540px]"
          aria-roledescription="carousel"
          aria-label="Bộ sưu tập Mushroomie"
        >
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
                className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-neutral-200 bg-white/95 text-text shadow-card hover:bg-yellow"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Banner tiếp theo"
                className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg border border-neutral-200 bg-white/95 text-text shadow-card hover:bg-yellow"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 right-3 z-20 flex rounded-lg border border-white/70 bg-white/90 p-1 shadow-card md:bottom-[204px]">
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

        <div className="relative overflow-hidden bg-primary px-5 py-6 text-white sm:px-8 md:absolute md:inset-x-0 md:bottom-0 md:z-20 md:px-10 md:py-5">
          <AnimatedDoodle icon="sparkle" className="right-[7%] top-3 h-8 w-8 rotate-12 text-yellow/80" />
          <AnimatedDoodle icon="heart" className="bottom-4 right-[19%] hidden h-7 w-7 -rotate-12 text-pink/70 sm:block" />
          <div className="relative z-10 grid items-end gap-5 lg:grid-cols-[1fr_auto]">
            <div className="max-w-4xl">
              <BrandSticker tone="white">Made for you</BrandSticker>
              <h1 className="mt-4 max-w-4xl text-balance font-heading text-2xl leading-[1.08] sm:text-4xl md:mt-3 lg:text-[2.75rem]">
                Từ từng hạt nhỏ,<br className="sm:hidden" /> tạo phong cách riêng
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white sm:text-base sm:leading-7 md:mt-2">
                Mushroomie tạo nên phụ kiện handmade cá nhân hóa từ hạt, charm và những màu sắc bạn yêu thích.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Link
                href="/san-pham"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-extrabold text-primary shadow-card hover:-translate-y-0.5 hover:bg-yellow hover:text-text"
              >
                Khám phá sản phẩm <ArrowRight size={17} />
              </Link>
              <Link
                href="/lien-he"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/55 px-5 text-sm font-extrabold text-white hover:-translate-y-0.5 hover:bg-white hover:text-primary"
              >
                <MessageCircle size={17} /> Custom món riêng
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="brand-container grid grid-cols-2 border-x border-b border-neutral-200 bg-white sm:grid-cols-4">
        {proofItems.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={`flex min-h-20 items-center gap-3 px-4 py-3 ${index % 2 === 0 ? 'border-r border-neutral-200' : ''} ${index < 2 ? 'border-b border-neutral-200 sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
              <Icon size={18} />
            </span>
            <span className="text-xs font-extrabold leading-5 text-text sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
