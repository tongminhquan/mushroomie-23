'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react'

interface FormData {
  title: string
  slug: string
  content: string
  seo_title: string
  meta_description: string
  focus_keyword?: string
  secondary_keywords?: string[]
  featured_image?: string
  featured_image_alt?: string
  og_image?: string
  twitter_image?: string
}

interface SeoAnalyzerProps {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<any>>
  onScoreChange?: (score: number) => void
}

interface CheckResult {
  status: 'success' | 'warning' | 'error'
  text: string
  group: 'basic' | 'additional' | 'title_readability' | 'content_readability'
}

const GROUP_INFO = {
  basic: { label: 'SEO cơ bản', icon: '🎯' },
  additional: { label: 'Bổ sung', icon: '📎' },
  title_readability: { label: 'Khả năng đọc tiêu đề', icon: '📝' },
  content_readability: { label: 'Khả năng đọc nội dung', icon: '📖' },
}

// Segment progress bar (like RankMath)
function SegmentBar({ value, segments = 14 }: { value: number; segments?: number }) {
  const filled = Math.round((value / 100) * segments)
  return (
    <div className="flex gap-0.5 h-2.5">
      {Array.from({ length: segments }).map((_, i) => {
        let bg = 'bg-neutral-200'
        if (i < filled) {
          if (value >= 80) bg = 'bg-green-500'
          else if (value >= 50) bg = 'bg-orange-400'
          else bg = 'bg-red-500'
        }
        return <div key={i} className={`flex-1 rounded-sm transition-all ${bg}`} />
      })}
    </div>
  )
}

// Length gauge bar (red → orange → yellow → green)
function LengthGauge({ value, min, ideal, max, label }: { value: number; min: number; ideal: number; max: number; label: string }) {
  const segments = 10
  const getSegColor = (idx: number) => {
    const segVal = ((idx + 1) / segments) * max
    if (segVal <= min) return value >= segVal ? 'bg-red-500' : 'bg-neutral-200'
    if (segVal <= ideal) return value >= segVal ? 'bg-green-500' : 'bg-neutral-200'
    if (segVal <= max) return value >= segVal ? 'bg-orange-400' : 'bg-neutral-200'
    return 'bg-neutral-200'
  }

  let statusColor = 'text-red-600'
  if (value >= min && value <= ideal) statusColor = 'text-green-600'
  else if (value > ideal && value <= max) statusColor = 'text-orange-500'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-neutral-600">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${statusColor}`}>{value} / {ideal}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-sm transition-all ${getSegColor(i)}`} />
        ))}
      </div>
    </div>
  )
}

export default function SeoAnalyzer({ form, setForm, onScoreChange }: SeoAnalyzerProps) {
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<CheckResult[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'social'>('overview')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [expandedGroups, setExpandedGroups] = useState({ basic: true, additional: true, title_readability: true, content_readability: true })

  const keyword = (form.focus_keyword || '').toLowerCase().trim()
  const seoTitleLen = (form.seo_title || '').length
  const slugLen = (form.slug || '').length
  const metaLen = (form.meta_description || '').length

  // SEO Analysis Engine
  useEffect(() => {
    const timer = setTimeout(() => {
      const checks: CheckResult[] = []
      let pts = 0

    const rawHtml = form.content || ''
    const plain = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim()
    const wordCount = plain.split(/\s+/).filter(w => w.length > 0).length
    const title = (form.seo_title || form.title || '').toLowerCase()
    const desc = (form.meta_description || '').toLowerCase()
    const slug = (form.slug || '').toLowerCase()

    if (!keyword) {
      checks.push({ status: 'error', text: 'Chưa thiết lập Từ khóa chính (Focus Keyword).', group: 'basic' })
      setResults(checks); setScore(0); onScoreChange?.(0); return
    }

    const kwRe = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

    // ── BASIC SEO (55 pts) ──────────────────────
    // 1. Keyword in SEO title (10pts)
    if (title.includes(keyword)) {
      pts += 10
      checks.push({ status: 'success', text: 'Tuyệt vời! Bạn đang sử dụng từ khoá chính trong Tiêu đề SEO.', group: 'basic' })
    } else {
      checks.push({ status: 'error', text: 'Từ khoá chính chưa xuất hiện trong Tiêu đề SEO.', group: 'basic' })
    }

    // 2. Keyword in meta description (8pts)
    if (desc.includes(keyword)) {
      pts += 8
      checks.push({ status: 'success', text: 'Đã sử dụng từ khoá chính trong Mô tả Meta SEO.', group: 'basic' })
    } else {
      checks.push({ status: 'error', text: 'Thêm từ khoá chính vào Mô tả Meta (Meta Description).', group: 'basic' })
    }

    // 3. Keyword in URL (7pts)
    const kwSlug = keyword.replace(/\s+/g, '-')
    if (slug.includes(kwSlug) || slug.replace(/-/g, '').includes(keyword.replace(/\s/g, ''))) {
      pts += 7
      checks.push({ status: 'success', text: 'Từ khoá chính đã được sử dụng trong URL.', group: 'basic' })
    } else {
      checks.push({ status: 'warning', text: 'Nên đưa từ khoá chính vào Đường dẫn tĩnh (Slug).', group: 'basic' })
    }

    // 4. Keyword in first 10% (8pts)
    const first10 = plain.substring(0, Math.max(150, Math.floor(plain.length * 0.1)))
    if (first10.includes(keyword)) {
      pts += 8
      checks.push({ status: 'success', text: 'Từ khóa chính xuất hiện trong 10% nội dung đầu tiên.', group: 'basic' })
    } else {
      checks.push({ status: 'warning', text: 'Hãy chèn từ khóa vào đoạn mở bài (10% đầu tiên).', group: 'basic' })
    }

    // 5. Keyword in body (7pts)
    const kwCount = (plain.match(kwRe) || []).length
    if (kwCount > 0) {
      pts += 7
      checks.push({ status: 'success', text: `Đã tìm thấy từ khoá chính trong nội dung.`, group: 'basic' })
    } else {
      checks.push({ status: 'error', text: 'Từ khoá chính chưa xuất hiện trong nội dung bài viết.', group: 'basic' })
    }

    // 6. Word count (8pts)
    if (wordCount >= 600) {
      pts += 8
      checks.push({ status: 'success', text: `Nội dung dài ${wordCount} từ. Làm tốt lắm!`, group: 'basic' })
    } else if (wordCount >= 300) {
      pts += 4
      checks.push({ status: 'warning', text: `Nội dung dài ${wordCount} từ. Nên đạt trên 600 từ.`, group: 'basic' })
    } else {
      checks.push({ status: 'error', text: `Nội dung quá ngắn (${wordCount} từ). Tối thiểu cần 300 từ.`, group: 'basic' })
    }

    // 7. Meta description length (7pts)
    if (metaLen >= 120 && metaLen <= 160) {
      pts += 7
      checks.push({ status: 'success', text: `Meta description ${metaLen} ký tự. Hoàn hảo!`, group: 'basic' })
    } else if (metaLen >= 80 && metaLen < 120) {
      pts += 3
      checks.push({ status: 'warning', text: `Meta description hơi ngắn (${metaLen} ký tự). Khuyến nghị 120–160 ký tự.`, group: 'basic' })
    } else if (metaLen > 160) {
      pts += 3
      checks.push({ status: 'warning', text: `Meta description quá dài (${metaLen} ký tự). Khuyến nghị ≤160 ký tự.`, group: 'basic' })
    } else if (metaLen > 0) {
      checks.push({ status: 'error', text: `Meta description quá ngắn (${metaLen} ký tự). Tối thiểu 80 ký tự.`, group: 'basic' })
    } else {
      checks.push({ status: 'error', text: 'Chưa nhập meta description.', group: 'basic' })
    }

    // ── ADDITIONAL (30 pts) ─────────────────────
    // 8. Keyword in H2 headings (5pts)
    const h2Matches = rawHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
    const h2Text = h2Matches.map(h => h.replace(/<[^>]+>/g, '')).join(' ').toLowerCase()
    if (h2Text.includes(keyword)) {
      pts += 5
      checks.push({ status: 'success', text: 'Từ khoá chính xuất hiện trong ít nhất một tiêu đề H2.', group: 'additional' })
    } else {
      checks.push({ status: 'warning', text: 'Nên thêm từ khoá vào ít nhất một tiêu đề phụ H2.', group: 'additional' })
    }

    // 9. At least 2 H2 headings (3pts)
    if (h2Matches.length >= 2) {
      pts += 3
      checks.push({ status: 'success', text: `Bài viết có ${h2Matches.length} tiêu đề H2. Tốt!`, group: 'additional' })
    } else if (h2Matches.length === 1) {
      pts += 1
      checks.push({ status: 'warning', text: 'Chỉ có 1 tiêu đề H2. Nên có ít nhất 2 H2.', group: 'additional' })
    } else {
      checks.push({ status: 'error', text: 'Chưa có tiêu đề H2 nào. Nên có ít nhất 2 H2.', group: 'additional' })
    }

    // 10. No multiple H1 in content (3pts)
    const h1Count = (rawHtml.match(/<h1[^>]*>/gi) || []).length
    if (h1Count === 0) {
      pts += 3
      checks.push({ status: 'success', text: 'Nội dung không chứa thẻ H1 (H1 chỉ nên ở tiêu đề bài).', group: 'additional' })
    } else {
      checks.push({ status: 'error', text: `Phát hiện ${h1Count} thẻ H1 trong nội dung. Không nên dùng H1 trong bài viết.`, group: 'additional' })
    }

    // 11. Keyword in image alt (3pts)
    const altTexts = (rawHtml.match(/alt="([^"]*)"/gi) || []).join(' ').toLowerCase()
    if (altTexts.length > 0 && altTexts.includes(keyword)) {
      pts += 3
      checks.push({ status: 'success', text: 'Đã tìm thấy từ khoá chính trong thuộc tính alt của hình ảnh.', group: 'additional' })
    } else if (altTexts.length > 0) {
      checks.push({ status: 'warning', text: 'Thêm từ khoá chính vào thuộc tính alt của hình ảnh.', group: 'additional' })
    } else {
      checks.push({ status: 'warning', text: 'Không tìm thấy hình ảnh có thuộc tính alt. Hãy thêm hình và alt text.', group: 'additional' })
    }

    // 12. Keyword density (3pts)
    if (kwCount > 0 && wordCount > 0) {
      const density = (kwCount / wordCount) * 100
      const densityStr = density.toFixed(2)
      if (density >= 0.5 && density <= 2.5) {
        pts += 3
        checks.push({ status: 'success', text: `Mật độ từ khóa là ${densityStr}%, xuất hiện ${kwCount} lần.`, group: 'additional' })
      } else if (density > 2.5) {
        checks.push({ status: 'warning', text: `Mật độ từ khóa hơi cao (${densityStr}%). Giảm bớt để tránh spam.`, group: 'additional' })
      } else {
        checks.push({ status: 'warning', text: `Mật độ từ khóa còn thấp (${densityStr}%). Hãy tăng thêm.`, group: 'additional' })
      }
    }

    // 13. URL length (3pts)
    if (slug.length > 0 && slug.length <= 75) {
      pts += 3
      checks.push({ status: 'success', text: `URL dài ${slug.length} ký tự. Rất tốt!`, group: 'additional' })
    } else if (slug.length > 75) {
      checks.push({ status: 'warning', text: `URL quá dài (${slug.length} ký tự). Nên giữ dưới 75 ký tự.`, group: 'additional' })
    }

    // 14. External links (3pts)
    const extLinks = (rawHtml.match(/href="https?:\/\/[^"]+"/gi) || [])
    if (extLinks.length > 0) {
      pts += 3
      checks.push({ status: 'success', text: `Tuyệt vời! Bạn đang liên kết đến ${extLinks.length} tài nguyên bên ngoài.`, group: 'additional' })
    } else {
      checks.push({ status: 'warning', text: 'Nên thêm ít nhất một liên kết ngoại (external link).', group: 'additional' })
    }

    // 15. Internal links (4pts)
    const intLinks = (rawHtml.match(/href="\/[^"]+"/gi) || [])
    if (intLinks.length > 0) {
      pts += 4
      checks.push({ status: 'success', text: `Bạn đang liên kết đến ${intLinks.length} tài nguyên khác trên trang web.`, group: 'additional' })
    } else {
      checks.push({ status: 'warning', text: 'Nên thêm liên kết nội bộ (internal link) đến bài viết khác.', group: 'additional' })
    }

    // ── TITLE READABILITY (5 pts) ───────────────
    // 16. Keyword at start of title (3pts)
    if (title.startsWith(keyword)) {
      pts += 3
      checks.push({ status: 'success', text: 'Từ khoá chính được sử dụng ở đầu tiêu đề SEO.', group: 'title_readability' })
    } else {
      checks.push({ status: 'warning', text: 'Nên đặt từ khóa chính ở đầu tiêu đề SEO để tăng hiệu quả.', group: 'title_readability' })
    }

    // 17. Number in title (2pts)
    if (/\d/.test(form.seo_title || form.title || '')) {
      pts += 2
      checks.push({ status: 'success', text: 'Bạn đang sử dụng một số trong tiêu đề SEO.', group: 'title_readability' })
    } else {
      checks.push({ status: 'warning', text: 'Thêm số vào tiêu đề (ví dụ: "Top 10...") để thu hút click.', group: 'title_readability' })
    }

    // ── CONTENT READABILITY (10 pts) ─────────────
    // 18. Featured image (3pts)
    if (form.featured_image) {
      pts += 3
      checks.push({ status: 'success', text: 'Bài viết có ảnh đại diện. Tốt!', group: 'content_readability' })
    } else {
      checks.push({ status: 'error', text: 'Thiếu ảnh đại diện. Ảnh giúp tăng CTR khi chia sẻ.', group: 'content_readability' })
    }

    // 19. Featured image alt (2pts)
    if (form.featured_image && form.featured_image_alt) {
      pts += 2
      checks.push({ status: 'success', text: 'Ảnh đại diện có alt text. Tốt cho SEO!', group: 'content_readability' })
    } else if (form.featured_image) {
      checks.push({ status: 'warning', text: 'Ảnh đại diện chưa có alt text. Hãy thêm mô tả ảnh.', group: 'content_readability' })
    }

    // 20. Images in content (2pts)
    const imgCount = (rawHtml.match(/<img/gi) || []).length
    if (imgCount > 0) {
      pts += 2
      checks.push({ status: 'success', text: `Nội dung của bạn chứa ${imgCount} hình ảnh.`, group: 'content_readability' })
    } else {
      checks.push({ status: 'warning', text: 'Nên thêm ít nhất một hình ảnh vào nội dung.', group: 'content_readability' })
    }

    // 21. Short paragraphs (3pts)
    const paras = rawHtml.split(/<\/p>/i).filter(p => p.trim().length > 0)
    const longParas = paras.filter(p => p.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length > 150)
    if (paras.length > 0 && longParas.length === 0) {
      pts += 3
      checks.push({ status: 'success', text: 'Bạn đang sử dụng các đoạn văn ngắn. Rất tốt!', group: 'content_readability' })
    } else if (longParas.length > 0) {
      checks.push({ status: 'warning', text: `${longParas.length} đoạn văn quá dài. Hãy chia nhỏ để dễ đọc hơn.`, group: 'content_readability' })
    } else {
      checks.push({ status: 'warning', text: 'Chưa có nội dung để đánh giá khả năng đọc.', group: 'content_readability' })
    }

    // 22. Secondary keywords check (3pts)
    if (form.secondary_keywords && form.secondary_keywords.length > 0) {
      let foundSKs = 0;
      form.secondary_keywords.forEach(sk => {
        if (sk.trim() && plain.includes(sk.toLowerCase().trim())) foundSKs++;
      });
      if (foundSKs > 0) {
        pts += 3;
        checks.push({ status: 'success', text: `Tìm thấy ${foundSKs}/${form.secondary_keywords.length} từ khóa phụ trong nội dung.`, group: 'basic' });
      } else {
        checks.push({ status: 'warning', text: 'Chưa tìm thấy từ khóa phụ nào trong nội dung bài viết.', group: 'basic' });
      }
    }

    // 23. Social Images check (2pts)
    if (form.og_image || form.twitter_image || form.featured_image) {
      pts += 2;
      checks.push({ status: 'success', text: 'Đã có hình ảnh để hiển thị trên mạng xã hội.', group: 'additional' });
    } else {
      checks.push({ status: 'warning', text: 'Nên thêm ảnh đại diện (Featured Image) hoặc OG/Twitter Image để bài viết nổi bật khi chia sẻ.', group: 'additional' });
    }

    const finalScore = Math.min(100, pts)
    setScore(finalScore)
    setResults(checks)
    onScoreChange?.(finalScore)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [form, keyword, onScoreChange])

  const scoreColor = score >= 80 ? 'text-green-700' : score >= 50 ? 'text-orange-600' : score > 0 ? 'text-red-600' : 'text-neutral-400'
  const scoreBg = score >= 80 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-orange-50 border-orange-200' : score > 0 ? 'bg-red-50 border-red-100' : 'bg-neutral-50 border-neutral-200'
  const scoreLabel = score >= 80 ? '🌿 Tốt' : score >= 50 ? '⚠️ Cần cải thiện' : score > 0 ? '❌ Kém' : '—'

  const groupedResults = (Object.keys(GROUP_INFO) as Array<keyof typeof GROUP_INFO>).map(group => ({
    group,
    items: results.filter(r => r.group === group),
  }))

  const getGroupBadge = (items: CheckResult[]) => {
    const errors = items.filter(i => i.status === 'error').length
    const warnings = items.filter(i => i.status === 'warning').length
    if (errors > 0) return { cls: 'bg-red-100 text-red-700', txt: `✕ ${errors} Lỗi` }
    if (warnings > 0) return { cls: 'bg-orange-100 text-orange-700', txt: `! ${warnings} Cảnh báo` }
    if (items.length > 0) return { cls: 'bg-green-100 text-green-700', txt: '✓ Tất cả đều tốt' }
    return { cls: 'bg-neutral-100 text-neutral-500', txt: '...' }
  }

  const displayTitle = form.seo_title || form.title || 'Tiêu đề bài viết'
  const displaySlug = form.slug || 'duong-dan-bai-viet'
  const displayDesc = form.meta_description || 'Mô tả meta sẽ hiển thị ở đây khi bài viết xuất hiện trên Google tìm kiếm...'

  return (
    <div className="space-y-3">
      {/* ─── PUBLISH INFO (SEO score) ─── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${scoreBg}`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 bg-white/60">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-700">
            <TrendingUp size={15} className="text-primary" />
            Mushroomie SEO
          </div>
          <div className={`flex items-center gap-1.5 font-bold text-sm ${scoreColor}`}>
            <span>{scoreLabel}</span>
            <span className="tabular-nums">{score} / 100</span>
          </div>
        </div>
        <div className="p-4">
          <SegmentBar value={score} />
          <div className="mt-3">
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Từ khóa chính (Focus Keyword)</label>
            <input
              type="text"
              placeholder="Ví dụ: vòng tay handmade"
              value={form.focus_keyword || ''}
              onChange={e => setForm((p: any) => ({ ...p, focus_keyword: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
            />
            <p className="text-xs text-neutral-400 mt-1">Hệ thống sẽ phân tích dựa trên từ khóa này.</p>
          </div>
        </div>
      </div>

      {/* ─── SEO Preview + Title/Slug/Desc ─── */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-neutral-100 text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            ⚙ Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${activeTab === 'social' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            🌐 Preview
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* SEO Title */}
            <div className="space-y-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              <LengthGauge value={seoTitleLen} min={30} ideal={60} max={100} label="Tiêu đề SEO" />
              <input
                value={form.seo_title}
                onChange={e => setForm((p: any) => ({ ...p, seo_title: e.target.value }))}
                placeholder={form.title || 'Nhập tiêu đề SEO...'}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none bg-white"
              />
              <p className="text-xs text-neutral-400">Sẽ xuất hiện ở dòng đầu tiên khi hiển thị trong kết quả tìm kiếm.</p>
            </div>

            {/* Slug */}
            <div className="space-y-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              <LengthGauge value={slugLen} min={15} ideal={75} max={120} label="Liên kết cố định (Slug)" />
              <input
                value={form.slug}
                onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value }))}
                placeholder="duong-dan-bai-viet"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none bg-white font-mono text-xs"
              />
              <p className="text-xs text-neutral-400">URL duy nhất của trang này trong kết quả tìm kiếm.</p>
            </div>

            {/* Meta Description */}
            <div className="space-y-2 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
              <LengthGauge value={metaLen} min={120} ideal={160} max={230} label="Thẻ mô tả (Meta Description)" />
              <textarea
                value={form.meta_description}
                onChange={e => setForm((p: any) => ({ ...p, meta_description: e.target.value }))}
                rows={3}
                placeholder="Viết mô tả 120–160 ký tự, có chứa từ khóa chính."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-primary outline-none resize-none bg-white"
              />
              <p className="text-xs text-neutral-400">Nội dung xuất hiện làm mô tả khi bài viết hiển thị trên Google.</p>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="p-4 space-y-4">
            {/* Preview toggle */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Xem trước Google</p>
              <div className="flex gap-1">
                <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'desktop' ? 'bg-primary text-white' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                  <Monitor size={14} />
                </button>
                <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 rounded-lg transition-colors ${previewDevice === 'mobile' ? 'bg-primary text-white' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            {/* Google snippet preview */}
            <div className={`border border-neutral-200 rounded-xl p-4 bg-white ${previewDevice === 'mobile' ? 'max-w-xs' : ''}`}>
              <p className="text-xs text-neutral-400 truncate mb-0.5">https://mushroomie.io.vn/tin-tuc/{displaySlug}</p>
              <p className={`text-blue-700 font-medium leading-snug mt-0.5 ${previewDevice === 'desktop' ? 'text-[18px]' : 'text-[16px]'} line-clamp-1`}>
                {displayTitle}
              </p>
              <p className="text-sm text-neutral-600 mt-1 line-clamp-2 leading-relaxed text-[13px]">
                {displayDesc}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── SEO Checklist ─── */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <p className="text-sm font-bold text-neutral-800">Kết quả phân tích SEO</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {groupedResults.map(({ group, items }) => {
              if (!items.length) return null
              const badge = getGroupBadge(items)
              const isExpanded = expandedGroups[group]
              const info = GROUP_INFO[group]
              return (
                <div key={group}>
                  <button
                    onClick={() => setExpandedGroups(p => ({ ...p, [group]: !isExpanded }))}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{info.icon}</span>
                      <span className="text-sm font-semibold text-neutral-700">{info.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.txt}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {items.map((r, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          {r.status === 'success' && <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />}
                          {r.status === 'warning' && <AlertCircle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />}
                          {r.status === 'error' && <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />}
                          <span className={r.status === 'success' ? 'text-neutral-600' : r.status === 'warning' ? 'text-orange-700' : 'text-red-600'}>
                            {r.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
