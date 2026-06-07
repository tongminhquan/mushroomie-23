'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { getPublicImageUrl } from '@/lib/utils'

type ImageKind = 'product' | 'banner' | 'user'

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null
  fallbackSrc?: string
  imageKind?: ImageKind
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
      unoptimized={unoptimized ?? resolvedSrc.startsWith('/')}
      onError={() => {
        if (resolvedSrc !== fallback) setResolvedSrc(fallback)
      }}
    />
  )
}
