import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateOrderCode } from '@/lib/utils'
import { rateLimiter } from '@/lib/rate-limit'

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
  payment_method: z.string().default('bank_transfer'),
  user_voucher_id: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const req = request as any
    if (rateLimiter.isLimited(req, 5, 60000, 'order_post')) {
      return rateLimiter.getLimitResponse()
    }

    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ? Number(session.user.id) : null
    const { items, shipping_fee, payment_method, user_voucher_id, ...orderData } = parsed.data
    
    // FETCH REAL PRICES FROM DB
    const productIds = items.map(i => i.product_id)
    const productsInDb = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(productsInDb.map(p => [p.id, p]))

    let realSubtotal = 0
    const secureItems = items.map(item => {
      const dbProduct = productMap.get(item.product_id)
      if (!dbProduct) throw new Error(`Sản phẩm không tồn tại: ${item.product_name}`)
      if (dbProduct.status !== 'active') throw new Error(`Sản phẩm ngừng bán: ${item.product_name}`)
      if (item.quantity <= 0) throw new Error(`Số lượng không hợp lệ cho: ${item.product_name}`)
      
      const realPrice = dbProduct.sale_price ? Number(dbProduct.sale_price) : Number(dbProduct.price)
      realSubtotal += realPrice * item.quantity

      return {
        ...item,
        price_snapshot: realPrice,
        total_price: realPrice * item.quantity
      }
    })

    const realShippingFee = realSubtotal >= 500000 ? 0 : 30000
    const subtotal = realSubtotal

    const order_code = generateOrderCode()

    const order = await prisma.$transaction(async (tx) => {
      let userVoucher = null
      let voucherDiscountAmount = 0
      let template = null

      if (user_voucher_id) {
        if (!userId) throw new Error('LOGIN_REQUIRED_FOR_VOUCHER')

        userVoucher = await tx.userVoucher.findFirst({
          where: {
            id: user_voucher_id,
            userId: userId,
            status: 'AVAILABLE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { voucher: true },
        })

        if (!userVoucher) throw new Error('VOUCHER_NOT_AVAILABLE')
        template = userVoucher.voucher

        if (template.minOrderValue && subtotal < Number(template.minOrderValue)) {
          throw new Error('MIN_ORDER_VALUE_NOT_MET')
        }

        if (template.discountType === 'PERCENT') {
          voucherDiscountAmount = Math.floor((subtotal * Number(template.discountValue)) / 100)
          if (template.maxDiscount) {
            voucherDiscountAmount = Math.min(voucherDiscountAmount, Number(template.maxDiscount))
          }
        } else if (template.discountType === 'FIXED') {
          voucherDiscountAmount = Number(template.discountValue)
        }

        voucherDiscountAmount = Math.min(subtotal, voucherDiscountAmount)
      }

      const total = Math.max(0, subtotal - voucherDiscountAmount) + realShippingFee
      const orderStatus = payment_method === 'cod' ? 'PROCESSING' : 'PENDING_PAYMENT'

      const createdOrder = await tx.order.create({
        data: {
          ...orderData,
          order_code,
          user_id: userId,
          subtotal,
          shipping_fee: realShippingFee,
          voucher_id: userVoucher?.id ?? null,
          voucher_code: template?.code ?? null,
          voucher_discount_amount: voucherDiscountAmount,
          total,
          payment_method,
          payment_status: 'PENDING',
          order_status: orderStatus,
          items: {
            create: secureItems.map((item) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              price_snapshot: item.price_snapshot,
              selected_options: item.selected_options ? JSON.stringify(item.selected_options) : null,
              custom_note: item.custom_note,
              total_price: item.total_price,
            })),
          },
        },
        include: { items: true },
      })

      if (userVoucher && template) {
        const updatedUserVoucher = await tx.userVoucher.updateMany({
          where: {
            id: userVoucher.id,
            userId: userId!,
            status: 'AVAILABLE',
          },
          data: {
            status: 'USED',
            orderId: createdOrder.id,
            usedAt: new Date(),
          },
        })

        if (updatedUserVoucher.count !== 1) throw new Error('VOUCHER_NOT_AVAILABLE')

        await tx.voucherRedemptionLog.create({
          data: {
            userId,
            voucherId: template.id,
            userVoucherId: userVoucher.id,
            orderId: createdOrder.id,
            action: payment_method === 'cod' ? 'USED' : 'APPLIED_TO_ORDER',
            message: `Applied to order ${order_code}`,
            discountAmount: voucherDiscountAmount,
          }
        })
      }

      await tx.orderStatusHistory.create({
        data: {
          order_id: createdOrder.id,
          old_status: '',
          new_status: orderStatus,
          changed_by: 'SYSTEM',
          note: 'Order created',
        },
      })

      return createdOrder
    })

    return NextResponse.json({ orderId: order.id, orderCode: order.order_code }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'LOGIN_REQUIRED_FOR_VOUCHER') {
      return NextResponse.json({ error: 'Login required for voucher' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'VOUCHER_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'Voucher is not available' }, { status: 400 })
    }
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
