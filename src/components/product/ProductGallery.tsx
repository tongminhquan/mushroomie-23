'use client'

import { useEffect, useMemo, useState } from 'react'
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

export default function ProductGallery({
  images,
  productName,
  isCustomizable,
  isOnSale,
}: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const normalized = images
      .map((image) => getPublicImageUrl(image, 'product'))
      .filter(Boolean)

    const uniqueImages = Array.from(new Set(normalized))
    return uniqueImages.length > 0 ? uniqueImages : [FALLBACK_IMAGE]
  }, [images])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const mainImage = gallery[selectedIndex] || FALLBACK_IMAGE

  useEffect(() => {
    if (selectedIndex < gallery.length) return
    setSelectedIndex(0)
  }, [gallery.length, selectedIndex])

  useEffect(() => {
    if (!lightboxOpen) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') {
        setSelectedIndex((index) => (index + 1) % gallery.length)
      }
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((index) => (index - 1 + gallery.length) % gallery.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gallery.length, lightboxOpen])

  return (
    <>
      <div className="flex h-full flex-col gap-3">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Xem ảnh sản phẩm lớn hơn"
          /* `group` vốn bị thiếu: ảnh bên trong khai báo `group-hover:scale-[1.02]` nhưng
             không có phần tử nào mang class `group` nên hiệu ứng phóng chưa từng chạy. */
          className="group relative flex aspect-[3/4] flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-[28px] border border-warm-border bg-white shadow-card lg:min-h-[640px]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,214,214,0.35),_transparent_55%)]" />
          <SafeImage
            src={mainImage}
            fallbackSrc={FALLBACK_IMAGE}
            imageKind="product"
            alt={productName || 'Ảnh sản phẩm Mushroomie'}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <div className="absolute left-4 top-4 flex flex-wrap items-start gap-2">
            <BrandBadge tone="pink" className="rounded-full px-3 py-1">
              Handmade
            </BrandBadge>
            {isCustomizable && (
              <BrandBadge tone="yellow" className="rounded-full px-3 py-1">
                Cá nhân hóa
              </BrandBadge>
            )}
            {isOnSale && (
              <BrandBadge tone="red" className="rounded-full px-3 py-1">
                Đang giảm giá
              </BrandBadge>
            )}
          </div>

          <span className="absolute bottom-3 right-3 rounded-xl bg-white/85 px-3 py-1.5 text-[11px] font-bold text-neutral-500 shadow-card backdrop-blur-sm">
            Nhấn để xem lớn
          </span>
        </button>

        {gallery.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Xem ảnh sản phẩm ${index + 1}`}
                aria-pressed={selectedIndex === index}
                className={`m-press relative aspect-[3/4] overflow-hidden rounded-[20px] border bg-white transition ${
                  selectedIndex === index
                    ? 'border-primary ring-2 ring-primary/15'
                    : 'border-warm-border hover:border-primary/60'
                }`}
              >
                <SafeImage
                  src={image}
                  fallbackSrc={FALLBACK_IMAGE}
                  imageKind="product"
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

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng ảnh lớn"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            type="button"
          >
            <X size={20} />
          </button>
          <div
            className="relative h-[85vmin] w-[85vmin] max-h-[85vh] max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <SafeImage
              src={mainImage}
              fallbackSrc={FALLBACK_IMAGE}
              imageKind="product"
              alt={productName}
              fill
              sizes="85vmin"
              className="object-contain"
              priority
            />
          </div>
          {gallery.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Ảnh ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
