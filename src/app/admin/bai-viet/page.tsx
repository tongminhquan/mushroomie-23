'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Copy, Eye, Loader2,
  Pencil, RotateCcw, Search, Trash2, X,
} from 'lucide-react'
import { calculatePostSeoAnalysis, getPostSeoRating, type PostSeoInput } from '@/lib/post-seo-score'

/**
 * Quản lý bài viết kiểu WordPress Posts List:
 * tabs trạng thái kèm số lượng, search, filter danh mục/tháng, sort,
 * bulk actions, quick actions từng dòng, thùng rác + khôi phục.
 * UI theo brand Mushroomie (nền kem, đỏ #e41d1d, card bo góc).
 */

interface PostRow extends PostSeoInput {
  id: number
  title: string
  slug: string
  status: string
  created_at: string
  published_at: string | null
  category: { id: number; name: string } | null
  author: { id: number; name: string } | null
  seoScore: number
}

interface Category { id: number; name: string; slug: string }

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'published', label: '🟢 Đã xuất bản' },
  { value: 'scheduled', label: '⏰ Chờ đăng' },
  { value: 'draft', label: '🟡 Nháp' },
  { value: 'private', label: '🔒 Riêng tư' },
  { value: 'hidden', label: '🙈 Ẩn' },
  { value: 'trash', label: '🗑 Thùng rác' },
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  published: { label: 'Đã xuất bản', cls: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Chờ đăng', cls: 'bg-blue-100 text-blue-700' },
  draft: { label: 'Nháp', cls: 'bg-yellow-100 text-yellow-700' },
  private: { label: 'Riêng tư', cls: 'bg-purple-100 text-purple-700' },
  hidden: { label: 'Ẩn', cls: 'bg-neutral-100 text-neutral-700' },
  trash: { label: 'Thùng rác', cls: 'bg-red-100 text-red-700' },
}

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Mới tạo nhất' },
  { value: 'created_at:asc', label: 'Cũ nhất' },
  { value: 'updated_at:desc', label: 'Vừa cập nhật' },
  { value: 'published_at:desc', label: 'Mới xuất bản' },
  { value: 'title:asc', label: 'Tiêu đề A→Z' },
  { value: 'title:desc', label: 'Tiêu đề Z→A' },
]

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SEO_TONE_CLASSES = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  poor: 'border-red-200 bg-red-50 text-red-700',
  empty: 'border-neutral-200 bg-neutral-50 text-neutral-500',
}

function SeoScoreBadge({ score }: { score: number }) {
  const rating = getPostSeoRating(score)

  return (
    <div
      className={`inline-flex min-w-[104px] items-center gap-2 rounded-md border px-2 py-1 ${SEO_TONE_CLASSES[rating.tone]}`}
      title={`Điểm SEO: ${score}/100. ${rating.label}`}
      aria-label={`Điểm SEO ${score} trên 100, ${rating.label}`}
    >
      <span className="font-bold tabular-nums leading-none">{score}</span>
      <span className="h-4 w-px bg-current opacity-20" aria-hidden="true" />
      <span className="text-[11px] font-semibold leading-none">{rating.label}</span>
    </div>
  )
}

export default function AdminPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Bộ lọc
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [month, setMonth] = useState('')
  const [sort, setSort] = useState('created_at:desc')
  const [page, setPage] = useState(1)

  // Chọn nhiều
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const monthOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = []
    const now = new Date()
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      opts.push({ value, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` })
    }
    return opts
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        status, page: String(page), limit: '20', withCounts: '1',
        sortBy: sort.split(':')[0], order: sort.split(':')[1],
      })
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (month) params.set('month', month)

      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error('Không tải được danh sách bài viết')
      const data = await res.json()
      setPosts((data.posts || []).map((post: PostSeoInput & Omit<PostRow, 'seoScore'>) => ({
        ...post,
        seoScore: calculatePostSeoAnalysis(post).score,
      })))
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      if (data.counts) setCounts(data.counts)
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }, [status, page, search, category, month, sort])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/categories?type=post')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(posts.map((p) => p.id)) : new Set())
  }
  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  const runBulk = async () => {
    if (!bulkAction || selected.size === 0) return
    if (bulkAction === 'delete' && !confirmDelete) { setConfirmDelete(true); return }
    setBusy(true)
    setConfirmDelete(false)
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: bulkAction, ids: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra')
      setBulkAction('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setBusy(false)
    }
  }

  const rowAction = async (id: number, action: 'trash' | 'restore' | 'delete' | 'duplicate') => {
    setBusy(true)
    try {
      let res: Response
      if (action === 'duplicate') {
        res = await fetch(`/api/posts/${id}/duplicate`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Không nhân bản được')
        router.push(`/admin/bai-viet/${data.id}`)
        return
      }
      if (action === 'restore') res = await fetch(`/api/posts/${id}/restore`, { method: 'POST' })
      else res = await fetch(`/api/posts/${id}`, { method: 'DELETE' }) // trash lần 1, xóa vĩnh viễn khi đã ở trash
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Có lỗi xảy ra')
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setBusy(false)
    }
  }

  const inTrashView = status === 'trash'
  const visibleTabs = STATUS_TABS.filter((t) =>
    ['all', 'published', 'draft', 'trash'].includes(t.value) || (counts[t.value] || 0) > 0,
  )

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400 mb-1">Nội dung &amp; hệ thống</div>
          <h1 className="font-heading text-2xl font-bold text-neutral-800">Quản lý bài viết</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} bài viết{inTrashView ? ' trong thùng rác' : ''}</p>
        </div>
        <div className="flex gap-2 flex-1 md:flex-none">
          <Link href="/admin/bai-viet/dang-hang-loat" className="border-[1.5px] border-primary text-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary hover:text-white transition-colors whitespace-nowrap flex-1 text-center md:flex-none">
            ⚡ Đăng tự động
          </Link>
          <Link href="/admin/bai-viet/them" className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors whitespace-nowrap flex-1 text-center md:flex-none">
            + Thêm bài viết
          </Link>
        </div>
      </div>

      {/* ── Tabs trạng thái (kèm số lượng kiểu WordPress) ── */}
      <div className="flex gap-2 mb-4 overflow-x-auto whitespace-nowrap pb-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              status === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-600 border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}
          >
            {tab.label}
            {counts[tab.value === 'all' ? 'all' : tab.value] !== undefined && (
              <span className="ml-1 opacity-75">({counts[tab.value === 'all' ? 'all' : tab.value] || 0})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Thanh công cụ: search / filter / sort ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}
          className="flex items-center gap-0 flex-1 min-w-[220px] max-w-[380px]"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề, slug, từ khóa SEO…"
            className="flex-1 border-[1.5px] border-[#f0e0d6] rounded-l-lg px-3 py-2 text-sm focus:border-primary outline-none bg-white"
          />
          <button type="submit" className="bg-primary text-white px-3 py-2 rounded-r-lg border-[1.5px] border-primary hover:bg-primary-dark transition-colors">
            <Search size={16} />
          </button>
        </form>
        {search && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} className="text-xs text-neutral-500 flex items-center gap-1 hover:text-primary">
            <X size={12} /> Bỏ tìm &quot;{search}&quot;
          </button>
        )}
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2.5 py-2 text-sm bg-white focus:border-primary outline-none">
          <option value="">Mọi danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1) }}
          className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2.5 py-2 text-sm bg-white focus:border-primary outline-none">
          <option value="">Mọi thời gian</option>
          {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2.5 py-2 text-sm bg-white focus:border-primary outline-none">
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* ── Bulk actions ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-[#fff7f2] border-[1.5px] border-[#ffd6d6] rounded-lg px-3 py-2">
          <span className="text-sm font-semibold text-neutral-700">{selected.size} bài đã chọn</span>
          <select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setConfirmDelete(false) }}
            className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2.5 py-1.5 text-sm bg-white focus:border-primary outline-none">
            <option value="">Chọn hành động…</option>
            {!inTrashView && <option value="publish">Xuất bản</option>}
            {!inTrashView && <option value="draft">Chuyển sang nháp</option>}
            {!inTrashView && <option value="trash">Đưa vào thùng rác</option>}
            {inTrashView && <option value="restore">Khôi phục</option>}
            {inTrashView && <option value="delete">Xóa vĩnh viễn</option>}
          </select>
          <button onClick={runBulk} disabled={!bulkAction || busy}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
              confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-primary-dark'
            }`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : confirmDelete ? 'Bấm lần nữa để XÓA VĨNH VIỄN' : 'Áp dụng'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ── Bảng ── */}
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0e0d6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-[#fcfbfa] border-b-[1.5px] border-[#f0e0d6]">
              <tr>
                <th className="py-3 px-4 w-8">
                  <input type="checkbox" className="accent-[#e41d1d]"
                    checked={posts.length > 0 && selected.size === posts.length}
                    onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                {['Tiêu đề', 'Danh mục', 'Tác giả', 'Trạng thái', 'SEO', 'Ngày', 'Hành động'].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400 ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6ece5]">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-neutral-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />Đang tải bài viết…
                </td></tr>
              ) : posts.map((post) => {
                const badge = STATUS_BADGE[post.status] || STATUS_BADGE.hidden
                return (
                  <tr key={post.id} className="hover:bg-[#fdf6f2] transition-colors">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="accent-[#e41d1d]"
                        checked={selected.has(post.id)}
                        onChange={(e) => toggleOne(post.id, e.target.checked)} />
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/bai-viet/${post.id}`} className="font-semibold text-neutral-800 hover:text-primary line-clamp-1 max-w-[320px]">
                        {post.title}
                      </Link>
                      <div className="text-xs text-[#b9794b] font-mono max-w-[320px] truncate">{post.slug}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{post.category?.name || '—'}</td>
                    <td className="py-3 px-4 text-neutral-600">{post.author?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                      {post.status === 'scheduled' && post.published_at && (
                        <div className="text-[11px] text-blue-600 mt-1">⏰ {fmtDate(post.published_at)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4"><SeoScoreBadge score={post.seoScore} /></td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">{fmtDate(post.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end items-center gap-2.5 text-neutral-400">
                        {!inTrashView ? (
                          <>
                            <Link href={`/admin/bai-viet/${post.id}`} title="Sửa" className="hover:text-primary"><Pencil size={15} /></Link>
                            <Link href={`/tin-tuc/${post.slug}`} target="_blank"
                              title={post.status === 'published' ? 'Xem' : 'Xem trước (chỉ admin thấy)'}
                              className="hover:text-primary"><Eye size={15} /></Link>
                            <button onClick={() => rowAction(post.id, 'duplicate')} disabled={busy} title="Nhân bản" className="hover:text-primary disabled:opacity-40"><Copy size={15} /></button>
                            <button onClick={() => rowAction(post.id, 'trash')} disabled={busy} title="Đưa vào thùng rác" className="hover:text-red-600 disabled:opacity-40"><Trash2 size={15} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => rowAction(post.id, 'restore')} disabled={busy} title="Khôi phục" className="hover:text-green-600 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold">
                              <RotateCcw size={14} /> Khôi phục
                            </button>
                            <button onClick={() => { if (window.confirm(`Xóa vĩnh viễn "${post.title}"? Không thể hoàn tác.`)) rowAction(post.id, 'delete') }}
                              disabled={busy} title="Xóa vĩnh viễn" className="hover:text-red-600 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold text-red-500">
                              <Trash2 size={14} /> Xóa vĩnh viễn
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && posts.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <div className="text-3xl mb-2">🍄</div>
              {inTrashView ? 'Thùng rác trống.' : search || category || month ? 'Không tìm thấy bài viết phù hợp.' : 'Chưa có bài viết nào — bấm “+ Thêm bài viết” để bắt đầu.'}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-[1.5px] border-[#f0e0d6] bg-[#fcfbfa]">
            <span className="text-xs text-neutral-500">Trang {page}/{totalPages} — {total} bài</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded-lg border-[1.5px] border-[#f0e0d6] bg-white text-neutral-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border-[1.5px] border-[#f0e0d6] bg-white text-neutral-600 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
