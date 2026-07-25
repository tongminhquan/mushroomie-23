import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subtotal = Math.max(0, Number(searchParams.get('subtotal') || 0))
    const { shippingFee } = await getShippingFeeSnapshot()
    const now = new Date()

    const userVouchers = await prisma.userVoucher.findMany({
      where: {
        userId: Number(session.user.id),
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { voucher: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const items = userVouchers.map((uv) => {
      const template = uv.voucher
      let discountAmount = 0
      
      if (template.minOrderValue && subtotal < Number(template.minOrderValue)) {
        discountAmount = 0
      } else {
        if (template.discountType === 'PERCENT') {
          discountAmount = Math.floor((subtotal * Number(template.discountValue)) / 100)
          if (template.maxDiscount) {
            discountAmount = Math.min(discountAmount, Number(template.maxDiscount))
          }
        } else if (template.discountType === 'FIXED') {
          discountAmount = Number(template.discountValue)
        } else if (template.discountType === 'FREE_SHIPPING') {
          discountAmount = shippingFee
        }
      }

      discountAmount = template.discountType === 'FREE_SHIPPING'
        ? Math.min(shippingFee, discountAmount)
        : Math.min(subtotal, discountAmount)

      return {
        id: uv.id,
        code: template.code,
        title: template.title,
        discountType: template.discountType,
        discountValue: Number(template.discountValue),
        minOrderValue: template.minOrderValue ? Number(template.minOrderValue) : null,
        discountAmount,
        status: uv.status,
        source: uv.source,
        sourceGame: uv.sourceGame,
        expiresAt: uv.expiresAt,
        createdAt: uv.createdAt,
      }
    })

    items.sort((a, b) => b.discountAmount - a.discountAmount || b.discountValue - a.discountValue)

    return NextResponse.json({
      items,
      best: items[0] && items[0].discountAmount > 0 ? items[0] : null,
    })
  } catch (error) {
    console.error('[MY AVAILABLE VOUCHERS]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
