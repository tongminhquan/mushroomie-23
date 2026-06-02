'use client'
import { useState, useEffect } from 'react'
import { Trash2, Copy, Check, Upload, RefreshCw, FolderOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function MediaLibrary() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchImages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/upload')
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleDelete = async (filename: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) return
    
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setImages(images.filter(img => img.filename !== filename))
      } else {
        alert('Có lỗi xảy ra khi xóa ảnh')
      }
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra khi xóa ảnh')
    }
  }

  const handleCopy = (url: string, id: string) => {
    // try to make absolute URL if needed, but relative works well for internal usage
    // navigator.clipboard.writeText(window.location.origin + url)
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        await fetchImages()
      } else {
        alert('Upload thất bại')
      }
    } catch (err) {
      console.error(err)
      alert('Upload thất bại')
    } finally {
      setUploading(false)
      // reset input
      e.target.value = ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Thư viện hình ảnh</h1>
          <p className="text-neutral-500 text-sm">Quản lý tất cả hình ảnh trên website</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchImages}
            disabled={loading}
            className="p-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50"
            title="Làm mới"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <label className="bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm cursor-pointer flex items-center gap-2">
            <Upload size={18} />
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-card border border-neutral-100">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="text-neutral-400" size={24} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Thư viện trống</h3>
          <p className="text-neutral-500 text-sm mb-6">Chưa có hình ảnh nào được tải lên.</p>
          <label className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark cursor-pointer inline-flex items-center gap-2">
            <Upload size={18} />
            Tải ảnh lên ngay
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.id} className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden group flex flex-col">
              <div className="aspect-square relative bg-neutral-100 flex items-center justify-center p-2">
                <img 
                  src={image.url} 
                  alt={image.filename}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleCopy(window.location.origin + image.url, image.id.toString())}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="Sao chép đường dẫn tuyệt đối"
                  >
                    {copiedId === image.id.toString() ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(image.filename)}
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold truncate mb-2" title={image.filename}>{image.filename}</p>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>{formatBytes(image.size)}</span>
                  <span>{formatDate(image.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
