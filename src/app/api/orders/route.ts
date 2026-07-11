import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateOrderCode } from '@/lib/utils'
import { rateLimiter } from '@/lib/rate-limit'
import { createOrderAccessToken } from '@/lib/order-access'

const orderSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().email(),
  customer_phone: z.string().trim().regex(/^(0|\+84)[0-9]{8,9}$/),
  shipping_address: z.string().trim().min(10).max(1000),
  note: z.string().trim().max(2000).optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    product_name: z.string().optional(),
    quantity: z.number().int().positive().max(99),
    price_snapshot: z.number().optional(),
    selected_options: z.record(z.string().max(100), z.string().max(300)).optional(),
    custom_note: z.string().trim().max(1000).optional(),
  })).min(1).max(50),
  payment_method: z.enum(['bank_transfer', 'cod']).default('bank_transfer'),
  user_voucher_id: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    if (await rateLimiter.isLimited(request, 5, 60_000, 'order_post')) {
      return rateLimiter.getLimitResponse()
    }

    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id ? Number(session.user.id) : null
    const { items, payment_method, user_voucher_id, ...orderData } = parsed.data

    const productIds = [...new Set(items.map((item) => item.product_id))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'active' },
      include: { options: true },
    })
    const productById = new Map(products.map((product) => [product.id, product]))
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products are unavailable' }, { status: 400 })
    }

    const authoritativeItems = items.map((item) => {
      const product = productById.get(item.product_id)
      if (!product || product.stock < item.quantity) throw new Error('PRODUCT_UNAVAILABLE')

      const selectedOptions = item.selected_options || {}
      const optionByName = new Map(product.options.map((option) => [option.option_name, option]))
      for (const [name, value] of Object.entries(selectedOptions)) {
        const option = optionByName.get(name)
        if (!option) throw new Error('INVALID_PRODUCT_OPTIONS')
        if (option.option_type !== 'text') {
          const allowedValues = JSON.parse(option.option_values || '[]')
          if (!Array.isArray(allowedValues) || !allowedValues.includes(value)) {
            throw new Error('INVALID_PRODUCT_OPTIONS')
          }
        }
      }

      const regularPrice = Number(product.price)
      const salePrice = product.sale_price === null ? null : Number(product.sale_price)
      const unitPrice = salePrice !== null && salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice

      return {
        ...item,
        product_name: product.name,
        price_snapshot: unitPrice,
        total_price: unitPrice * item.quantity,
      }
    })

    const subtotal = authoritativeItems.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0)
    const reservedQuantities = authoritativeItems.reduce((result, item) => {
      result.set(item.product_id, (result.get(item.product_id) || 0) + item.quantity)
      return result
    }, new Map<number, number>())
    const shippingFee = 30_000
    const orderCode = generateOrderCode()

    const order = await prisma.$transaction(async (tx) => {
      for (const [productId, quantity] of reservedQuantities) {
        const reserved = await tx.product.updateMany({
          where: { id: productId, status: 'active', stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        })
        if (reserved.count !== 1) throw new Error('PRODUCT_UNAVAILABLE')
      }

      let voucherDiscountAmount = 0

      let userVoucher = null
      let itemDiscountAmount = voucherDiscountAmount
      let shippingDiscountAmount = 0
      if (user_voucher_id) {
        if (!userId) throw new Error('LOGIN_REQUIRED_FOR_VOUCHER')

        userVoucher = await tx.userVoucher.findFirst({
          where: {
            id: user_voucher_id,
            userId,
            status: 'AVAILABLE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: { voucher: true },
        })

        if (!userVoucher) throw new Error('VOUCHER_NOT_AVAILABLE')

        const template = userVoucher.voucher
        if (template.minOrderValue && subtotal < Number(template.minOrderValue)) {
          throw new Error('MIN_ORDER_VALUE_NOT_MET')
        }

        if (template.discountType === 'PERCENT') {
          itemDiscountAmount = Math.floor((subtotal * Number(template.discountValue)) / 100)
          if (template.maxDiscount) {
            itemDiscountAmount = Math.min(itemDiscountAmount, Number(template.maxDiscount))
          }
        } else if (template.discountType === 'FIXED') {
          itemDiscountAmount = Number(template.discountValue)
        } else if (template.discountType === 'FREE_SHIPPING') {
          shippingDiscountAmount = shippingFee
        }

        itemDiscountAmount = Math.min(subtotal, itemDiscountAmount)
        shippingDiscountAmount = Math.min(shippingFee, shippingDiscountAmount)
        voucherDiscountAmount = itemDiscountAmount + shippingDiscountAmount
      }

      const total = Math.max(0, subtotal - itemDiscountAmount) + Math.max(0, shippingFee - shippingDiscountAmount)
      const orderStatus = payment_method === 'cod' ? 'PROCESSING' : 'PENDING_PAYMENT'

      const createdOrder = await tx.order.create({
          data: {
          ...orderData,
          order_code: orderCode,
          user_id: userId,
          subtotal,
          shipping_fee: shippingFee,
          voucher_id: user_voucher_id ?? null,
          voucher_code: user_voucher_id ? userVoucher?.voucher.code ?? null : null,
          voucher_discount_amount: voucherDiscountAmount,
          total,
          payment_method,
          payment_status: 'PENDING',
          order_status: orderStatus,
          items: {
            create: authoritativeItems.map((item) => ({
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

      if (user_voucher_id) {
        const updatedUserVoucher = await tx.userVoucher.updateMany({
          where: {
            id: user_voucher_id,
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

    return NextResponse.json({
      orderId: order.id,
      orderCode: order.order_code,
      accessToken: createOrderAccessToken(order.id, order.order_code),
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'LOGIN_REQUIRED_FOR_VOUCHER') {
      return NextResponse.json({ error: 'Login required for voucher' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'VOUCHER_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'Voucher is not available' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'PRODUCT_UNAVAILABLE') {
      return NextResponse.json({ error: 'Product is unavailable or out of stock' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'INVALID_PRODUCT_OPTIONS') {
      return NextResponse.json({ error: 'Invalid product options' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'MIN_ORDER_VALUE_NOT_MET') {
      return NextResponse.json({ error: 'Minimum order value is not met for this voucher' }, { status: 400 })
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
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20) || 20))
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
