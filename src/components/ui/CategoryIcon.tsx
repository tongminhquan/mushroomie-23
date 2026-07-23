'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPublicImageUrl } from '@/lib/utils'

type CategoryIconSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<CategoryIconSize, { image: string; text: string; pixels: number }> = {
  sm: { image: 'h-8 w-8', text: 'text-2xl', pixels: 32 },
  md: { image: 'h-9 w-9', text: 'text-3xl', pixels: 36 },
  lg: { image: 'h-20 w-20', text: 'text-5xl', pixels: 80 },
  xl: { image: 'h-24 w-24', text: 'text-6xl', pixels: 96 },
}

const imageLikePattern = /^(https?:\/\/|\/|uploads\/|public\/|images\/)/i
const fileExtensionPattern = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i

function isImageSource(value: string) {
  return imageLikePattern.test(value) || fileExtensionPattern.test(value)
}

function normalizeIconSrc(value: string) {
  return getPublicImageUrl(value, 'product')
}

export default function CategoryIcon({
  iconSrc,
  name,
  size = 'md',
  imageClassName,
  fallbackClassName,
}: {
  iconSrc: string | null
  name: string
  size?: CategoryIconSize
  imageClassName?: string
  fallbackClassName?: string
}) {
  const [hasError, setHasError] = useState(false)
  const value = iconSrc?.trim()
  const classes = sizeClasses[size]

  if (value && !hasError && isImageSource(value)) {
    const src = normalizeIconSrc(value)

    return (
      <Image
        src={src}
        alt={name}
        width={classes.pixels}
        height={classes.pixels}
        sizes={`${classes.pixels}px`}
        className={`block shrink-0 object-contain ${classes.image} ${imageClassName || ''}`}
        onError={() => setHasError(true)}
      />
    )
  }

  if (value && !hasError) {
    return (
      <span className={`flex items-center justify-center leading-none ${classes.text} ${fallbackClassName || ''}`}>
        {value}
      </span>
    )
  }

  return (
    <span className={`flex items-center justify-center leading-none ${classes.text} ${fallbackClassName || ''}`}>
      🍄
    </span>
  )
}
