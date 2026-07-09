import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Danh sách revisions của một bài (metadata nhẹ, không kèm content) */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const revisions = await prisma.postRevision.findMany({
      where: { post_id: Number(id) },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        created_at: true,
        author_id: true,
        excerpt: false,
        content: false,
      },
    })

    // Lấy tên tác giả (ít bản ghi nên map đơn giản)
    const authorIds = [...new Set(revisions.map((r) => r.author_id).filter((v): v is number => v !== null))]
    const authors = authorIds.length
      ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
      : []
    const authorMap = new Map(authors.map((a) => [a.id, a.name]))

    return NextResponse.json({
      revisions: revisions.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at,
        author: r.author_id ? authorMap.get(r.author_id) || null : null,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
