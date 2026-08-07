'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { getPublicImageUrl } from '@/lib/utils'
import type { PublicImageKind } from '@/lib/image-url'
import { isResponsiveUploadUrl, uploadVariantLoader } from '@/lib/image-variants'

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
  loader,
  ...props
}: Omit<ImageProps, 'src'> & { initialSrc: string; fallback: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(initialSrc)
  const responsiveUploadLoader = isResponsiveUploadUrl(resolvedSrc)
    ? uploadVariantLoader
    : undefined

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      loader={loader || responsiveUploadLoader}
      unoptimized={unoptimized ?? shouldBypassOptimizer(resolvedSrc)}
      onError={() => {
        if (resolvedSrc !== fallback) setResolvedSrc(fallback)
      }}
    />
  )
}

function shouldBypassOptimizer(src: string) {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) return true
  if (src === '/logo.webp' || src.startsWith('/images/')) return true
  if (!/^https?:\/\//i.test(src)) return false

  try {
    const hostname = new URL(src).hostname.toLowerCase()
    const exactHosts = new Set([
      'img.vietqr.io',
      'api.qrserver.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'mushroomie.io.vn',
      'down-vn.img.susercontent.com',
      'cf.shopee.vn',
    ])

    return !exactHosts.has(hostname) && !hostname.endsWith('.amazonaws.com')
  } catch {
    return true
  }
}
