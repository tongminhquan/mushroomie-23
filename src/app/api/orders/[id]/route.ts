import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendOrderEmail } from '@/lib/payment/email/sender'
import { EmailTemplateKey } from '@/types'
import { logAdminAction } from '@/lib/admin-logger'
import { verifyOrderAccessToken } from '@/lib/order-access'
import { checkRateLimit } from '@/lib/security'
import { z } from 'zod'

const updateOrderSchema = z.object({
  order_status: z.enum(['PENDING_PAYMENT', 'PROCESSING', 'MAKING', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED']),
  note: z.string().trim().max(2000).optional().nullable(),
}).strict()

const ORDER_EMAIL_MAP: Record<string, EmailTemplateKey> = {
  PROCESSING: 'order_processing',
  MAKING: 'order_making',
  PACKING: 'order_packing',
  SHIPPING: 'order_shipping',
  COMPLETED: 'order_completed',
  CANCELLED: 'order_cancelled',
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')

    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    const isAdmin = session?.user && ['super_admin', 'admin', 'viewer'].includes((session.user as any).role)
    const userId = session?.user ? Number((session.user as any).id) : null

    const order = await prisma.order.findFirst({
      where: isNumeric ? { id: Number(id) } : { order_code: id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        payment: true,
        status_history: { orderBy: { created_at: 'asc' } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Admin can view all
    if (isAdmin) return NextResponse.json(order)

    // Logged in user must be the owner
    if (userId) {
      if (order.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.json(order)
    }

    const rateLimit = await checkRateLimit(request, 'order-lookup', { limit: 30, windowMs: 5 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many lookup requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }

    if (verifyOrderAccessToken(accessToken, order.id, order.order_code)) {
      return NextResponse.json(order)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const parsed = updateOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { order_status, note } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.order.updateMany({
        where: { id: Number(id), order_status: order.order_status },
        data: {
          order_status,
          ...(order_status === 'CANCELLED' ? { inventory_reserved_at: null } : {}),
          ...(order.order_status === 'CANCELLED' && order_status !== 'CANCELLED'
            ? { inventory_reserved_at: new Date() }
            : {}),
        },
      })
      if (transitioned.count !== 1) throw new Error('ORDER_CHANGED')

      if (order.inventory_reserved_at && order.order_status !== 'CANCELLED' && order_status === 'CANCELLED') {
        for (const item of order.items) {
          if (item.product_id) {
            await tx.product.update({
              where: { id: item.product_id },
              data: { stock: { increment: item.quantity } },
            })
          }
        }
      }

      if (order.order_status === 'CANCELLED' && order_status !== 'CANCELLED') {
        for (const item of order.items) {
          if (!item.product_id) continue
          const reserved = await tx.product.updateMany({
            where: { id: item.product_id, status: 'active', stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (reserved.count !== 1) throw new Error('PRODUCT_UNAVAILABLE')
        }

        if (order.voucher_id) {
          const restoredVoucher = await tx.userVoucher.updateMany({
            where: {
              id: order.voucher_id,
              status: 'AVAILABLE',
              orderId: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            data: { status: 'USED', orderId: order.id, usedAt: new Date() },
          })
          if (restoredVoucher.count !== 1) throw new Error('VOUCHER_NOT_AVAILABLE')
        }
      }

      if (order_status === 'CANCELLED') {
        await tx.userVoucher.updateMany({
          where: { orderId: Number(id), status: 'USED' },
          data: { status: 'AVAILABLE', orderId: null, usedAt: null },
        })
      }

      await tx.orderStatusHistory.create({
        data: {
          order_id: Number(id),
          old_status: order.order_status,
          new_status: order_status,
          changed_by: 'ADMIN',
          changed_by_user_id: Number(session.user.id),
          note: note || null,
        },
      })

      return tx.order.findUniqueOrThrow({ where: { id: Number(id) } })
    })

    // Send email nếu có template
    const emailKey = ORDER_EMAIL_MAP[order_status]
    if (emailKey) {
      sendOrderEmail(Number(id), emailKey).catch(console.error)
    }

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'ORDER',
      details: { id: updatedOrder.id, order_code: updatedOrder.order_code, new_status: order_status, note },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_UNAVAILABLE') {
      return NextResponse.json({ error: 'Product is unavailable or out of stock' }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'ORDER_CHANGED') {
      return NextResponse.json({ error: 'Order status changed, please reload and try again' }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'VOUCHER_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'The order voucher is no longer available' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * Xoá vĩnh viễn một đơn hàng.
 *
 * Đây là thao tác không hoàn tác được trên hồ sơ kinh doanh, nên có mấy ràng buộc:
 *
 * 1. `Payment` là quan hệ DUY NHẤT trỏ tới Order mà không khai báo `onDelete`, tức
 *    mặc định `Restrict`. `prisma.order.delete()` sẽ ném lỗi khoá ngoại với bất kỳ đơn
 *    nào từng qua thanh toán, nên phải xoá bản ghi Payment trong cùng transaction.
 *    (OrderItem và OrderStatusHistory có Cascade; EmailLog và UserVoucher là SetNull.)
 *
 * 2. Nếu đơn đang giữ tồn kho (`inventory_reserved_at`), phải cộng trả số lượng về
 *    sản phẩm — xoá thẳng sẽ làm kho hụt vĩnh viễn mà không ai biết.
 *
 * 3. Voucher đã dùng cho đơn được trả lại trạng thái AVAILABLE, giống hệt luồng huỷ đơn
 *    trong cancelOrderAndReleaseInventory().
 *
 * 4. Toàn bộ ảnh chụp đơn được ghi vào admin_logs trước khi xoá, để còn dấu vết đối
 *    chiếu doanh thu về sau.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || !role || !['super_admin', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const orderId = Number(id)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Mã đơn không hợp lệ' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    // Ảnh chụp trước khi xoá — sau transaction thì không còn gì để đọc.
    const snapshot = {
      order_code: order.order_code,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total: order.total.toString(),
      payment_status: order.payment_status,
      order_status: order.order_status,
      created_at: order.created_at.toISOString(),
      items: order.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price_snapshot: item.price_snapshot.toString(),
        total_price: item.total_price.toString(),
      })),
      restored_stock: Boolean(order.inventory_reserved_at),
    }

    await prisma.$transaction(async (tx) => {
      // Trả tồn kho nếu đơn đang giữ chỗ.
      if (order.inventory_reserved_at) {
        for (const item of order.items) {
          if (!item.product_id) continue
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      // Trả voucher về ví khách.
      await tx.userVoucher.updateMany({
        where: { orderId, status: 'USED' },
        data: { status: 'AVAILABLE', orderId: null, usedAt: null },
      })

      // Payment không Cascade — phải xoá tay, nếu không khoá ngoại chặn.
      if (order.payment) {
        await tx.payment.delete({ where: { order_id: orderId } })
      }

      await tx.order.delete({ where: { id: orderId } })
    })

    await logAdminAction({
      userId: Number((session.user as { id?: string | number }).id),
      action: 'DELETE',
      entity: 'ORDER',
      details: snapshot,
    })

    return NextResponse.json({ success: true, order_code: order.order_code })
  } catch (error) {
    console.error('[ORDER DELETE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
