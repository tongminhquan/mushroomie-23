'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  ListChecks,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'
import { AdminCard, AdminStatusBadge } from '@/components/admin/AdminUI'

interface ConfigStatus {
  configured: boolean
  siteUrl?: string
  missing: string[]
}

interface PreviewPost {
  rowNumber: number
  title: string
  slug?: string
  maBai?: string
  category?: string
  tags: string[]
  status: string
  seoTitle?: string
  metaDescription?: string
  focusKeywords: string[]
  imageMatch: {
    featured: boolean
    contentImages: number
  }
}

interface PublishResult {
  rowNumber: number
  title: string
  status: 'success' | 'failed' | 'skipped'
  action?: 'created' | 'updated' | 'skipped'
  link?: string
  wordpressId?: number
  error?: string
}

interface PreviewResponse {
  posts: PreviewPost[]
  orphanImages: string[]
  extractedImages: number
}

interface PublishResponse {
  results: PublishResult[]
  orphanImages: string[]
  extractedImages: number
}

export default function WordPressAutoPosterClient() {
  const formRef = useRef<HTMLFormElement>(null)
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [busy, setBusy] = useState<'preview' | 'publish' | 'test' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [publish, setPublish] = useState<PublishResponse | null>(null)

  const loadConfig = async () => {
    setLoadingConfig(true)
    try {
      const response = await fetch('/api/admin/wordpress', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Không tải được cấu hình WordPress')
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được cấu hình WordPress')
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const submit = async (action: 'preview' | 'publish' | 'test') => {
    if (!formRef.current) return
    setBusy(action)
    setError(null)
    setMessage(null)
    if (action === 'preview') setPublish(null)

    try {
      const formData = new FormData(formRef.current)
      formData.set('action', action)

      const response = await fetch('/api/admin/wordpress', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Thao tác thất bại')

      if (action === 'preview') {
        setPreview(data)
        setMessage(`Đã đọc ${data.posts.length} bài từ file import.`)
      } else if (action === 'publish') {
        setPublish(data)
        setMessage(`Đã xử lý ${data.results.length} bài WordPress.`)
      } else {
        setMessage(data.message || 'Kết nối WordPress hợp lệ.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thao tác thất bại')
    } finally {
      setBusy(null)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit('preview')
  }

  const successCount = publish?.results.filter((result) => result.status === 'success').length || 0
  const failedCount = publish?.results.filter((result) => result.status === 'failed').length || 0
  const skippedCount = publish?.results.filter((result) => result.status === 'skipped').length || 0
  const previewCount = preview?.posts.length || 0
  const extractedImages = preview?.extractedImages || publish?.extractedImages || 0
  const orphanImages = preview?.orphanImages.length || publish?.orphanImages.length || 0
  const isConfigured = Boolean(config?.configured)

  return (
    <div className="min-h-screen bg-theme-page px-4 py-6 text-theme-primary md:px-6">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <section className="overflow-hidden rounded-lg border border-[#ead8cd] bg-white shadow-[0_18px_48px_rgba(91,48,35,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-[#f0dfd4] bg-[var(--wordpress-automation-hero)] p-6 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                <Sparkles size={14} />
                WordPress automation
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-theme-primary md:text-4xl">
                Đăng bài tự động từ Excel và ZIP ảnh
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-theme-secondary">
                Import bài SEO, ghép ảnh theo mã bài, kiểm tra preview và gửi bài sang WordPress qua REST API. Thiết kế theo luồng thao tác rõ ràng để hạn chế đăng nhầm.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">Excel/CSV</span>
                <span className="rounded-full bg-[#ffe7a3] px-3 py-1 text-xs font-bold text-[#6b4a1f]">ZIP ảnh</span>
                <span className="rounded-full bg-[#fff] px-3 py-1 text-xs font-bold text-[#b9794b] ring-1 ring-[#ead8cd]">Rank Math</span>
              </div>
            </div>

            <div className="grid content-between gap-4 bg-[#2b2b2b] p-6 text-white">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffe7a3]">Trạng thái kết nối</p>
                  <button
                    type="button"
                    onClick={loadConfig}
                    className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/16 disabled:opacity-60"
                    disabled={loadingConfig}
                  >
                    <RefreshCw size={16} className={loadingConfig ? 'animate-spin' : ''} />
                    Tải lại
                  </button>
                </div>

                {isConfigured ? (
                  <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 font-bold text-emerald-100">
                      <CheckCircle2 size={18} />
                      WordPress đã sẵn sàng
                    </div>
                    <div className="mt-2 break-all text-sm text-emerald-50">{config?.siteUrl}</div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
                    <div className="flex items-center gap-2 font-bold text-amber-100">
                      <AlertTriangle size={18} />
                      Chưa đủ cấu hình
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-50">
                      Bổ sung biến môi trường WordPress trên server trước khi publish thật.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => submit('test')}
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-[4px] bg-theme-card px-4 text-sm font-bold text-theme-primary transition hover:bg-[#ffe7a3] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy === 'test' || !isConfigured}
              >
                <RefreshCw size={16} className={busy === 'test' ? 'animate-spin' : ''} />
                Kiểm tra kết nối
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Bài đã đọc', value: previewCount, icon: FileText, tone: 'bg-[#fff] text-primary' },
            { label: 'Ảnh đã ghép', value: extractedImages, icon: ImagePlus, tone: 'bg-[#fff] text-[#b9794b]' },
            { label: 'Ảnh chưa khớp', value: orphanImages, icon: Archive, tone: 'bg-[#fff] text-amber-700' },
            { label: 'Đăng thành công', value: successCount, icon: CheckCircle2, tone: 'bg-[#fff] text-emerald-700' },
          ].map((item) => (
            <AdminCard key={item.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-lg border border-[#ead8cd] ${item.tone}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-theme-muted">{item.label}</p>
                  <p className="text-2xl font-bold text-theme-primary">{item.value}</p>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AdminCard className="overflow-hidden">
            <div className="border-b border-[#ead8cd] bg-white px-5 py-4">
              <h2 className="text-xl font-bold text-theme-primary">Quy trình import</h2>
              <p className="mt-1 text-sm text-theme-secondary">Làm theo thứ tự: chọn file, preview, kiểm tra, sau đó mới đăng sang WordPress.</p>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="space-y-5 p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block rounded-lg border border-[#ead8cd] bg-theme-elevated p-4 transition hover:border-primary/40 hover:bg-theme-card">
                  <span className="flex items-center gap-2 text-sm font-bold text-theme-primary">
                    <FileSpreadsheet size={18} className="text-primary" />
                    File Excel/CSV bài viết
                  </span>
                  <input
                    name="spreadsheet"
                    type="file"
                    accept=".xlsx,.csv"
                    className="mt-4 block w-full rounded-[4px] border border-[#c3c4c7] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-[4px] file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                    required
                  />
                  <span className="mt-2 block text-xs leading-5 text-theme-secondary">
                    Hỗ trợ cột title/content hoặc Tiêu đề SEO/Nội dung HTML thuần.
                  </span>
                </label>

                <label className="block rounded-lg border border-[#ead8cd] bg-theme-elevated p-4 transition hover:border-primary/40 hover:bg-theme-card">
                  <span className="flex items-center gap-2 text-sm font-bold text-theme-primary">
                    <Archive size={18} className="text-[#b9794b]" />
                    ZIP ảnh theo mã bài
                  </span>
                  <input
                    name="imageZip"
                    type="file"
                    accept=".zip"
                    className="mt-4 block w-full rounded-[4px] border border-[#c3c4c7] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-[4px] file:border-0 file:bg-[#2b2b2b] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
                  />
                  <span className="mt-2 block text-xs leading-5 text-theme-secondary">
                    Tên ảnh dạng ma_bai_bg.jpg, ma_bai_1.jpg, ma_bai_2.webp.
                  </span>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-theme-primary">Trạng thái mặc định</span>
                  <select name="defaultStatus" defaultValue="draft" className="h-10 w-full rounded-[4px] border border-[#8c8f94] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="draft">Nháp</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="publish">Xuất bản</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-theme-primary">Ảnh nội dung tối đa/bài</span>
                  <input
                    name="maxImagesPerPost"
                    type="number"
                    min={0}
                    max={6}
                    defaultValue={2}
                    className="h-10 w-full rounded-[4px] border border-[#8c8f94] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-[#ead8cd] bg-theme-card px-4 py-3 text-sm font-semibold text-theme-primary">
                  <input name="updateDuplicates" type="checkbox" value="true" defaultChecked className="h-4 w-4 accent-primary" />
                  Cập nhật bài trùng slug/tiêu đề
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#ead8cd] pt-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-primary bg-theme-card px-5 text-sm font-bold text-primary transition hover:bg-theme-subtle disabled:opacity-60"
                >
                  <Upload size={18} />
                  {busy === 'preview' ? 'Đang đọc file...' : 'Preview import'}
                </button>
                <button
                  type="button"
                  disabled={busy !== null || !isConfigured}
                  onClick={() => submit('publish')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={18} />
                  {busy === 'publish' ? 'Đang gửi WordPress...' : 'Đăng sang WordPress'}
                </button>
              </div>
            </form>
          </AdminCard>

          <div className="space-y-4">
            <AdminCard className="p-5">
              <div className="flex items-center gap-2">
                <Wand2 size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-theme-primary">Các bước xử lý</h2>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  'Đọc dữ liệu bài viết từ Excel/CSV.',
                  'Ghép ảnh đại diện và ảnh nội dung theo mã bài.',
                  'Preview toàn bộ bài trước khi gửi thật.',
                  'Gửi bài và Rank Math meta sang WordPress.',
                ].map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-lg border border-[#ead8cd] bg-theme-elevated p-3">
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm leading-6 text-theme-secondary">{step}</p>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard className="p-5">
              <div className="flex items-center gap-2">
                <ListChecks size={20} className="text-[#b9794b]" />
                <h2 className="text-lg font-bold text-theme-primary">Plugin Rank Math</h2>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-theme-secondary">
                <div>1. Cài plugin wordpress-auto-poster-rank-math-rest-meta.zip trên WordPress.</div>
                <div>2. Kích hoạt plugin.</div>
                <div>3. Import lại nếu SEO title/meta/focus keyword chưa vào Rank Math.</div>
              </div>
            </AdminCard>

            {!isConfigured && (
              <AdminCard className="p-5">
                <div className="mb-2 flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle size={18} />
                  Thiếu biến môi trường
                </div>
                <pre className="overflow-x-auto rounded-lg bg-[#1d2327] p-3 text-xs leading-5 text-white">
{`WORDPRESS_SITE_URL=https://example.com
WORDPRESS_USERNAME=admin-user
WORDPRESS_APPLICATION_PASSWORD=xxxx xxxx xxxx xxxx`}
                </pre>
                {config?.missing?.length ? (
                  <div className="mt-3 text-sm text-theme-secondary">Đang thiếu: {config.missing.join(', ')}</div>
                ) : null}
              </AdminCard>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        )}
        {message && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>
        )}

        {preview && (
          <AdminCard className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#ead8cd] bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-theme-primary">Preview import</h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  {preview.posts.length} bài, {preview.extractedImages} ảnh khớp mã bài, {preview.orphanImages.length} ảnh không khớp.
                </p>
              </div>
              <AdminStatusBadge tone={preview.orphanImages.length ? 'warning' : 'success'}>
                {preview.orphanImages.length ? 'Cần kiểm tra ảnh' : 'Dữ liệu ổn'}
              </AdminStatusBadge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="border-b border-[#dcdcde] bg-theme-subtle text-left text-[11px] font-bold uppercase tracking-[0.06em] text-theme-secondary">
                  <tr>
                    <th className="px-4 py-3">Dòng</th>
                    <th className="px-4 py-3">Tiêu đề</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">SEO</th>
                    <th className="px-4 py-3">Ảnh</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="m-admin-rows divide-y divide-[#f0f0f1]">
                  {preview.posts.map((post) => (
                    <tr key={`${post.rowNumber}-${post.title}`} className="hover:bg-theme-subtle">
                      <td className="px-4 py-3 text-theme-secondary">{post.rowNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-theme-primary">{post.title}</div>
                        <div className="mt-1 text-xs text-theme-secondary">{post.maBai || 'Không có mã bài'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#b9794b]">{post.slug || 'Tự sinh bởi WordPress'}</td>
                      <td className="px-4 py-3 text-xs text-theme-secondary">
                        <div>{post.seoTitle || post.title}</div>
                        <div className="mt-1 line-clamp-1">{post.focusKeywords.join(', ') || 'Chưa có keyword'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <AdminStatusBadge tone={post.imageMatch.featured ? 'success' : 'neutral'}>Ảnh đại diện</AdminStatusBadge>
                          <AdminStatusBadge tone={post.imageMatch.contentImages > 0 ? 'info' : 'neutral'}>
                            {post.imageMatch.contentImages} ảnh nội dung
                          </AdminStatusBadge>
                        </div>
                      </td>
                      <td className="px-4 py-3"><AdminStatusBadge tone="warning">{post.status}</AdminStatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}

        {publish && (
          <AdminCard className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#ead8cd] bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-theme-primary">Kết quả đăng WordPress</h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  Thành công {successCount}, lỗi {failedCount}, bỏ qua {skippedCount}.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="border-b border-[#dcdcde] bg-theme-subtle text-left text-[11px] font-bold uppercase tracking-[0.06em] text-theme-secondary">
                  <tr>
                    <th className="px-4 py-3">Dòng</th>
                    <th className="px-4 py-3">Tiêu đề</th>
                    <th className="px-4 py-3">Kết quả</th>
                    <th className="px-4 py-3">WordPress</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f1]">
                  {publish.results.map((result) => (
                    <tr key={`${result.rowNumber}-${result.title}`} className="hover:bg-theme-subtle">
                      <td className="px-4 py-3 text-theme-secondary">{result.rowNumber}</td>
                      <td className="px-4 py-3 font-semibold text-theme-primary">{result.title}</td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={result.status === 'success' ? 'success' : result.status === 'skipped' ? 'warning' : 'danger'}>
                          {result.action || result.status}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        {result.link ? (
                          <a href={result.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink size={14} />
                            Mở bài
                          </a>
                        ) : (
                          <span className="text-theme-secondary">Không có link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">{result.error || `ID ${result.wordpressId || ''}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}

        <AdminCard className="p-5">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-theme-primary">
            <FileText size={20} />
            Cột hỗ trợ từ app gốc
          </div>
          <div className="grid gap-3 text-sm leading-6 text-theme-secondary md:grid-cols-2">
            <div>Tiêu đề SEO hoặc title dùng cho tiêu đề WordPress và Rank Math title.</div>
            <div>Nội dung HTML thuần hoặc content dùng cho nội dung bài viết.</div>
            <div>Mô tả Meta SEO dùng cho excerpt và Rank Math description.</div>
            <div>Từ khóa chính, Từ khóa phụ đã phủ thêm dùng cho Rank Math focus keyword.</div>
            <div>Danh mục, tags, Slug, Trạng thái, Ngày đăng được map sang WordPress REST.</div>
            <div>ma_bai dùng để ghép ảnh trong ZIP theo quy ước ma_bai_bg, ma_bai_1.</div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
