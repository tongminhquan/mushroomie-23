'use client'
import { useState, useEffect } from 'react'
import { Trash2, Edit2, ImageIcon, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MediaPicker from '@/components/admin/MediaPicker'

export default function ManageCategoriesModal() {
  const [show, setShow] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  
  // Mode: 'add' or 'edit'
  const [mode, setMode] = useState<'add'|'edit'>('add')
  const [editId, setEditId] = useState<number | null>(null)
  
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [icon, setIcon] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const router = useRouter()

  const fetchCategories = () => {
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
  }

  useEffect(() => {
    if (show) fetchCategories()
  }, [show])

  const resetForm = () => {
    setMode('add')
    setEditId(null)
    setName('')
    setImageUrl('')
    setIcon('')
  }

  const handleEditClick = (cat: any) => {
    setMode('edit')
    setEditId(cat.id)
    setName(cat.name)
    setImageUrl(cat.image_url || '')
    setIcon(cat.icon || '')
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    try {
      const url = mode === 'add' ? '/api/categories' : `/api/categories/${editId}`
      const method = mode === 'add' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug, type: 'product', image_url: imageUrl, icon: icon.trim() })
      })
      
      if (res.ok) {
        resetForm()
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
        if (editId === id) resetForm()
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-neutral-800">Quản lý danh mục sản phẩm</h3>
            
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-neutral-700">{mode === 'add' ? 'Thêm mới' : 'Chỉnh sửa'}</h4>
                {mode === 'edit' && (
                  <button onClick={resetForm} className="text-xs text-primary font-semibold hover:underline">Hủy sửa</button>
                )}
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      value={icon}
                      onChange={e => setIcon(e.target.value)}
                      placeholder="Icon (VD: 💛)"
                      className="w-16 px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-primary text-sm text-center"
                    />
                    <input 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Tên danh mục mới (VD: Vòng tay)..."
                      className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl outline-none focus:border-primary text-sm"
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {imageUrl ? (
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-neutral-200 group">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setImageUrl('')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowMediaPicker(true)}
                        className="h-10 px-3 border border-dashed border-neutral-300 rounded-xl flex items-center gap-2 text-neutral-500 text-xs font-semibold hover:border-primary hover:text-primary transition-colors bg-white"
                      >
                        <ImageIcon size={16} /> Chọn ảnh đại diện
                      </button>
                    )}
                  </div>
                </div>
                
                <button onClick={handleSave} disabled={loading || !name.trim()} className="px-4 py-2 h-10 mb-2 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 text-sm whitespace-nowrap">
                  {mode === 'add' ? 'Thêm' : 'Lưu'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 border border-neutral-100 rounded-lg">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <div className="flex items-center gap-3">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 border border-neutral-200">
                        {c.icon ? <span className="text-lg">{c.icon}</span> : <ImageIcon size={14} />}
                      </div>
                    )}
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditClick(c)} className="text-blue-500 p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
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
      
      {showMediaPicker && (
        <div className="fixed inset-0 z-[60]">
          <MediaPicker 
            value={imageUrl} 
            onChange={(url) => {
              setImageUrl(url)
              setShowMediaPicker(false)
            }}
            onClose={() => setShowMediaPicker(false)}
          />
        </div>
      )}
    </>
  )
}
