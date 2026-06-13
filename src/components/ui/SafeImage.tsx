'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { getPublicImageUrl } from '@/lib/utils'
import type { PublicImageKind } from '@/lib/image-url'

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null
  fallbackSrc?: string
  imageKind?: PublicImageKind
}

export default function SafeImage({
  src,
  fallbackSrc,
  imageKind = 'product',
  unoptimized,
  alt,
  ...props
}: SafeImageProps) {
  const fallback = fallbackSrc || getPublicImageUrl(null, imageKind)
  const normalizedSrc = getPublicImageUrl(src, imageKind)

  return (
    <ResolvedImage
      key={normalizedSrc}
      {...props}
      initialSrc={normalizedSrc}
      fallback={fallback}
      unoptimized={unoptimized}
      alt={alt}
    />
  )
}

function ResolvedImage({
  initialSrc,
  fallback,
  unoptimized,
  alt,
  ...props
}: Omit<ImageProps, 'src'> & { initialSrc: string; fallback: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(initialSrc)

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      unoptimized={unoptimized ?? shouldBypassOptimizer(resolvedSrc)}
      onError={() => {
        if (resolvedSrc !== fallback) setResolvedSrc(fallback)
      }}
    />
  )
}

function shouldBypassOptimizer(src: string) {
  return src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg') || /^https?:\/\//i.test(src)
}
