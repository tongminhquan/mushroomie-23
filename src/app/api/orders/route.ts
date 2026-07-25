import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateOrderCode } from '@/lib/utils'
import { rateLimiter } from '@/lib/rate-limit'
import { createOrderAccessToken } from '@/lib/order-access'
import { orderSchema } from '@/lib/order-schema'
import {
  buildAuthoritativeOrderItems,
  calculateOrderTotal,
  calculateVoucherDiscount,
} from '@/lib/order-pricing'
import {
  createShippingFeeConflict,
  type ShippingFeeConflict,
} from '@/lib/shipping-fee'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'
import {
  createGiftWrapFeeConflict,
  createGiftWrapUnavailable,
  normalizeGiftMessage,
  resolveGiftWrapFee,
  type GiftWrapConflict,
  type GiftWrapUnavailable,
} from '@/lib/gift-wrap'
import { getGiftWrapSnapshot } from '@/lib/gift-wrap-server'

class ShippingFeeChangedError extends Error {
  constructor(readonly conflict: ShippingFeeConflict) {
    super(conflict.code)
  }
}

class GiftWrapChangedError extends Error {
  constructor(readonly conflict: GiftWrapConflict) {
    super(conflict.code)
  }
}

class GiftWrapUnavailableError extends Error {
  constructor(readonly conflict: GiftWrapUnavailable) {
    super(conflict.code)
  }
}

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
    const {
      items,
      payment_method,
      user_voucher_id,
      expected_shipping_fee,
      gift_wrap,
      gift_message,
      expected_gift_wrap_fee,
      ...orderData
    } = parsed.data

    const productIds = [...new Set(items.map((item) => item.product_id))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'active' },
      include: { options: true },
    })
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products are unavailable' }, { status: 400 })
    }

    const authoritativeItems = buildAuthoritativeOrderItems(items, products)

    const subtotal = authoritativeItems.reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0)
    const reservedQuantities = authoritativeItems.reduce((result, item) => {
      result.set(item.product_id, (result.get(item.product_id) || 0) + item.quantity)
      return result
    }, new Map<number, number>())
    const orderCode = generateOrderCode()

    const order = await prisma.$transaction(async (tx) => {
      const { shippingFee } = await getShippingFeeSnapshot(tx)
      const shippingConflict = createShippingFeeConflict(expected_shipping_fee, shippingFee)
      if (shippingConflict) throw new ShippingFeeChangedError(shippingConflict)

      // Phí gói quà lấy từ settings trong cùng transaction — không tin số client gửi lên.
      const giftWrapSnapshot = await getGiftWrapSnapshot(tx)
      const giftWrapUnavailable = createGiftWrapUnavailable(gift_wrap, giftWrapSnapshot)
      if (giftWrapUnavailable) throw new GiftWrapUnavailableError(giftWrapUnavailable)

      const giftWrapConflict = createGiftWrapFeeConflict(
        gift_wrap,
        expected_gift_wrap_fee,
        giftWrapSnapshot.fee,
      )
      if (giftWrapConflict) throw new GiftWrapChangedError(giftWrapConflict)

      const giftWrapFee = resolveGiftWrapFee(gift_wrap, giftWrapSnapshot)
      const giftMessage = gift_wrap ? normalizeGiftMessage(gift_message) : null

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

        const discounts = calculateVoucherDiscount(subtotal, shippingFee, template)
        itemDiscountAmount = discounts.itemDiscountAmount
        shippingDiscountAmount = discounts.shippingDiscountAmount
        voucherDiscountAmount = discounts.voucherDiscountAmount
      }

      const total = calculateOrderTotal(
        subtotal,
        shippingFee,
        itemDiscountAmount,
        shippingDiscountAmount,
        giftWrapFee,
      )
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
          gift_wrap: giftWrapFee > 0 || Boolean(gift_wrap && giftWrapSnapshot.enabled),
          gift_wrap_fee: giftWrapFee,
          gift_message: giftMessage,
          total,
          payment_method,
          payment_status: 'PENDING',
          order_status: orderStatus,
          inventory_reserved_at: new Date(),
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
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })

    return NextResponse.json({
      orderId: order.id,
      orderCode: order.order_code,
      accessToken: createOrderAccessToken(order.id, order.order_code),
    }, { status: 201 })
  } catch (error) {
    if (error instanceof ShippingFeeChangedError) {
      return NextResponse.json(error.conflict, { status: 409 })
    }
    if (error instanceof GiftWrapChangedError) {
      return NextResponse.json(error.conflict, { status: 409 })
    }
    if (error instanceof GiftWrapUnavailableError) {
      return NextResponse.json(error.conflict, { status: 409 })
    }
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

    const role = session.user.role
    const isAdmin = Boolean(role && ['super_admin', 'admin', 'viewer'].includes(role))
    const userId = Number(session.user.id)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20) || 20))
    const status = searchParams.get('status')

    const where: Prisma.OrderWhereInput = isAdmin ? {} : { user_id: userId }
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
