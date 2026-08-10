import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'
import { buildPostContentMetrics, normalizeOptionalPostImage, serializePostForEditor, serializeStringArray } from '@/lib/post-normalization'
import { isValidPostStatus, makeExcerpt, syncPostTags } from '@/lib/post-workflow'
import { recordAndRevalidatePublication } from '@/lib/seo-discovery/publication'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

const SORTABLE_FIELDS = new Set(['created_at', 'updated_at', 'published_at', 'title'])

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(Number(searchParams.get('limit') || 9), 100)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'
    const month = searchParams.get('month') // dạng YYYY-MM
    const sortBy = SORTABLE_FIELDS.has(searchParams.get('sortBy') || '') ? (searchParams.get('sortBy') as string) : null
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const withCounts = searchParams.get('withCounts') === '1'

    const session = await auth()
    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.role === 'super_admin'

    const where: any = {}
    if (!isAdmin) {
      // Public: chỉ bài đã xuất bản — không bao giờ lộ draft/scheduled/private/trash
      where.status = 'published'
    } else if (!status || status === 'all') {
      // "Tất cả" kiểu WordPress: mọi trạng thái trừ thùng rác
      where.status = { not: 'trash' }
    } else {
      where.status = status
    }
    if (category) where.category = { slug: category }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { focus_keyword: { contains: search } },
      ]
    }
    if (isAdmin && month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number)
      where.created_at = { gte: new Date(y, m - 1, 1), lt: new Date(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) }
    }

    const orderBy = sortBy
      ? { [sortBy]: order }
      : isAdmin ? { created_at: 'desc' as const } : { published_at: 'desc' as const }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    // Status counts cho tabs kiểu WordPress: Tất cả (n) / Đã xuất bản (n) / ...
    let counts: Record<string, number> | undefined
    if (isAdmin && withCounts) {
      const grouped = await prisma.post.groupBy({ by: ['status'], _count: { _all: true } })
      counts = { all: 0 }
      for (const g of grouped) {
        counts[g.status] = g._count._all
        if (g.status !== 'trash') counts.all += g._count._all
      }
    }

    return NextResponse.json({
      posts: await Promise.all(posts.map((post) => serializePostForEditor(post))),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { content: normalizedContent, readingTime, wordCount } = buildPostContentMetrics(content)

    const postSlug = slug || generateSlug(title)
    const post = await prisma.post.create({
      data: {
        title,
        slug: postSlug,
        excerpt: makeExcerpt(content, excerpt),
        content: normalizedContent,
        featured_image: normalizeOptionalPostImage(featured_image),
        featured_image_alt,
        featured_image_caption,
        featured_image_description,
        status: status || 'draft',
        category_id: category_id ? Number(category_id) : null,
        seo_title,
        meta_description,
        focus_keyword,
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
        reading_time: readingTime,
        word_count: wordCount,
        author_id: Number((session.user as any).id),
        published_at: status === 'published' ? new Date() : status === 'scheduled' ? scheduledAt : null,
      },
    })

    // Gắn tags (form gửi mảng tên tag)
    if (Array.isArray(tags)) {
      await syncPostTags(post.id, tags.filter((t: unknown): t is string => typeof t === 'string'))
    }

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'CREATE',
      entity: 'POST',
      details: { id: post.id, title: post.title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    if (post.status === 'published') {
      await recordAndRevalidatePublication({
        source: 'post',
        sourceId: post.id,
        url: buildPublicContentUrl('post', post.slug),
        contentUpdatedAt: post.updated_at,
        reason: 'created',
      })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
