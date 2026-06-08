'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPublicImageUrl } from '@/lib/utils'
import SafeImage from '@/components/ui/SafeImage'

interface Banner {
  id: number
  image_url: string
  title: string | null
  subtitle: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  secondary_button_text: string | null
  secondary_button_link: string | null
  link: string | null
  text_position: string
  text_size: string
  brightness: number
  sort_order: number
  status: string
}

export default function HomeHeroCarousel({
  banners,
  fallbackHero,
}: {
  banners: Banner[]
  fallbackHero: React.ReactNode
}) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const hasBanners = banners.length > 0

  useEffect(() => {
    if (!hasBanners || banners.length < 2 || paused) return
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % banners.length)
    }, 12000)
    return () => window.clearInterval(timer)
  }, [banners.length, hasBanners, paused])

  if (!hasBanners) return <>{fallbackHero}</>

  const previous = () => setCurrent((value) => (value - 1 + banners.length) % banners.length)
  const next = () => setCurrent((value) => (value + 1) % banners.length)

  return (
    <section className="bg-secondary py-4 md:py-6" aria-roledescription="carousel" aria-label="Banner Mushroomie">
      <div
        className="brand-container relative aspect-[16/9] overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-strong md:aspect-[2/1]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {banners.map((banner, index) => {
          const active = index === current
          const hasContent = banner.title || banner.subtitle || banner.description || banner.button_text
          return (
            <article key={banner.id} aria-hidden={!active} className={`absolute inset-0 transition-opacity duration-500 ${active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}>
              <SafeImage
                src={getPublicImageUrl(banner.image_url, 'banner')}
                imageKind="banner"
                alt={banner.title || 'Bộ sưu tập Mushroomie'}
                fill
                priority={index === 0}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                sizes="(max-width: 768px) 100vw, 1280px"
                className="object-contain"
              />
              {hasContent && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 md:p-10">
                  <div className="max-w-2xl text-white">
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-yellow md:text-xs">Mushroomie handmade</p>
                    {banner.title && <h1 className="text-balance font-heading text-2xl leading-[1.08] md:text-5xl">{banner.title}</h1>}
                    {banner.subtitle && <p className="mt-2 font-heading text-lg text-yellow md:text-2xl">{banner.subtitle}</p>}
                    {banner.description && <p className="mt-3 hidden max-w-xl text-sm leading-6 text-white/80 sm:block">{banner.description}</p>}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {banner.button_text && <Link href={banner.button_link || '/san-pham'} className="rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-primary">{banner.button_text}</Link>}
                      {banner.secondary_button_text && <Link href={banner.secondary_button_link || '/lien-he'} className="rounded-xl border border-white/60 px-5 py-2.5 text-sm font-extrabold text-white">{banner.secondary_button_text}</Link>}
                    </div>
                  </div>
                </div>
              )}
              {banner.link && !hasContent && <Link href={banner.link} className="absolute inset-0" aria-label="Mở banner" />}
            </article>
          )
        })}

        {banners.length > 1 && (
          <>
            <button onClick={previous} aria-label="Banner trước" className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl bg-white/90 text-text shadow-card hover:bg-white"><ChevronLeft size={20} /></button>
            <button onClick={next} aria-label="Banner tiếp theo" className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl bg-white/90 text-text shadow-card hover:bg-white"><ChevronRight size={20} /></button>
            <div className="absolute bottom-3 right-3 z-20 flex gap-1 rounded-lg bg-black/25 p-1 backdrop-blur-sm">
              {banners.map((banner, index) => (
                <button key={banner.id} onClick={() => setCurrent(index)} aria-label={`Chuyển đến banner ${index + 1}`} aria-current={index === current} className="grid h-8 min-w-8 place-items-center rounded-lg">
                  <span className={`h-1.5 rounded-full transition-[width,background-color] ${index === current ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="brand-container mt-3 grid grid-cols-3 divide-x divide-neutral-200 rounded-xl border border-neutral-200 bg-white py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.06em] text-neutral-600 sm:text-xs">
        <span>Handmade kỹ</span>
        <span>Custom theo ý</span>
        <span>Gói quà chỉn chu</span>
      </div>
    </section>
  )
}
