'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Clock, Download,
  FileSpreadsheet, Images, Loader2, UploadCloud,
} from 'lucide-react'

/**
 * Đăng bài tự động (bulk import) — port từ app desktop
 * "PMEDIA Đăng Bài Tự Động WordPress" vào admin Mushroomie.
 *
 * Quy trình: chọn Excel/CSV + ảnh → Xem trước → Đăng theo file.
 * Bài có publish_date tương lai sẽ ở trạng thái "Chờ đăng" và được
 * server tự xuất bản đúng giờ (job chạy mỗi 60 giây).
 */

interface PreviewRow {
  index: number
  title: string
  ma_bai: string
  slug: string
  status: string
  publish_date: string | null
  contentLength: number
  warnings: string[]
  featuredImageFile: string | null
  contentImageFiles: string[]
  action: 'create' | 'update' | 'skipped'
}

interface PreviewData {
  rows: PreviewRow[]
  unmatchedImages: string[]
  summary: { total: number; images: number; willUpdate: number }
}

interface ResultRow {
  index: number
  title: string
  slug: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  status: string
  url: string | null
  message: string
}

interface ResultData {
  results: ResultRow[]
  summary: { total: number; created: number; updated: number; scheduled: number; failed: number; skipped: number }
}

const statusLabel: Record<string, string> = {
  draft: '🟡 Nháp',
  published: '🟢 Công khai',
  scheduled: '⏰ Chờ đăng',
}

const actionLabel: Record<string, string> = {
  create: 'Tạo mới',
  update: 'Cập nhật',
  created: '✅ Đã tạo',
  updated: '🔄 Đã cập nhật',
  skipped: '⏭ Bỏ qua',
  error: '❌ Lỗi',
}

export default function BulkImportPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState<'preview' | 'commit' | null>(null)
  const [error, setError] = useState('')
  const excelInputRef = useRef<HTMLInputElement>(null)
  const imagesInputRef = useRef<HTMLInputElement>(null)

  const submit = async (mode: 'preview' | 'commit') => {
    if (!excelFile) { setError('Vui lòng chọn file Excel (.xlsx) hoặc CSV.'); return }
    setLoading(mode)
    setError('')
    if (mode === 'preview') { setPreview(null); setResult(null) }

    try {
      const form = new FormData()
      form.append('mode', mode)
      form.append('file', excelFile)
      imageFiles.forEach((f) => form.append('images', f))

      const res = await fetch('/api/posts/bulk-import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || (data.errors || []).join(' • ') || 'Có lỗi xảy ra')

      if (mode === 'preview') setPreview(data)
      else { setResult(data); setPreview(null) }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(null)
    }
  }

  const downloadResultCsv = () => {
    if (!result) return
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [
      ['stt', 'title', 'slug', 'ket_qua', 'trang_thai', 'link', 'ghi_chu'].join(','),
      ...result.results.map((r) => [
        r.index, esc(r.title), esc(r.slug), r.action, r.status,
        esc(r.url ? `${window.location.origin}${r.url}` : ''), esc(r.message),
      ].join(',')),
    ]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ket-qua-dang-bai-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—')

  return (
    <div className="p-6 max-w-[1200px]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bai-viet" className="p-2 hover:bg-primary-light rounded-lg transition-colors text-neutral-500 hover:text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400 mb-1">Nội dung &amp; hệ thống</div>
          <h1 className="font-heading text-2xl font-bold text-neutral-800">⚡ Đăng bài tự động</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Nhập bài viết hàng loạt từ Excel/CSV kèm ảnh theo mã bài — hỗ trợ hẹn giờ đăng tự động.
          </p>
        </div>
      </div>

      {/* ── Hướng dẫn nhanh ── */}
      <div className="bg-[#fff7f2] border-[1.5px] border-[#ffd6d6] rounded-[14px] p-4 mb-6 text-sm text-neutral-700 space-y-1">
        <p className="font-semibold text-neutral-800">📋 Định dạng file (giống app PMEDIA Đăng Bài Tự Động):</p>
        <p>• Cột bắt buộc: <code className="bg-white px-1 rounded">title</code>, <code className="bg-white px-1 rounded">content</code> — Tùy chọn: <code className="bg-white px-1 rounded">ma_bai</code>, <code className="bg-white px-1 rounded">featured_image_url</code>, <code className="bg-white px-1 rounded">category</code>, <code className="bg-white px-1 rounded">tags</code>, <code className="bg-white px-1 rounded">status</code>, <code className="bg-white px-1 rounded">publish_date</code>, <code className="bg-white px-1 rounded">slug</code>, <code className="bg-white px-1 rounded">meta_description</code></p>
        <p>• Ảnh đại diện: <code className="bg-white px-1 rounded">{'{ma_bai}'}_bg.jpg</code> — Ảnh nội dung: <code className="bg-white px-1 rounded">{'{ma_bai}'}_1.jpg</code>, <code className="bg-white px-1 rounded">{'{ma_bai}'}_2.jpg</code>… (jpg/png/webp)</p>
        <p>• <code className="bg-white px-1 rounded">publish_date</code> ở tương lai (vd <code className="bg-white px-1 rounded">25/12/2026 08:00</code>) → bài sẽ <strong>tự động đăng đúng giờ</strong>. Slug trùng bài cũ → cập nhật, không tạo bài đôi.</p>
        <p>
          • <a href="/uploads/mau-dang-bai-tu-dong.xlsx" download className="text-primary font-semibold hover:underline">⬇ Tải file mẫu Excel (.xlsx)</a> — có sheet hướng dẫn + quy ước tên ảnh
          {' '}hoặc <a href="/mau-dang-bai-tu-dong.csv" download className="text-primary font-semibold hover:underline">bản .csv</a>. Giữ nguyên dòng tiêu đề.
        </p>
      </div>

      {/* ── Bước 1: Chọn file ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => excelInputRef.current?.click()}
          className="bg-white rounded-[14px] border-[1.5px] border-dashed border-[#e2d3c8] hover:border-primary transition-colors p-6 text-center group"
        >
          <FileSpreadsheet size={28} className="mx-auto mb-2 text-[#b9794b] group-hover:text-primary transition-colors" />
          <div className="font-semibold text-sm text-neutral-800">
            {excelFile ? excelFile.name : 'Chọn file Excel / CSV'}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {excelFile ? `${(excelFile.size / 1024).toFixed(0)} KB` : '.xlsx hoặc .csv — tối đa 100 bài/lần'}
          </div>
        </button>
        <button
          onClick={() => imagesInputRef.current?.click()}
          className="bg-white rounded-[14px] border-[1.5px] border-dashed border-[#e2d3c8] hover:border-primary transition-colors p-6 text-center group"
        >
          <Images size={28} className="mx-auto mb-2 text-[#b9794b] group-hover:text-primary transition-colors" />
          <div className="font-semibold text-sm text-neutral-800">
            {imageFiles.length > 0 ? `${imageFiles.length} ảnh đã chọn` : 'Chọn ảnh theo mã bài (tùy chọn)'}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Đặt tên theo quy ước — ảnh tự chuyển WebP khi đăng</div>
        </button>
        <input
          ref={excelInputRef} type="file" accept=".xlsx,.csv" className="hidden"
          onChange={(e) => { setExcelFile(e.target.files?.[0] || null); setPreview(null); setResult(null) }}
        />
        <input
          ref={imagesInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden"
          onChange={(e) => { setImageFiles(Array.from(e.target.files || [])); setPreview(null) }}
        />
      </div>

      {/* ── Hành động ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => submit('preview')}
          disabled={!excelFile || loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 border-[1.5px] border-[#e2d3c8] bg-white rounded-lg font-semibold text-sm text-neutral-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {loading === 'preview' ? <Loader2 size={15} className="animate-spin" /> : '👁'} Xem trước
        </button>
        <button
          onClick={() => submit('commit')}
          disabled={!preview || loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          title={!preview ? 'Hãy Xem trước để kiểm tra dữ liệu trước khi đăng' : ''}
        >
          {loading === 'commit' ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
          {loading === 'commit' ? 'Đang đăng…' : 'Đăng theo file'}
        </button>
        {error && (
          <span className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-center gap-1.5">
            <AlertTriangle size={13} /> {error}
          </span>
        )}
      </div>

      {/* ── Preview ── */}
      {preview && (
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0e0d6] shadow-card overflow-hidden mb-6">
          <div className="px-4 py-3 bg-[#fdfaf7] border-b-[1.5px] border-[#f0e0d6] flex items-center justify-between flex-wrap gap-2">
            <span className="font-heading text-sm text-neutral-900">
              Xem trước — {preview.summary.total} bài ({preview.summary.willUpdate} sẽ cập nhật bài cũ), {preview.summary.images} ảnh
            </span>
            {preview.unmatchedImages.length > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                ⚠ {preview.unmatchedImages.length} ảnh không khớp ma_bai: {preview.unmatchedImages.slice(0, 3).join(', ')}{preview.unmatchedImages.length > 3 ? '…' : ''}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-[#fcfbfa] border-b-[1.5px] border-[#f0e0d6]">
                <tr>
                  {['#', 'Tiêu đề', 'Slug', 'Hành động', 'Trạng thái', 'Hẹn đăng', 'Ảnh', 'Cảnh báo'].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400 ${i >= 6 ? 'text-left' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f6ece5]">
                {preview.rows.map((row) => (
                  <tr key={row.index} className="hover:bg-[#fdf6f2] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-400 text-xs">{row.index}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-neutral-800 max-w-[260px] truncate">{row.title || '(trống)'}</div>
                      <div className="text-xs text-neutral-400">{(row.contentLength / 1000).toFixed(1)}k ký tự</div>
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono text-[#b9794b] max-w-[180px] truncate">{row.slug}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold">{actionLabel[row.action]}</td>
                    <td className="py-2.5 px-4 text-xs">{statusLabel[row.status] || row.status}</td>
                    <td className="py-2.5 px-4 text-xs text-neutral-500">{fmtTime(row.publish_date)}</td>
                    <td className="py-2.5 px-4 text-xs text-neutral-500">
                      {row.featuredImageFile ? '🖼' : ''} {row.contentImageFiles.length > 0 ? `+${row.contentImageFiles.length}` : row.featuredImageFile ? '' : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-amber-700 max-w-[280px] whitespace-normal">
                      {row.warnings.length > 0 ? row.warnings.join(' • ') : <span className="text-green-600">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Kết quả ── */}
      {result && (
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0e0d6] shadow-card overflow-hidden">
          <div className="px-4 py-3 bg-[#fdfaf7] border-b-[1.5px] border-[#f0e0d6] flex items-center justify-between flex-wrap gap-2">
            <span className="font-heading text-sm text-neutral-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Hoàn tất: {result.summary.created} tạo mới • {result.summary.updated} cập nhật • {result.summary.scheduled} chờ đăng
              {result.summary.failed > 0 && <span className="text-red-600"> • {result.summary.failed} lỗi</span>}
              {result.summary.skipped > 0 && <span className="text-neutral-500"> • {result.summary.skipped} bỏ qua</span>}
            </span>
            <button
              onClick={downloadResultCsv}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Download size={13} /> Tải kết quả CSV (kèm link)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-[#fcfbfa] border-b-[1.5px] border-[#f0e0d6]">
                <tr>
                  {['#', 'Tiêu đề', 'Kết quả', 'Trạng thái', 'Ghi chú', 'Link'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f6ece5]">
                {result.results.map((r) => (
                  <tr key={r.index} className="hover:bg-[#fdf6f2] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-400 text-xs">{r.index}</td>
                    <td className="py-2.5 px-4 font-semibold text-neutral-800 max-w-[280px] truncate">{r.title}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold">{actionLabel[r.action] || r.action}</td>
                    <td className="py-2.5 px-4 text-xs">
                      {r.status === 'scheduled' ? (
                        <span className="inline-flex items-center gap-1 text-blue-700"><Clock size={12} /> Chờ đăng</span>
                      ) : (statusLabel[r.status] || r.status)}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-neutral-500 max-w-[300px] whitespace-normal">{r.message}</td>
                    <td className="py-2.5 px-4 text-xs">
                      {r.url ? (
                        <Link href={r.url} target="_blank" className="text-primary font-semibold hover:underline">Xem bài</Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state khi chưa làm gì */}
      {!preview && !result && !loading && (
        <div className="text-center py-10 text-neutral-400 text-sm">
          Chọn file Excel/CSV rồi bấm <strong>Xem trước</strong> để kiểm tra dữ liệu trước khi đăng.
        </div>
      )}
    </div>
  )
}
