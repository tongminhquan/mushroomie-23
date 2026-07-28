'use client'
import { useState } from 'react'

export default function AddCategoryButton() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    
    // Auto generate a simple slug, backend can handle the rest or will use this
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug, type: 'product' })
      })
      if (res.ok) {
        alert('Thêm danh mục thành công!')
        setShow(false)
        setName('')
        window.location.reload()
      } else {
        const err = await res.json()
        alert(err.error || 'Có lỗi xảy ra, có thể danh mục đã tồn tại.')
      }
    } catch {
      alert('Có lỗi xảy ra khi gọi API!')
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setShow(true)} className="bg-white border border-[#f0e0d6] text-neutral-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#fdfaf7] transition-colors shadow-sm">
        + Thêm danh mục
      </button>
      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="m-pop-in bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg mb-4 text-neutral-800">Thêm danh mục sản phẩm mới</h3>
            <input 
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tên danh mục (ví dụ: Vòng tay)..."
              className="w-full px-4 py-2 border border-[#f0e0d6] rounded-xl mb-6 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShow(false)} className="px-4 py-2 text-sm text-neutral-500 font-semibold hover:bg-[#fdf6f2] rounded-xl transition-colors">Hủy</button>
              <button onClick={handleAdd} disabled={loading || !name.trim()} className="px-5 py-2 text-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                {loading ? 'Đang thêm...' : 'Thêm danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
