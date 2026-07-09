'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImageIcon, Eye, Save, BookOpen, Globe, Share2, Settings2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import SeoAnalyzer from '@/components/admin/SeoAnalyzer'
import MediaPicker from '@/components/admin/MediaPicker'
import CategoryPanel from '@/components/admin/CategoryPanel'
import InternalLinkSuggester from '@/components/admin/InternalLinkSuggester'
import { generateSlug } from '@/lib/utils'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[450px] border-[1.5px] border-[#f0e0d6] rounded-xl bg-[#fdfaf7] flex items-center justify-center text-neutral-400 text-sm">
      Đang tải trình soạn thảo...
    </div>
  ),
})



type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function AddPostPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured' | 'og' | 'twitter'>('featured')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [hasToc, setHasToc] = useState(false)
  const [tocHeadings, setTocHeadings] = useState({ h2: true, h3: true, h4: false, h5: false })
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState(0)

  // Autosave
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const [savedPostId, setSavedPostId] = useState<number | null>(null)
  const lastSavedRef = useRef<string>('')
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Tags
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Secondary keywords
  const [skInput, setSkInput] = useState('')
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([])

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
    // Social / OG
    og_title: '',
    og_description: '',
    og_image: '',
    // Twitter
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    // Technical SEO
    canonical_url: '',
    robots_index: true,
    robots_follow: true,
    schema_type: 'BlogPosting',
  })

  // ── Unsaved changes warning ──
  const isDirtyRef = useRef(false)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const markDirty = useCallback(() => {
    isDirtyRef.current = true
  }, [])

  // ── Autosave every 30s ──
  useEffect(() => {
    autosaveTimerRef.current = setInterval(() => {
      if (!isDirtyRef.current) return
      const snapshot = JSON.stringify({ ...form, tags, secondaryKeywords, selectedCategoryIds })
      if (snapshot === lastSavedRef.current) return

      // Don't autosave if title is empty
      if (!form.title.trim()) return

      setAutosaveStatus('saving')
      fetch('/api/posts/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedPostId,
          ...form,
          category_id: selectedCategoryIds[0] ?? undefined,
          secondary_keywords: secondaryKeywords,
          has_toc: hasToc,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Autosave failed')
          return res.json()
        })
        .then(data => {
          if (data.isNew && data.post?.id) {
            setSavedPostId(data.post.id)
          }
          lastSavedRef.current = snapshot
          isDirtyRef.current = false
          setAutosaveStatus('saved')
          setTimeout(() => setAutosaveStatus('idle'), 3000)
        })
        .catch(() => {
          setAutosaveStatus('error')
          setTimeout(() => setAutosaveStatus('idle'), 5000)
        })
    }, 30000)

    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current)
    }
  }, [form, tags, secondaryKeywords, selectedCategoryIds, savedPostId, hasToc])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setForm(p => ({ ...p, title: v, slug: slugEdited ? p.slug : generateSlug(v) }))
    markDirty()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'slug') setSlugEdited(true)
    setForm(p => ({ ...p, [name]: value }))
    markDirty()
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm(p => ({ ...p, [name]: checked }))
    markDirty()
  }

  // ── Tag chips ──
  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      markDirty()
    }
    setTagInput('')
  }

  // ── Secondary keyword chips ──
  const addSecondaryKeyword = () => {
    const k = skInput.trim().toLowerCase()
    if (k && !secondaryKeywords.includes(k)) {
      setSecondaryKeywords(prev => [...prev, k])
      markDirty()
    }
    setSkInput('')
  }

  // ── Validation before publish ──
  const validateForPublish = (): string[] => {
    const errors: string[] = []
    if (!form.title.trim()) errors.push('Thiếu tiêu đề bài viết')
    if (!form.slug.trim()) errors.push('Thiếu đường dẫn (slug)')
    if (!form.content.trim() || form.content.replace(/<[^>]+>/g, '').trim().length < 50) errors.push('Nội dung quá ngắn hoặc trống')
    if (!form.featured_image) errors.push('Thiếu ảnh đại diện')
    if (form.featured_image && !form.featured_image_alt.trim()) errors.push('Thiếu alt text cho ảnh đại diện')
    if (!form.meta_description.trim()) errors.push('Thiếu meta description')
    if (!form.focus_keyword.trim()) errors.push('Thiếu từ khóa chính (focus keyword)')
    if (selectedCategoryIds.length === 0) errors.push('Chưa chọn danh mục')
    const seoTitleLen = (form.seo_title || form.title).length
    if (seoTitleLen > 60) errors.push(`SEO title quá dài (${seoTitleLen} ký tự, tối đa 60)`)
    const metaLen = form.meta_description.length
    if (metaLen > 0 && metaLen < 120) errors.push(`Meta description quá ngắn (${metaLen} ký tự, tối thiểu 120)`)
    if (metaLen > 160) errors.push(`Meta description quá dài (${metaLen} ký tự, tối đa 160)`)
    return errors
  }

  const handleSubmit = async (submitStatus: string) => {
    if (!form.title.trim()) { setError('Vui lòng nhập tiêu đề bài viết'); return }

    if (submitStatus === 'published') {
      const errors = validateForPublish()
      if (errors.length > 0) {
        setValidationErrors(errors)
        setShowValidationDialog(true)
        return
      }
      if (seoScore < 70) {
        setValidationErrors([`Điểm SEO hiện tại: ${seoScore}/100. Khuyến nghị đạt tối thiểu 70 điểm trước khi xuất bản.`])
        setShowValidationDialog(true)
        return
      }
    }

    await doSubmit(submitStatus)
  }

  const doSubmit = async (submitStatus: string) => {
    setIsLoading(true)
    setError('')
    setShowValidationDialog(false)
    try {
      const url = savedPostId ? `/api/posts/${savedPostId}` : '/api/posts'
      const method = savedPostId ? 'PUT' : 'POST'
      const payload = {
        ...form,
        status: submitStatus,
        category_id: selectedCategoryIds[0] ?? undefined,
        has_toc: hasToc,
        secondary_keywords: secondaryKeywords,
        tags,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Có lỗi xảy ra')
      }
      isDirtyRef.current = false
      router.push('/admin/bai-viet')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setIsLoading(false)
    }
  }

  const openMediaPicker = (target: 'featured' | 'og' | 'twitter') => {
    setMediaPickerTarget(target)
    setShowMediaPicker(true)
  }

  const handleMediaSelect = (url: string, meta?: any) => {
    if (mediaPickerTarget === 'featured') {
      setForm(p => ({
        ...p,
        featured_image: url,
        featured_image_alt: meta?.seo_title || meta?.alt_text || p.featured_image_alt,
        featured_image_caption: meta?.caption || p.featured_image_caption,
        featured_image_description: meta?.description || p.featured_image_description,
      }))
    } else if (mediaPickerTarget === 'og') {
      setForm(p => ({ ...p, og_image: url }))
    } else if (mediaPickerTarget === 'twitter') {
      setForm(p => ({ ...p, twitter_image: url }))
    }
    markDirty()
  }

  // Autosave status indicator
  const AutosaveIndicator = () => {
    if (autosaveStatus === 'saving') return <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Đang lưu...</span>
    if (autosaveStatus === 'saved') return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Đã lưu nháp</span>
    if (autosaveStatus === 'error') return <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> Lỗi khi lưu</span>
    return null
  }

  return (
    <div className="min-h-screen bg-[#f6f7f7] text-[#1d2327]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-[#dcdcde] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/bai-viet" className="rounded-[4px] border border-transparent p-2 text-[#646970] transition hover:border-[#dcdcde] hover:bg-[#f6f7f7] hover:text-primary">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-semibold leading-none text-[#1d2327]">Thêm bài viết</h1>
              <p className="mt-1 text-xs text-[#646970]">Soạn nội dung, ảnh đại diện và SEO như WordPress.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AutosaveIndicator />
            {error && <span className="rounded-[4px] border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</span>}
            <button
              onClick={() => handleSubmit('draft')}
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] border border-[#8c8f94] bg-[#f6f7f7] px-4 text-sm font-semibold text-[#1d2327] transition hover:bg-white"
            >
              <Save size={14} /> Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit('published')}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              <Eye size={14} />
              {isLoading ? 'Đang lưu...' : 'Xuất bản'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] px-4 py-5 md:px-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ══ LEFT: Main Editor ══ */}
          <div className="space-y-4">
            {/* Title + Slug */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#dcdcde] px-5 py-4">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Ví dụ: Top 10 mẫu vòng tay handmade dễ thương cho Gen Z"
                  className="w-full border-0 text-[30px] font-semibold leading-tight text-[#1d2327] outline-none placeholder:text-[#a7aaad]"
                />
              </div>
              <div className="flex items-center gap-2 border-t border-[#f0f0f1] bg-[#f6f7f7] px-5 py-3 text-sm">
                <span className="whitespace-nowrap text-xs font-medium text-[#646970]">Đường dẫn:</span>
                <span className="text-[#8c8f94]">/tin-tuc/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="duong-dan-bai-viet"
                  className="flex-1 rounded-[4px] border-0 bg-transparent px-1 py-0.5 font-mono text-xs text-primary outline-none focus:bg-[#fff7f2]"
                />
                {slugEdited && (
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, slug: generateSlug(p.title) }))
                      setSlugEdited(false)
                      markDirty()
                    }}
                    className="whitespace-nowrap rounded-[4px] border border-[#dcdcde] bg-white px-2 py-1 text-[10px] font-semibold text-[#50575e] transition hover:border-primary hover:text-primary"
                  >
                    Tạo lại từ tiêu đề
                  </button>
                )}
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex flex-col overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <p className="text-sm font-semibold text-[#1d2327]">Nội dung bài viết</p>
                <div className="flex rounded-[4px] border border-[#dcdcde] bg-white p-0.5">
                  <button
                    onClick={() => setEditorMode('rich')}
                    className={`rounded-[3px] px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === 'rich' ? 'bg-primary text-white' : 'text-[#646970] hover:text-[#1d2327]'}`}
                  >
                    Trực quan
                  </button>
                  <button
                    onClick={() => setEditorMode('html')}
                    className={`rounded-[3px] px-3 py-1.5 text-xs font-semibold transition-colors ${editorMode === 'html' ? 'bg-primary text-white' : 'text-[#646970] hover:text-[#1d2327]'}`}
                  >
                    Mã HTML
                  </button>
                </div>
              </div>
              {editorMode === 'rich' ? (
                <RichTextEditor
                  value={form.content}
                  onChange={v => { setForm(p => ({ ...p, content: v })); markDirty() }}
                  placeholder="Bắt đầu viết nội dung bài viết của bạn..."
                />
              ) : (
                <textarea
                  value={form.content}
                  onChange={e => { setForm(p => ({ ...p, content: e.target.value })); markDirty() }}
                  placeholder="<p>Nhập mã HTML tại đây...</p>"
                  className="min-h-[520px] w-full resize-y bg-[#1e1e1e] p-5 font-mono text-sm text-[#d4d4d4] outline-none"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Excerpt */}
            <div className="rounded-[4px] border border-[#c3c4c7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#1d2327]">Tóm tắt</h3>
                <span className="rounded-full bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#646970]">Tùy chọn</span>
              </div>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder="Tóm tắt ngắn nội dung bài viết để hiển thị ở trang blog."
                className="w-full resize-none rounded-[4px] border border-[#8c8f94] px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Table of Contents Panel */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-[#646970]" />
                  <span className="text-sm font-semibold text-[#1d2327]">Mục lục</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={hasToc} onChange={e => setHasToc(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
              {hasToc ? (
                <div className="space-y-4 p-5 text-sm">
                  <p className="text-xs text-[#646970]">Mục lục sẽ tự động được tạo từ các tiêu đề trong bài viết.</p>
                  <div>
                    <p className="mb-2 font-semibold text-[#50575e]">Đề mục hiển thị trong Mục lục</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['h2', 'h3', 'h4', 'h5'] as const).map(h => (
                        <label key={h} className="flex cursor-pointer items-center gap-2 text-[#50575e]">
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
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm text-[#646970]">Bật tính năng Mục lục để hệ thống tự động tạo mục lục từ các thẻ tiêu đề H2, H3 trong bài viết.</p>
                </div>
              )}
            </div>

            {/* ── SEO Cơ bản (below editor on mobile, visible on desktop too) ── */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] xl:hidden">
              <div className="flex items-center gap-2 border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <Settings2 size={15} className="text-[#646970]" />
                <span className="text-sm font-semibold text-[#1d2327]">SEO & Mạng xã hội</span>
              </div>
              <div className="p-5 text-sm text-[#646970]">
                Cuộn xuống để xem panel SEO ở cột bên phải (desktop) hoặc bên dưới (mobile).
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Sidebar ══ */}
          <div className="space-y-4">
            {/* Publish Panel */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <span className="text-sm font-semibold text-[#1d2327]">Xuất bản</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#646970]">Trạng thái</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Công khai</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#646970]">Schema</span>
                  <select
                    name="schema_type"
                    value={form.schema_type}
                    onChange={handleChange}
                    className="rounded-[4px] border border-[#8c8f94] bg-white px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="BlogPosting">BlogPosting</option>
                    <option value="Article">Article</option>
                    <option value="NewsArticle">NewsArticle</option>
                    <option value="HowTo">HowTo</option>
                    <option value="FAQPage">FAQPage</option>
                  </select>
                </div>
                <AutosaveIndicator />
                <div className="flex gap-2 border-t border-[#dcdcde] pt-3">
                  <button onClick={() => handleSubmit('draft')} className="flex-1 rounded-[4px] border border-[#8c8f94] bg-[#f6f7f7] py-2 text-sm font-semibold text-[#1d2327] transition hover:bg-white">
                    Lưu nháp
                  </button>
                  <button onClick={() => handleSubmit('published')} disabled={isLoading} className="flex-1 rounded-[4px] bg-primary py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60">
                    Xuất bản
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Image Panel */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <span className="text-sm font-semibold text-[#1d2327]">Ảnh đại diện</span>
              </div>
              <div className="p-4">
                {form.featured_image ? (
                  <div className="space-y-3">
                    <div className="group relative overflow-hidden rounded-[4px] border border-[#dcdcde]">
                      <img src={form.featured_image} alt={form.featured_image_alt} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => openMediaPicker('featured')} className="rounded-[4px] bg-white px-3 py-1.5 text-xs font-semibold text-[#1d2327]">Thay đổi</button>
                        <button onClick={() => setForm(p => ({ ...p, featured_image: '', featured_image_alt: '', featured_image_caption: '', featured_image_description: '' }))} className="rounded-[4px] bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">Xóa</button>
                      </div>
                    </div>
                    <p className="text-center text-xs text-[#646970]">Khuyến nghị: 1200x675px</p>
                    <div className="space-y-2 border-t border-[#dcdcde] pt-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#50575e]">Alt text (SEO) <span className="text-red-500">*</span></label>
                        <input value={form.featured_image_alt} onChange={e => { setForm(p => ({ ...p, featured_image_alt: e.target.value })); markDirty() }} placeholder="Mô tả ảnh, ví dụ: vòng tay handmade charm hoa hồng Mushroomie" className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#50575e]">Chú thích</label>
                        <input value={form.featured_image_caption} onChange={e => { setForm(p => ({ ...p, featured_image_caption: e.target.value })); markDirty() }} placeholder="Chú thích hiển thị dưới ảnh..." className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => openMediaPicker('featured')} className="flex w-full flex-col items-center gap-2 rounded-[4px] border border-dashed border-[#8c8f94] py-8 text-[#646970] transition hover:border-primary hover:bg-[#fff7f2] hover:text-primary">
                    <ImageIcon size={28} />
                    <span className="text-sm font-medium">Chọn ảnh đại diện</span>
                    <span className="text-xs">Khuyến nghị: 1200x675px</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Panel */}
            <CategoryPanel selectedIds={selectedCategoryIds} onChange={(ids) => { setSelectedCategoryIds(ids); markDirty() }} />

            {/* Tags */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <span className="text-sm font-semibold text-[#1d2327]">Thẻ</span>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Thêm tag..."
                    className="flex-1 rounded-[4px] border border-[#8c8f94] px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={addTag} className="rounded-[4px] bg-primary px-3 py-1.5 text-xs font-semibold text-white">+</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                        {t}
                        <button onClick={() => { setTags(prev => prev.filter(x => x !== t)); markDirty() }} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Internal Link Suggester */}
            <InternalLinkSuggester />

            {/* SEO Analyzer (existing component - enhanced) */}
            <SeoAnalyzer form={form} setForm={(fn: any) => { setForm(fn); markDirty() }} onScoreChange={setSeoScore} />

            {/* ── Social / OG / Twitter Panel ── */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <Share2 size={14} className="text-[#646970]" />
                <span className="text-sm font-semibold text-[#1d2327]">Mạng xã hội</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Social preview card */}
                <div className="overflow-hidden rounded-[4px] border border-[#dcdcde]">
                  <div className="aspect-[1.91/1] bg-neutral-100 relative">
                    {(form.og_image || form.featured_image) ? (
                      <img src={form.og_image || form.featured_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#fdfaf7]">
                    <p className="text-[10px] uppercase text-[#646970]">mushroomie.io.vn</p>
                    <p className="text-sm font-semibold text-neutral-800 line-clamp-1 mt-0.5">
                      {form.og_title || form.seo_title || form.title || 'Tiêu đề bài viết'}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                      {form.og_description || form.meta_description || 'Mô tả sẽ hiển thị khi chia sẻ lên Facebook, Zalo...'}
                    </p>
                  </div>
                </div>

                {/* OG fields */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">OG Title</label>
                  <input name="og_title" value={form.og_title} onChange={handleChange} placeholder="Để trống sẽ dùng SEO title" className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">OG Description</label>
                  <textarea name="og_description" value={form.og_description} onChange={handleChange} rows={2} placeholder="Để trống sẽ dùng meta description" className="w-full resize-none rounded-[4px] border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">OG Image</label>
                  <div className="flex gap-2">
                    <input name="og_image" value={form.og_image} onChange={handleChange} placeholder="Để trống sẽ dùng ảnh đại diện" className="flex-1 rounded-[4px] border border-[#8c8f94] px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    <button onClick={() => openMediaPicker('og')} className="rounded-[4px] border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-[#fff7f2]">Chọn</button>
                  </div>
                </div>

                <hr className="border-[#f0e0d6]" />

                {/* Twitter fields */}
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Twitter Card</p>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">Twitter Title</label>
                  <input name="twitter_title" value={form.twitter_title} onChange={handleChange} placeholder="Để trống sẽ dùng OG title" className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">Twitter Description</label>
                  <textarea name="twitter_description" value={form.twitter_description} onChange={handleChange} rows={2} placeholder="Để trống sẽ dùng OG description" className="w-full resize-none rounded-[4px] border border-[#8c8f94] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">Twitter Image</label>
                  <div className="flex gap-2">
                    <input name="twitter_image" value={form.twitter_image} onChange={handleChange} placeholder="Để trống sẽ dùng OG image" className="flex-1 rounded-[4px] border border-[#8c8f94] px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    <button onClick={() => openMediaPicker('twitter')} className="rounded-[4px] border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-[#fff7f2]">Chọn</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Technical SEO Panel ── */}
            <div className="overflow-hidden rounded-[4px] border border-[#c3c4c7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-[#dcdcde] bg-[#f6f7f7] px-4 py-3">
                <Globe size={14} className="text-[#646970]" />
                <span className="text-sm font-semibold text-[#1d2327]">SEO kỹ thuật</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">Canonical URL</label>
                  <input name="canonical_url" value={form.canonical_url} onChange={handleChange} placeholder="Để trống sẽ tự dùng URL bài viết" className="w-full rounded-[4px] border border-[#8c8f94] px-3 py-2 font-mono text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                    <input type="checkbox" checked={form.robots_index} onChange={e => handleCheckboxChange('robots_index', e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                    Index
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                    <input type="checkbox" checked={form.robots_follow} onChange={e => handleCheckboxChange('robots_follow', e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                    Follow
                  </label>
                </div>
                <p className="text-xs text-[#646970]">Bỏ tích &quot;Index&quot; nếu không muốn Google index bài viết này.</p>

                {/* Secondary keywords */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">Từ khóa phụ</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skInput}
                      onChange={e => setSkInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSecondaryKeyword() } }}
                      placeholder="Ví dụ: vòng cổ handmade"
                      className="flex-1 rounded-[4px] border border-[#8c8f94] px-3 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button onClick={addSecondaryKeyword} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-200">+</button>
                  </div>
                  {secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {secondaryKeywords.map(k => (
                        <span key={k} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {k}
                          <button onClick={() => { setSecondaryKeywords(prev => prev.filter(x => x !== k)); markDirty() }} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Media Picker Modal ── */}
      {showMediaPicker && (
        <MediaPicker
          value={mediaPickerTarget === 'featured' ? form.featured_image : mediaPickerTarget === 'og' ? form.og_image : form.twitter_image}
          onChange={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
          purpose="post"
        />
      )}

      {/* ── Validation Dialog ── */}
      {showValidationDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] shadow-strong w-full max-w-md overflow-hidden border-[1.5px] border-[#f0e0d6]">
            <div className="px-5 py-4 border-b-[1.5px] border-[#f0e0d6] flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              <h3 className="font-heading text-neutral-900">Kiểm tra trước khi xuất bản</h3>
            </div>
            <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span className="text-neutral-700">{err}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-[#fdfaf7] border-t-[1.5px] border-[#f0e0d6] flex justify-end gap-2">
              <button onClick={() => setShowValidationDialog(false)} className="px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-100">
                Quay lại sửa
              </button>
              <button onClick={() => doSubmit('published')} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
                Vẫn xuất bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
