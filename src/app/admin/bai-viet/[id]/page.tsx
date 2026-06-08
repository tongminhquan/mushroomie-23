'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImageIcon, Eye, Save, BookOpen, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import SeoAnalyzer from '@/components/admin/SeoAnalyzer'
import MediaPicker from '@/components/admin/MediaPicker'
import CategoryPanel from '@/components/admin/CategoryPanel'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[450px] border border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 text-sm">
      Đang tải trình soạn thảo...
    </div>
  ),
})

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [postId, setPostId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [hasToc, setHasToc] = useState(false)
  const [tocHeadings, setTocHeadings] = useState({ h2: true, h3: true, h4: false, h5: false })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    featured_image_alt: '',
    featured_image_caption: '',
    featured_image_description: '',
    status: 'draft',
    seo_title: '',
    meta_description: '',
    focus_keyword: '',
  })

  // Load post data
  useEffect(() => {
    params.then(async ({ id }) => {
      const numId = Number(id)
      setPostId(numId)
      try {
        const res = await fetch(`/api/posts/${numId}`)
        if (!res.ok) throw new Error('Không tìm thấy bài viết')
        const data = await res.json()
        const post = data.post || data
        setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image: post.featured_image || '',
          featured_image_alt: post.featured_image_alt || '',
          featured_image_caption: post.featured_image_caption || '',
          featured_image_description: post.featured_image_description || '',
          status: post.status || 'draft',
          seo_title: post.seo_title || '',
          meta_description: post.meta_description || '',
          focus_keyword: post.focus_keyword || '',
        })
        if (post.category_id) setSelectedCategoryIds([post.category_id])
        if (post.has_toc) setHasToc(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lỗi tải bài viết')
      } finally {
        setIsFetching(false)
      }
    })
  }, [params])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm(p => ({ ...p, title: v, slug: slugEdited ? p.slug : generateSlug(v) }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'slug') setSlugEdited(true)
    setForm(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (submitStatus: string) => {
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề bài viết'); return }
    setIsLoading(true); setError('')
    try {
      const payload = {
        ...form,
        status: submitStatus,
        category_id: selectedCategoryIds[0] ?? undefined,
        has_toc: hasToc,
      }
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Có lỗi xảy ra')
      }
      router.push('/admin/bai-viet')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setIsLoading(true)
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      router.push('/admin/bai-viet')
      router.refresh()
    } catch {
      setError('Không thể xóa bài viết')
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 text-sm">Đang tải bài viết...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/bai-viet" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-bold text-neutral-800 text-sm leading-none">Sửa bài viết</h1>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono truncate max-w-[300px]">/{form.slug}/</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-red-600 text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{error}</span>}
            {form.slug && (
              <Link href={`/tin-tuc/${form.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                <ExternalLink size={13} /> Xem
              </Link>
            )}
            <button
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 bg-white rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Save size={14} /> Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              <Eye size={14} />
              {isLoading ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

          {/* ══ LEFT: Main Editor ══ */}
          <div className="space-y-4">
            {/* Title + Slug */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full text-2xl font-bold text-neutral-900 border-0 outline-none placeholder:text-neutral-300 leading-tight"
                />
              </div>
              <div className="px-6 py-3 flex items-center gap-2 bg-neutral-50/50 text-sm">
                <span className="text-neutral-400 text-xs font-medium">Đường dẫn:</span>
                <span className="text-neutral-300">/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="duong-dan-bai-viet"
                  className="flex-1 text-primary font-mono text-xs border-0 outline-none focus:bg-primary/5 rounded px-1 py-0.5"
                />
                <span className="text-neutral-300">/</span>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-700">Nội dung bài viết</p>
                <div className="flex bg-neutral-200/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setEditorMode('rich')} 
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${editorMode === 'rich' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Văn bản thường
                  </button>
                  <button 
                    onClick={() => setEditorMode('html')} 
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${editorMode === 'html' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Viết thuần HTML
                  </button>
                </div>
              </div>
              {editorMode === 'rich' ? (
                <RichTextEditor
                  value={form.content}
                  onChange={v => setForm(p => ({ ...p, content: v }))}
                  placeholder="Bắt đầu viết nội dung bài viết của bạn..."
                />
              ) : (
                <textarea
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="<p>Nhập mã HTML tại đây...</p>"
                  className="w-full min-h-[450px] p-5 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-y"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-neutral-700">Tóm tắt (Excerpt)</h3>
                <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">Tùy chọn</span>
              </div>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder="Một đoạn giới thiệu ngắn về bài viết (nếu để trống sẽ tự lấy từ nội dung)..."
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary outline-none resize-none text-sm"
              />
            </div>

            {/* Table of Contents Panel */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-700">Mục lục (Table of Contents)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={hasToc} onChange={e => setHasToc(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
              {hasToc ? (
                <div className="p-5 space-y-4 text-sm">
                  <p className="text-neutral-500 text-xs">Mục lục sẽ tự động được tạo từ các tiêu đề trong bài viết.</p>
                  <div>
                    <p className="font-semibold text-neutral-600 mb-2">Đề mục hiển thị trong Mục lục</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['h2', 'h3', 'h4', 'h5'] as const).map(h => (
                        <label key={h} className="flex items-center gap-2 cursor-pointer text-neutral-600">
                          <input
                            type="checkbox"
                            checked={tocHeadings[h] || false}
                            onChange={e => setTocHeadings(p => ({ ...p, [h]: e.target.checked }))}
                            className="w-4 h-4 accent-primary rounded"
                          />
                          Tiêu đề {h.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 mb-1.5">Nhãn tiêu đề</label>
                    <input
                      defaultValue="Mục lục"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none"
                    />
                    <p className="text-xs text-neutral-400 mt-1">Ví dụ: Nội dung, Mục lục, Nội dung trang</p>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm text-neutral-400">Bật tính năng Mục lục để hệ thống tự động tạo mục lục từ các thẻ tiêu đề H2, H3 trong bài viết.</p>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Sidebar ══ */}
          <div className="space-y-4">
            {/* Publish Panel */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-semibold text-sm text-neutral-800">Xuất bản</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">📌 Trạng thái</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none bg-white"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Công khai</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">👁 Hiển thị</span>
                  <span className="text-neutral-700 font-medium">Công khai</span>
                </div>
                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <button onClick={() => handleSubmit('draft')} className="flex-1 py-2 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                    Lưu nháp
                  </button>
                  <button onClick={() => handleSubmit('published')} disabled={isLoading} className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60">
                    Cập nhật
                  </button>
                </div>

                {/* Delete */}
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    onClick={handleDelete}
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      deleteConfirm
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={14} />
                    {deleteConfirm ? 'Xác nhận xóa?' : 'Bỏ vào thùng rác'}
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image Panel */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-semibold text-sm text-neutral-800">Ảnh đại diện</span>
              </div>
              <div className="p-4">
                {form.featured_image ? (
                  <div className="space-y-3">
                    <div className="relative group rounded-xl overflow-hidden border border-neutral-200">
                      <img src={form.featured_image} alt={form.featured_image_alt} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setShowMediaPicker(true)} className="bg-white text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold">Thay đổi</button>
                        <button onClick={() => setForm(p => ({ ...p, featured_image: '', featured_image_alt: '', featured_image_caption: '', featured_image_description: '' }))} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Xóa</button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 text-center">Nhấn vào ảnh để sửa hoặc cập nhật</p>
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Tiêu đề SEO (Title)</label>
                        <input value={form.featured_image_alt} onChange={e => setForm(p => ({ ...p, featured_image_alt: e.target.value }))} placeholder="Tiêu đề tối ưu SEO cho ảnh..." className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Chú thích (Caption)</label>
                        <input value={form.featured_image_caption} onChange={e => setForm(p => ({ ...p, featured_image_caption: e.target.value }))} placeholder="Chú thích hiển thị dưới ảnh..." className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Mô tả (Description)</label>
                        <textarea value={form.featured_image_description} onChange={e => setForm(p => ({ ...p, featured_image_description: e.target.value }))} rows={2} placeholder="Mô tả nội dung ảnh..." className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:border-primary outline-none resize-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowMediaPicker(true)} className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-8 flex flex-col items-center gap-2 text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                    <ImageIcon size={28} />
                    <span className="text-sm font-medium">Chọn ảnh đại diện</span>
                    <span className="text-xs">Nhấn để mở thư viện Media</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Panel */}
            <CategoryPanel selectedIds={selectedCategoryIds} onChange={setSelectedCategoryIds} />

            {/* SEO Analyzer */}
            <SeoAnalyzer form={form} setForm={setForm} />
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          value={form.featured_image}
          onChange={(url, meta) => {
            setForm(p => ({
              ...p,
              featured_image: url,
              featured_image_alt: meta?.seo_title || meta?.alt_text || p.featured_image_alt,
              featured_image_caption: meta?.caption || p.featured_image_caption,
              featured_image_description: meta?.description || p.featured_image_description,
            }))
          }}
          onClose={() => setShowMediaPicker(false)}
          purpose="post"
        />
      )}
    </div>
  )
}
