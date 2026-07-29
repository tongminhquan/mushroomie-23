'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPublicImageUrl } from '@/lib/utils'
import type { HomeBanner } from './types'

function getVariantUrl(src: string, width: 750 | 1280) {
  return src.replace(/\.webp$/, `-${width}.webp`)
}

export default function HomeHeroControls({ slides }: { slides: HomeBanner[] }) {
  const [current, setCurrent] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (!hasInteracted || slides.length < 2) return undefined

    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [hasInteracted, slides.length])

  const selectSlide = (index: number) => {
    setHasInteracted(true)
    setCurrent(index)
  }

  if (slides.length < 2) return null

  const activeBanner = slides[current]
  const activeHref = activeBanner.link || activeBanner.button_link
  const normalizedSrc = getPublicImageUrl(activeBanner.image_url, 'banner')
  const supportsVariants = normalizedSrc.startsWith('/uploads/') && normalizedSrc.endsWith('.webp')
  const mobileSrc = supportsVariants ? getVariantUrl(normalizedSrc, 750) : normalizedSrc
  const desktopSrc = supportsVariants ? getVariantUrl(normalizedSrc, 1280) : normalizedSrc

  return (
    <>
      {current > 0 && (
        <article className="absolute inset-0 z-10 bg-theme-subtle" aria-live="polite">
          <picture>
            {supportsVariants && <source media="(max-width: 640px)" srcSet={mobileSrc} />}
            <img
              src={desktopSrc}
              alt={activeBanner.title || 'Phụ kiện handmade Mushroomie'}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="object-contain text-transparent"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          </picture>
          {activeHref && (
            <Link href={activeHref} className="absolute inset-0 z-10" aria-label={activeBanner.title || 'Mở bộ sưu tập'} />
          )}
        </article>
      )}

      <button
        type="button"
        onClick={() => selectSlide((current - 1 + slides.length) % slides.length)}
        aria-label="Banner trước"
        className="theme-transition absolute left-3 top-1/2 z-20 grid h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-theme-border bg-theme-card/95 text-theme-primary shadow-card hover:scale-105 hover:bg-pink"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => selectSlide((current + 1) % slides.length)}
        aria-label="Banner tiếp theo"
        className="theme-transition absolute right-3 top-1/2 z-20 grid h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-theme-border bg-theme-card/95 text-theme-primary shadow-card hover:scale-105 hover:bg-pink"
      >
        <ChevronRight size={20} />
      </button>
      <div className="theme-transition absolute bottom-3 right-3 z-20 flex rounded-full border-[1.5px] border-theme-border bg-theme-card/90 p-1 shadow-card md:bottom-[204px]">
        {slides.map((banner, index) => (
          <button
            key={`${banner.id}-${index}`}
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
  )
}
