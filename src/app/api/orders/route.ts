import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateOrderCode } from '@/lib/utils'

const orderSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(9),
  shipping_address: z.string().min(1),
  note: z.string().optional(),
  items: z.array(z.object({
    product_id: z.number(),
    product_name: z.string(),
    quantity: z.number().int().positive(),
    price_snapshot: z.number(),
    selected_options: z.record(z.string(), z.string()).optional(),
    custom_note: z.string().optional(),
  })),
  shipping_fee: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ? Number(session.user.id) : null

    const { items, shipping_fee, ...orderData } = parsed.data

    const subtotal = items.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0)
    const total = subtotal + shipping_fee
    const order_code = generateOrderCode()

    const order = await prisma.order.create({
      data: {
        ...orderData,
        order_code,
        user_id: userId,
        subtotal,
        shipping_fee,
        total,
        payment_method: 'bank_transfer',
        payment_status: 'PENDING',
        order_status: 'PENDING_PAYMENT',
        items: {
          create: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price_snapshot: item.price_snapshot,
            selected_options: item.selected_options ? JSON.stringify(item.selected_options) : null,
            custom_note: item.custom_note,
            total_price: item.price_snapshot * item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Log initial status
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        old_status: '',
        new_status: 'PENDING_PAYMENT',
        changed_by: 'SYSTEM',
        note: 'Đơn hàng được tạo',
      },
    })

    return NextResponse.json({ orderId: order.id, orderCode: order.order_code }, { status: 201 })
  } catch (error) {
    console.error('[ORDER CREATE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = ['super_admin', 'admin', 'viewer'].includes((session.user as any).role)
    const userId = Number((session.user as any).id)
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const status = searchParams.get('status')

    const where: any = isAdmin ? {} : { user_id: userId }
    if (status) where.order_status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, payment: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
