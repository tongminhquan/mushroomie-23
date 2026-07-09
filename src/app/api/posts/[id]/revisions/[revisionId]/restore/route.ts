import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'
import { savePostRevision } from '@/lib/post-workflow'

export const dynamic = 'force-dynamic'

/**
 * Khôi phục nội dung từ một revision (kiểu WordPress):
 * snapshot bản hiện tại trước, rồi áp title/content/excerpt/SEO từ revision.
 * Không đổi status/slug hiện tại để tránh vô tình un-publish bài.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> },
) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, revisionId } = await params
    const postId = Number(id)

    const [post, revision] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId } }),
      prisma.postRevision.findUnique({ where: { id: Number(revisionId) } }),
    ])
    if (!post || !revision || revision.post_id !== postId) {
      return NextResponse.json({ error: 'Không tìm thấy bản lịch sử' }, { status: 404 })
    }

    // Lưu bản hiện tại thành revision để có thể quay lại
    await savePostRevision(post, Number(session.user.id))

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        seo_title: revision.seo_title,
        meta_description: revision.meta_description,
      },
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'POST',
      details: { id: updated.id, title: updated.title, restoredRevision: revision.id },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
