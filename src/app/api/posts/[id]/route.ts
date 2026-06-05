import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'
import { sanitizeHtml, calculateReadingTime, calculateWordCount } from '@/lib/sanitize'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    const post = await prisma.post.findFirst({
      where: isNumeric ? { id: Number(id) } : { slug: id },
      include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
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
      secondary_keywords,
    } = body

    const sanitizedContent = content ? sanitizeHtml(content) : content
    const readingTime = sanitizedContent ? calculateReadingTime(sanitizedContent) : undefined
    const wordCount = sanitizedContent ? calculateWordCount(sanitizedContent) : undefined

    const data: any = {
      title, excerpt, content: sanitizedContent, featured_image,
      featured_image_alt, featured_image_caption, featured_image_description,
      seo_title, meta_description, focus_keyword,
      og_title: og_title || null,
      og_description: og_description || null,
      og_image: og_image || null,
      twitter_title: twitter_title || null,
      twitter_description: twitter_description || null,
      twitter_image: twitter_image || null,
      canonical_url: canonical_url || null,
      robots_index: robots_index ?? true,
      robots_follow: robots_follow ?? true,
      schema_type: schema_type || 'BlogPosting',
      secondary_keywords: Array.isArray(secondary_keywords) ? JSON.stringify(secondary_keywords) : (secondary_keywords || null),
      reading_time: readingTime,
      word_count: wordCount,
      status: status || 'draft',
      category_id: category_id ? Number(category_id) : null,
    }
    data.slug = slug || (title ? generateSlug(title) : undefined)
    if (status === 'published') data.published_at = new Date()
    // Remove undefined keys
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])
    const post = await prisma.post.update({ where: { id: Number(id) }, data })
    
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
    const deleted = await prisma.post.delete({ where: { id: Number(id) } })
    
    await logAdminAction({
      userId: Number(session.user.id),
      action: 'DELETE',
      entity: 'POST',
      details: { id: deleted.id, title: deleted.title },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
