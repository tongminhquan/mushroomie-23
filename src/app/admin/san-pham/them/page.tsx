'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MultiImageUploader from '@/components/admin/MultiImageUploader'
import SingleImageUploader from '@/components/admin/SingleImageUploader'

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([])
  const [statuses, setStatuses] = useState<{ slug: string, name: string }[]>([])

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
    images: [] as string[],
    category_id: ''
  })

  useEffect(() => {
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error(err))

    fetch('/api/categories?type=product_status')
      .then(res => res.json())
      .then(data => setStatuses(data.categories || []))
      .catch(err => console.error(err))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : undefined,
        stock: Number(form.stock),
        category_id: form.category_id ? Number(form.category_id) : undefined,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.name?.[0] || data.error || 'Có lỗi xảy ra')
      }

      router.push('/admin/san-pham')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/san-pham" className="p-2 bg-white border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary text-neutral-600 rounded-lg shadow-card transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs font-semibold text-neutral-400">Cửa hàng / Sản phẩm</p>
          <h1 className="text-2xl font-bold font-heading">Thêm sản phẩm mới</h1>
          <p className="text-neutral-500 text-sm">Điền thông tin chi tiết cho sản phẩm của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border-[1.5px] border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] space-y-4">
          <h2 className="font-heading text-lg text-neutral-800 border-b border-[#f0e0d6] pb-3 mb-4">Thông tin cơ bản</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Tên sản phẩm *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Đường dẫn tĩnh (Slug)</label>
              <input name="slug" value={form.slug} onChange={handleChange}
                placeholder="De-trong-de-tu-dong-tao"
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Giá bán (VNĐ) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} required min="0"
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Giá khuyến mãi (VNĐ)</label>
              <input name="sale_price" type="number" value={form.sale_price} onChange={handleChange} min="0"
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Tồn kho *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required min="0"
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Mã SP (SKU)</label>
              <input name="sku" value={form.sku} onChange={handleChange}
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Danh mục</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors bg-white">
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors bg-white">
                <option value="active">Đang bán (Active)</option>
                <option value="inactive">Ngừng bán (Inactive)</option>
                <option value="draft">Bản nháp (Draft)</option>
                {statuses.length > 0 && (
                  <optgroup label="Trạng thái tùy chỉnh">
                    {statuses.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] space-y-4">
          <h2 className="font-heading text-lg text-neutral-800 border-b border-[#f0e0d6] pb-3 mb-4">Chi tiết nội dung</h2>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Mô tả ngắn</label>
            <textarea name="short_description" value={form.short_description} onChange={handleChange} rows={2}
              className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Mô tả chi tiết</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={5}
              className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors resize-y" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-3">Ảnh chính (Tối đa 1 ảnh)</label>
              <SingleImageUploader
                value={form.featured_image || ''}
                onChange={(featured_image) => setForm(prev => ({ ...prev, featured_image }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-3">Ảnh phụ (Không giới hạn)</label>
              <MultiImageUploader
                images={form.images}
                onChange={(images) => setForm(prev => ({ ...prev, images }))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] space-y-4">
          <h2 className="font-heading text-lg text-neutral-800 border-b border-[#f0e0d6] pb-3 mb-4">Thuộc tính thêm</h2>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange}
                className="w-5 h-5 rounded border-[1.5px] border-[#e2d3c8] text-primary focus:ring-primary" />
              <span className="text-sm font-medium text-neutral-700">Sản phẩm nổi bật</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link href="/admin/san-pham">
            <Button type="button" variant="outline">Hủy bỏ</Button>
          </Link>
          <Button type="submit" isLoading={isLoading}>Lưu sản phẩm</Button>
        </div>
      </form>
    </div>
  )
}
