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
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
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

    const rateLimit = checkRateLimit(request, 'order-lookup', { limit: 60, windowMs: 5 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many lookup requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }

    if (verifyOrderAccessToken(accessToken, order.id, order.order_code)) {
      return NextResponse.json(order)
    }

    // Guest lookup requires matching contact information.
    if (phone && order.customer_phone === phone) return NextResponse.json(order)
    if (email && order.customer_email.toLowerCase() === email.trim().toLowerCase()) return NextResponse.json(order)

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

    const order = await prisma.order.findUnique({ where: { id: Number(id) } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const nextOrder = await tx.order.update({
        where: { id: Number(id) },
        data: { order_status },
      })

      if (order_status === 'CANCELLED') {
        await tx.userVoucher.updateMany({
          where: { orderId: Number(id), status: 'USED' },
          data: { status: 'AVAILABLE', orderId: null, usedAt: null },
        })
      }

      return nextOrder
    })

    // Log status history
    await prisma.orderStatusHistory.create({
      data: {
        order_id: Number(id),
        old_status: order.order_status,
        new_status: order_status,
        changed_by: 'ADMIN',
        changed_by_user_id: Number((session.user as any).id),
        note: note || null,
      },
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
