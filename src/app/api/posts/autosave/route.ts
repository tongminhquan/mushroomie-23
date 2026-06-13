import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { buildPostContentMetrics, normalizeOptionalPostImage, serializeStringArray } from '@/lib/post-normalization'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id, title, slug, excerpt, content, featured_image, featured_image_alt,
      featured_image_caption, featured_image_description,
      category_id, seo_title, meta_description, focus_keyword,
      og_title, og_description, og_image,
      twitter_title, twitter_description, twitter_image,
      canonical_url, robots_index, robots_follow, schema_type,
      secondary_keywords, has_toc,
    } = body

    const { content: normalizedContent, readingTime, wordCount } = buildPostContentMetrics(content)

    const data: any = {
      title: title || 'Bài viết chưa đặt tên',
      slug: slug || `draft-${Date.now()}`,
      excerpt, content: normalizedContent, featured_image: normalizeOptionalPostImage(featured_image), featured_image_alt,
      featured_image_caption, featured_image_description,
      category_id: category_id ? Number(category_id) : null,
      seo_title, meta_description, focus_keyword,
      og_title, og_description, og_image: normalizeOptionalPostImage(og_image),
      twitter_title, twitter_description, twitter_image: normalizeOptionalPostImage(twitter_image),
      canonical_url,
      robots_index: robots_index ?? true,
      robots_follow: robots_follow ?? true,
      schema_type: schema_type || 'BlogPosting',
      secondary_keywords: serializeStringArray(secondary_keywords),
      reading_time: readingTime,
      word_count: wordCount,
    }

    // Remove undefined keys
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])

    if (id) {
      // Update existing draft
      const post = await prisma.post.update({
        where: { id: Number(id) },
        data,
      })
      return NextResponse.json({ post, isNew: false })
    } else {
      // Create new draft
      data.status = 'draft'
      data.author_id = Number((session.user as any).id)
      const post = await prisma.post.create({ data })
      return NextResponse.json({ post, isNew: true })
    }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    }
    console.error('Autosave error:', error)
    return NextResponse.json({ error: 'Lỗi khi tự động lưu' }, { status: 500 })
  }
}
