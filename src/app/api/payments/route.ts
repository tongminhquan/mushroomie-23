import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getPaymentProvider } from '@/lib/payment/factory'
import { z } from 'zod'

const paymentSchema = z.object({
  orderId: z.number(),
  orderCode: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { orderId, orderCode } = parsed.data

    // Check order exists and not yet paid
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.payment) {
      // Return existing payment
      return NextResponse.json(order.payment)
    }

    const expireMinutes = Number(process.env.PAYMENT_EXPIRE_MINUTES || 30)
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000)

    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      orderId,
      orderCode,
      amount: Number(order.total),
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      expiresAt,
    })

    const payment = await prisma.payment.create({
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

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('[PAYMENT CREATE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
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
        include: { order: { select: { order_code: true, customer_name: true } } },
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
