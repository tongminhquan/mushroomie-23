'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác!')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const err = await res.json()
        alert(err.error || 'Xóa sản phẩm thất bại')
      }
    } catch {
      alert('Có lỗi xảy ra khi gọi API!')
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      className="text-red-500 text-xs font-semibold hover:underline disabled:opacity-50 ml-3"
    >
      {loading ? 'Đang xóa...' : 'Xóa'}
    </button>
  )
}
