import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'

const applyVoucherSchema = z.object({
  userVoucherId: z.string(),
  subtotal: z.number().nonnegative(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = applyVoucherSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const userVoucher = await prisma.userVoucher.findFirst({
      where: {
        id: parsed.data.userVoucherId,
        userId: Number(session.user.id),
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { voucher: true }
    })

    if (!userVoucher) {
      return NextResponse.json({ error: 'Voucher is not available or expired' }, { status: 400 })
    }

    const template = userVoucher.voucher
    const { shippingFee } = await getShippingFeeSnapshot()
    if (template.minOrderValue && parsed.data.subtotal < Number(template.minOrderValue)) {
      return NextResponse.json({ error: `Đơn hàng tối thiểu ${Number(template.minOrderValue).toLocaleString('vi-VN')} đ` }, { status: 400 })
    }

    let discountAmount = 0
    if (template.discountType === 'PERCENT') {
      discountAmount = Math.floor((parsed.data.subtotal * Number(template.discountValue)) / 100)
      if (template.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(template.maxDiscount))
      }
    } else if (template.discountType === 'FIXED') {
      discountAmount = Number(template.discountValue)
    } else if (template.discountType === 'FREE_SHIPPING') {
      discountAmount = shippingFee
    }

    discountAmount = template.discountType === 'FREE_SHIPPING'
      ? Math.min(shippingFee, discountAmount)
      : Math.min(parsed.data.subtotal, discountAmount)

    return NextResponse.json({
      voucher: {
        id: userVoucher.id, // we return userVoucherId
        code: template.code,
        title: template.title,
        discountType: template.discountType,
        discountValue: Number(template.discountValue),
        discountAmount,
        expiresAt: userVoucher.expiresAt,
      },
    })
  } catch (error) {
    console.error('[CHECKOUT APPLY VOUCHER]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
