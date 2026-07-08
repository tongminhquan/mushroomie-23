'use client'
import { use, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImageIcon, Eye, Save, BookOpen, Globe, Share2, Settings2, AlertTriangle, CheckCircle2, Loader2, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import SeoAnalyzer from '@/components/admin/SeoAnalyzer'
import MediaPicker from '@/components/admin/MediaPicker'
import CategoryPanel from '@/components/admin/CategoryPanel'
import InternalLinkSuggester from '@/components/admin/InternalLinkSuggester'
import { generateSlug } from '@/lib/utils'
import SafeImage from '@/components/ui/SafeImage'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[450px] border-[1.5px] border-[#f0e0d6] rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 text-sm">
      Đang tải trình soạn thảo...
    </div>
  ),
})



type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type LoadErrorState = { message: string; status?: number } | null

/** ISO/Date → giá trị cho input datetime-local theo giờ máy người dùng */
function toLocalInputValue(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const postId = Number(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState<LoadErrorState>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured' | 'og' | 'twitter'>('featured')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [hasToc, setHasToc] = useState(false)
  const [tocHeadings, setTocHeadings] = useState({ h2: true, h3: true, h4: false, h5: false })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editorMode, setEditorMode] = useState<'rich' | 'html'>('rich')
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState(0)
  const [featuredImagePreview, setFeaturedImagePreview] = useState('')
  const [featuredImageMissing, setFeaturedImageMissing] = useState(false)

  // Autosave
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const lastSavedRef = useRef<string>('')
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Snapshot of the content as loaded from the server, to guard against
  // accidentally saving an empty editor over an article that has content.
  const originalContentRef = useRef<string>('')

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
    publish_date: '',
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

  const parseStringArray = useCallback((value: unknown) => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
    if (typeof value !== 'string' || !value.trim()) return []

    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : []
    } catch {
      return []
    }
  }, [])

  const getLoadErrorMessage = useCallback((status?: number, fallback?: string) => {
    if (status === 400) return 'ID bài viết không hợp lệ.'
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (status === 403) return 'Bạn không có quyền truy cập bài viết này.'
    if (status === 404) return 'Không tìm thấy bài viết.'
    return fallback || 'Không thể tải bài viết, vui lòng thử lại.'
  }, [])

  // Load post data
  useEffect(() => {
    let cancelled = false

    async function loadPost() {
      if (!id || !Number.isFinite(postId) || postId <= 0) {
        setLoadError({ status: 400, message: getLoadErrorMessage(400) })
        setIsFetching(false)
        return
      }

      setIsFetching(true)
      setLoadError(null)
      setError('')

      try {
        const res = await fetch(`/api/posts/${postId}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (!res.ok) {
          const requestError = new Error(getLoadErrorMessage(res.status)) as Error & { status?: number }
          requestError.status = res.status
          throw requestError
        }
        const data = await res.json().catch(() => null)
        const post = data?.post || data
        if (!post || typeof post !== 'object') {
          throw new Error('Invalid post response.')
        }
        if (cancelled) return

        const parsedTags = parseStringArray(post.tags)
        const parsedSecondaryKeywords = parseStringArray(post.secondary_keywords)
        setForm({
          publish_date: post.status === 'scheduled' ? toLocalInputValue(post.published_at) : '',
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
          og_title: post.og_title || '',
          og_description: post.og_description || '',
          og_image: post.og_image || '',
          twitter_title: post.twitter_title || '',
          twitter_description: post.twitter_description || '',
          twitter_image: post.twitter_image || '',
          canonical_url: post.canonical_url || '',
          robots_index: post.robots_index ?? true,
          robots_follow: post.robots_follow ?? true,
          schema_type: post.schema_type || 'BlogPosting',
        })
        originalContentRef.current = post.content || ''
        setSelectedCategoryIds(post.category_id ? [post.category_id] : [])
        setHasToc(Boolean(post.has_toc))
        setTags(parsedTags)
        setSecondaryKeywords(parsedSecondaryKeywords)
        setFeaturedImagePreview(post.featured_image_preview || post.featured_image || '')
        setFeaturedImageMissing(post.featured_image_exists === false)

        // Init last saved snapshot
        lastSavedRef.current = JSON.stringify({
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
          og_title: post.og_title || '',
          og_description: post.og_description || '',
          og_image: post.og_image || '',
          twitter_title: post.twitter_title || '',
          twitter_description: post.twitter_description || '',
          twitter_image: post.twitter_image || '',
          canonical_url: post.canonical_url || '',
          robots_index: post.robots_index ?? true,
          robots_follow: post.robots_follow ?? true,
          schema_type: post.schema_type || 'BlogPosting',
          tags: parsedTags,
          secondaryKeywords: parsedSecondaryKeywords,
          selectedCategoryIds: post.category_id ? [post.category_id] : [],
        })
      } catch (e) {
        if (!cancelled) {
          setLoadError({
            status: typeof (e as { status?: unknown })?.status === 'number'
              ? (e as { status?: number }).status
              : undefined,
            message: e instanceof Error ? e.message : getLoadErrorMessage(undefined),
          })
        }
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }

    loadPost()

    return () => {
      cancelled = true
    }
  }, [getLoadErrorMessage, id, loadAttempt, parseStringArray, postId])

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
    if (!postId) return
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
          id: postId,
          ...form,
          category_id: selectedCategoryIds[0] ?? undefined,
          secondary_keywords: secondaryKeywords,
          tags,
          has_toc: hasToc,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Autosave failed')
          return res.json()
        })
        .then(() => {
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
  }, [form, tags, secondaryKeywords, selectedCategoryIds, postId, hasToc])

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

    if (submitStatus === 'scheduled') {
      if (!form.publish_date || new Date(form.publish_date).getTime() <= Date.now()) {
        setError('Vui lòng chọn thời gian hẹn đăng ở tương lai')
        return
      }
    }

    // Guard against data loss: the post had content when loaded, but the editor
    // is now empty (e.g. it failed to bind on load). Don't silently overwrite.
    const stripText = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim()
    if (stripText(originalContentRef.current).length > 0 && stripText(form.content).length === 0) {
      const proceed = window.confirm(
        'Bài viết hiện có nội dung nhưng vùng soạn thảo đang trống (có thể do tải lỗi). ' +
        'Nhấn OK để vẫn lưu và xóa toàn bộ nội dung, hoặc Cancel để tải lại bài viết.'
      )
      if (!proceed) { setLoadAttempt(v => v + 1); return }
    }

    if (submitStatus === 'published' || submitStatus === 'scheduled') {
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
      const payload = {
        ...form,
        status: submitStatus,
        category_id: selectedCategoryIds[0] ?? undefined,
        has_toc: hasToc,
        secondary_keywords: secondaryKeywords,
        tags,
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
      isDirtyRef.current = false
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
      setFeaturedImagePreview(url)
      setFeaturedImageMissing(false)
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
    if (autosaveStatus === 'saved') return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Đã lưu tự động</span>
    if (autosaveStatus === 'error') return <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> Lỗi khi lưu</span>
    return null
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

  if (loadError) {
    const needsLogin = loadError.status === 401 || loadError.status === 403

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-500">Lỗi tải bài viết</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Không thể mở trang chỉnh sửa</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{loadError.message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setLoadAttempt((value) => value + 1)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Tải lại
            </button>
            <Link
              href={needsLogin ? '/tai-khoan/dang-nhap' : '/admin/bai-viet'}
              className="rounded-xl border-[1.5px] border-[#f0e0d6] px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {needsLogin ? 'Đăng nhập lại' : 'Quay lại danh sách'}
            </Link>
          </div>
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
            <AutosaveIndicator />
            {error && <span className="text-red-600 text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{error}</span>}
            {form.slug && (
              <Link href={`/tin-tuc/${form.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                <ExternalLink size={13} /> Xem
              </Link>
            )}
            <button
              onClick={() => handleSubmit('draft')}
              className="flex items-center gap-1.5 px-4 py-2 border-[1.5px] border-[#f0e0d6] bg-white rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
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
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full text-2xl font-bold text-neutral-900 border-0 outline-none placeholder:text-neutral-300 leading-tight"
                />
              </div>
              <div className="px-6 py-3 flex items-center gap-2 bg-neutral-50/50 text-sm border-t border-neutral-100">
                <span className="text-neutral-400 text-xs font-medium whitespace-nowrap">Đường dẫn:</span>
                <span className="text-neutral-300">/tin-tuc/</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="duong-dan-bai-viet"
                  className="flex-1 text-primary font-mono text-xs border-0 outline-none focus:bg-primary/5 rounded px-1 py-0.5 bg-transparent"
                />
                {slugEdited && (
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, slug: generateSlug(p.title) }))
                      setSlugEdited(false)
                      markDirty()
                    }}
                    className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
                  >
                    Tạo lại từ tiêu đề
                  </button>
                )}
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden flex flex-col">
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
                  onChange={v => { setForm(p => ({ ...p, content: v })); markDirty() }}
                  placeholder="Bắt đầu viết nội dung bài viết của bạn..."
                />
              ) : (
                <textarea
                  value={form.content}
                  onChange={e => { setForm(p => ({ ...p, content: e.target.value })); markDirty() }}
                  placeholder="<p>Nhập mã HTML tại đây...</p>"
                  className="w-full min-h-[450px] p-5 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] outline-none resize-y"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-neutral-700">Tóm tắt (Excerpt)</h3>
                <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">Tùy chọn</span>
              </div>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                placeholder="Tóm tắt ngắn nội dung bài viết để hiển thị ở trang blog."
                className="w-full px-4 py-2 border-[1.5px] border-[#f0e0d6] rounded-xl focus:border-primary outline-none resize-none text-sm"
              />
            </div>

            {/* Table of Contents Panel */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
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
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-sm text-neutral-400">Bật tính năng Mục lục để hệ thống tự động tạo mục lục từ các thẻ tiêu đề H2, H3 trong bài viết.</p>
                </div>
              )}
            </div>

            {/* ── SEO Cơ bản (below editor on mobile, visible on desktop too) ── */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden xl:hidden">
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                <Settings2 size={15} className="text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-700">SEO & Mạng xã hội</span>
              </div>
              <div className="p-5 text-sm text-neutral-400">
                Cuộn xuống để xem panel SEO ở cột bên phải (desktop) hoặc bên dưới (mobile).
              </div>
            </div>
          </div>

          {/* ══ RIGHT: Sidebar ══ */}
          <div className="space-y-4">
            {/* Publish Panel */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
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
                    className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none bg-white"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Công khai</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">📊 Schema</span>
                  <select
                    name="schema_type"
                    value={form.schema_type}
                    onChange={handleChange}
                    className="border-[1.5px] border-[#f0e0d6] rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none bg-white"
                  >
                    <option value="BlogPosting">BlogPosting</option>
                    <option value="Article">Article</option>
                    <option value="NewsArticle">NewsArticle</option>
                    <option value="HowTo">HowTo</option>
                    <option value="FAQPage">FAQPage</option>
                  </select>
                </div>
                <AutosaveIndicator />
                <div className="pt-2 border-t border-neutral-100 flex gap-2">
                  <button onClick={() => handleSubmit('draft')} className="flex-1 py-2 border-[1.5px] border-[#f0e0d6] rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
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
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-semibold text-sm text-neutral-800">Ảnh đại diện</span>
              </div>
              <div className="p-4">
                {form.featured_image ? (
                  <div className="space-y-3">
                    <div className="relative group overflow-hidden rounded-xl border-[1.5px] border-[#f0e0d6] bg-secondary">
                      <div className="relative aspect-video w-full">
                        <SafeImage
                          src={featuredImagePreview || form.featured_image}
                          alt={form.featured_image_alt || form.title || 'Ảnh đại diện bài viết'}
                          fill
                          imageKind="post"
                          sizes="320px"
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => openMediaPicker('featured')} className="bg-white text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold">Thay đổi</button>
                        <button
                          onClick={() => {
                            setForm(p => ({ ...p, featured_image: '', featured_image_alt: '', featured_image_caption: '', featured_image_description: '' }))
                            setFeaturedImagePreview('')
                            setFeaturedImageMissing(false)
                            markDirty()
                          }}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    {featuredImageMissing && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                        Ảnh hiện tại không còn tồn tại trong thư mục uploads. Public site đang dùng ảnh dự phòng. Vui lòng chọn lại ảnh để cập nhật dữ liệu.
                      </div>
                    )}
                    <p className="text-xs text-neutral-400 text-center">Khuyến nghị: 1200×675px</p>
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Alt text (SEO) <span className="text-red-500">*</span></label>
                        <input value={form.featured_image_alt} onChange={e => { setForm(p => ({ ...p, featured_image_alt: e.target.value })); markDirty() }} placeholder="Mô tả ảnh, ví dụ: vòng tay handmade charm hoa hồng Mushroomie" className="w-full px-3 py-1.5 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Chú thích (Caption)</label>
                        <input value={form.featured_image_caption} onChange={e => { setForm(p => ({ ...p, featured_image_caption: e.target.value })); markDirty() }} placeholder="Chú thích hiển thị dưới ảnh..." className="w-full px-3 py-1.5 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => openMediaPicker('featured')} className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-8 flex flex-col items-center gap-2 text-neutral-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                    <ImageIcon size={28} />
                    <span className="text-sm font-medium">Chọn ảnh đại diện</span>
                    <span className="text-xs">Khuyến nghị: 1200×675px</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Panel */}
            <CategoryPanel selectedIds={selectedCategoryIds} onChange={(ids) => { setSelectedCategoryIds(ids); markDirty() }} />

            {/* Tags */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <span className="font-semibold text-sm text-neutral-800">Tags</span>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Thêm tag..."
                    className="flex-1 px-3 py-1.5 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none"
                  />
                  <button onClick={addTag} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold">+</button>
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
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                <Share2 size={14} className="text-neutral-500" />
                <span className="font-semibold text-sm text-neutral-800">Mạng xã hội</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Social preview card */}
                <div className="border-[1.5px] border-[#f0e0d6] rounded-xl overflow-hidden">
                  <div className="aspect-[1.91/1] bg-neutral-100 relative">
                    {(form.og_image || form.featured_image) ? (
                      <SafeImage
                        src={form.og_image || featuredImagePreview || form.featured_image}
                        alt={form.og_title || form.seo_title || form.title || 'Ảnh xem trước mạng xã hội'}
                        fill
                        imageKind="post"
                        sizes="320px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-neutral-50">
                    <p className="text-[10px] text-neutral-400 uppercase">mushroomie.io.vn</p>
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
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">OG Title</label>
                  <input name="og_title" value={form.og_title} onChange={handleChange} placeholder="Để trống sẽ dùng SEO title" className="w-full px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">OG Description</label>
                  <textarea name="og_description" value={form.og_description} onChange={handleChange} rows={2} placeholder="Để trống sẽ dùng meta description" className="w-full px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-sm focus:border-primary outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">OG Image</label>
                  <div className="flex gap-2">
                    <input name="og_image" value={form.og_image} onChange={handleChange} placeholder="Để trống sẽ dùng ảnh đại diện" className="flex-1 px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none" />
                    <button onClick={() => openMediaPicker('og')} className="px-3 py-2 border border-primary text-primary rounded-lg text-xs font-semibold hover:bg-primary/5">Chọn</button>
                  </div>
                </div>

                <hr className="border-neutral-100" />

                {/* Twitter fields */}
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Twitter Card</p>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Twitter Title</label>
                  <input name="twitter_title" value={form.twitter_title} onChange={handleChange} placeholder="Để trống sẽ dùng OG title" className="w-full px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Twitter Description</label>
                  <textarea name="twitter_description" value={form.twitter_description} onChange={handleChange} rows={2} placeholder="Để trống sẽ dùng OG description" className="w-full px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-sm focus:border-primary outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Twitter Image</label>
                  <div className="flex gap-2">
                    <input name="twitter_image" value={form.twitter_image} onChange={handleChange} placeholder="Để trống sẽ dùng OG image" className="flex-1 px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none" />
                    <button onClick={() => openMediaPicker('twitter')} className="px-3 py-2 border border-primary text-primary rounded-lg text-xs font-semibold hover:bg-primary/5">Chọn</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Technical SEO Panel ── */}
            <div className="bg-white rounded-2xl border-[1.5px] border-[#f0e0d6] shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center gap-2">
                <Globe size={14} className="text-neutral-500" />
                <span className="font-semibold text-sm text-neutral-800">SEO Kỹ thuật</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Canonical URL</label>
                  <input name="canonical_url" value={form.canonical_url} onChange={handleChange} placeholder="Để trống sẽ tự dùng URL bài viết" className="w-full px-3 py-2 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs font-mono focus:border-primary outline-none" />
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
                <p className="text-xs text-neutral-400">Bỏ tích &quot;Index&quot; nếu không muốn Google index bài viết này.</p>

                {/* Secondary keywords */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Từ khóa phụ</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={skInput}
                      onChange={e => setSkInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSecondaryKeyword() } }}
                      placeholder="Ví dụ: vòng cổ handmade"
                      className="flex-1 px-3 py-1.5 border-[1.5px] border-[#f0e0d6] rounded-lg text-xs focus:border-primary outline-none"
                    />
                    <button onClick={addSecondaryKeyword} className="px-3 py-1.5 bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-300">+</button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              <h3 className="font-bold text-neutral-800">Kiểm tra trước khi xuất bản</h3>
            </div>
            <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span className="text-neutral-700">{err}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button onClick={() => setShowValidationDialog(false)} className="px-4 py-2 border-[1.5px] border-[#f0e0d6] rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100">
                Quay lại sửa
              </button>
              <button onClick={() => doSubmit('published')} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">
                Vẫn xuất bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
