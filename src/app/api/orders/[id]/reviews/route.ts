import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  content: z.string().min(5),
  rating: z.number().int().min(1).max(5),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Lấy user từ DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Lấy thông tin đơn hàng và kiểm tra điều kiện
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Đảm bảo đơn hàng thuộc về user hiện tại
    if (order.user_id !== user.id && order.customer_email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Đảm bảo đơn hàng đã hoàn thành và chưa đánh giá
    if (order.order_status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Chỉ có thể đánh giá khi đơn hàng đã hoàn thành' }, { status: 400 })
    }

    if ((order as any).is_reviewed) {
      return NextResponse.json({ error: 'Đơn hàng này đã được đánh giá' }, { status: 400 })
    }

    // Thu thập các product_id duy nhất trong đơn hàng
    const productIds = Array.from(new Set(order.items.map(item => item.product_id).filter(id => id !== null))) as number[]

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm trong đơn hàng' }, { status: 400 })
    }

    // Tạo đánh giá cho tất cả sản phẩm
    // Bỏ qua tạo avatar để cho default avatar tuỳ frontend, status tự động là approved theo yêu cầu
    const reviewPromises = productIds.map(productId => {
      return prisma.review.create({
        data: {
          name: user.name,
          content: parsed.data.content,
          rating: parsed.data.rating,
          product_id: productId,
          status: 'approved',
        }
      })
    })

    await Promise.all(reviewPromises)

    // Đánh dấu đơn hàng là đã review
    await prisma.order.update({
      where: { id: orderId },
      data: { is_reviewed: true }
    })

    return NextResponse.json({ success: true, message: 'Đánh giá thành công' }, { status: 201 })
  } catch (error) {
    console.error('Error creating order review:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
