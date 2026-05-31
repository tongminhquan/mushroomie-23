'use client'
import { useState } from 'react'
import { Plus, X, Star } from 'lucide-react'
import MediaPicker from './MediaPicker'
import Image from 'next/image'

interface MultiImageUploaderProps {
  featuredImage: string | null
  images: string[]
  onChange: (featured: string | null, images: string[]) => void
}

export default function MultiImageUploader({ featuredImage, images, onChange }: MultiImageUploaderProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleAddImage = (url: string) => {
    // If image already exists, don't add
    if (images.includes(url) || featuredImage === url) return

    let newFeatured = featuredImage
    let newImages = [...images]

    if (!newFeatured) {
      newFeatured = url
    } else {
      newImages.push(url)
    }

    onChange(newFeatured, newImages)
  }

  const handleRemoveImage = (url: string) => {
    let newFeatured = featuredImage
    let newImages = images.filter(img => img !== url)

    if (newFeatured === url) {
      if (newImages.length > 0) {
        newFeatured = newImages[0]
        newImages = newImages.slice(1)
      } else {
        newFeatured = null
      }
    }

    onChange(newFeatured, newImages)
  }

  const handleSetFeatured = (url: string) => {
    if (featuredImage === url) return

    let newImages = images.filter(img => img !== url)
    if (featuredImage) {
      newImages.push(featuredImage)
    }
    
    onChange(url, newImages)
  }

  // All combined images for display
  const allImages = []
  if (featuredImage) allImages.push({ url: featuredImage, isFeatured: true })
  images.forEach(img => {
    if (img !== featuredImage) {
      allImages.push({ url: img, isFeatured: false })
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allImages.map((img, index) => (
          <div key={`${img.url}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm">
            <Image
              src={img.url}
              alt="Product image"
              fill
              className="object-cover"
              unoptimized={true}
            />
            
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              {!img.isFeatured && (
                <button
                  type="button"
                  onClick={() => handleSetFeatured(img.url)}
                  className="bg-white/90 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white"
                >
                  Đặt làm ảnh chính
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(img.url)}
                className="bg-red-500/90 text-white p-2 rounded-full shadow-sm hover:bg-red-500"
                title="Xóa ảnh"
              >
                <X size={16} />
              </button>
            </div>

            {/* Badges */}
            {img.isFeatured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                <Star size={10} className="fill-yellow-900" />
                Ảnh chính
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Plus size={24} />
          <span className="text-sm font-semibold">Thêm ảnh</span>
        </button>
      </div>

      {showPicker && (
        <MediaPicker
          value=""
          onChange={(url) => handleAddImage(url)}
          onClose={() => setShowPicker(false)}
          title="Chọn ảnh sản phẩm"
          submitText="Thêm ảnh này"
        />
      )}
    </div>
  )
}
