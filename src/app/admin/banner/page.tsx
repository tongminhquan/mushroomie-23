'use client'
import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Edit, ArrowUp, ArrowDown, Eye, EyeOff,
  ImageIcon, Save, X, ExternalLink, HelpCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import MediaPicker from '@/components/admin/MediaPicker'

interface Banner {
  id: number
  image_url: string
  title: string | null
  subtitle: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  secondary_button_text: string | null
  secondary_button_link: string | null
  link: string | null
  text_position: string
  text_size: string
  brightness: number
  sort_order: number
  status: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  // Media Picker State
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  // Form State
  const [form, setForm] = useState({
    image_url: '',
    title: '',
    subtitle: '',
    description: '',
    button_text: '',
    button_link: '',
    secondary_button_text: '',
    secondary_button_link: '',
    link: '',
    text_position: 'bottom-left',
    text_size: 'medium',
    brightness: 100,
    sort_order: 0,
    status: 'active'
  })

  // Fetch Banners
  const fetchBanners = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data)
      } else {
        setError('Không thể tải danh sách banner')
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Quản lý Banner | Admin Mushroomie'
    fetchBanners()
  }, [])

  // Open Modal to Add
  const handleOpenAdd = () => {
    setEditingBanner(null)
    setForm({
      image_url: '',
      title: '',
      subtitle: '',
      description: '',
      button_text: '',
      button_link: '',
      secondary_button_text: '',
      secondary_button_link: '',
      link: '',
      text_position: 'bottom-left',
      text_size: 'medium',
      brightness: 100,
      sort_order: banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 10 : 10,
      status: 'active'
    })
    setIsModalOpen(true)
    setError('')
  }

  // Open Modal to Edit
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setForm({
      image_url: banner.image_url || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      secondary_button_text: banner.secondary_button_text || '',
      secondary_button_link: banner.secondary_button_link || '',
      link: banner.link || '',
      text_position: banner.text_position || 'bottom-left',
      text_size: banner.text_size || 'medium',
      brightness: banner.brightness ?? 100,
      sort_order: banner.sort_order,
      status: banner.status
    })
    setIsModalOpen(true)
    setError('')
  }

  // Handle Form Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle Submit (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image_url) {
      setError('Vui lòng chọn hình ảnh cho banner')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMsg('')

    try {
      const payload = {
        ...form,
        sort_order: Number(form.sort_order),
        title: form.title || null,
        subtitle: form.subtitle || null,
        description: form.description || null,
        button_text: form.button_text || null,
        button_link: form.button_link || null,
        secondary_button_text: form.secondary_button_text || null,
        secondary_button_link: form.secondary_button_link || null,
        link: form.link || null,
        text_position: form.text_position,
        text_size: form.text_size,
        brightness: Number(form.brightness),
      }

      let res
      if (editingBanner) {
        res = await fetch(`/api/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        setSuccessMsg(editingBanner ? 'Cập nhật banner thành công!' : 'Tạo banner mới thành công!')
        setIsModalOpen(false)
        fetchBanners()
        // Auto clear success message
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        const errData = await res.json()
        setError(errData.error || 'Có lỗi xảy ra khi lưu banner')
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ')
    } finally {
      setIsSaving(false)
    }
  }

  // Quick Toggle Status
  const handleToggleStatus = async (banner: Banner) => {
    try {
      const newStatus = banner.status === 'active' ? 'hidden' : 'active'
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: banner.image_url,
          title: banner.title,
          subtitle: banner.subtitle,
          description: banner.description,
          button_text: banner.button_text,
          button_link: banner.button_link,
          secondary_button_text: banner.secondary_button_text,
          secondary_button_link: banner.secondary_button_link,
          link: banner.link,
          text_position: banner.text_position,
          text_size: banner.text_size,
          brightness: banner.brightness,
          sort_order: banner.sort_order,
          status: newStatus
        })
      })
      if (res.ok) {
        fetchBanners()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Move Up / Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === banners.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const currentBanner = banners[index]
    const targetBanner = banners[targetIndex]

    // Swap sort orders
    const tempOrder = currentBanner.sort_order
    currentBanner.sort_order = targetBanner.sort_order
    targetBanner.sort_order = tempOrder

    try {
      await Promise.all([
        fetch(`/api/banners/${currentBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentBanner)
        }),
        fetch(`/api/banners/${targetBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetBanner)
        })
      ])
      fetchBanners()
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Banner
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này không?')) return

    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setSuccessMsg('Xóa banner thành công!')
        fetchBanners()
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setError('Không thể xóa banner này')
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[18px] border-[1.5px] border-[#f0e0d6] shadow-card">
        <div>
          <div className="text-xs font-semibold text-neutral-500 mb-1">Nội dung / Banner</div>
          <h1 className="font-heading text-2xl font-bold text-neutral-800">Quản lý Banner Trang chủ</h1>
          <p className="text-neutral-500 text-sm mt-1">Thêm, sửa, sắp xếp các banner trượt trên màn hình chính của trang chủ.</p>
        </div>
        <Button onClick={handleOpenAdd} className="flex items-center gap-2">
          <Plus size={18} />
          <span>Thêm Banner mới</span>
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-[1.5px] border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold transition-all">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-[1.5px] border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold transition-all">
          {error}
        </div>
      )}

      {/* Banner List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-[18px] border-[1.5px] border-[#f0e0d6] shadow-card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-sm text-neutral-500 font-medium">Đang tải dữ liệu banner...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[18px] border-[1.5px] border-[#f0e0d6] shadow-card space-y-4">
          <div className="bg-primary-light p-4 rounded-full inline-block text-primary">
            <ImageIcon size={36} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-neutral-800 text-lg">Chưa có banner nào</h3>
            <p className="text-neutral-500 text-sm max-w-md mx-auto mt-1">
              Hiện tại trang chủ đang hiển thị banner tĩnh mặc định. Hãy thêm banner mới để tạo hiệu ứng carousel tự động lướt tuyệt đẹp!
            </p>
          </div>
          <Button onClick={handleOpenAdd} variant="outline" size="sm">
            Tạo Banner đầu tiên
          </Button>
        </div>
      ) : (
        <div data-batch-reveal className="grid grid-cols-1 gap-6">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white border-[1.5px] rounded-[18px] overflow-hidden shadow-card hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row ${
                banner.status === 'hidden' ? 'border-[#f0e0d6] opacity-75' : 'border-[#f0e0d6]'
              }`}
            >
              {/* Image Preview */}
              <div className="w-full lg:w-96 h-48 lg:h-auto min-h-[192px] relative bg-neutral-100 flex-shrink-0 group overflow-hidden">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  style={{ filter: `brightness(${banner.brightness ?? 100}%)` }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  Thứ tự: {banner.sort_order}
                </div>
                {banner.status === 'hidden' && (
                  <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-[2px] flex items-center justify-center text-white font-semibold gap-1.5">
                    <EyeOff size={18} />
                    <span>Đang ẩn</span>
                  </div>
                )}
              </div>

              {/* Banner Details */}
              <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        banner.status === 'active'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-neutral-100 text-neutral-600 border border-[#f0e0d6]'
                      }`}>
                        {banner.status === 'active' ? 'Đang hoạt động' : 'Đang ẩn'}
                      </span>
                    </div>
                    {/* Move Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border-[1.5px] border-[#e2d3c8] hover:bg-primary-light hover:border-primary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-1.5 rounded-lg border-[1.5px] border-[#e2d3c8] hover:bg-primary-light hover:border-primary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-all"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-neutral-800 font-heading">
                    {banner.title ? (
                      <>
                        <span>{banner.title}</span>
                        {banner.subtitle && <span className="text-primary ml-1.5 font-extrabold">{banner.subtitle}</span>}
                      </>
                    ) : (
                      <span className="italic text-neutral-400 font-normal text-sm">Không có tiêu đề (Chỉ hiện hình ảnh nền)</span>
                    )}
                  </h3>

                  {banner.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2 max-w-2xl">{banner.description}</p>
                  )}

                  {/* Buttons Info */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    {banner.button_text && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-[#fdfaf7] border-[1.5px] border-[#f0e0d6] px-3 py-1.5 rounded-full">
                        <span className="font-semibold text-neutral-700">Nút chính:</span>
                        <span>&quot;{banner.button_text}&quot;</span>
                        <span className="text-neutral-300">|</span>
                        <span className="font-mono text-neutral-400">{banner.button_link}</span>
                      </div>
                    )}
                    {banner.secondary_button_text && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-[#fdfaf7] border-[1.5px] border-[#f0e0d6] px-3 py-1.5 rounded-full">
                        <span className="font-semibold text-neutral-700">Nút phụ:</span>
                        <span>&quot;{banner.secondary_button_text}&quot;</span>
                        <span className="text-neutral-300">|</span>
                        <span className="font-mono text-neutral-400">{banner.secondary_button_link}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0e0d6]">
                  <button
                    onClick={() => handleToggleStatus(banner)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border-[1.5px] transition-all ${
                      banner.status === 'active'
                        ? 'border-[#e2d3c8] text-neutral-700 hover:bg-[#fdfaf7]'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {banner.status === 'active' ? (
                      <>
                        <EyeOff size={14} />
                        <span>Ẩn khỏi Home</span>
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        <span>Hiển thị lại</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="px-3 py-2 border-[1.5px] border-primary text-primary hover:bg-primary-light rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Edit size={14} />
                    <span>Chỉnh sửa</span>
                  </button>

                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="px-3 py-2 border-[1.5px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over / Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#f0e0d6] flex items-center justify-between bg-[#fafafa]">
              <div>
                <h2 className="font-heading font-bold text-xl text-neutral-800">
                  {editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
                </h2>
                <p className="text-xs text-neutral-500">Cấu hình hiển thị và nội dung tương tác cho Banner.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">

              {/* Left Form (Inputs) */}
              <form onSubmit={handleSubmit} id="banner-form" className="flex-1 space-y-5">
                {/* Image Picker */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Hình ảnh banner *</label>
                  {form.image_url ? (
                    <div className="relative rounded-[14px] overflow-hidden border-[1.5px] border-[#f0e0d6] group aspect-video bg-neutral-100">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMediaPicker(true)}
                          className="bg-white text-neutral-800 px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform"
                        >
                          Thay ảnh khác
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="w-full aspect-video border-2 border-dashed border-[#e2d3c8] rounded-[14px] flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <ImageIcon size={32} />
                      <span className="text-sm font-semibold">Chọn hình ảnh từ thư viện</span>
                      <span className="text-xs text-neutral-400">Khuyên dùng: Tỷ lệ 16:9 hoặc rộng hơn</span>
                    </button>
                  )}
                </div>

                {/* Text Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Tiêu đề (Title)</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Ví dụ: Phụ kiện nhỏ,"
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Tiêu đề nổi bật (Subtitle)</label>
                    <input
                      name="subtitle"
                      value={form.subtitle}
                      onChange={handleChange}
                      placeholder="Ví dụ: cảm xúc lớn"
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Liên kết toàn Banner (Tuỳ chọn)</label>
                  <input
                    name="link"
                    value={form.link}
                    onChange={handleChange}
                    placeholder="Ví dụ: /san-pham/bo-suu-tap-moi"
                    className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm transition-all font-mono"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Khi khách hàng click vào bất kỳ đâu trên banner, sẽ chuyển hướng đến link này.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Mô tả ngắn</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Mô tả ngắn hiển thị bên dưới tiêu đề..."
                    className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm resize-none transition-all"
                  />
                </div>

                {/* Interactive buttons */}
                <div className="border-t border-[#f0e0d6] pt-4 space-y-4">
                  <h4 className="font-heading font-bold text-sm text-neutral-800 flex items-center gap-1">
                    <span>Nút tương tác (Không bắt buộc)</span>
                    <span className="text-neutral-400" title="Nếu không điền text, nút sẽ không hiển thị trên banner.">
                      <HelpCircle size={14} />
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#fafafa] p-4 rounded-[14px] border-[1.5px] border-[#f0e0d6]">
                    {/* Primary Button */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-primary">Nút hành động chính</h5>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Tên nút</label>
                        <input
                          name="button_text"
                          value={form.button_text}
                          onChange={handleChange}
                          placeholder="Ví dụ: Khám phá ngay"
                          className="w-full px-3 py-1.5 border-[1.5px] border-[#e2d3c8] bg-white rounded-lg focus:border-primary outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Đường dẫn (Link)</label>
                        <input
                          name="button_link"
                          value={form.button_link}
                          onChange={handleChange}
                          placeholder="Ví dụ: /san-pham"
                          className="w-full px-3 py-1.5 border-[1.5px] border-[#e2d3c8] bg-white rounded-lg focus:border-primary outline-none text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Secondary Button */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l md:pl-4 border-[#f0e0d6]">
                      <h5 className="text-xs font-bold text-neutral-700">Nút hành động phụ</h5>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Tên nút</label>
                        <input
                          name="secondary_button_text"
                          value={form.secondary_button_text}
                          onChange={handleChange}
                          placeholder="Ví dụ: Tự thiết kế"
                          className="w-full px-3 py-1.5 border-[1.5px] border-[#e2d3c8] bg-white rounded-lg focus:border-primary outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Đường dẫn (Link)</label>
                        <input
                          name="secondary_button_link"
                          value={form.secondary_button_link}
                          onChange={handleChange}
                          placeholder="Ví dụ: /lien-he"
                          className="w-full px-3 py-1.5 border-[1.5px] border-[#e2d3c8] bg-white rounded-lg focus:border-primary outline-none text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#f0e0d6] pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Vị trí chữ</label>
                    <select
                      name="text_position"
                      value={form.text_position}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm bg-white transition-all"
                    >
                      <option value="top-left">Góc trên trái</option>
                      <option value="top-right">Góc trên phải</option>
                      <option value="center">Ở giữa trung tâm</option>
                      <option value="bottom-left">Góc dưới trái</option>
                      <option value="bottom-right">Góc dưới phải</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Kích thước chữ</label>
                    <select
                      name="text_size"
                      value={form.text_size}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm bg-white transition-all"
                    >
                      <option value="small">Nhỏ</option>
                      <option value="medium">Vừa (Mặc định)</option>
                      <option value="large">Lớn</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#f0e0d6] pt-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">
                      Độ sáng ảnh nền (Brightness): {form.brightness}%
                    </label>
                    <input
                      name="brightness"
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={form.brightness}
                      onChange={handleChange}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                      <span>Tối (10%)</span>
                      <span>Bình thường (100%)</span>
                      <span>Sáng (200%)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#f0e0d6] pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Thứ tự hiển thị</label>
                    <input
                      name="sort_order"
                      type="number"
                      value={form.sort_order}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Trạng thái</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none text-sm bg-white transition-all"
                    >
                      <option value="active">Hiển thị (Active)</option>
                      <option value="hidden">Ẩn (Hidden)</option>
                    </select>
                  </div>
                </div>
              </form>

              {/* Right Side: Real-time Live Preview */}
              <div className="w-full lg:w-96 flex flex-col space-y-4 flex-shrink-0">
                <div className="sticky top-0 space-y-3">
                  <h4 className="font-heading font-bold text-sm text-neutral-800">Xem trước thời gian thực (Preview)</h4>

                  {/* Banner Preview Card */}
                  <div className="relative w-full aspect-video rounded-[14px] overflow-hidden shadow-card border-[1.5px] border-[#f0e0d6] bg-neutral-900 group">
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt="Preview Background"
                        style={{ filter: `brightness(${form.brightness}%)` }}
                        className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-neutral-850 to-neutral-800 flex items-center justify-center text-neutral-600">
                        <div className="text-center p-4">
                          <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-semibold">Chưa có ảnh nền</p>
                        </div>
                      </div>
                    )}

                    {/* Gradient Overlay for Text Visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Content overlay */}
                    <div className={`absolute inset-0 p-6 flex flex-col text-white ${
                      form.text_position === 'top-left' ? 'justify-start items-start text-left' :
                      form.text_position === 'top-right' ? 'justify-start items-end text-right' :
                      form.text_position === 'center' ? 'justify-center items-center text-center' :
                      form.text_position === 'bottom-right' ? 'justify-end items-end text-right' :
                      'justify-end items-start text-left'
                    }`}>
                      <div className={`space-y-2 max-w-[80%] ${
                        form.text_position === 'center' ? 'flex flex-col items-center' :
                        form.text_position?.includes('right') ? 'flex flex-col items-end' : ''
                      }`}>
                        {/* Subtitle / Title */}
                        {(form.title || form.subtitle) ? (
                          <h2 className={`font-heading font-bold leading-tight ${
                            form.text_size === 'small' ? 'text-base md:text-lg' :
                            form.text_size === 'large' ? 'text-xl md:text-2xl' :
                            'text-lg md:text-xl'
                          }`}>
                            {form.title} <span className="text-primary font-extrabold">{form.subtitle}</span>
                          </h2>
                        ) : (
                          <div className="h-4 w-3/4 bg-white/20 rounded animate-pulse" />
                        )}

                        {/* Description */}
                        {form.description ? (
                          <p className={`text-white/80 line-clamp-2 leading-relaxed ${
                            form.text_size === 'small' ? 'text-[10px]' :
                            form.text_size === 'large' ? 'text-xs md:text-sm' :
                            'text-[11px]'
                          }`}>{form.description}</p>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="h-2 w-full bg-white/25 rounded animate-pulse" />
                            <div className="h-2 w-5/6 bg-white/25 rounded animate-pulse" />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-2.5">
                          {form.button_text ? (
                            <span className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-full text-[10px] font-bold shadow-sm transition-all">
                              {form.button_text}
                            </span>
                          ) : (
                            form.image_url && <div className="h-6 w-20 bg-primary/20 rounded-full animate-pulse" />
                          )}
                          {form.secondary_button_text && (
                            <span className="px-3.5 py-1.5 border border-white hover:bg-white hover:text-neutral-900 text-white rounded-full text-[10px] font-bold transition-all">
                              {form.secondary_button_text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#fafafa] p-4 rounded-[14px] border-[1.5px] border-[#f0e0d6] text-xs text-neutral-500 leading-relaxed">
                    <span className="font-semibold text-neutral-700">Mẹo thiết kế:</span>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1">
                      <li>Sử dụng hình ảnh có độ phân giải tối thiểu 1920x1080px.</li>
                      <li>Phần text nên ngắn gọn, súc tích để khách hàng dễ đọc lướt qua.</li>
                      <li>Chọn tone màu ảnh nền hài hòa với màu chủ đạo của website.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#f0e0d6] bg-[#fafafa] flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                form="banner-form"
                isLoading={isSaving}
                className="flex items-center gap-1.5"
              >
                <Save size={16} />
                <span>{editingBanner ? 'Lưu thay đổi' : 'Tạo Banner'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          value={form.image_url}
          onChange={(url) => {
            setForm(prev => ({ ...prev, image_url: url }))
          }}
          onClose={() => setShowMediaPicker(false)}
          purpose="banner"
        />
      )}
    </div>
  )
}
