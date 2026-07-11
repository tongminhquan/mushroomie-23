import net from 'node:net'
import { lookup } from 'node:dns/promises'
import path from 'node:path'
import JSZip from 'jszip'
import { Agent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from 'undici'

type SheetData = unknown[][]

export const WORDPRESS_AUTO_POSTER_LIMITS = {
  maxSpreadsheetBytes: 8 * 1024 * 1024,
  maxImageZipBytes: 60 * 1024 * 1024,
  maxImageBytes: 8 * 1024 * 1024,
  maxRows: 100,
  maxImagesPerPost: 6,
}

const REQUIRED_COLUMNS = new Set(['title', 'content'])
const FEATURED_IMAGE_SUFFIXES = new Set(['bg', 'thumb', 'thumbnail', 'featured'])
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const WORDPRESS_STATUSES = new Set(['draft', 'pending', 'publish', 'private', 'future'])

const COLUMN_ALIASES: Record<string, string[]> = {
  title: ['title', 'post title', 'tieu de', 'tieu de seo', 'tiêu đề', 'tiêu đề seo'],
  content: [
    'content',
    'noi dung',
    'noi dung html',
    'noi dung html thuan',
    'nội dung',
    'nội dung html',
    'nội dung html thuần',
  ],
  featuredImageUrl: [
    'featured image url',
    'featured_image_url',
    'anh dai dien',
    'url anh dai dien',
    'ảnh đại diện',
    'url ảnh đại diện',
  ],
  category: ['category', 'danh muc', 'danh mục'],
  tags: ['tags', 'tag', 'the', 'the wordpress', 'wordpress tags', 'thẻ', 'thẻ wordpress'],
  primaryKeyword: ['tu khoa chinh', 'keyword chinh', 'main keyword', 'từ khóa chính'],
  secondaryKeywords: [
    'tu khoa phu',
    'tu khoa phu da phu them',
    'secondary keywords',
    'từ khóa phụ',
    'từ khóa phụ đã phủ thêm',
  ],
  status: ['status', 'trang thai', 'trạng thái'],
  publishDate: ['publish date', 'publish_date', 'ngay dang', 'lich dang', 'ngày đăng', 'lịch đăng'],
  maBai: ['ma bai', 'ma_bai', 'id bai', 'code', 'mã bài'],
  slug: ['slug', 'duong dan', 'duong dan tinh', 'đường dẫn', 'đường dẫn tĩnh'],
  seoTitle: ['seo title', 'tieu de seo', 'rank math title', 'tiêu đề seo'],
  metaDescription: ['meta description', 'mo ta meta', 'mo ta meta seo', 'meta seo', 'mô tả meta', 'mô tả meta seo'],
}

export interface AutoPosterPost {
  rowNumber: number
  title: string
  content: string
  featuredImageUrl?: string
  category?: string
  tags: string[]
  status: string
  publishDate?: string
  maBai?: string
  slug?: string
  seoTitle?: string
  metaDescription?: string
  focusKeywords: string[]
}

export interface AutoPosterPreviewPost extends AutoPosterPost {
  imageMatch: {
    featured: boolean
    contentImages: number
  }
}

export interface AutoPosterImage {
  filename: string
  bytes: Uint8Array
  mimeType: string
}

export interface AutoPosterImageMatch {
  featured?: AutoPosterImage
  contentImages: AutoPosterImage[]
}

export interface AutoPosterImageBundle {
  matches: Map<string, AutoPosterImageMatch>
  orphanImages: string[]
  extractedCount: number
}

export interface WordPressAutoPosterConfig {
  siteUrl: string
  username: string
  applicationPassword: string
  timeoutMs: number
}

export interface WordPressAutoPosterConfigStatus {
  configured: boolean
  siteUrl?: string
  missing: string[]
}

export interface WordPressPublishOptions {
  defaultStatus: string
  maxImagesPerPost: number
  updateDuplicates: boolean
}

export type WordPressPublishStatus = 'success' | 'failed' | 'skipped'
export type WordPressPublishAction = 'created' | 'updated' | 'skipped'

export interface WordPressPublishResult {
  rowNumber: number
  title: string
  status: WordPressPublishStatus
  action?: WordPressPublishAction
  link?: string
  wordpressId?: number
  error?: string
}

interface UploadedMedia {
  id: number
  sourceUrl: string
  filename: string
}

interface WordPressPostSummary {
  id: number
  link?: string
  title?: {
    rendered?: string
  }
  slug?: string
}

export class WordPressAutoPosterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WordPressAutoPosterError'
  }
}

export function getWordPressAutoPosterConfigStatus(): WordPressAutoPosterConfigStatus {
  const missing: string[] = []
  if (!process.env.WORDPRESS_SITE_URL) missing.push('WORDPRESS_SITE_URL')
  if (!process.env.WORDPRESS_USERNAME) missing.push('WORDPRESS_USERNAME')
  if (!process.env.WORDPRESS_APPLICATION_PASSWORD) missing.push('WORDPRESS_APPLICATION_PASSWORD')

  let siteUrl: string | undefined
  if (process.env.WORDPRESS_SITE_URL) {
    try {
      siteUrl = normalizeExternalUrl(process.env.WORDPRESS_SITE_URL, { allowPrivateInDevelopment: true })
    } catch {
      missing.push('WORDPRESS_SITE_URL hợp lệ')
    }
  }

  return {
    configured: missing.length === 0,
    siteUrl,
    missing,
  }
}

export function getRequiredWordPressAutoPosterConfig(): WordPressAutoPosterConfig {
  const status = getWordPressAutoPosterConfigStatus()
  if (!status.configured || !status.siteUrl) {
    throw new WordPressAutoPosterError(`Thiếu cấu hình WordPress: ${status.missing.join(', ')}`)
  }

  return {
    siteUrl: status.siteUrl,
    username: process.env.WORDPRESS_USERNAME as string,
    applicationPassword: process.env.WORDPRESS_APPLICATION_PASSWORD as string,
    timeoutMs: Number(process.env.WORDPRESS_TIMEOUT_MS || 30000),
  }
}

export function normalizeWordPressStatus(value?: string | null, fallback = 'draft') {
  const status = cleanText(value)?.toLowerCase() || fallback
  return WORDPRESS_STATUSES.has(status) ? status : fallback
}

export async function parseAutoPosterSpreadsheet(
  buffer: Buffer,
  filename: string,
  defaultStatus = 'draft',
): Promise<AutoPosterPost[]> {
  const ext = path.extname(filename).toLowerCase()
  if (!['.xlsx', '.csv'].includes(ext)) {
    throw new WordPressAutoPosterError('File bài viết phải là .xlsx hoặc .csv')
  }

  let parsedSheet: { rows: Record<string, unknown>[]; columnMap: Record<string, string> } | null
  try {
    parsedSheet = ext === '.csv'
      ? findBestRows([{ sheet: 'CSV', data: parseCsv(buffer.toString('utf8')) }])
      : findBestRows(await readXlsxSheets(buffer))
  } catch (error) {
    throw new WordPressAutoPosterError(`Không đọc được file Excel/CSV: ${errorMessage(error)}`)
  }

  if (!parsedSheet) {
    throw new WordPressAutoPosterError(
      'Không tìm thấy sheet có cột tiêu đề/nội dung. Hỗ trợ title/content hoặc Tiêu đề SEO/Nội dung HTML thuần.',
    )
  }

  const { rows, columnMap } = parsedSheet
  const posts: AutoPosterPost[] = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (Object.values(row).every((value) => !cleanText(value))) continue

    const title = cleanText(readMappedValue(row, columnMap, 'title'))
    const content = cleanText(readMappedValue(row, columnMap, 'content'))
    if (!title || !content) {
      throw new WordPressAutoPosterError(`Dòng ${index + 2} thiếu tiêu đề hoặc nội dung`)
    }

    const primaryKeyword = cleanText(readMappedValue(row, columnMap, 'primaryKeyword'))
    const secondaryKeywords = parseList(readMappedValue(row, columnMap, 'secondaryKeywords'))
    const focusKeywords = uniqueList([primaryKeyword, ...secondaryKeywords].filter(Boolean) as string[])
    const status = normalizeWordPressStatus(cleanText(readMappedValue(row, columnMap, 'status')), defaultStatus)

    posts.push({
      rowNumber: index + 2,
      title,
      content,
      featuredImageUrl: cleanText(readMappedValue(row, columnMap, 'featuredImageUrl')) || undefined,
      category: cleanText(readMappedValue(row, columnMap, 'category')) || undefined,
      tags: parseList(readMappedValue(row, columnMap, 'tags')),
      status,
      publishDate: cleanText(readMappedValue(row, columnMap, 'publishDate')) || undefined,
      maBai: cleanText(readMappedValue(row, columnMap, 'maBai')) || undefined,
      slug: cleanText(readMappedValue(row, columnMap, 'slug')) || undefined,
      seoTitle: cleanText(readMappedValue(row, columnMap, 'seoTitle')) || title,
      metaDescription: cleanText(readMappedValue(row, columnMap, 'metaDescription')) || undefined,
      focusKeywords,
    })
  }

  if (posts.length === 0) {
    throw new WordPressAutoPosterError('File không có dòng bài viết hợp lệ')
  }

  if (posts.length > WORDPRESS_AUTO_POSTER_LIMITS.maxRows) {
    throw new WordPressAutoPosterError(
      `File có ${posts.length} bài, vượt giới hạn ${WORDPRESS_AUTO_POSTER_LIMITS.maxRows} bài mỗi lần import`,
    )
  }

  return posts
}

export async function parseAutoPosterImageZip(
  buffer: Buffer,
  maBaiValues: string[],
  maxImagesPerPost: number,
): Promise<AutoPosterImageBundle> {
  const normalizedCodes = uniqueList(maBaiValues.map((value) => value.trim()).filter(Boolean))
  const matches = new Map<string, AutoPosterImageMatch>()
  for (const code of normalizedCodes) {
    matches.set(code, { contentImages: [] })
  }

  if (normalizedCodes.length === 0) {
    return { matches, orphanImages: [], extractedCount: 0 }
  }

  let archive: JSZip
  try {
    archive = await JSZip.loadAsync(buffer)
  } catch (error) {
    throw new WordPressAutoPosterError(`Không đọc được ZIP ảnh: ${errorMessage(error)}`)
  }

  const entries = Object.values(archive.files)
    .filter((entry) => !entry.dir)
    .sort((a, b) => basenameFromArchiveName(a.name).localeCompare(basenameFromArchiveName(b.name)))

  const orphanImages: string[] = []
  let extractedCount = 0

  for (const entry of entries) {
    const filename = basenameFromArchiveName(entry.name)
    const ext = path.extname(filename).toLowerCase()
    if (!filename || !IMAGE_EXTENSIONS.has(ext)) continue

    const matchedCode = normalizedCodes.find((code) => filename.toLowerCase().startsWith(`${code.toLowerCase()}_`))
    if (!matchedCode) {
      orphanImages.push(filename)
      continue
    }

    const suffix = filename.slice(`${matchedCode}_`.length, filename.length - ext.length).toLowerCase()
    const bytes = await entry.async('uint8array')
    if (bytes.byteLength > WORDPRESS_AUTO_POSTER_LIMITS.maxImageBytes) {
      throw new WordPressAutoPosterError(`Ảnh ${filename} vượt giới hạn 8MB`)
    }

    const match = matches.get(matchedCode) || { contentImages: [] }
    const image: AutoPosterImage = {
      filename,
      bytes,
      mimeType: mimeTypeFromFilename(filename),
    }

    if (FEATURED_IMAGE_SUFFIXES.has(suffix)) {
      match.featured = image
      extractedCount += 1
    } else if (/^\d+$/.test(suffix)) {
      match.contentImages.push(image)
      extractedCount += 1
    } else {
      orphanImages.push(filename)
    }

    matches.set(matchedCode, match)
  }

  const perPostLimit = clampImageLimit(maxImagesPerPost)
  for (const match of matches.values()) {
    match.contentImages = match.contentImages
      .sort((a, b) => imageOrder(a.filename) - imageOrder(b.filename) || a.filename.localeCompare(b.filename))
      .slice(0, perPostLimit)
  }

  return { matches, orphanImages, extractedCount }
}

export function buildAutoPosterPreview(
  posts: AutoPosterPost[],
  images: AutoPosterImageBundle | null,
): AutoPosterPreviewPost[] {
  return posts.map((post) => {
    const match = post.maBai ? images?.matches.get(post.maBai) : undefined
    return {
      ...post,
      imageMatch: {
        featured: Boolean(match?.featured || post.featuredImageUrl),
        contentImages: match?.contentImages.length || 0,
      },
    }
  })
}

export async function testWordPressAutoPosterConnection(config: WordPressAutoPosterConfig) {
  const client = new WordPressAutoPosterClient(config)
  return client.testConnection()
}

export async function publishWordPressAutoPosterBatch({
  posts,
  images,
  config,
  options,
}: {
  posts: AutoPosterPost[]
  images: AutoPosterImageBundle | null
  config: WordPressAutoPosterConfig
  options: WordPressPublishOptions
}): Promise<WordPressPublishResult[]> {
  const client = new WordPressAutoPosterClient(config)
  const results: WordPressPublishResult[] = []

  for (const post of posts) {
    try {
      const imageMatch = post.maBai ? images?.matches.get(post.maBai) : undefined
      const featuredMedia = imageMatch?.featured
        ? await client.uploadMedia(imageMatch.featured.bytes, imageMatch.featured.filename, imageMatch.featured.mimeType)
        : post.featuredImageUrl
          ? await client.uploadMediaFromUrl(post.featuredImageUrl)
          : undefined

      const contentImages: UploadedMedia[] = []
      for (const image of imageMatch?.contentImages || []) {
        contentImages.push(await client.uploadMedia(image.bytes, image.filename, image.mimeType))
      }

      const content = composeContentWithImages(post.content, post.title, contentImages, featuredMedia ? [featuredMedia] : [])
      const duplicate = await client.findPostBySlugOrTitle(post.slug, post.title)

      if (duplicate && !options.updateDuplicates) {
        results.push({
          rowNumber: post.rowNumber,
          title: post.title,
          status: 'skipped',
          action: 'skipped',
          link: duplicate.link,
          wordpressId: duplicate.id,
          error: 'Bài trùng slug/tiêu đề, đã bỏ qua theo tùy chọn',
        })
        continue
      }

      const payload = duplicate
        ? await client.updatePost(duplicate.id, post, content, featuredMedia?.id)
        : await client.createPost({ ...post, status: normalizeWordPressStatus(post.status, options.defaultStatus) }, content, featuredMedia?.id)

      results.push({
        rowNumber: post.rowNumber,
        title: post.title,
        status: 'success',
        action: duplicate ? 'updated' : 'created',
        link: payload.link,
        wordpressId: payload.id,
      })
    } catch (error) {
      results.push({
        rowNumber: post.rowNumber,
        title: post.title,
        status: 'failed',
        error: errorMessage(error),
      })
    }
  }

  return results
}

export function clampImageLimit(value: number) {
  if (!Number.isFinite(value)) return 2
  return Math.max(0, Math.min(WORDPRESS_AUTO_POSTER_LIMITS.maxImagesPerPost, Math.floor(value)))
}

class WordPressAutoPosterClient {
  private readonly apiBase: string
  private readonly authHeader: string

  constructor(private readonly config: WordPressAutoPosterConfig) {
    this.apiBase = `${config.siteUrl.replace(/\/+$/, '')}/wp-json/wp/v2`
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64')}`
  }

  async testConnection() {
    const user = await this.requestJson<{ name?: string; slug?: string }>('users/me')
    return {
      ok: true,
      message: `Đã kết nối WordPress với tài khoản ${user.name || user.slug || this.config.username}`,
    }
  }

  async uploadMedia(bytes: Uint8Array, filename: string, mimeType: string): Promise<UploadedMedia> {
    if (!mimeType.startsWith('image/')) {
      throw new WordPressAutoPosterError(`Định dạng ảnh không hỗ trợ: ${filename}`)
    }

    const payload = await this.requestJson<{ id: number; source_url?: string; guid?: { rendered?: string } }>('media', {
      method: 'POST',
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}"`,
        'Content-Type': mimeType,
      },
      body: new Blob([toArrayBuffer(bytes)], { type: mimeType }),
    })

    return {
      id: Number(payload.id),
      sourceUrl: String(payload.source_url || payload.guid?.rendered || ''),
      filename,
    }
  }

  async uploadMediaFromUrl(rawUrl: string): Promise<UploadedMedia> {
    const imageUrl = normalizeExternalUrl(rawUrl, { allowPrivateInDevelopment: false })
    const response = await fetchWithTimeout(imageUrl, {
      timeoutMs: this.config.timeoutMs,
      headers: {
        'User-Agent': 'MushroomieWordPressAutoPoster/1.0',
      },
    })

    if (!response.ok) {
      throw new WordPressAutoPosterError(`Không tải được ảnh đại diện (${response.status})`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new WordPressAutoPosterError(`URL ảnh không trả về image/*: ${contentType || 'không rõ'}`)
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > WORDPRESS_AUTO_POSTER_LIMITS.maxImageBytes) {
      throw new WordPressAutoPosterError('Ảnh đại diện từ URL vượt giới hạn 8MB')
    }

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > WORDPRESS_AUTO_POSTER_LIMITS.maxImageBytes) {
      throw new WordPressAutoPosterError('Ảnh đại diện từ URL vượt giới hạn 8MB')
    }

    const filename = sanitizeFilename(path.basename(new URL(imageUrl).pathname) || 'remote-image')
    const ext = path.extname(filename)
    return this.uploadMedia(new Uint8Array(arrayBuffer), ext ? filename : `${filename}.jpg`, contentType.split(';')[0])
  }

  async findPostBySlugOrTitle(slug: string | undefined, title: string): Promise<WordPressPostSummary | null> {
    if (slug) {
      const bySlug = await this.requestJson<WordPressPostSummary[]>(`posts?slug=${encodeURIComponent(slug)}&per_page=1`)
      if (bySlug[0]) return bySlug[0]
    }

    const posts = await this.requestJson<WordPressPostSummary[]>(
      `posts?search=${encodeURIComponent(title)}&per_page=20&status=publish,draft,pending,future,private`,
    )
    const normalizedTitle = stripHtml(title).trim().toLowerCase()
    return posts.find((post) => stripHtml(post.title?.rendered || '').trim().toLowerCase() === normalizedTitle) || null
  }

  async createPost(post: AutoPosterPost, content: string, featuredMediaId?: number) {
    return this.requestJson<{ id: number; link?: string }>('posts', {
      method: 'POST',
      body: JSON.stringify(await this.buildPostPayload(post, content, featuredMediaId, true)),
    })
  }

  async updatePost(postId: number, post: AutoPosterPost, content: string, featuredMediaId?: number) {
    return this.requestJson<{ id: number; link?: string }>(`posts/${postId}`, {
      method: 'POST',
      body: JSON.stringify(await this.buildPostPayload(post, content, featuredMediaId, false)),
    })
  }

  private async buildPostPayload(
    post: AutoPosterPost,
    content: string,
    featuredMediaId: number | undefined,
    includeStatus: boolean,
  ) {
    const payload: Record<string, unknown> = {
      title: post.title,
      content,
      slug: post.slug || undefined,
      excerpt: post.metaDescription || undefined,
      meta: rankMathMeta(post),
      date: post.publishDate || undefined,
      featured_media: featuredMediaId || undefined,
    }

    if (includeStatus) {
      payload.status = post.status || 'draft'
    }

    if (post.category) {
      payload.categories = [await this.getOrCreateTerm('categories', post.category)]
    }

    payload.tags = post.tags.length > 0
      ? await Promise.all(post.tags.map((tag) => this.getOrCreateTerm('tags', tag)))
      : []

    return pruneUndefined(payload)
  }

  private async getOrCreateTerm(taxonomy: 'categories' | 'tags', name: string) {
    const terms = await this.requestJson<Array<{ id: number; name?: string }>>(
      `${taxonomy}?search=${encodeURIComponent(name)}&per_page=20`,
    )
    const target = name.trim().toLowerCase()
    const existing = terms.find((term) => stripHtml(term.name || '').trim().toLowerCase() === target)
    if (existing) return existing.id

    const created = await this.requestJson<{ id: number }>(taxonomy, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    return created.id
  }

  private async requestJson<T>(pathPart: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Authorization', this.authHeader)
    headers.set('User-Agent', 'MushroomieWordPressAutoPoster/1.0')
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetchWithTimeout(`${this.apiBase}/${pathPart.replace(/^\/+/, '')}`, {
      ...init,
      headers,
      timeoutMs: this.config.timeoutMs,
    })

    const text = await response.text()
    const payload = text ? safeJsonParse(text) : null
    if (!response.ok) {
      const message = typeof payload?.message === 'string' ? payload.message : text.slice(0, 500)
      throw new WordPressAutoPosterError(`WordPress API ${response.status}: ${message || response.statusText}`)
    }

    return payload as T
  }
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit & { timeoutMs: number },
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs)
  const requestInit = { ...init }
  delete (requestInit as { timeoutMs?: number }).timeoutMs
  try {
    let currentUrl = new URL(input)
    for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
      const destination = await assertPublicDestination(currentUrl)
      const dispatcher = new Agent({
        connect: {
          lookup: (_hostname, _options, callback) => callback(null, destination.address, destination.family),
        },
      })

      let response
      try {
        response = await undiciFetch(currentUrl, {
          ...requestInit,
          signal: controller.signal,
          cache: 'no-store',
          redirect: 'manual',
          dispatcher,
        } as unknown as UndiciRequestInit)
      } catch (error) {
        await dispatcher.close()
        throw error
      }

      if (response.status < 300 || response.status >= 400) {
        const body = await response.arrayBuffer()
        const responseHeaders = new Headers()
        response.headers.forEach((value, key) => responseHeaders.append(key, value))
        const result = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        })
        await dispatcher.close()
        return result
      }
      const location = response.headers.get('location')
      await response.body?.cancel()
      await dispatcher.close()
      if (!location || redirectCount === 3) {
        throw new WordPressAutoPosterError('WordPress API chuyển hướng quá nhiều lần')
      }

      const nextUrl = new URL(location, currentUrl)
      if (nextUrl.origin !== currentUrl.origin) {
        throw new WordPressAutoPosterError('WordPress API không được chuyển hướng sang tên miền khác')
      }
      currentUrl = nextUrl
    }

    throw new WordPressAutoPosterError('Không thể kết nối WordPress API')
  } finally {
    clearTimeout(timeout)
  }
}

async function assertPublicDestination(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol) || isPrivateHost(url.hostname)) {
    throw new WordPressAutoPosterError('Không cho phép URL nội bộ hoặc giao thức không an toàn')
  }

  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new WordPressAutoPosterError('Không phân giải được tên miền WordPress')
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateHost(address))) {
    throw new WordPressAutoPosterError('Tên miền WordPress trỏ tới địa chỉ mạng không được phép')
  }

  return addresses[0]
}

async function readXlsxSheets(buffer: Buffer): Promise<Array<{ sheet: string; data: SheetData }>> {
  const archive = await JSZip.loadAsync(buffer)
  const workbookXml = await archive.file('xl/workbook.xml')?.async('string')
  if (!workbookXml) {
    throw new WordPressAutoPosterError('File .xlsx thiếu xl/workbook.xml')
  }

  const sharedStrings = await readSharedStrings(archive)
  const relationshipMap = await readWorkbookRelationships(archive)
  const sheets = parseWorkbookSheets(workbookXml, relationshipMap)

  if (sheets.length === 0) {
    throw new WordPressAutoPosterError('File .xlsx không có worksheet')
  }

  const output: Array<{ sheet: string; data: SheetData }> = []
  for (const sheet of sheets) {
    const xml = await archive.file(sheet.path)?.async('string')
    if (!xml) continue
    output.push({
      sheet: sheet.name,
      data: parseWorksheet(xml, sharedStrings),
    })
  }

  return output
}

async function readSharedStrings(archive: JSZip) {
  const xml = await archive.file('xl/sharedStrings.xml')?.async('string')
  if (!xml) return []

  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/gi)].map((match) => {
    const item = match[0]
    const textParts = [...item.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi)]
    return textParts.map((part) => decodeXml(part[1])).join('')
  })
}

async function readWorkbookRelationships(archive: JSZip) {
  const xml = await archive.file('xl/_rels/workbook.xml.rels')?.async('string')
  const relationships = new Map<string, string>()
  if (!xml) return relationships

  for (const match of xml.matchAll(/<Relationship\b([^>]*?)\/?>/gi)) {
    const attrs = match[1]
    const id = readXmlAttribute(attrs, 'Id')
    const target = readXmlAttribute(attrs, 'Target')
    if (!id || !target) continue
    relationships.set(id, normalizeWorkbookTarget(target))
  }

  return relationships
}

function parseWorkbookSheets(workbookXml: string, relationships: Map<string, string>) {
  const sheets: Array<{ name: string; path: string }> = []
  let fallbackIndex = 1

  for (const match of workbookXml.matchAll(/<sheet\b([^>]*?)\/?>/gi)) {
    const attrs = match[1]
    const name = decodeXml(readXmlAttribute(attrs, 'name') || `Sheet ${fallbackIndex}`)
    const relationshipId = readXmlAttribute(attrs, 'r:id')
    const target = relationshipId ? relationships.get(relationshipId) : undefined
    sheets.push({
      name,
      path: target || `xl/worksheets/sheet${fallbackIndex}.xml`,
    })
    fallbackIndex += 1
  }

  return sheets
}

function normalizeWorkbookTarget(target: string) {
  const normalized = target.replace(/\\/g, '/').replace(/^\/+/, '')
  if (normalized.startsWith('xl/')) return normalized
  return path.posix.join('xl', normalized)
}

function parseWorksheet(xml: string, sharedStrings: string[]): SheetData {
  const rows: SheetData = []

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
    const rowXml = rowMatch[1]
    const row: unknown[] = []

    for (const cellMatch of rowXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi)) {
      const attrs = cellMatch[1]
      const body = cellMatch[2] || ''
      const ref = readXmlAttribute(attrs, 'r')
      const columnIndex = ref ? columnIndexFromCellRef(ref) : row.length
      row[columnIndex] = parseWorksheetCell(attrs, body, sharedStrings)
    }

    if (row.some((value) => cleanText(value))) {
      rows.push(row)
    }
  }

  return rows
}

function parseWorksheetCell(attrs: string, body: string, sharedStrings: string[]) {
  const type = readXmlAttribute(attrs, 't')
  if (type === 's') {
    const index = Number(readXmlTag(body, 'v'))
    return Number.isFinite(index) ? sharedStrings[index] || '' : ''
  }
  if (type === 'inlineStr') {
    return [...body.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi)]
      .map((match) => decodeXml(match[1]))
      .join('')
  }
  if (type === 'b') {
    return readXmlTag(body, 'v') === '1'
  }
  return decodeXml(readXmlTag(body, 'v') || '')
}

function readXmlAttribute(attrs: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = attrs.match(new RegExp(`\\b${escaped}="([^"]*)"`, 'i'))
  return match ? match[1] : undefined
}

function readXmlTag(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = xml.match(new RegExp(`<(?:\\w+:)?${escaped}\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`, 'i'))
  return match ? decodeXml(match[1]) : undefined
}

function columnIndexFromCellRef(ref: string) {
  const letters = (ref.match(/[A-Z]+/i)?.[0] || '').toUpperCase()
  let index = 0
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64)
  }
  return Math.max(0, index - 1)
}

function findBestRows(sheets: Array<{ sheet: string; data: SheetData }>) {
  const orderedNames = [
    ...sheets.filter((item) => normalizeLabel(item.sheet).includes('bai seo html')),
    ...sheets.filter((item) => !normalizeLabel(item.sheet).includes('bai seo html')),
  ]

  for (const sheet of orderedNames) {
    const headers = (sheet.data[0] || []).map((value) => cleanText(value))
    if (headers.every((header) => !header)) continue

    const columnMap = buildColumnMap(headers)
    if ([...REQUIRED_COLUMNS].every((column) => column in columnMap)) {
      return {
        rows: sheet.data.slice(1).map((row) => rowToObject(headers, row)),
        columnMap,
      }
    }
  }

  return null
}

function rowToObject(headers: string[], row: unknown[]) {
  const output: Record<string, unknown> = {}
  headers.forEach((header, index) => {
    if (!header) return
    output[header] = row[index] ?? ''
  })
  return output
}

function parseCsv(csv: string): SheetData {
  const rows: SheetData = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

function buildColumnMap(headers: string[]) {
  const normalizedToOriginal = new Map(headers.map((header) => [normalizeLabel(header), header]))
  const map: Record<string, string> = {}

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const original = normalizedToOriginal.get(normalizeLabel(alias))
      if (original) {
        map[canonical] = original
        break
      }
    }
  }

  return map
}

function readMappedValue(row: Record<string, unknown>, columnMap: Record<string, string>, key: string) {
  const column = columnMap[key]
  return column ? row[column] : undefined
}

function normalizeLabel(value: unknown) {
  return String(value || '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return ''
  const text = String(value).trim()
  if (!text || text.toLowerCase() === 'nan') return ''
  return text
}

function parseList(value: unknown) {
  return uniqueList(
    cleanText(value)
      .split(/[,;\n]/g)
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function uniqueList(values: string[]) {
  const seen = new Set<string>()
  const output: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

function basenameFromArchiveName(name: string) {
  return name.replace(/\\/g, '/').split('/').filter(Boolean).pop() || ''
}

function sanitizeFilename(filename: string) {
  const basename = path.basename(filename).replace(/[^\w.\-]+/g, '-')
  return basename || 'image.jpg'
}

function mimeTypeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function imageOrder(filename: string) {
  const ext = path.extname(filename)
  const suffix = filename.slice(0, filename.length - ext.length).split('_').pop() || ''
  const value = Number(suffix)
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

function normalizeExternalUrl(rawUrl: string, options: { allowPrivateInDevelopment: boolean }) {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new WordPressAutoPosterError('URL không hợp lệ')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new WordPressAutoPosterError('URL phải dùng http hoặc https')
  }

  if (!options.allowPrivateInDevelopment || process.env.NODE_ENV === 'production') {
    if (isPrivateHost(url.hostname)) {
      throw new WordPressAutoPosterError('Không cho phép URL localhost/private IP')
    }
  }

  return url.toString().replace(/\/+$/, '')
}

export function isPrivateHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true
  if (normalized === '::1') return true

  if (net.isIP(normalized) === 4) {
    const parts = normalized.split('.').map(Number)
    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 192 && parts[1] === 0 && (parts[2] === 0 || parts[2] === 2)) ||
      (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19 || parts[1] === 51)) ||
      (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) ||
      parts[0] >= 224
    )
  }

  if (net.isIP(normalized) === 6) {
    if (normalized.startsWith('::ffff:')) return isPrivateHost(normalized.slice(7))
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('ff') ||
      normalized.startsWith('2001:db8:')
    )
  }

  return false
}

function composeContentWithImages(
  content: string,
  title: string,
  uploadedImages: UploadedMedia[],
  leadingImages: UploadedMedia[],
) {
  let output = replaceLocalImageSources(content, [...leadingImages, ...uploadedImages])
  const usedFilenames = findImageSources(output)
  const unusedLeading = leadingImages.filter((media) => !usedFilenames.has(media.filename.toLowerCase()))
  const unusedContent = uploadedImages.filter((media) => !usedFilenames.has(media.filename.toLowerCase()))

  if (unusedLeading.length > 0) {
    const leadingHtml = unusedLeading.map((media) => imageHtml(media, title)).join('\n')
    output = output.trim() ? `${leadingHtml}\n${output.trimStart()}` : leadingHtml
  }

  if (unusedContent.length === 0) return output

  const tags = unusedContent.map((media) => imageHtml(media, title))
  const blockRegex = /(<(?:p|h[1-6]|ul|ol|li|table|blockquote|div|section|figure|figcaption)\b[^>]*>[\s\S]*?<\/(?:p|h[1-6]|ul|ol|li|table|blockquote|div|section|figure|figcaption)>)/gi
  const parts = output.split(blockRegex).filter(Boolean)
  const blockIndexes = parts.map((part, index) => (new RegExp(blockRegex).test(part) ? index : -1)).filter((index) => index >= 0)

  if (blockIndexes.length === 0) {
    return `${output.trimEnd()}\n${tags.join('\n')}`
  }

  const insertions = new Map<number, string[]>()
  tags.forEach((tag, index) => {
    const position = Math.round(((index + 1) * (blockIndexes.length + 1)) / (tags.length + 1))
    const blockIndex = blockIndexes[Math.max(0, Math.min(blockIndexes.length - 1, position - 1))]
    insertions.set(blockIndex, [...(insertions.get(blockIndex) || []), tag])
  })

  return parts.flatMap((part, index) => [part, ...(insertions.get(index) || [])]).join('')
}

function replaceLocalImageSources(content: string, uploadedImages: UploadedMedia[]) {
  const byFilename = new Map(uploadedImages.map((media) => [media.filename.toLowerCase(), media]))
  return content.replace(/(<img\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (full, prefix, src, suffix) => {
    const filename = String(src).split(/[/?#\\]/).filter(Boolean).pop()?.toLowerCase()
    const media = filename ? byFilename.get(filename) : undefined
    return media ? `${prefix}${escapeHtml(media.sourceUrl)}${suffix}` : full
  })
}

function findImageSources(content: string) {
  const filenames = new Set<string>()
  content.replace(/<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi, (_full, src) => {
    const filename = String(src).split(/[/?#\\]/).filter(Boolean).pop()?.toLowerCase()
    if (filename) filenames.add(filename)
    return ''
  })
  return filenames
}

function imageHtml(media: UploadedMedia, title: string) {
  return `<p><img src="${escapeHtml(media.sourceUrl)}" alt="${escapeHtml(title)}" class="wp-image-${media.id} aligncenter" /></p>`
}

function rankMathMeta(post: AutoPosterPost) {
  return pruneUndefined({
    rank_math_title: post.seoTitle || post.title,
    rank_math_description: post.metaDescription,
    rank_math_focus_keyword: post.focusKeywords.join(', ') || undefined,
    rank_math_permalink: post.slug,
  })
}

function pruneUndefined<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''))
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '')
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Lỗi không xác định'
}
