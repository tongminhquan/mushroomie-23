import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    
    const order = await prisma.order.findFirst({
      where: isNumeric ? { id: Number(id) } : { order_code: id },
      include: { payment: true },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const payment = order.payment
    let status = payment?.status || 'PENDING'

    // Check expiry
    if (status === 'PENDING' && payment?.expires_at && new Date(payment.expires_at) < new Date()) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
      status = 'EXPIRED'
    }

    return NextResponse.json({
      status,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      expiresAt: payment?.expires_at,
      paidAt: payment?.paid_at,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
