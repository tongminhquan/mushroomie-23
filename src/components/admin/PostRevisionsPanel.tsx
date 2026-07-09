'use client'

import { useCallback, useEffect, useState } from 'react'
import { History, Loader2, RotateCcw } from 'lucide-react'

/**
 * Lịch sử phiên bản bài viết (WordPress-like revisions).
 * Hiển thị tối đa 10 bản snapshot gần nhất; khôi phục áp lại
 * title/content/excerpt/SEO (không đổi status/slug hiện tại).
 */

interface Revision {
  id: number
  title: string
  status: string
  created_at: string
  author: string | null
}

export default function PostRevisionsPanel({ postId, onRestored }: { postId: number; onRestored: () => void }) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/revisions`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRevisions(data.revisions || [])
    } catch {
      setError('Không tải được lịch sử')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { load() }, [load])

  const restore = async (revisionId: number) => {
    if (confirmId !== revisionId) { setConfirmId(revisionId); return }
    setRestoring(revisionId)
    setConfirmId(null)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/revisions/${revisionId}/restore`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Không khôi phục được')
      }
      onRestored()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setRestoring(null)
    }
  }

  if (!loading && revisions.length === 0 && !error) return null

  return (
    <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
        <History size={14} className="text-[#b9794b]" />
        <span className="font-semibold text-sm text-neutral-800">Lịch sử phiên bản</span>
        {revisions.length > 0 && <span className="text-xs text-neutral-400">({revisions.length})</span>}
      </div>
      <div className="p-3 space-y-1.5 max-h-[260px] overflow-y-auto">
        {loading && <div className="text-xs text-neutral-400 flex items-center gap-1.5 py-1"><Loader2 size={12} className="animate-spin" /> Đang tải…</div>}
        {error && <div className="text-xs text-red-600 py-1">{error}</div>}
        {revisions.map((rev) => (
          <div key={rev.id} className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-[#fdf6f2] transition-colors">
            <div className="min-w-0">
              <div className="text-neutral-700 font-medium truncate max-w-[170px]">{rev.title}</div>
              <div className="text-neutral-400">
                {new Date(rev.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                {rev.author ? ` — ${rev.author}` : ''}
              </div>
            </div>
            <button
              onClick={() => restore(rev.id)}
              disabled={restoring !== null}
              className={`flex items-center gap-1 font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                confirmId === rev.id ? 'text-red-600' : 'text-primary hover:underline'
              }`}
            >
              {restoring === rev.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
              {confirmId === rev.id ? 'Chắc chắn?' : 'Khôi phục'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
