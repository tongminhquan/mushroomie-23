import Link from 'next/link'
import {
  Gift,
  HeartHandshake,
  Palette,
  Sparkles,
} from 'lucide-react'
import HomeBannerImage from './HomeBannerImage'
import HomeHeroControls from './HomeHeroControls'
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
  const activeBanners = banners
    .filter((banner) => banner.status === 'active')
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
  const slides = activeBanners.length > 0 ? activeBanners : [fallbackSlide]
  const firstBanner = slides[0]
  const firstHref = firstBanner.link || firstBanner.button_link

  return (
    <section
      className="relative overflow-hidden bg-theme-page pt-3 text-theme-primary md:pt-5"
    >
      <Sparkles aria-hidden className="pointer-events-none absolute left-[6%] top-[14%] h-6 w-6 animate-float-soft text-coral/70" />
      <span aria-hidden className="pointer-events-none absolute right-[8%] top-[22%] h-4 w-4 animate-float-soft rounded-full bg-yellow" />
      <Sparkles aria-hidden className="pointer-events-none absolute bottom-[12%] right-[14%] h-5 w-5 animate-float-soft text-primary/40" />

      <div className="brand-container relative overflow-hidden rounded-[24px] border-[1.5px] border-theme-border bg-theme-card shadow-strong">
        <div
          className="relative aspect-[4/3] overflow-hidden bg-theme-subtle sm:h-[300px] sm:aspect-auto md:h-[540px]"
          aria-roledescription="carousel"
          aria-label="Bộ sưu tập Mushroomie"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(45deg, var(--surface-muted), var(--surface-muted) 13px, var(--surface-card) 13px, var(--surface-card) 26px)',
              opacity: 0.5,
            }}
          />

          <article className="absolute inset-0 z-10" aria-label={`${firstBanner.title || 'Banner Mushroomie'} (1/${slides.length})`}>
            <HomeBannerImage
              src={firstBanner.image_url}
              alt={firstBanner.title || 'Phụ kiện handmade Mushroomie'}
              priority
              className={firstBanner.id === 0 ? 'object-contain p-12 md:p-24' : 'object-contain'}
            />
            {firstHref && (
              <Link href={firstHref} className="absolute inset-0 z-10" aria-label={firstBanner.title || 'Mở bộ sưu tập'} />
            )}
          </article>
          <HomeHeroControls slides={slides} />
        </div>
      </div>

      <div id="hero-proof-strip" className="brand-container relative grid grid-cols-2 rounded-b-[24px] border-x-[1.5px] border-b-[1.5px] border-theme-border bg-theme-card sm:grid-cols-4">
        {proofItems.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={`flex min-h-20 items-center gap-3 px-4 py-3 hover-lift ${
              index % 2 === 0 ? 'border-r border-theme-border' : ''
            } ${index < 2 ? 'border-b border-theme-border sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-pink text-primary">
              <Icon size={18} />
            </span>
            <span className="font-heading text-xs leading-5 text-theme-primary sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
