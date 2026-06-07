import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applyVoucherSchema = z.object({
  voucherId: z.number().int().positive(),
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

    const voucher = await prisma.voucher.findFirst({
      where: {
        id: parsed.data.voucherId,
        user_id: Number(session.user.id),
        status: 'active',
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    })

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher is not available' }, { status: 400 })
    }

    const discountAmount = Math.min(
      parsed.data.subtotal,
      Math.floor((parsed.data.subtotal * voucher.discount_percent) / 100),
    )

    return NextResponse.json({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        discountPercent: voucher.discount_percent,
        discountAmount,
        expiresAt: voucher.expires_at,
      },
    })
  } catch (error) {
    console.error('[CHECKOUT APPLY VOUCHER]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
