import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'
import { optimizeUploadImage } from '@/lib/image-processing'
import { buildPostContentMetrics, normalizeOptionalPostImage } from '@/lib/post-normalization'
import { normalizePostCanonicalUrl, parseBulkImportFile, rewriteContentImages } from '@/lib/bulk-import'
import { recordAndRevalidatePublication } from '@/lib/seo-discovery/publication'
import type { PublicContentPublication } from '@/lib/seo-discovery/types'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Upload + sharp cho nhiều ảnh có thể lâu trên VPS nhỏ
export const maxDuration = 300

const uploadDir = join(process.cwd(), 'public', 'uploads')
const MAX_IMAGES = 200

interface RowResult {
  index: number
  title: string
  slug: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  status: string
  url: string | null
  message: string
}

export async function POST(request: NextRequest) {
  let session
  try {
    session = await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const mode = String(form.get('mode') || 'preview')
    const file = form.get('file') as File | null
    const images = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Chưa chọn file Excel/CSV.' }, { status: 400 })
    }
    if (images.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Tối đa ${MAX_IMAGES} ảnh mỗi lần.` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const imageNames = images.map((f) => f.name)
    const parsed = await parseBulkImportFile(buffer, file.name, imageNames)

    if (parsed.errors.length > 0) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 })
    }

    // Đánh dấu create/update theo slug đã tồn tại (chống trùng — giống app)
    const slugs = parsed.rows.map((r) => r.slug).filter(Boolean)
    const existing = await prisma.post.findMany({
      where: { slug: { in: slugs } },
      select: { slug: true },
    })
    const existingSlugs = new Set(existing.map((p) => p.slug))

    if (mode === 'preview') {
      return NextResponse.json({
        rows: parsed.rows.map((r) => ({
          ...r,
          content: undefined,
          contentLength: r.content.length,
          action: !r.title || !r.content ? 'skipped' : existingSlugs.has(r.slug) ? 'update' : 'create',
        })),
        unmatchedImages: parsed.unmatchedImages,
        summary: {
          total: parsed.rows.length,
          images: imageNames.length,
          willUpdate: parsed.rows.filter((r) => existingSlugs.has(r.slug)).length,
        },
      })
    }

    // ══ mode === 'commit' ══
    const imageByName = new Map(images.map((f) => [f.name, f]))
    const uploadedCache = new Map<string, string>() // tên file gốc -> /uploads/url (tránh upload lặp)
    const results: RowResult[] = []
    const publicationEvents: PublicContentPublication[] = []

    const uploadOne = async (name: string): Promise<string> => {
      const cached = uploadedCache.get(name)
      if (cached) return cached
      const imgFile = imageByName.get(name)
      if (!imgFile) throw new Error(`Thiếu file ảnh ${name}`)
      const result = await optimizeUploadImage({
        buffer: Buffer.from(await imgFile.arrayBuffer()),
        declaredMime: imgFile.type || undefined,
        purpose: 'post',
        uploadDir,
      })
      uploadedCache.set(name, result.url)
      return result.url
    }

    for (const row of parsed.rows) {
      if (!row.title || !row.content) {
        results.push({ index: row.index, title: row.title || '(trống)', slug: row.slug, action: 'skipped', status: row.status, url: null, message: 'Thiếu title hoặc content' })
        continue
      }

      try {
        // 1) Ảnh đại diện: file local theo quy ước > featured_image_url
        let featuredImage: string | null = null
        if (row.featuredImageFile) {
          featuredImage = await uploadOne(row.featuredImageFile)
        } else if (row.featured_image_url) {
          featuredImage = normalizeOptionalPostImage(row.featured_image_url)
        }

        // 2) Ảnh nội dung: upload rồi thay src trong HTML
        let content = row.content
        if (row.contentImageFiles.length > 0) {
          const replacements = new Map<string, string>()
          for (const name of row.contentImageFiles) {
            replacements.set(name, await uploadOne(name))
          }
          content = rewriteContentImages(content, replacements)
        }

        // 3) Danh mục: khớp theo slug/tên, tạo mới nếu chưa có
        let categoryId: number | null = null
        if (row.category) {
          const catSlug = generateSlug(row.category)
          const category = await prisma.category.upsert({
            where: { slug: catSlug },
            update: {},
            create: { name: row.category, slug: catSlug, type: 'post' },
          })
          categoryId = category.id
        }

        // 4) published_at theo trạng thái
        const publishedAt =
          row.status === 'scheduled' ? new Date(row.publish_date as string)
          : row.status === 'published' ? (row.publish_date ? new Date(row.publish_date) : new Date())
          : null

        const { content: normalizedContent, readingTime, wordCount } = buildPostContentMetrics(content)
        const seoTitle = row.seo_title || row.title
        const metaDescription = row.meta_description || null
        const baseData = {
          title: row.title,
          excerpt: metaDescription,
          content: normalizedContent,
          ...(featuredImage ? {
            featured_image: featuredImage,
            featured_image_alt: row.featured_image_alt || row.title,
          } : {}),
          status: row.status,
          ...(categoryId !== null ? { category_id: categoryId } : {}),
          seo_title: seoTitle,
          meta_description: metaDescription,
          focus_keyword: row.focus_keyword || null,
          secondary_keywords: row.secondary_keywords || null,
          canonical_url: normalizePostCanonicalUrl(row.canonical_url, row.slug),
          robots_index: row.robots_index,
          robots_follow: row.robots_follow,
          schema_type: 'BlogPosting',
          og_title: seoTitle,
          og_description: metaDescription,
          twitter_title: seoTitle,
          twitter_description: metaDescription,
          reading_time: readingTime,
          word_count: wordCount,
          published_at: publishedAt,
        }

        // Normalize tags before opening the short per-row transaction. The first
        // spelling for a slug wins, and deterministic ordering keeps lock order stable.
        const normalizedTagsBySlug = new Map<string, { name: string; slug: string }>()
        for (const tagName of row.tags) {
          const tagSlug = generateSlug(tagName)
          if (tagSlug && !normalizedTagsBySlug.has(tagSlug)) {
            normalizedTagsBySlug.set(tagSlug, { name: tagName, slug: tagSlug })
          }
        }
        const normalizedTags = [...normalizedTagsBySlug.values()]
          .sort((left, right) => left.slug.localeCompare(right.slug))

        const isUpdate = existingSlugs.has(row.slug)
        const post = await prisma.$transaction(async (transaction) => {
          const savedPost = isUpdate
            ? await transaction.post.update({ where: { slug: row.slug }, data: baseData })
            : await transaction.post.create({
                data: { ...baseData, slug: row.slug, author_id: Number(session.user.id) },
              })

          // Keep the post and its tag mappings atomic for this row. Existing tag
          // mappings are intentionally retained on update, matching prior behavior.
          for (const tagData of normalizedTags) {
            const tag = await transaction.postTag.upsert({
              where: { slug: tagData.slug },
              update: {},
              create: tagData,
            })
            await transaction.postTagMap.upsert({
              where: { post_id_tag_id: { post_id: savedPost.id, tag_id: tag.id } },
              update: {},
              create: { post_id: savedPost.id, tag_id: tag.id },
            })
          }

          return savedPost
        }, {
          maxWait: 2_000,
          timeout: 5_000,
        })

        if (post.status === 'published') {
          publicationEvents.push({
            source: 'post',
            sourceId: post.id,
            url: buildPublicContentUrl('post', post.slug),
            contentUpdatedAt: post.updated_at,
            reason: isUpdate ? 'updated' : 'created',
          })
        }

        results.push({
          index: row.index,
          title: row.title,
          slug: post.slug,
          action: isUpdate ? 'updated' : 'created',
          status: row.status,
          url: `/tin-tuc/${post.slug}`,
          message: row.status === 'scheduled'
            ? `Hẹn đăng lúc ${new Date(row.publish_date as string).toLocaleString('vi-VN')}`
            : row.warnings.join('; ') || 'OK',
        })
      } catch (error) {
        results.push({
          index: row.index,
          title: row.title,
          slug: row.slug,
          action: 'error',
          status: row.status,
          url: null,
          message: error instanceof Error ? error.message : 'Lỗi không xác định',
        })
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === 'created').length,
      updated: results.filter((r) => r.action === 'updated').length,
      scheduled: results.filter((r) => r.status === 'scheduled' && r.action !== 'error').length,
      failed: results.filter((r) => r.action === 'error').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
    }

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'BULK_IMPORT',
      entity: 'POST',
      details: summary,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    for (const publicationEvent of publicationEvents) {
      await recordAndRevalidatePublication(publicationEvent)
    }

    return NextResponse.json({ results, summary })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
