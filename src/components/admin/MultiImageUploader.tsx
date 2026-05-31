'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import MediaPicker from './MediaPicker'
import Image from 'next/image'

interface MultiImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
}

export default function MultiImageUploader({ images, onChange }: MultiImageUploaderProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleAddImage = (url: string) => {
    // If image already exists, don't add
    if (images.includes(url)) return
    onChange([...images, url])
  }

  const handleRemoveImage = (url: string) => {
    onChange(images.filter(img => img !== url))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img, index) => (
          <div key={`${img}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm">
            <Image
              src={img}
              alt="Sub product image"
              fill
              className="object-cover"
              unoptimized={true}
            />
            
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleRemoveImage(img)}
                className="bg-red-500/90 text-white p-2 rounded-full shadow-sm hover:bg-red-500"
                title="Xóa ảnh"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Plus size={24} />
          <span className="text-sm font-semibold">Thêm ảnh phụ</span>
        </button>
      </div>

      {showPicker && (
        <MediaPicker
          value=""
          onChange={(url) => handleAddImage(url)}
          onClose={() => setShowPicker(false)}
          title="Chọn ảnh phụ sản phẩm"
          submitText="Thêm ảnh này"
        />
      )}
    </div>
  )
}
