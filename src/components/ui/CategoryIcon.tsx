'use client'

import { useState } from 'react'

export default function CategoryIcon({ iconSrc, name }: { iconSrc: string | null, name: string }) {
  const [hasError, setHasError] = useState(false)

  if (iconSrc && !hasError && /^https?:\/\//.test(iconSrc)) {
    return (
      <img
        src={iconSrc}
        alt={name}
        className="w-[36px] h-[36px] object-contain mx-auto"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  if (iconSrc && !hasError && iconSrc.startsWith('/')) {
    return (
      <img
        src={iconSrc}
        alt={name}
        className="w-[36px] h-[36px] object-contain mx-auto"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  // If there's an error loading the image, or it's a string emoji
  if (iconSrc && !hasError && !iconSrc.startsWith('/') && !/^https?:\/\//.test(iconSrc)) {
    return <span className="text-4xl leading-none flex items-center justify-center">{iconSrc}</span>;
  }

  // Fallback
  return <span className="text-4xl leading-none flex items-center justify-center">🍄</span>;
}
