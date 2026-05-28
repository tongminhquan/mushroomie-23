'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, ExternalLink, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import MediaPicker from '@/components/admin/MediaPicker'

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [productId, setProductId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [slugEdited, setSlugEdited] = useState(true) // Start true since it is loaded from database
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    sale_price: '',
    sku: '',
    stock: '0',
    status: 'active',
    is_customizable: false,
    is_featured: false,
    featured_image: '',
    category_id: ''
  })

  // Load product & categories
  useEffect(() => {
    // Load categories first
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error('Lỗi tải danh mục:', err))

    // Load product details
    params.then(async ({ id }) => {
      const numId = Number(id)
      setProductId(numId)
      try {
        const res = await fetch(`/api/products/${numId}`)
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm')
        const product = await res.json()
        
        setForm({
          name: product.name || '',
          slug: product.slug || '',
          short_description: product.short_description || '',
          description: product.description || '',
          price: String(product.price || ''),
          sale_price: product.sale_price ? String(product.sale_price) : '',
          sku: product.sku || '',
          stock: String(product.stock || 0),
          status: product.status || 'active',
          is_customizable: !!product.is_customizable,
          is_featured: !!product.is_featured,
          featured_image: product.featured_image || '',
          category_id: product.category_id ? String(product.category_id) : '',
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi tải chi tiết sản phẩm')
      } finally {
        setIsFetching(false)
      }
    })
  }, [params])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm(p => ({ ...p, name: v, slug: slugEdited ? p.slug : generateSlug(v) }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name === 'slug') setSlugEdited(true)
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Vui lòng nhập tên sản phẩm'); return }
    if (!form.price.trim()) { setError('Vui lòng nhập giá bán'); return }
    
    setIsLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock: Number(form.stock),
        category_id: form.category_id ? Number(form.category_id) : null,
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu sản phẩm')
      }

      router.push('/admin/san-pham')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Không thể xóa sản phẩm')
      router.push('/admin/san-pham')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi xóa sản phẩm')
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 text-sm">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/san-pham" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-bold text-neutral-800 text-sm leading-none">Chỉnh sửa sản phẩm</h1>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono truncate max-w-[300px]">/{form.slug}/</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-red-600 text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{error}</span>}
            {form.slug && (
              <Link href={`/san-pham/${form.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                <ExternalLink size={13} /> Xem trên web
              </Link>
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              <Save size={14} />
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          {/* ══ LEFT: Main Form Content ══ */}
          <div className="space-y-4">
            
            {/* Title & Slug */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Tên sản phẩm *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Nhập tên sản phẩm..."
                  required
                  className="w-full text-xl font-bold text-neutral-900 border-0 outline-none placeholder:text-neutral-300 leading-tight focus:ring-0 p-0"
                />
              </div>
              <div className="px-6 py-3 flex items-center gap-2 bg-neutral-50/50 text-sm">
                <span className="text-neutral-400 text-xs font-medium">Đường dẫn sản phẩm:</span>
                <span className="text-neutral-300">/san-pham/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="duong-dan-san-pham"
                  className="flex-1 text-primary font-mono text-xs border-0 outline-none focus:bg-primary/5 rounded px-1 py-0.5 bg-transparent"
                />
                <span className="text-neutral-300">/</span>
              </div>
            </div>

            {/* Price & Stock info */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-neutral-800 text-base border-b pb-2 mb-2">Giá cả & Tồn kho</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Giá bán lẻ (VNĐ) *</label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Ví dụ: 120000"
                    className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Giá khuyến mãi (VNĐ)</label>
                  <input
                    name="sale_price"
                    type="number"
                    value={form.sale_price}
                    onChange={handleChange}
                    min="0"
                    placeholder="Nếu có..."
                    className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none text-sm text-green-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Số lượng tồn kho *</label>
                  <input
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Mã sản phẩm (SKU)</label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="MUSH-001..."
                    className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Danh mục sản phẩm</label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none text-sm bg-white"
                  >
                    <option value="">Không phân loại</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Short description and description */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-neutral-800 text-base border-b pb-2 mb-2">Chi tiết sản phẩm</h2>
              
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Mô tả ngắn (Hiển thị đầu trang)</label>
                <textarea
                  name="short_description"
                  value={form.short_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Giới thiệu nhanh, thu hút khách hàng..."
                  className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Mô tả chi tiết sản phẩm</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Mô tả kỹ về kích thước, chất liệu, cách bảo quản..."
                  className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none resize-y text-sm font-sans"
                />
              </div>
            </div>

          </div>

          {/* ══ RIGHT: Sidebar Panel ══ */}
          <div className="space-y-4">
            
            {/* Publish Actions */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-bold text-xs text-neutral-600 uppercase">Trạng thái & Thao tác</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">📌 Trạng thái</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:border-primary outline-none bg-white"
                  >
                    <option value="active">Đang bán (Active)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="inactive">Ẩn (Inactive)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">📦 Trạng thái kho</span>
                  <span className={`font-semibold ${Number(form.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(form.stock) > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    {isLoading ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                </div>

                {/* Delete button */}
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      deleteConfirm
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={14} />
                    {deleteConfirm ? 'Xác nhận xóa?' : 'Xóa sản phẩm này'}
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-bold text-xs text-neutral-600 uppercase">Ảnh đại diện sản phẩm</span>
              </div>
              <div className="p-4">
                {form.featured_image ? (
                  <div className="space-y-3">
                    <div className="relative group rounded-xl overflow-hidden border border-neutral-200">
                      <img src={form.featured_image} alt={form.name} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMediaPicker(true)}
                          className="bg-white text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
                        >
                          Thay đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, featured_image: '' }))}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Đường dẫn ảnh đại diện</label>
                      <input
                        name="featured_image"
                        value={form.featured_image}
                        onChange={handleChange}
                        placeholder="Hoặc điền URL ảnh..."
                        className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-12 flex flex-col items-center gap-2 text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <ImageIcon size={28} />
                    <span className="text-sm font-medium">Chọn ảnh sản phẩm</span>
                    <span className="text-xs">Mở thư viện Media</span>
                  </button>
                )}
              </div>
            </div>

            {/* Additional Attributes */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-bold text-xs text-neutral-600 uppercase">Cài đặt nâng cao</span>
              </div>
              <div className="p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={form.is_featured}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-neutral-700">Sản phẩm nổi bật</span>
                </label>
                <p className="text-[10px] text-neutral-400 ml-6 -mt-1 leading-normal">
                  Sẽ xuất hiện ở mục "Sản phẩm nổi bật" tại trang chủ.
                </p>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    name="is_customizable"
                    checked={form.is_customizable}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-neutral-700">Cho phép đặt làm theo yêu cầu</span>
                </label>
                <p className="text-[10px] text-neutral-400 ml-6 -mt-1 leading-normal">
                  Cho phép người mua nhập ghi chú tùy chỉnh (màu sắc, charm...) trước khi thêm vào giỏ hàng.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          value={form.featured_image}
          onChange={(url) => setForm(p => ({ ...p, featured_image: url }))}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  )
}
