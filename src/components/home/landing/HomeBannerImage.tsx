import { getPublicImageUrl } from '@/lib/utils'
import BrandLogo from '@/components/ui/BrandLogo'

function getVariantUrl(src: string, width: 750 | 1280) {
  return src.replace(/\.webp$/, `-${width}.webp`)
}

export default function HomeBannerImage({
  src,
  alt,
  priority,
  className,
}: {
  src: string
  alt: string
  priority: boolean
  className?: string
}) {
  const normalizedSrc = getPublicImageUrl(src, 'banner')
  const supportsVariants = normalizedSrc.startsWith('/uploads/') && normalizedSrc.endsWith('.webp')
  const mobileSrc = supportsVariants ? getVariantUrl(normalizedSrc, 750) : normalizedSrc
  const desktopSrc = supportsVariants ? getVariantUrl(normalizedSrc, 1280) : normalizedSrc

  if (normalizedSrc === '/logo.webp') {
    return (
      <BrandLogo
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 1200px"
        className={className}
      />
    )
  }

  return (
    <picture>
      {supportsVariants && <source media="(max-width: 640px)" srcSet={mobileSrc} />}
      <img
        src={desktopSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        className={`${className || ''} text-transparent`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </picture>
  )
}
