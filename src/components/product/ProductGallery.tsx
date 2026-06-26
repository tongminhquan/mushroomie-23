'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import BrandBadge from '@/components/ui/BrandBadge'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  productName: string
  isCustomizable: boolean
  isOnSale: boolean
}

const FALLBACK_IMAGE = '/logo.webp'

export default function ProductGallery({ images, productName, isCustomizable, isOnSale }: ProductGalleryProps) {
  const gallery = images.length > 0
    ? images.map((image) => getPublicImageUrl(image, 'product'))
    : [FALLBACK_IMAGE]
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const mainImage = failed ? FALLBACK_IMAGE : gallery[selectedIndex] || FALLBACK_IMAGE

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') setSelectedIndex((i) => (i + 1) % gallery.length)
      if (e.key === 'ArrowLeft') setSelectedIndex((i) => (i - 1 + gallery.length) % gallery.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, gallery.length])

  return (
    <>
      <div className="flex h-full flex-col space-y-3">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Xem ảnh lớn hơn"
          className="relative flex aspect-[3/4] flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-[24px] border border-[#ece0d6] bg-white shadow-card lg:aspect-auto lg:min-h-[520px]"
        >
          <SafeImage
            src={mainImage}
            alt={failed ? 'Ảnh sản phẩm đang được cập nhật' : productName}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 hover:scale-[1.03]"
            onError={() => setFailed(true)}
          />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {isCustomizable && <BrandBadge tone="yellow">Cá nhân hóa</BrandBadge>}
            {isOnSale && <BrandBadge tone="red">Đang giảm giá</BrandBadge>}
            <BrandBadge tone="pink">Handmade</BrandBadge>
          </div>
          <span className="absolute bottom-3 right-3 rounded-xl bg-white/80 px-2.5 py-1 text-[11px] font-bold text-neutral-500 backdrop-blur-sm">
            🔍 Nhấn để xem lớn
          </span>
        </button>

        {gallery.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => { setSelectedIndex(index); setFailed(false) }}
                aria-label={`Xem ảnh sản phẩm ${index + 1}`}
                aria-pressed={selectedIndex === index}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border bg-white transition-all ${
                  selectedIndex === index
                    ? 'border-primary ring-2 ring-primary/15'
                    : 'border-[#ece0d6] hover:border-primary/60'
                }`}
              >
                <SafeImage
                  src={image}
                  alt={`${productName}, ảnh ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <div
            className="relative h-[85vmin] w-[85vmin] max-h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={mainImage}
              alt={productName}
              fill
              sizes="85vmin"
              className="object-contain"
              priority
            />
          </div>
          {gallery.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(i); setFailed(false) }}
                  className={`h-2 rounded-full transition-all ${i === selectedIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                  aria-label={`Ảnh ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
