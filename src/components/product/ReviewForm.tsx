'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ReviewFormProps {
  productId: number
  productName: string
}

export default function ReviewForm({ productId, productName }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Vui lòng chọn số sao đánh giá'); return }
    if (!name.trim()) { setError('Vui lòng nhập tên của bạn'); return }
    if (content.trim().length < 5) { setError('Nội dung đánh giá quá ngắn'); return }
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content: content.trim(), rating, product_id: productId }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 font-bold text-text">Cảm ơn bạn đã đánh giá!</p>
        <p className="mt-1 text-sm text-neutral-500">Đánh giá sẽ hiển thị sau khi được kiểm duyệt.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border-[1.5px] border-[#f0e0d6] bg-secondary/40 p-5">
      <p className="font-semibold text-sm text-neutral-700">
        Viết đánh giá về <span className="text-primary">{productName}</span>
      </p>

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
                className={`transition-colors ${(hovered || rating) >= star ? 'fill-yellow text-yellow' : 'text-neutral-300'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Tên của bạn</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Nội dung đánh giá</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
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
