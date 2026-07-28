'use client'
import { useState, useEffect, useRef } from 'react'
import { Trash2, Copy, Check, Upload, RefreshCw, FolderOpen, Edit3, X, Save, Sliders, FileType } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

export default function MediaLibrary() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Editor states
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormat, setEditFormat] = useState('webp')
  const [editQuality, setEditQuality] = useState(80)
  const [isProcessing, setIsProcessing] = useState(false)
  const cropperRef = useRef<HTMLImageElement>(null)

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

  const handleDelete = async (filename: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Bạn có chắc chắn muốn xóa ảnh này không?')) return
    
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setImages((prev) => prev.filter(img => img.filename !== filename))
        if (selectedImage?.filename === filename) {
          setSelectedImage(null)
          setIsEditing(false)
        }
      } else {
        alert('Có lỗi xảy ra khi xóa ảnh')
      }
    } catch (err) {
      console.error(err)
      alert('Có lỗi xảy ra khi xóa ảnh')
    }
  }

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('purpose', 'media')
    
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

  const handleProcessImage = async (overwrite: boolean) => {
    if (!selectedImage) return;
    setIsProcessing(true);
    let cropData = null;
    const cropper = (cropperRef.current as any)?.cropper;
    if (cropper && isEditing) {
      cropData = cropper.getData();
    }
    
    try {
      const res = await fetch('/api/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedImage.filename,
          format: editFormat,
          quality: editQuality,
          cropData: cropData,
          overwrite: overwrite,
          purpose: 'media'
        })
      });
      if (res.ok) {
        await fetchImages();
        setIsEditing(false);
        setSelectedImage(null);
      } else {
        alert('Xử lý ảnh thất bại');
      }
    } catch(e) {
      console.error(e);
      alert('Lỗi khi xử lý ảnh');
    } finally {
      setIsProcessing(false);
    }
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
            className="p-2 border border-[#f0e0d6] rounded-xl text-neutral-600 hover:bg-[#fdfaf7]"
            title="Làm mới"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <label className="bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm cursor-pointer flex items-center gap-2">
            <Upload size={18} />
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-card border border-neutral-100">
          <div className="w-16 h-16 bg-[#fdfaf7] rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="text-neutral-400" size={24} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Thư viện trống</h3>
          <p className="text-neutral-500 text-sm mb-6">Chưa có hình ảnh nào được tải lên.</p>
          <label className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark cursor-pointer inline-flex items-center gap-2">
            <Upload size={18} />
            Tải ảnh lên ngay
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      ) : (
        <div data-batch-reveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden group flex flex-col cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedImage(image);
                setIsEditing(false);
                // Extract format from filename
                const ext = image.filename.split('.').pop()?.toLowerCase();
                if (ext === 'jpg') setEditFormat('jpeg');
                else if (['jpeg', 'png', 'webp'].includes(ext)) setEditFormat(ext);
                else setEditFormat('webp');
                setEditQuality(80);
              }}
            >
              <div className="aspect-square relative bg-neutral-100 flex items-center justify-center p-2">
                <img 
                  src={`${image.url}?v=${image.id}`} 
                  alt={`Ảnh trong thư viện: ${image.filename}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopy(window.location.origin + image.url, image.id.toString()) }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="Sao chép đường dẫn tuyệt đối"
                  >
                    {copiedId === image.id.toString() ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(image.filename) }}
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

      {/* Editor Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="m-pop-in bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Left side: Image / Cropper */}
            <div className="flex-1 bg-neutral-100 p-4 flex items-center justify-center min-h-[300px] overflow-hidden relative">
              {isEditing ? (
                <Cropper
                  src={`${selectedImage.url}?v=${selectedImage.id}`}
                  style={{ height: '100%', width: '100%' }}
                  initialAspectRatio={NaN}
                  guides={true}
                  ref={cropperRef}
                  viewMode={1}
                  background={false}
                  responsive={true}
                  checkOrientation={false}
                />
              ) : (
                <img 
                  src={`${selectedImage.url}?v=${selectedImage.id}`} 
                  alt={`Xem trước ảnh: ${selectedImage.filename}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            
            {/* Right side: Tools */}
            <div className="w-full md:w-80 bg-white p-6 border-l border-neutral-100 flex flex-col gap-6 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">Chi tiết hình ảnh</h2>
                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-[#fdf6f2] rounded-full text-neutral-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#fdfaf7] p-3 rounded-xl text-sm break-all text-neutral-600">
                  <p className="font-medium text-neutral-800 mb-1 break-words">{selectedImage.filename}</p>
                  <p>Dung lượng: <span className="font-semibold">{formatBytes(selectedImage.size)}</span></p>
                  <p>Ngày tải lên: {formatDate(selectedImage.created_at)}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(window.location.origin + selectedImage.url, 'modal')}
                    className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedId === 'modal' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    Sao chép Link
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedImage.filename)}
                    className="flex-1 py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    Xóa ảnh
                  </button>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2 text-neutral-800">
                    <Edit3 size={18} /> Chỉnh sửa
                  </h3>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${isEditing ? 'bg-primary/10 text-primary' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}
                  >
                    {isEditing ? 'Tắt Cắt ảnh' : 'Cắt ảnh'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-neutral-700">
                      <FileType size={16} /> Định dạng xuất
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['webp', 'jpeg', 'png'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setEditFormat(fmt)}
                          className={`py-2 text-sm font-medium rounded-lg uppercase border transition-colors ${editFormat === fmt ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-[#f0e0d6] text-neutral-600 hover:bg-[#fdfaf7]'}`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium flex items-center gap-2 text-neutral-700">
                        <Sliders size={16} /> Chất lượng nén
                      </label>
                      <span className="text-sm font-semibold text-primary">{editQuality}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={editQuality} 
                      onChange={(e) => setEditQuality(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Nhẹ nhất (Chất lượng thấp)</span>
                      <span>Rõ nhất (Nặng)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => handleProcessImage(true)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    Lưu đè ảnh cũ
                  </button>
                  <button 
                    onClick={() => handleProcessImage(false)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-white border border-[#f0e0d6] hover:bg-[#fdfaf7] text-neutral-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Tạo bản sao mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
