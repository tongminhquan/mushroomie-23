import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 9)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'published'

    const session = await auth()
    const isAdmin = (session?.user as any)?.role === 'admin'

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

    return NextResponse.json({ posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
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
    const { title, slug, excerpt, content, featured_image, status, category_id, seo_title, meta_description, focus_keyword, tags } = body

    const postSlug = slug || generateSlug(title)
    const post = await prisma.post.create({
      data: {
        title,
        slug: postSlug,
        excerpt,
        content,
        featured_image,
        status: status || 'draft',
        category_id: category_id || null,
        seo_title,
        meta_description,
        focus_keyword,
        author_id: Number((session.user as any).id),
        published_at: status === 'published' ? new Date() : null,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
