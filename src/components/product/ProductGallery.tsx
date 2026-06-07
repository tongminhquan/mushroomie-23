'use client'

import { useState } from 'react'
import BrandBadge from '@/components/ui/BrandBadge'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  productName: string
  isCustomizable: boolean
  isOnSale: boolean
}

const FALLBACK_IMAGE = '/logo.png'

export default function ProductGallery({ images, productName, isCustomizable, isOnSale }: ProductGalleryProps) {
  const gallery = images.length > 0
    ? images.map((image) => getPublicImageUrl(image, 'product'))
    : [FALLBACK_IMAGE]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const mainImage = failed ? FALLBACK_IMAGE : gallery[selectedIndex] || FALLBACK_IMAGE

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-card">
        <SafeImage
          src={mainImage}
          alt={failed ? 'Ảnh sản phẩm đang được cập nhật' : productName}
          fill
          priority
          fetchPriority="high"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4"
          onError={() => setFailed(true)}
        />
        <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
          {isCustomizable && <BrandBadge tone="yellow">Cá nhân hóa</BrandBadge>}
          {isOnSale && <BrandBadge tone="red">Đang giảm giá</BrandBadge>}
          <BrandBadge tone="pink">Handmade</BrandBadge>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => {
                setSelectedIndex(index)
                setFailed(false)
              }}
              aria-label={`Xem ảnh sản phẩm ${index + 1}`}
              aria-pressed={selectedIndex === index}
              className={`relative aspect-square overflow-hidden rounded-xl border bg-white ${
                selectedIndex === index ? 'border-primary ring-2 ring-primary/15' : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <SafeImage
                src={image}
                alt={`${productName}, ảnh ${index + 1}`}
                fill
                sizes="120px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
