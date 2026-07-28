'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, X } from 'lucide-react'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'

export default function ReviewOrderModal({ orderId }: { orderId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  // Trước đây hộp thoại gắn class `animate-in fade-in zoom-in` — nhưng dự án không cài
  // tailwindcss-animate và cũng không tự định nghĩa, nên đó là class chết, không chạy
  // gì cả. Thay bằng .m-modal (có thật trong globals.css) + hook giữ DOM lúc đóng.
  const modal = useDrawerTransition(isOpen, 180)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/orders/${orderId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, content }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="m-press bg-primary text-white text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-primary-dark transition-colors"
      >
        Đánh giá
      </button>

      {modal.mounted && (
        <div
          data-drawer-state={modal.state}
          className="m-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div
            data-drawer-state={modal.state}
            className="m-modal bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="font-bold text-lg text-primary">Đánh giá sản phẩm</h3>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Chất lượng sản phẩm</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Nội dung đánh giá</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm nhé..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
