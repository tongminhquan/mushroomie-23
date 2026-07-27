'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * Form đánh giá cho khách đến từ link trong email — không cần đăng nhập, không cần nhập
 * tên (tên lấy từ đơn hàng phía server). Khác ReviewForm ở chỗ gửi kèm token thay vì
 * productId.
 */
export default function TokenReviewForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá')
      return
    }

    if (content.trim().length < 5) {
      setError('Nội dung đánh giá quá ngắn')
      return
    }

    setError('')
    setStatus('loading')

    try {
      const response = await fetch('/api/reviews/from-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, content: content.trim() }),
      })

      if (response.ok) {
        setStatus('success')
        return
      }

      const data = await response.json().catch(() => ({}))
      setError(data.error || 'Có lỗi xảy ra. Vui lòng thử lại sau.')
      setStatus('error')
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
        <p className="font-bold text-text">Cảm ơn bạn đã đánh giá!</p>
        <p className="mt-1 text-sm text-neutral-500">Đánh giá sẽ hiển thị sau khi được kiểm duyệt.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border-[1.5px] border-[#f0e0d6] bg-secondary/40 p-5">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-600">Chọn số sao</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} sao`}
            >
              <Star
                size={26}
                className={`transition-colors ${
                  (hovered || rating) >= star ? 'fill-yellow text-yellow' : 'text-neutral-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-content" className="mb-1.5 block text-sm font-semibold text-neutral-700">
          Nội dung đánh giá
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          placeholder="Vòng có vừa tay không? Màu sắc có đúng như bạn mong đợi?"
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" isLoading={status === 'loading'} className="w-full sm:w-auto">
        Gửi đánh giá
      </Button>
    </form>
  )
}
