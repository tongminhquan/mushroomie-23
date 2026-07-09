import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

/**
 * Nghiệp vụ workflow bài viết kiểu WordPress: trạng thái, tags, excerpt,
 * revisions. Dùng chung cho /api/posts, bulk actions và bulk-import.
 */

/** Trạng thái hợp lệ (giữ string như schema hiện có, không đổi kiểu dữ liệu cũ) */
export const POST_STATUSES = ['draft', 'published', 'scheduled', 'private', 'hidden', 'trash'] as const
export type PostStatus = (typeof POST_STATUSES)[number]

export function isValidPostStatus(value: unknown): value is PostStatus {
  return typeof value === 'string' && (POST_STATUSES as readonly string[]).includes(value)
}

/** Số bản revision giữ lại cho mỗi bài (giống WordPress giới hạn revisions) */
const MAX_REVISIONS_PER_POST = 10

/**
 * Đồng bộ tags cho bài viết: upsert tag theo slug, thay toàn bộ map.
 * Truyền undefined = không đụng tags; truyền [] = xóa hết tags.
 */
export async function syncPostTags(postId: number, tagNames: string[] | undefined) {
  if (tagNames === undefined) return

  const cleaned = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))]
  const tagIds: number[] = []
  for (const name of cleaned) {
    const slug = generateSlug(name)
    if (!slug) continue
    const tag = await prisma.postTag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
    tagIds.push(tag.id)
  }

  await prisma.postTagMap.deleteMany({ where: { post_id: postId, tag_id: { notIn: tagIds } } })
  for (const tagId of tagIds) {
    await prisma.postTagMap.upsert({
      where: { post_id_tag_id: { post_id: postId, tag_id: tagId } },
      update: {},
      create: { post_id: postId, tag_id: tagId },
    })
  }
}

/** Sinh excerpt từ content HTML (~160 ký tự, cắt tại ranh giới từ) khi admin để trống */
export function makeExcerpt(content: string | null | undefined, existing?: string | null): string | null {
  const trimmedExisting = (existing || '').trim()
  if (trimmedExisting) return trimmedExisting
  if (!content) return null

  const text = content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  if (text.length <= 180) return text

  const cut = text.slice(0, 180)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : 180)}…`
}

/**
 * Lưu snapshot bài viết hiện tại thành revision (gọi TRƯỚC khi update).
 * Tự cắt bớt revisions cũ, giữ tối đa MAX_REVISIONS_PER_POST bản.
 */
export async function savePostRevision(
  post: { id: number; title: string; content: string | null; excerpt: string | null; seo_title: string | null; meta_description: string | null; status: string },
  authorId?: number | null,
) {
  try {
    await prisma.postRevision.create({
      data: {
        post_id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        seo_title: post.seo_title,
        meta_description: post.meta_description,
        status: post.status,
        author_id: authorId ?? null,
      },
    })
    const stale = await prisma.postRevision.findMany({
      where: { post_id: post.id },
      orderBy: { created_at: 'desc' },
      skip: MAX_REVISIONS_PER_POST,
      select: { id: true },
    })
    if (stale.length > 0) {
      await prisma.postRevision.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } })
    }
  } catch (error) {
    // Revision là tiện ích phụ — không được làm hỏng thao tác lưu bài chính.
    console.error('[post-workflow] Không lưu được revision:', error)
  }
}

/** Dữ liệu update khi chuyển bài vào thùng rác */
export function trashData(currentStatus: string) {
  return {
    status: 'trash' as const,
    deleted_at: new Date(),
    status_before_trash: currentStatus === 'trash' ? 'draft' : currentStatus,
  }
}

/** Dữ liệu update khi khôi phục từ thùng rác. Bài từng scheduled với giờ đã qua → draft. */
export function restoreData(post: { status_before_trash: string | null; published_at: Date | null }) {
  let status = post.status_before_trash || 'draft'
  if (status === 'trash') status = 'draft'
  if (status === 'scheduled' && (!post.published_at || post.published_at.getTime() <= Date.now())) {
    status = 'draft'
  }
  return { status, deleted_at: null, status_before_trash: null }
}
