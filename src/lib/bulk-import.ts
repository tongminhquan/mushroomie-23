import ExcelJS from 'exceljs'
import { generateSlug } from '@/lib/utils'

/**
 * Đăng bài tự động (bulk import) — port tính năng từ app desktop
 * "PMEDIA Đăng Bài Tự Động WordPress" vào admin Mushroomie.
 *
 * Excel/CSV đầu vào:
 *   Cột bắt buộc : title, content
 *   Cột tùy chọn : ma_bai, featured_image_url, category, tags, status,
 *                  publish_date, slug, meta_description
 *
 * Quy ước ảnh theo mã bài (khớp app gốc):
 *   Ảnh đại diện : {ma_bai}_bg.* | {ma_bai}_thumb.* | {ma_bai}_thumbnail.* | {ma_bai}_featured.*
 *   Ảnh nội dung : {ma_bai}_1.* , {ma_bai}_2.* , ...
 *   Đuôi hỗ trợ  : .jpg .jpeg .png .webp
 */

export const BULK_IMPORT_MAX_ROWS = 100

export type BulkRowStatus = 'draft' | 'published' | 'scheduled'

export interface BulkImportRow {
  index: number
  title: string
  content: string
  ma_bai: string
  featured_image_url: string
  category: string
  tags: string[]
  status: BulkRowStatus
  /** ISO string khi hợp lệ, null nếu không có */
  publish_date: string | null
  slug: string
  meta_description: string
  warnings: string[]
  /** Tên file ảnh đại diện khớp quy ước (trong danh sách ảnh tải lên) */
  featuredImageFile: string | null
  /** Tên file ảnh nội dung khớp quy ước, sắp theo số thứ tự */
  contentImageFiles: string[]
}

const REQUIRED_COLUMNS = ['title', 'content'] as const
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
const FEATURED_SUFFIXES = ['bg', 'thumb', 'thumbnail', 'featured'] as const

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đ]/g, 'd')
    .trim()
    .replace(/\s+/g, '_')
}

/** Header tiếng Việt/biến thể → tên cột chuẩn của app */
const HEADER_ALIASES: Record<string, string> = {
  title: 'title', tieu_de: 'title',
  content: 'content', noi_dung: 'content',
  ma_bai: 'ma_bai', mabai: 'ma_bai',
  featured_image_url: 'featured_image_url', anh_dai_dien: 'featured_image_url',
  category: 'category', danh_muc: 'category', chuyen_muc: 'category',
  tags: 'tags', the: 'tags', tu_khoa: 'tags',
  status: 'status', trang_thai: 'status',
  publish_date: 'publish_date', ngay_dang: 'publish_date', lich_dang: 'publish_date',
  slug: 'slug', duong_dan: 'slug',
  meta_description: 'meta_description', mo_ta: 'meta_description', the_mo_ta: 'meta_description',
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    // ExcelJS: rich text / hyperlink / formula cell values
    if (Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map((p) => p.text || '').join('')
    }
    if (typeof v.text === 'string') return v.text
    if (v.result !== undefined) return cellToString(v.result)
    if (typeof v.hyperlink === 'string') return String(v.text ?? v.hyperlink)
    return ''
  }
  return String(value)
}

function normalizeStatus(raw: string): BulkRowStatus {
  const s = normalizeHeader(raw)
  if (['published', 'publish', 'cong_khai', 'xuat_ban', 'dang'].includes(s)) return 'published'
  if (['scheduled', 'schedule', 'future', 'len_lich', 'hen_gio'].includes(s)) return 'scheduled'
  return 'draft'
}

function parsePublishDate(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Hỗ trợ "dd/mm/yyyy hh:mm" phổ biến trong Excel VN
  const vn = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (vn) {
    const [, d, m, y, hh = '0', mm = '0'] = vn
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm))
    return isNaN(date.getTime()) ? null : date
  }
  const date = new Date(trimmed)
  return isNaN(date.getTime()) ? null : date
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Parser CSV thủ công: xử lý ngoặc kép, dấu phẩy và xuống dòng trong ô (content HTML) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const src = text.replace(/^﻿/, '') // bỏ BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field); field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  // Bỏ các dòng trống hoàn toàn
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

async function readTable(buffer: Buffer, filename: string): Promise<string[][]> {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
    return parseCsv(buffer.toString('utf8'))
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []

  const rows: string[][] = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = []
    // row.cellCount dựa trên cột có dữ liệu; duyệt theo header dài nhất
    const cellCount = Math.max(row.cellCount, sheet.columnCount)
    for (let col = 1; col <= cellCount; col++) {
      values.push(cellToString(row.getCell(col).value).trim())
    }
    rows.push(values)
  })
  return rows.filter((r) => r.some((c) => c !== ''))
}

/** Khớp ảnh tải lên với ma_bai theo quy ước của app */
export function matchImagesForRow(maBai: string, imageNames: string[]) {
  const result = { featured: null as string | null, content: [] as string[] }
  if (!maBai) return result

  const prefix = maBai.toLowerCase()
  const extPattern = IMAGE_EXTENSIONS.join('|')
  const featuredRe = new RegExp(`^(${FEATURED_SUFFIXES.join('|')})\\.(${extPattern})$`, 'i')
  const contentRe = new RegExp(`^(\\d+)\\.(${extPattern})$`, 'i')

  const contentMatches: Array<{ name: string; order: number }> = []
  for (const name of imageNames) {
    const lower = name.toLowerCase()
    if (!lower.startsWith(`${prefix}_`)) continue
    const rest = lower.slice(prefix.length + 1)
    if (!result.featured && featuredRe.test(rest)) {
      result.featured = name
      continue
    }
    const m = rest.match(contentRe)
    if (m) contentMatches.push({ name, order: Number(m[1]) })
  }
  contentMatches.sort((a, b) => a.order - b.order)
  result.content = contentMatches.map((m) => m.name)
  return result
}

export interface ParseResult {
  rows: BulkImportRow[]
  errors: string[]
  /** Ảnh tải lên không khớp với bất kỳ ma_bai nào (cảnh báo giống app) */
  unmatchedImages: string[]
}

export async function parseBulkImportFile(
  buffer: Buffer,
  filename: string,
  imageNames: string[],
): Promise<ParseResult> {
  const errors: string[] = []
  let table: string[][]
  try {
    table = await readTable(buffer, filename)
  } catch {
    return { rows: [], errors: ['Không đọc được file. Hỗ trợ định dạng .xlsx và .csv.'], unmatchedImages: [] }
  }

  if (table.length < 2) {
    return { rows: [], errors: ['File không có dữ liệu (cần dòng tiêu đề + ít nhất 1 dòng bài viết).'], unmatchedImages: [] }
  }

  const headers = table[0].map((h) => HEADER_ALIASES[normalizeHeader(h)] || normalizeHeader(h))
  for (const required of REQUIRED_COLUMNS) {
    if (!headers.includes(required)) errors.push(`Thiếu cột bắt buộc: ${required}`)
  }
  if (errors.length > 0) return { rows: [], errors, unmatchedImages: [] }

  const dataRows = table.slice(1)
  if (dataRows.length > BULK_IMPORT_MAX_ROWS) {
    errors.push(`File có ${dataRows.length} dòng — vượt giới hạn ${BULK_IMPORT_MAX_ROWS} bài/lần. Vui lòng tách nhỏ file.`)
    return { rows: [], errors, unmatchedImages: [] }
  }

  const col = (row: string[], name: string) => {
    const idx = headers.indexOf(name)
    return idx >= 0 ? (row[idx] ?? '').trim() : ''
  }

  const now = Date.now()
  const seenSlugs = new Set<string>()
  const matchedImages = new Set<string>()
  const rows: BulkImportRow[] = []

  dataRows.forEach((raw, i) => {
    const warnings: string[] = []
    const title = col(raw, 'title')
    const content = col(raw, 'content')
    const maBai = col(raw, 'ma_bai')

    if (!title) warnings.push('Thiếu title — dòng sẽ bị bỏ qua khi đăng.')
    if (!content) warnings.push('Thiếu content — dòng sẽ bị bỏ qua khi đăng.')
    if (maBai && /[\sÀ-ỹ]/.test(maBai)) {
      warnings.push('ma_bai chứa khoảng trắng hoặc tiếng Việt có dấu — không khớp được ảnh.')
    }

    let slug = col(raw, 'slug') || (maBai ? generateSlug(maBai) : '') || generateSlug(title)
    if (slug && seenSlugs.has(slug)) {
      warnings.push(`Slug "${slug}" trùng với dòng phía trên trong file — dòng này sẽ ghi đè dòng trước.`)
    }
    if (slug) seenSlugs.add(slug)

    let status = normalizeStatus(col(raw, 'status'))
    const publishDate = parsePublishDate(col(raw, 'publish_date'))
    if (col(raw, 'publish_date') && !publishDate) {
      warnings.push('publish_date không hợp lệ (dùng dd/mm/yyyy hh:mm hoặc ISO) — bỏ qua lịch đăng.')
    }
    if (publishDate && publishDate.getTime() > now) {
      if (status !== 'draft') status = 'scheduled'
    } else if (status === 'scheduled') {
      warnings.push('status=scheduled nhưng publish_date trống/quá khứ — chuyển về draft.')
      status = 'draft'
    }

    const images = matchImagesForRow(maBai, imageNames)
    if (images.featured) matchedImages.add(images.featured)
    images.content.forEach((n) => matchedImages.add(n))

    const featuredImageUrl = col(raw, 'featured_image_url')
    if (maBai && !images.featured && !featuredImageUrl) {
      warnings.push(`Không tìm thấy ảnh đại diện cho ma_bai "${maBai}" (${maBai}_bg.jpg...).`)
    }

    rows.push({
      index: i + 1,
      title,
      content,
      ma_bai: maBai,
      featured_image_url: featuredImageUrl,
      category: col(raw, 'category'),
      tags: parseTags(col(raw, 'tags')),
      status,
      publish_date: publishDate ? publishDate.toISOString() : null,
      slug,
      meta_description: col(raw, 'meta_description'),
      warnings,
      featuredImageFile: images.featured,
      contentImageFiles: images.content,
    })
  })

  const unmatchedImages = imageNames.filter((n) => !matchedImages.has(n))
  return { rows, errors, unmatchedImages }
}

/**
 * Thay tham chiếu ảnh local trong content HTML bằng URL /uploads sau khi upload.
 * Khớp cả src="ten-file_1.jpg" lẫn src=".../duong/dan/ten-file_1.jpg".
 */
export function rewriteContentImages(content: string, replacements: Map<string, string>): string {
  let result = content
  for (const [originalName, uploadedUrl] of replacements) {
    const escaped = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(src=["'])([^"']*[/\\\\])?${escaped}(["'])`, 'gi')
    result = result.replace(re, `$1${uploadedUrl}$3`)
  }
  return result
}
