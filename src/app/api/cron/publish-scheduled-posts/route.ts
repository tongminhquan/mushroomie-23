import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { timingSafeStringEqual } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron endpoint: xuất bản bài đã lên lịch đến hạn.
 *
 * - Cơ chế CHÍNH là job in-process (src/instrumentation.ts, tick 60s).
 *   Endpoint này là backstop cho trường hợp process treo/missed schedule,
 *   được system cron gọi mỗi 5 phút.
 * - Idempotent: updateMany với điều kiện status='scheduled' — gọi bao nhiêu
 *   lần cũng không publish trùng.
 * - Bảo vệ bằng CRON_SECRET (Bearer). Thiếu secret trong env → luôn 401,
 *   không bao giờ mở public.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!secret || !timingSafeStringEqual(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Lấy id trước để trả về danh sách (log vừa đủ, không log nội dung bài)
    const due = await prisma.post.findMany({
      where: { status: 'scheduled', published_at: { lte: new Date() } },
      select: { id: true },
    })

    if (due.length === 0) {
      return NextResponse.json({ success: true, publishedCount: 0, postIds: [] })
    }

    const result = await prisma.post.updateMany({
      where: { id: { in: due.map((p) => p.id) }, status: 'scheduled' },
      data: { status: 'published' },
    })

    console.info(`[cron/publish-scheduled] Đã xuất bản ${result.count} bài:`, due.map((p) => p.id).join(','))
    return NextResponse.json({ success: true, publishedCount: result.count, postIds: due.map((p) => p.id) })
  } catch (error) {
    console.error('[cron/publish-scheduled] Lỗi:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const POST = GET
