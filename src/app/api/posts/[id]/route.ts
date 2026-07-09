import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'
import { buildPostContentMetrics, normalizeOptionalPostImage, serializePostForEditor, serializeStringArray } from '@/lib/post-normalization'
import { isValidPostStatus, makeExcerpt, savePostRevision, syncPostTags, trashData } from '@/lib/post-workflow'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    const session = await auth()
    const isAdmin = ['super_admin', 'admin'].includes((session?.user as any)?.role)

    if (isNumeric && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (isNumeric && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const post = await prisma.post.findFirst({
      where: isNumeric
        ? { id: Number(id) }
        : { slug: id, ...(isAdmin ? {} : { status: 'published' }) },
      include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ post: await serializePostForEditor(post) })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const {
      title, slug, excerpt, content, featured_image,
      featured_image_alt, featured_image_caption, featured_image_description,
      status, category_id, seo_title, meta_description, focus_keyword,
      og_title, og_description, og_image,
      twitter_title, twitter_description, twitter_image,
      canonical_url, robots_index, robots_follow, schema_type,
      secondary_keywords, publish_date, tags,
    } = body

    if (status && !isValidPostStatus(status)) {
      return NextResponse.json({ error: 'Trạng thái bài viết không hợp lệ' }, { status: 400 })
    }

    // Lên lịch đăng (Đăng bài tự động): cần thời điểm hợp lệ trong tương lai
    let scheduledAt: Date | null = null
    if (status === 'scheduled') {
      scheduledAt = publish_date ? new Date(publish_date) : null
      if (!scheduledAt || isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: 'Lịch đăng cần thời gian hợp lệ' }, { status: 400 })
      }
      if (scheduledAt.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Thời gian hẹn đăng phải ở tương lai' }, { status: 400 })
      }
    }

    // Bài hiện tại: cần cho revision snapshot + xử lý chuyển trạng thái thùng rác
    const existing = await prisma.post.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    const data: any = {
      title, excerpt, featured_image: normalizeOptionalPostImage(featured_image),
      featured_image_alt, featured_image_caption, featured_image_description,
      seo_title, meta_description, focus_keyword,
      og_title: og_title || null,
      og_description: og_description || null,
      og_image: normalizeOptionalPostImage(og_image),
      twitter_title: twitter_title || null,
      twitter_description: twitter_description || null,
      twitter_image: normalizeOptionalPostImage(twitter_image),
      canonical_url: canonical_url || null,
      robots_index: robots_index ?? true,
      robots_follow: robots_follow ?? true,
      schema_type: schema_type || 'BlogPosting',
      secondary_keywords: serializeStringArray(secondary_keywords),
      status: status || 'draft',
      category_id: category_id ? Number(category_id) : null,
    }

    // Only touch content when the client explicitly sends a string, so a payload
    // that omits `content` can never wipe the stored article.
    if (typeof content === 'string') {
      const { content: normalizedContent, readingTime, wordCount } = buildPostContentMetrics(content)
      data.content = normalizedContent
      data.reading_time = readingTime
      data.word_count = wordCount
    }
    data.slug = slug || (title ? generateSlug(title) : undefined)
    // published_at: giữ mốc cũ khi bài đã published (tránh reset ngày đăng mỗi lần sửa)
    if (status === 'published') data.published_at = existing.published_at ?? new Date()
    if (status === 'scheduled') data.published_at = scheduledAt

    // Chuyển trạng thái thùng rác kiểu WordPress
    if (status === 'trash' && existing.status !== 'trash') {
      Object.assign(data, trashData(existing.status))
    } else if (status !== 'trash' && existing.status === 'trash') {
      data.deleted_at = null
      data.status_before_trash = null
    }

    // Excerpt fallback khi để trống
    data.excerpt = makeExcerpt(typeof content === 'string' ? content : existing.content, excerpt)

    // Remove undefined keys
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])

    // Snapshot bản hiện tại thành revision TRƯỚC khi ghi đè
    await savePostRevision(existing, Number(session.user.id))

    const post = await prisma.post.update({ where: { id: Number(id) }, data })

    // Đồng bộ tags (mảng tên tag; undefined = không đụng)
    if (Array.isArray(tags)) {
      await syncPostTags(post.id, tags.filter((t: unknown): t is string => typeof t === 'string'))
    }
    
    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'POST',
      details: { id: post.id, title: post.title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })
    
    return NextResponse.json({ post })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const existing = await prisma.post.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    // Kiểu WordPress: lần xóa đầu → thùng rác; đã ở thùng rác → xóa vĩnh viễn
    if (existing.status !== 'trash') {
      const trashed = await prisma.post.update({ where: { id: existing.id }, data: trashData(existing.status) })
      await logAdminAction({
        userId: Number(session.user.id),
        action: 'DELETE',
        entity: 'POST',
        details: { id: trashed.id, title: trashed.title, soft: true },
        ipAddress: request.headers.get('x-forwarded-for') || undefined
      })
      return NextResponse.json({ success: true, trashed: true })
    }

    const deleted = await prisma.post.delete({ where: { id: existing.id } })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'DELETE',
      entity: 'POST',
      details: { id: deleted.id, title: deleted.title, permanent: true },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    return NextResponse.json({ success: true, permanent: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
