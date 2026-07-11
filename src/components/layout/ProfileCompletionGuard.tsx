'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

export default function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Kiểm tra xem người dùng có thiếu thông tin không
  const isMissingInfo = status === 'authenticated' && session?.user && (!session.user.phone || !session.user.address)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !address) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: session?.user?.name || 'User',
          phone, 
          address 
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        if (data.error && typeof data.error === 'object') {
          const firstError = Object.values(data.error)[0] as string[]
          throw new Error(firstError[0] || 'Lỗi cập nhật')
        }
        throw new Error(data.error || 'Lỗi cập nhật')
      }

      // Cập nhật lại session để loại bỏ Guard
      await update({
        ...session,
        user: {
          ...session?.user,
          phone,
          address
        }
      })
      
      // Reload trang để chắc chắn
      window.location.reload()
      
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại sau')
      setLoading(false)
    }
  }

  // Trong lúc đang kiểm tra session, hiển thị children bình thường (hoặc có thể show loader)
  if (status === 'loading') {
    return <>{children}</>
  }

  // Nếu thiếu thông tin, hiển thị màn hình Guard đè lên, VÀ không render children
  if (isMissingInfo) {
    return (
      <div className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="relative h-16 w-40 mb-4">
              <Image src="/logo.webp" alt="Mushroomie Logo" fill className="object-contain" priority />
            </div>
            <h2 className="font-heading text-xl font-bold text-primary mb-2">Bổ sung thông tin</h2>
            <p className="text-stone-500 text-sm">
              Vì lý do bảo mật và để giao hàng, bạn cần bổ sung số điện thoại và địa chỉ trước khi tiếp tục.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ví dụ: 0912345678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
              <textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all resize-none"
                placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Nếu đủ thông tin, hiển thị nội dung website bình thường
  return <>{children}</>
}
