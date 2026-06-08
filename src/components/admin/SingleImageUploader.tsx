'use client'
import { useState } from 'react'
import { Plus, X, ImageIcon } from 'lucide-react'
import MediaPicker from './MediaPicker'
import Image from 'next/image'

interface SingleImageUploaderProps {
  value: string
  onChange: (url: string) => void
}

export default function SingleImageUploader({ value, onChange }: SingleImageUploaderProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative group w-32 h-32 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm">
          <Image
            src={value}
            alt="Main product image"
            fill
            className="object-cover"
            unoptimized={true}
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500/90 text-white p-2 rounded-full shadow-sm hover:bg-red-500"
              title="Xóa ảnh"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-32 h-32 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
        >
          <ImageIcon size={24} />
          <span className="text-sm font-semibold">Chọn ảnh</span>
        </button>
      )}

      {showPicker && (
        <MediaPicker
          value={value}
          onChange={(url) => onChange(url)}
          onClose={() => setShowPicker(false)}
          title="Chọn ảnh chính"
          submitText="Chọn ảnh này"
          purpose="product"
        />
      )}
    </div>
  )
}
