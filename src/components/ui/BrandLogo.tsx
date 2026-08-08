import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/cn'

type BrandLogoProps = Omit<
  ImageProps,
  'src' | 'loading' | 'preload' | 'priority' | 'fetchPriority'
> & {
  variant?: 'adaptive' | 'white'
}

export default function BrandLogo({
  variant = 'adaptive',
  className,
  alt,
  ...props
}: BrandLogoProps) {
  const imageClassName = cn('object-contain', className)

  if (variant === 'white') {
    return <Image {...props} src="/brand/logo-white.webp" alt={alt} className={imageClassName} />
  }

  return (
    <>
      <Image {...props} src="/logo.webp" alt={alt} className={cn('brand-logo__default', imageClassName)} />
      <Image {...props} src="/brand/logo-white.webp" alt={alt} className={cn('brand-logo__white', imageClassName)} />
    </>
  )
}
