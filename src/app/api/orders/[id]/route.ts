import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendOrderEmail } from '@/lib/payment/email/sender'
import { EmailTemplateKey } from '@/types'

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
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    const isAdmin = (session.user as any).role === 'admin'
    const userId = Number((session.user as any).id)

    const order = await prisma.order.findFirst({
      where: isNumeric ? { id: Number(id) } : { order_code: id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        payment: true,
        status_history: { orderBy: { created_at: 'asc' } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!isAdmin && order.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { order_status, note } = body

    const order = await prisma.order.findUnique({ where: { id: Number(id) } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { order_status },
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

    return NextResponse.json(updatedOrder)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
