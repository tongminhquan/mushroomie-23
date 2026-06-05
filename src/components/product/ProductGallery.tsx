'use client'
import { useState, useEffect } from 'react'
import Badge from '@/components/ui/Badge'

interface ProductGalleryProps {
  images: string[]
  productName: string
  isCustomizable: boolean
  isOnSale: boolean
}

const FALLBACK_IMAGE = '/logo.png'

export default function ProductGallery({ images, productName, isCustomizable, isOnSale }: ProductGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0] || FALLBACK_IMAGE)
  const [hasError, setHasError] = useState(false)

  // Reset main image when images prop changes
  useEffect(() => {
    setMainImage(images[0] || FALLBACK_IMAGE)
    setHasError(false)
  }, [images])

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true)
      setMainImage(FALLBACK_IMAGE)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-card flex flex-col items-center justify-center p-4">
        {hasError && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50/50">
            <span className="text-sm font-medium mt-16">Ảnh đang được cập nhật</span>
          </div>
        )}
        <img
          src={mainImage}
          alt={hasError ? 'Ảnh đang được cập nhật' : productName}
          className="w-full h-full object-contain relative z-10"
          loading="eager"
          decoding="async"
          onError={handleImageError}
        />
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {isCustomizable && <Badge variant="custom">Cá nhân hóa</Badge>}
          {isOnSale && <Badge variant="sale">Sale</Badge>}
          <Badge variant="handmade">🧶 Handmade</Badge>
        </div>
      </div>
      
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setMainImage(img)
                setHasError(false)
              }}
              className={`relative aspect-square w-full bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all p-1 ${
                mainImage === img && !hasError ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <img 
                src={img} 
                alt={`${productName} thumbnail ${i + 1}`} 
                className="w-full h-full object-contain" 
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
