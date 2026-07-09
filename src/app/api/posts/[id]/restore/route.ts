import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'
import { restoreData } from '@/lib/post-workflow'

export const dynamic = 'force-dynamic'

/** Khôi phục bài viết từ thùng rác về trạng thái trước đó (kiểu WordPress) */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.post.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    if (existing.status !== 'trash') {
      return NextResponse.json({ error: 'Bài viết không nằm trong thùng rác' }, { status: 400 })
    }

    const post = await prisma.post.update({ where: { id: existing.id }, data: restoreData(existing) })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'POST',
      details: { id: post.id, title: post.title, restored: true, status: post.status },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true, status: post.status })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
