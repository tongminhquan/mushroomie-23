import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'

export const dynamic = 'force-dynamic'

/** Nhân bản bài viết (kiểu WordPress Duplicate Post): bản sao ở trạng thái nháp */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const source = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: { tags: true },
    })
    if (!source) return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })

    // Tìm slug trống: {slug}-ban-sao, -ban-sao-2, ...
    let newSlug = `${source.slug}-ban-sao`
    for (let i = 2; await prisma.post.findUnique({ where: { slug: newSlug }, select: { id: true } }); i++) {
      newSlug = `${source.slug}-ban-sao-${i}`
    }

    const copy = await prisma.post.create({
      data: {
        title: `(Bản sao) ${source.title}`,
        slug: newSlug,
        excerpt: source.excerpt,
        content: source.content,
        featured_image: source.featured_image,
        featured_image_alt: source.featured_image_alt,
        featured_image_caption: source.featured_image_caption,
        featured_image_description: source.featured_image_description,
        status: 'draft',
        category_id: source.category_id,
        seo_title: source.seo_title,
        meta_description: source.meta_description,
        focus_keyword: source.focus_keyword,
        og_title: source.og_title,
        og_description: source.og_description,
        og_image: source.og_image,
        twitter_title: source.twitter_title,
        twitter_description: source.twitter_description,
        twitter_image: source.twitter_image,
        canonical_url: null,
        robots_index: source.robots_index,
        robots_follow: source.robots_follow,
        schema_type: source.schema_type,
        secondary_keywords: source.secondary_keywords,
        reading_time: source.reading_time,
        word_count: source.word_count,
        author_id: Number(session.user.id),
        published_at: null,
        tags: { create: source.tags.map((t) => ({ tag_id: t.tag_id })) },
      },
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'CREATE',
      entity: 'POST',
      details: { id: copy.id, title: copy.title, duplicatedFrom: source.id },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, id: copy.id, slug: copy.slug })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
