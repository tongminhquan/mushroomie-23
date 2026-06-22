import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import ReviewActions from '@/components/admin/ReviewActions'

export const metadata: Metadata = { title: 'Quản lý đánh giá | Admin Mushroomie' }

interface SearchParams { status?: string }

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const where: any = {}
  if (sp.status) where.status = sp.status

  const reviews = await prisma.review.findMany({
    where,
    include: { product: true },
    orderBy: { created_at: 'desc' },
    take: 50,
  }).catch(() => [])

  const pendingCount = await prisma.review.count({ where: { status: 'pending' } }).catch(() => 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-[#ffe7a3] text-[#8a6410]',
    approved: 'bg-[#d8f3e3] text-[#1f8a5b]',
    rejected: 'bg-[#ffd6d6] text-[#c91414]',
  }

  return (
    <div className="p-6 bg-[#fbf7f3] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Nội dung &amp; hệ thống</p>
          <h1 className="font-heading text-xl font-bold text-neutral-800">Quản lý đánh giá</h1>
          {pendingCount > 0 && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[#8a6410] text-xs font-semibold bg-[#fdf3df] border-[1.5px] border-[#f0dba8] rounded-lg px-2.5 py-1">
              {pendingCount} đánh giá chờ duyệt
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        {[
          { value: '', label: 'Tất cả' },
          { value: 'pending', label: '⏳ Chờ duyệt' },
          { value: 'approved', label: '✅ Đã duyệt' },
          { value: 'rejected', label: '❌ Từ chối' },
        ].map((tab) => (
          <a key={tab.value} href={`/admin/danh-gia${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              (sp.status || '') === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-600 border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}>
            {tab.label}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-[16px] p-5 border-[1.5px] border-[#f0e0d6] shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800">{review.name}</span>
                <div className="flex text-[#f5b301] text-sm">{'★'.repeat(review.rating)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[review.status] || ''}`}>
                  {review.status === 'pending' ? 'Chờ duyệt' : review.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                </span>
                <span className="text-neutral-400 text-xs">{formatDate(review.created_at)}</span>
              </div>
            </div>
            {review.product && (
              <p className="text-xs text-primary font-medium mb-2">Sản phẩm: {review.product.name}</p>
            )}
            <p className="text-neutral-600 text-sm bg-[#fbf7f3] border-[1.5px] border-[#f0e0d6] rounded-[12px] p-3">{review.content}</p>
            {(review as any).admin_reply && (
              <div className="mt-3 bg-primary/5 p-3 rounded-[12px] border-[1.5px] border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">Mushroomie phản hồi:</p>
                <p className="text-sm text-neutral-700">{(review as any).admin_reply}</p>
              </div>
            )}
              <ReviewActions review={review} />
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-12 text-neutral-500 bg-white rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">Không có đánh giá nào</div>
        )}
      </div>
    </div>
  )
}
