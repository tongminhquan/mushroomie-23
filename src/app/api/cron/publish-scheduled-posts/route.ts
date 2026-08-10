import { NextRequest, NextResponse } from 'next/server'
import { timingSafeStringEqual } from '@/lib/security'
import { publishDuePosts } from '@/lib/scheduled-publisher'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron endpoint: xuất bản bài đã lên lịch đến hạn.
 *
 * - Cơ chế CHÍNH là job in-process (src/instrumentation.ts, tick 60s).
 *   Endpoint này là backstop cho trường hợp process treo/missed schedule,
 *   được system cron gọi mỗi 5 phút.
 * - Idempotent: implementation dùng conditional update status='scheduled' cho
 *   từng id; chỉ worker chuyển trạng thái thành công mới phát publication event.
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
    const publishedPosts = await publishDuePosts()
    const postIds = publishedPosts.map((post) => post.id)

    if (publishedPosts.length > 0) {
      console.info(
        `[cron/publish-scheduled] Đã xuất bản ${publishedPosts.length} bài:`,
        postIds.join(','),
      )
    }
    return NextResponse.json({
      success: true,
      publishedCount: publishedPosts.length,
      postIds: publishedPosts.map((post) => post.id),
    })
  } catch (error) {
    console.error('[cron/publish-scheduled] Lỗi:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const POST = GET
