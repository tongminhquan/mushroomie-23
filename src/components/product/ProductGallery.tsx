'use client'
import { useState } from 'react'
import Image from 'next/image'
import Badge from '@/components/ui/Badge'

interface ProductGalleryProps {
  images: string[]
  productName: string
  isCustomizable: boolean
  isOnSale: boolean
}

export default function ProductGallery({ images, productName, isCustomizable, isOnSale }: ProductGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0])

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] w-full bg-white rounded-2xl overflow-hidden shadow-card">
        <Image
          src={mainImage}
          alt={productName}
          fill
          className="object-cover"
          priority
          unoptimized={true}
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
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
              onClick={() => setMainImage(img)}
              className={`relative aspect-[3/4] w-full bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
                mainImage === img ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <Image 
                src={img} 
                alt={`${productName} thumbnail ${i + 1}`} 
                fill 
                className="object-cover" 
                unoptimized={true} 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
