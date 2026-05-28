'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReviewActions({ review }: { review: { id: number, rating: number, status: string, is_featured: boolean } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const updateReview = async (data: any) => {
    setIsLoading(true)
    await fetch(`/api/reviews/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-3 mt-3">
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
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
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
    </div>
  )
}
