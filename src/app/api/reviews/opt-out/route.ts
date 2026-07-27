import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OPT_OUT_TEMPLATE_KEY, verifyReviewToken } from '@/lib/review-request'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Huỷ nhận email xin đánh giá. Link này nằm ở chân email nên phải hoạt động bằng một
 * cú click, không yêu cầu đăng nhập — token đã đủ chứng minh người bấm là chủ đơn.
 *
 * Opt-out lưu dưới dạng một bản ghi EmailLog thay vì cột mới trên User, vì phần lớn đơn
 * là khách vãng lai (không có user_id) và cách này không cần migration.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const payload = verifyReviewToken(token)

  if (!payload) {
    return NextResponse.json({ error: 'Link không hợp lệ hoặc đã hết hạn' }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
      select: { order_code: true, customer_email: true },
    })

    if (!order || order.order_code !== payload.orderCode) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    const existing = await prisma.emailLog.findFirst({
      where: { template_key: OPT_OUT_TEMPLATE_KEY, recipient_email: order.customer_email },
      select: { id: true },
    })

    if (!existing) {
      await prisma.emailLog.create({
        data: {
          order_id: payload.orderId,
          recipient_email: order.customer_email,
          subject: 'Huỷ nhận email xin đánh giá',
          template_key: OPT_OUT_TEMPLATE_KEY,
          status: 'SENT',
          sent_at: new Date(),
        },
      })
    }

    return new NextResponse(
      `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Đã huỷ đăng ký</title></head>
<body style="margin:0;padding:40px 20px;background:#fff7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2b2b2b;text-align:center;">
  <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:18px;padding:32px;">
    <div style="font-size:40px;">🍄</div>
    <h1 style="font-size:20px;margin:12px 0;">Đã huỷ đăng ký</h1>
    <p style="font-size:15px;line-height:1.6;color:#6b6b6b;margin:0 0 24px;">
      Mushroomie sẽ không gửi email xin đánh giá tới địa chỉ này nữa. Các email về đơn hàng vẫn được giữ nguyên.
    </p>
    <a href="/" style="display:inline-block;background:#e41d1d;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;font-size:15px;">Về trang chủ</a>
  </div>
</body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' } },
    )
  } catch (error) {
    console.error('[reviews/opt-out] Lỗi:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
