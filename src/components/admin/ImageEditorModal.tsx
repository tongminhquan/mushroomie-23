'use client'
import React, { useRef, useState } from 'react'
import Cropper, { ReactCropperElement } from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import { Crop, ZoomIn, ZoomOut, RotateCcw, RotateCw, Undo, Redo, X, Check } from 'lucide-react'

interface ImageEditorModalProps {
  src: string
  onSave: (newUrl: string) => void
  onCancel: () => void
}

export default function ImageEditorModal({ src, onSave, onCancel }: ImageEditorModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleZoomIn = () => cropperRef.current?.cropper.zoom(0.1)
  const handleZoomOut = () => cropperRef.current?.cropper.zoom(-0.1)
  const handleRotateLeft = () => cropperRef.current?.cropper.rotate(-90)
  const handleRotateRight = () => cropperRef.current?.cropper.rotate(90)
  const handleReset = () => cropperRef.current?.cropper.reset()
  const handleSetDragModeCrop = () => cropperRef.current?.cropper.setDragMode('crop')

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) return

    setIsSaving(true)
    cropper.getCroppedCanvas().toBlob(async (blob) => {
      if (!blob) {
        setIsSaving(false)
        return
      }

      const formData = new FormData()
      formData.append('file', blob, `edited-${Date.now()}.png`)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          onSave(data.url)
        } else {
          alert('Lỗi khi lưu ảnh đã chỉnh sửa!')
        }
      } catch (err) {
        console.error(err)
        alert('Lỗi kết nối khi lưu ảnh!')
      } finally {
        setIsSaving(false)
      }
    }, 'image/png')
  }

  return (
    <div className="image-editor-modal fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-3 border-b border-neutral-200 flex flex-wrap gap-2 items-center justify-between bg-neutral-50">
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleSetDragModeCrop} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <Crop size={16} className="text-primary" /> Cắt ảnh
            </button>
            <button onClick={handleZoomIn} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <ZoomIn size={16} className="text-primary" /> Phóng to
            </button>
            <button onClick={handleZoomOut} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <ZoomOut size={16} className="text-primary" /> Thu nhỏ
            </button>
            <button onClick={handleRotateLeft} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <RotateCcw size={16} className="text-primary" /> Xoay trái
            </button>
            <button onClick={handleRotateRight} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <RotateCw size={16} className="text-primary" /> Xoay phải
            </button>
            <div className="w-px h-6 bg-neutral-300 mx-1" />
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-100 text-sm font-medium text-neutral-700 bg-white">
              <Undo size={16} className="text-neutral-500" /> Đặt lại
            </button>
          </div>
          
          <div className="flex gap-2 items-center mt-2 sm:mt-0">
            <button onClick={onCancel} className="px-4 py-1.5 border border-neutral-300 rounded bg-white hover:bg-neutral-100 text-sm font-semibold text-neutral-600">
              Hủy chỉnh sửa
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 rounded bg-primary hover:bg-primary-dark text-white text-sm font-semibold disabled:opacity-50">
              {isSaving ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
            </button>
          </div>
        </div>

        {/* Cropper Container */}
        <div className="flex-1 bg-neutral-900 relative">
          <Cropper
            ref={cropperRef}
            src={src}
            style={{ height: '100%', width: '100%' }}
            viewMode={1}
            guides={true}
            minCropBoxHeight={10}
            minCropBoxWidth={10}
            background={true}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
          />
        </div>
      </div>
    </div>
  )
}
