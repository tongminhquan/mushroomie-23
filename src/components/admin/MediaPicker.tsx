'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Upload, Search, Check, ImageIcon } from 'lucide-react'
import ImageEditorModal from './ImageEditorModal'

interface MediaItem {
  id: number
  url: string
  filename: string
  alt_text?: string
  caption?: string
  description?: string
  size?: number
  width?: number
  height?: number
  created_at?: string
}

interface SelectedImageMeta {
  url: string
  alt_text: string
  caption: string
  description: string
  seo_title: string
}

interface MediaPickerProps {
  value: string
  onChange: (url: string, meta?: Partial<SelectedImageMeta>) => void
  onClose: () => void
  title?: string
  submitText?: string
}

// Simulated media library from picsum
const DEMO_IMAGES: MediaItem[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  url: `https://picsum.photos/seed/${i + 10}/400/300`,
  filename: `image-${i + 1}.jpg`,
  alt_text: '',
  caption: '',
  description: '',
  width: 400,
  height: 300,
  size: 120000 + i * 5000,
}))

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function MediaPicker({ value, onChange, onClose, title, submitText }: MediaPickerProps) {
  const [tab, setTab] = useState<'upload' | 'library'>('library')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState<SelectedImageMeta>({
    url: '',
    alt_text: '',
    caption: '',
    description: '',
    seo_title: '',
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [fileToEdit, setFileToEdit] = useState<string | null>(null)

  const [customImages, setCustomImages] = useState<MediaItem[]>([])

  useEffect(() => {
    fetch('/api/upload')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomImages(data)
        }
      })
      .catch(console.error)
  }, [])

  const allImages = [...customImages, ...DEMO_IMAGES]
  const filtered = allImages.filter(img =>
    img.filename.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (img: MediaItem) => {
    setSelected(img)
    setMeta(prev => ({ ...prev, url: img.url, alt_text: img.alt_text || '', caption: img.caption || '', description: img.description || '', seo_title: img.filename.replace(/\.\w+$/, '') }))
  }

  const handleConfirm = () => {
    if (!selected) return
    onChange(selected.url, meta)
    onClose()
  }

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setMeta(prev => ({ ...prev, url }))
    if (!selected) setSelected({ id: 0, url, filename: 'custom' })
    else setSelected(prev => prev ? { ...prev, url } : null)
  }

  const uploadFile = async (file: File) => {
    // Thay vì tải lên ngay, tạo ObjectURL và mở modal cắt ảnh
    const url = URL.createObjectURL(file)
    setFileToEdit(url)
    if (fileRef.current) fileRef.current.value = '' // Reset input
  }

  const handleCroppedSave = (url: string, itemData?: any) => {
    if (itemData) {
      setCustomImages(prev => [itemData, ...prev])
      setSelected(itemData)
      setMeta(prev => ({ ...prev, url: itemData.url, seo_title: itemData.filename.replace(/\.\w+$/, '') }))
    }
    setFileToEdit(null)
    setTab('library')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    } else if (file) {
      alert('Vui lòng chọn tệp hình ảnh!')
    }
  }

  return (
    <>
      {fileToEdit && (
        <ImageEditorModal
          src={fileToEdit}
          onSave={handleCroppedSave}
          onCancel={() => setFileToEdit(null)}
        />
      )}
      <div className="media-picker-modal fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-bold text-lg text-neutral-800">{title || 'Ảnh đại diện'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-6">
          <button type="button"
            onClick={() => setTab('upload')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Tải lên tệp mới
          </button>
          <button type="button"
            onClick={() => setTab('library')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'library' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Chọn từ thư viện Media
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab === 'upload' ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all w-full max-w-md ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-neutral-300 hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload size={40} className={`mx-auto mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-neutral-400'}`} />
                  <p className="font-semibold text-neutral-700 mb-1">{isDragging ? 'Thả tệp vào đây...' : 'Kéo thả tệp vào đây'}</p>
                  <p className="text-sm text-neutral-500 mb-4">hoặc nhấn để chọn tệp từ máy tính</p>
                  <button type="button" 
                    disabled={isUploading}
                    className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none"
                  >
                    {isUploading ? 'Đang tải lên...' : 'Chọn tệp'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadFile(file)
                  }} />
                </div>
              </div>
            ) : (
              <>
                {/* Search & filters */}
                <div className="p-4 border-b border-neutral-100 flex gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Tìm tệp media..."
                      className="w-full pl-8 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none bg-white">
                    <option>Hình ảnh</option>
                    <option>Video</option>
                    <option>Tất cả</option>
                  </select>
                </div>

                {/* Image grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {filtered.map(img => (
                      <button type="button"
                        key={img.id}
                        onClick={() => handleSelect(img)}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${selected?.id === img.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-neutral-300'}`}
                      >
                        <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                        {selected?.id === img.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Meta panel */}
          <div className="w-72 border-l border-neutral-200 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Chi tiết tệp đính kèm</p>
            </div>

            {selected ? (
              <div className="p-4 space-y-4 flex-1">
                {/* Preview */}
                <div className="aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img src={selected.url} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="text-xs text-neutral-500 space-y-1">
                  <p className="font-semibold text-neutral-700 truncate">{selected.filename}</p>
                  {selected.size && <p>{formatBytes(selected.size)}</p>}
                  {selected.width && <p>{selected.width} × {selected.height} pixel</p>}
                </div>

                <hr className="border-neutral-200" />

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Văn bản thay thế (Alt text)</label>
                    <textarea
                      value={meta.alt_text}
                      onChange={e => setMeta(p => ({ ...p, alt_text: e.target.value }))}
                      rows={2}
                      placeholder="Mô tả nội dung ảnh..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none resize-none"
                    />
                    <p className="text-xs text-neutral-400 mt-1">Để trống nếu ảnh chỉ dùng làm hiệu ứng trình bày.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Tiêu đề SEO (SEO Title)</label>
                    <input
                      value={meta.seo_title}
                      onChange={e => setMeta(p => ({ ...p, seo_title: e.target.value }))}
                      placeholder="Tiêu đề tối ưu SEO cho ảnh"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Chú thích (Caption)</label>
                    <textarea
                      value={meta.caption}
                      onChange={e => setMeta(p => ({ ...p, caption: e.target.value }))}
                      rows={2}
                      placeholder="Chú thích hiển thị dưới ảnh..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Mô tả (Description)</label>
                    <textarea
                      value={meta.description}
                      onChange={e => setMeta(p => ({ ...p, description: e.target.value }))}
                      rows={2}
                      placeholder="Mô tả chi tiết về ảnh..."
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">URL ảnh</label>
                    <input
                      value={meta.url || selected.url}
                      onChange={handleUrlInput}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                <ImageIcon size={40} className="mb-3 opacity-40" />
                <p className="text-sm">Chọn một ảnh để xem chi tiết và chỉnh sửa thông tin SEO</p>
              </div>
            )}

            {/* Confirm button */}
            {selected && (
              <div className="p-4 border-t border-neutral-200">
                <button type="button"
                  onClick={handleConfirm}
                  className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  {submitText || 'Đặt ảnh đại diện'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
  )
}
