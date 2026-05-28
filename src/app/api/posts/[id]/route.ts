import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

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
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    // Only pick known Prisma fields
    const {
      title, slug, excerpt, content, featured_image,
      featured_image_alt, featured_image_caption, featured_image_description,
      status, category_id, seo_title, meta_description, focus_keyword,
    } = body
    const data: any = {
      title, excerpt, content, featured_image,
      featured_image_alt, featured_image_caption, featured_image_description,
      seo_title, meta_description, focus_keyword,
      status: status || 'draft',
      category_id: category_id ? Number(category_id) : null,
    }
    data.slug = slug || (title ? generateSlug(title) : undefined)
    if (status === 'published') data.published_at = new Date()
    // Remove undefined keys
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])
    const post = await prisma.post.update({ where: { id: Number(id) }, data })
    return NextResponse.json({ post })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    await prisma.post.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
