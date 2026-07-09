'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReviewActions({ review }: { review: { id: number, rating: number, status: string, is_featured: boolean } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState((review as any).admin_reply || '')

  const updateReview = async (data: any) => {
    setIsLoading(true)
    await fetch(`/api/reviews/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setIsLoading(false)
    setIsReplying(false)
    router.refresh()
  }

  const deleteReview = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return
    setIsLoading(true)
    await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' })
    setIsLoading(false)
    router.refresh()
  }

  return (
    <div>
      {isReplying && (
        <div className="mt-3 bg-[#fdfaf7] p-3 rounded-xl border border-[#f0e0d6]">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full text-sm p-2 border border-neutral-300 rounded-lg focus:outline-none mb-2"
            rows={3}
            placeholder="Nhập nội dung phản hồi..."
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsReplying(false)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-[#fdf6f2]">Hủy</button>
            <button disabled={isLoading} onClick={() => updateReview({ admin_reply: replyText })} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark">Lưu phản hồi</button>
          </div>
        </div>
      )}
      <div className="flex gap-3 mt-3 items-center">
        {review.status !== 'approved' && (
          <button
            disabled={isLoading}
            className="text-xs text-green-600 font-semibold hover:underline disabled:opacity-50"
            onClick={() => updateReview({ status: 'approved', is_featured: review.rating >= 5 })}
          >
            ✅ Duyệt
          </button>
        )}
        {review.status !== 'rejected' && (
          <button
            disabled={isLoading}
            className="text-xs text-orange-600 font-semibold hover:underline disabled:opacity-50"
            onClick={() => updateReview({ status: 'rejected' })}
          >
            ❌ Từ chối
          </button>
        )}
        {!review.is_featured && review.status === 'approved' && (
          <button
            disabled={isLoading}
            className="text-xs text-purple-600 font-semibold hover:underline disabled:opacity-50"
            onClick={() => updateReview({ is_featured: true })}
          >
            ⭐ Hiển thị trang chủ
          </button>
        )}
        
        <div className="flex-1"></div>
        
        <button
          disabled={isLoading}
          className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-50"
          onClick={() => setIsReplying(!isReplying)}
        >
          💬 Phản hồi
        </button>
        <button
          disabled={isLoading}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
          onClick={deleteReview}
        >
          🗑️ Xóa
        </button>
      </div>
    </div>
  )
}
