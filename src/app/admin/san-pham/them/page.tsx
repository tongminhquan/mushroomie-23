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
        <Link href="/admin/san-pham" className="p-2 hover:bg-neutral-200 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading">Thêm sản phẩm mới</h1>
          <p className="text-neutral-500 text-sm">Điền thông tin chi tiết cho sản phẩm của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 mb-4">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Tên sản phẩm *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Đường dẫn tĩnh (Slug)</label>
              <input name="slug" value={form.slug} onChange={handleChange}
                placeholder="De-trong-de-tu-dong-tao"
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Giá bán (VNĐ) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} required min="0"
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Giá khuyến mãi (VNĐ)</label>
              <input name="sale_price" type="number" value={form.sale_price} onChange={handleChange} min="0"
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tồn kho *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required min="0"
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Mã SP (SKU)</label>
              <input name="sku" value={form.sku} onChange={handleChange}
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Danh mục</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none bg-white">
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none bg-white">
                {statuses.length === 0 && <option value="active">--- Chọn trạng thái ---</option>}
                {statuses.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 mb-4">Chi tiết nội dung</h2>
          
          <div>
            <label className="block text-sm font-semibold mb-1">Mô tả ngắn</label>
            <textarea name="short_description" value={form.short_description} onChange={handleChange} rows={2}
              className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Mô tả chi tiết</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={5}
              className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none resize-y" />
          </div>
          <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Ảnh chính (Tối đa 1 ảnh)</label>
              <SingleImageUploader 
                value={form.featured_image || ''}
                onChange={(featured_image) => setForm(prev => ({ ...prev, featured_image }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3">Ảnh phụ (Không giới hạn)</label>
              <MultiImageUploader 
                images={form.images}
                onChange={(images) => setForm(prev => ({ ...prev, images }))}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 mb-4">Thuộc tính thêm</h2>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange}
                className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary" />
              <span className="text-sm font-medium">Sản phẩm nổi bật</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_customizable" checked={form.is_customizable} onChange={handleChange}
                className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary" />
              <span className="text-sm font-medium">Cho phép tùy chỉnh (Customizable)</span>
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
