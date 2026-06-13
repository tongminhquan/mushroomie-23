import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'
import { buildPostContentMetrics, normalizeOptionalPostImage, serializePostForEditor, serializeStringArray } from '@/lib/post-normalization'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 9)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'

    const session = await auth()
    const isAdmin = (session?.user as any)?.role === 'admin' || (session?.user as any)?.role === 'super_admin'

    const where: any = {}
    if (!isAdmin) where.status = 'published'
    else if (status !== 'all') where.status = status
    if (category) where.category = { slug: category }
    if (search) where.title = { contains: search }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
        orderBy: { published_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts: await Promise.all(posts.map((post) => serializePostForEditor(post))),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      secondary_keywords,
    } = body

    const { content: normalizedContent, readingTime, wordCount } = buildPostContentMetrics(content)

    const postSlug = slug || generateSlug(title)
    const post = await prisma.post.create({
      data: {
        title,
        slug: postSlug,
        excerpt,
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
        published_at: status === 'published' ? new Date() : null,
      },
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'CREATE',
      entity: 'POST',
      details: { id: post.id, title: post.title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
