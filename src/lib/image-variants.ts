const DERIVED_UPLOAD_PATTERN = /-(?:384|750|1280)\.webp$/i
const RESPONSIVE_UPLOAD_PATTERN = /^\/uploads\/[^/?]+\.webp$/i

export function isResponsiveUploadUrl(src: string) {
  return RESPONSIVE_UPLOAD_PATTERN.test(src) && !DERIVED_UPLOAD_PATTERN.test(src)
}

export function getUploadVariantUrl(src: string, requestedWidth: number) {
  if (!isResponsiveUploadUrl(src)) return src

  if (requestedWidth <= 384) return src.replace(/\.webp$/i, '-384.webp')
  if (requestedWidth <= 750) return src.replace(/\.webp$/i, '-750.webp')
  return src
}

export function uploadVariantLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const variantUrl = getUploadVariantUrl(src, width)
  if (!isResponsiveUploadUrl(src)) return variantUrl

  return `${variantUrl}?w=${width}`
}
