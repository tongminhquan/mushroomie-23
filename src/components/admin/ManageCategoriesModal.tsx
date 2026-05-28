'use client'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ManageCategoriesModal() {
  const [show, setShow] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchCategories = () => {
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
  }

  useEffect(() => {
    if (show) fetchCategories()
  }, [show])

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug, type: 'product' })
      })
      if (res.ok) {
        setName('')
        fetchCategories()
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Có lỗi xảy ra!')
      }
    } catch {
      alert('Lỗi kết nối')
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCategories()
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Có lỗi xảy ra!')
      }
    } catch {
      alert('Lỗi kết nối')
    }
  }

  return (
    <>
      <button onClick={() => setShow(true)} className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors shadow-sm">
        Quản lý danh mục
      </button>
      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-neutral-800">Quản lý danh mục sản phẩm</h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tên danh mục mới (VD: Vòng tay)..."
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl outline-none focus:border-primary text-sm"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button onClick={handleAdd} disabled={loading || !name.trim()} className="px-4 py-2 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 text-sm">
                Thêm
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 border border-neutral-100 rounded-lg">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <span className="font-medium text-sm">{c.name}</span>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 p-1 hover:bg-red-100 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">Chưa có danh mục nào</p>}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
