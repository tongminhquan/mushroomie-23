import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getPaymentProvider } from '@/lib/payment/factory'
import { z } from 'zod'
import { verifyOrderAccessToken } from '@/lib/order-access'
import { checkRateLimit } from '@/lib/security'
import { Prisma } from '@prisma/client'

const paymentSchema = z.object({
  orderId: z.number().int().positive(),
  accessToken: z.string().max(1000).optional(),
})

class PaymentOrderStateChangedError extends Error {}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(request, 'payment-create', { limit: 20, windowMs: 15 * 60 * 1000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many payment requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }

    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { orderId, accessToken } = parsed.data

    // Check order exists and not yet paid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const session = await auth()
    const isAdmin = session?.user && ['super_admin', 'admin'].includes(session.user.role || '')
    const isOwner = session?.user?.id && order.user_id === Number(session.user.id)
    const hasGuestToken = verifyOrderAccessToken(accessToken, order.id, order.order_code)
    if (!isAdmin && !isOwner && !hasGuestToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (order.payment_method !== 'bank_transfer') {
      return NextResponse.json({ error: 'Order does not use bank transfer' }, { status: 400 })
    }
    if (order.payment_status === 'PAID') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })
    }
    if (
      order.order_status !== 'PENDING_PAYMENT'
      || order.payment_status !== 'PENDING'
      || !order.inventory_reserved_at
    ) {
      return NextResponse.json({ error: 'Order is no longer awaiting payment' }, { status: 409 })
    }
    if (order.payment) {
      // Return existing payment
      return NextResponse.json(order.payment)
    }

    const expireMinutes = Number(process.env.PAYMENT_EXPIRE_MINUTES || 30)

    const provider = getPaymentProvider()

    const outcome = await prisma.$transaction(async (tx) => {
      // This conditional update obtains the same order-row lock as reservation
      // expiry. Keep it for QR generation too: creating the provider payload
      // before this claim could produce a QR for a reservation the expiry job
      // has just cancelled.
      const claimed = await tx.order.updateMany({
        where: {
          id: orderId,
          order_status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          inventory_reserved_at: { not: null },
        },
        data: { updated_at: new Date() },
      })
      if (claimed.count !== 1) {
        throw new PaymentOrderStateChangedError('Order is no longer awaiting payment')
      }

      const existingPayment = await tx.payment.findUnique({ where: { order_id: orderId } })
      if (existingPayment) return { payment: existingPayment, created: false }

      // Start the payment lifetime only after the order-row claim succeeds. A
      // blocked transaction must not emit a QR that is already expired.
      const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000)

      // The currently configured Casso/VietQR provider generates this payload
      // locally. Keeping it after the order claim ensures no QR is created for
      // an order whose reservation has already been released.
      const result = await provider.createPayment({
        orderId,
        orderCode: order.order_code,
        amount: Number(order.total),
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        expiresAt,
      })

      try {
        const payment = await tx.payment.create({
          data: {
            order_id: orderId,
            provider: provider.providerKey,
            bank_name: result.bankName,
            bank_account: result.bankAccount,
            account_name: result.accountName,
            amount: order.total,
            currency: 'VND',
            transfer_content: result.transferContent,
            qr_code_url: result.qrCodeUrl,
            qr_code_payload: result.qrCodePayload,
            status: 'PENDING',
            expires_at: expiresAt,
          },
        })
        return { payment, created: true }
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
        const payment = await tx.payment.findUnique({ where: { order_id: orderId } })
        if (!payment) throw error
        return { payment, created: false }
      }
    })

    return NextResponse.json(outcome.payment, { status: outcome.created ? 201 : 200 })
  } catch (error) {
    if (error instanceof PaymentOrderStateChangedError) {
      return NextResponse.json({ error: 'Order is no longer awaiting payment' }, { status: 409 })
    }
    console.error('[PAYMENT CREATE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status && status !== 'ALL') where.status = status

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        // id + trạng thái cần cho nút xoá đơn ở /admin/thanh-toan; thiếu id thì nút
        // không biết gọi DELETE lên đơn nào.
        include: {
          order: {
            select: {
              id: true,
              order_code: true,
              customer_name: true,
              payment_status: true,
              order_status: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
