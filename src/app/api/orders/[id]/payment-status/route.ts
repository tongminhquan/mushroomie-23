import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { verifyOrderAccessToken } from '@/lib/order-access'
import { checkRateLimit } from '@/lib/security'
import { cancelOrderAndReleaseInventory } from '@/lib/order-inventory'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const isNumeric = /^\d+$/.test(id)
    const session = await auth()
    const accessToken = request.nextUrl.searchParams.get('accessToken')
    
    const order = await prisma.order.findFirst({
      where: isNumeric ? { id: Number(id) } : { order_code: id },
      include: { payment: true },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isAdmin = session?.user && ['super_admin', 'admin', 'viewer'].includes(session.user.role || '')
    const isOwner = session?.user?.id && order.user_id === Number(session.user.id)
    const hasGuestToken = verifyOrderAccessToken(accessToken, order.id, order.order_code)
    if (!isAdmin && !isOwner && !hasGuestToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(request, 'payment-status', {
      limit: 120,
      windowMs: 5 * 60 * 1000,
      identity: session?.user?.id || undefined,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many status requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }

    const payment = order.payment
    let status = payment?.status || 'PENDING'
    let orderStatus = order.order_status
    let paymentStatus = order.payment_status
    let expiresAt = payment?.expires_at
    let paidAt = payment?.paid_at

    // Check expiry
    if (
      status === 'PENDING'
      && order.order_status === 'PENDING_PAYMENT'
      && order.payment_status === 'PENDING'
      && payment?.expires_at
      && new Date(payment.expires_at) < new Date()
    ) {
      await prisma.$transaction(async (tx) => {
        const expired = await tx.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        })
        if (expired.count === 1) {
          await cancelOrderAndReleaseInventory(tx, {
            orderId: order.id,
            changedBy: 'SYSTEM',
            note: 'Payment expired; inventory released',
          })
        }
      })

      // The webhook may have won the PENDING -> PAID compare-and-set while
      // this request was waiting. Always re-read the authoritative state.
      const currentPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { order: true },
      })
      if (currentPayment) {
        status = currentPayment.status
        orderStatus = currentPayment.order.order_status
        paymentStatus = currentPayment.order.payment_status
        expiresAt = currentPayment.expires_at
        paidAt = currentPayment.paid_at
      }
    }

    return NextResponse.json({
      status,
      orderStatus,
      paymentStatus,
      expiresAt,
      paidAt,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
