'use client'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ManageCategoriesModal() {
  const [show, setShow] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const router = useRouter()

  const fetchCategories = () => {
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
  }

  useEffect(() => {
    if (show) fetchCategories()
  }, [show])

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
