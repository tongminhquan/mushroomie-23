import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'
import { restoreData, trashData } from '@/lib/post-workflow'
import { recordAndRevalidatePublication } from '@/lib/seo-discovery/publication'
import type { PublicContentPublication } from '@/lib/seo-discovery/types'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

export const dynamic = 'force-dynamic'

type BulkAction = 'publish' | 'draft' | 'trash' | 'restore' | 'delete'
const VALID_ACTIONS: BulkAction[] = ['publish', 'draft', 'trash', 'restore', 'delete']

/** Bulk actions kiểu WordPress: Xuất bản / Chuyển nháp / Thùng rác / Khôi phục / Xóa vĩnh viễn */
export async function POST(request: NextRequest) {
  const publicationEvents: PublicContentPublication[] = []
  const drainPublicationEvents = async () => {
    const committedEvents = publicationEvents.splice(0)
    for (const publicationEvent of committedEvents) {
      await recordAndRevalidatePublication(publicationEvent)
    }
  }

  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action as BulkAction
    const ids: number[] = Array.isArray(body.ids)
      ? body.ids.map((v: unknown) => Number(v)).filter((n: number) => Number.isInteger(n) && n > 0)
      : []

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
    }
    if (ids.length === 0 || ids.length > 100) {
      return NextResponse.json({ error: 'Chọn từ 1 đến 100 bài viết' }, { status: 400 })
    }

    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, status_before_trash: true, published_at: true },
    })

    let affected = 0
    for (const post of posts) {
      switch (action) {
        case 'publish':
          if (post.status !== 'published' && post.status !== 'trash') {
            const publishedPost = await prisma.post.update({
              where: { id: post.id },
              data: { status: 'published', published_at: post.published_at ?? new Date() },
            })
            publicationEvents.push({
              source: 'post',
              sourceId: publishedPost.id,
              url: buildPublicContentUrl('post', publishedPost.slug),
              contentUpdatedAt: publishedPost.updated_at,
              reason: 'published',
            })
            affected++
          }
          break
        case 'draft':
          if (post.status !== 'draft' && post.status !== 'trash') {
            await prisma.post.update({ where: { id: post.id }, data: { status: 'draft' } })
            affected++
          }
          break
        case 'trash':
          if (post.status !== 'trash') {
            await prisma.post.update({ where: { id: post.id }, data: trashData(post.status) })
            affected++
          }
          break
        case 'restore':
          if (post.status === 'trash') {
            await prisma.post.update({ where: { id: post.id }, data: restoreData(post) })
            affected++
          }
          break
        case 'delete':
          // Chỉ xóa vĩnh viễn bài ĐANG ở thùng rác (an toàn kiểu WordPress)
          if (post.status === 'trash') {
            await prisma.post.delete({ where: { id: post.id } })
            affected++
          }
          break
      }
    }

    await logAdminAction({
      userId: Number(session.user.id),
      action: action === 'delete' ? 'DELETE' : 'UPDATE',
      entity: 'POST',
      details: { bulk: action, requested: ids.length, affected },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    await drainPublicationEvents()

    return NextResponse.json({ success: true, affected })
  } catch {
    await drainPublicationEvents()
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
