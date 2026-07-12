'use client'

import { useState } from 'react'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'

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
  const [useVariants, setUseVariants] = useState(supportsVariants)

  if (!useVariants) {
    return (
      <SafeImage
        src={normalizedSrc}
        fallbackSrc="/logo.webp"
        imageKind="banner"
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        sizes="(max-width: 640px) calc(100vw - 20px), (max-width: 1312px) calc(100vw - 32px), 1280px"
        className={className}
      />
    )
  }

  const mobileSrc = getVariantUrl(normalizedSrc, 750)
  const desktopSrc = getVariantUrl(normalizedSrc, 1280)

  return (
    <>
      {priority && (
        <>
          <link rel="preload" as="image" href={mobileSrc} media="(max-width: 640px)" />
          <link rel="preload" as="image" href={desktopSrc} media="(min-width: 641px)" />
        </>
      )}
      <picture>
        <source media="(max-width: 640px)" srcSet={mobileSrc} />
        <img
          src={desktopSrc}
          alt={alt}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          className={className}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          onError={() => setUseVariants(false)}
        />
      </picture>
    </>
  )
}
