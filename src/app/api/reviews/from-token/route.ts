import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyReviewToken } from '@/lib/review-request'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const payloadSchema = z.object({
  token: z.string().min(1),
  content: z.string().min(5).max(2000),
  rating: z.number().int().min(1).max(5),
})

class ReviewAlreadySubmittedError extends Error {}

/**
 * Nhận đánh giá từ link trong email, không cần đăng nhập.
 *
 * Khác với /api/orders/[id]/reviews (yêu cầu session), route này dành cho khách vãng lai
 * — phần lớn đơn không gắn user_id. Token HMAC 30 ngày đóng vai trò xác thực.
 *
 * Review từ kênh này để status 'pending' để admin duyệt tại /admin/danh-gia: link email
 * ai chuyển tiếp cũng bấm được, nên không thể tin tuyệt đối như đánh giá từ tài khoản
 * đã đăng nhập.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = payloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    const tokenPayload = verifyReviewToken(parsed.data.token)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Link đánh giá không hợp lệ hoặc đã hết hạn' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: tokenPayload.orderId },
      include: { items: { select: { product_id: true } } },
    })

    if (!order || order.order_code !== tokenPayload.orderCode) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    if (order.order_status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Chỉ có thể đánh giá khi đơn hàng đã hoàn thành' }, { status: 400 })
    }

    if (order.is_reviewed) {
      return NextResponse.json({ error: 'Đơn hàng này đã được đánh giá' }, { status: 409 })
    }

    const productIds = Array.from(
      new Set(order.items.map((item) => item.product_id).filter((id): id is number => id !== null)),
    )

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm trong đơn hàng' }, { status: 400 })
    }

    // Claim đơn bằng UPDATE có điều kiện. Hai request đồng thời không thể cùng
    // chuyển is_reviewed từ false sang true, nên chỉ một request được tạo review.
    await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        where: { id: order.id, is_reviewed: false },
        data: { is_reviewed: true },
      })
      if (claim.count !== 1) {
        throw new ReviewAlreadySubmittedError()
      }

      await tx.review.createMany({
        data: productIds.map((productId) => ({
          name: order.customer_name,
          content: parsed.data.content,
          rating: parsed.data.rating,
          product_id: productId,
          status: 'pending',
        })),
      })
    })

    return NextResponse.json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' }, { status: 201 })
  } catch (error) {
    if (error instanceof ReviewAlreadySubmittedError) {
      return NextResponse.json({ error: 'Đơn hàng này đã được đánh giá' }, { status: 409 })
    }
    console.error('[reviews/from-token] Lỗi:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
