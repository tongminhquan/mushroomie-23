import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subtotal = Math.max(0, Number(searchParams.get('subtotal') || 0))
    const now = new Date()

    const vouchers = await prisma.voucher.findMany({
      where: {
        user_id: Number(session.user.id),
        status: 'active',
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      orderBy: [{ discount_percent: 'desc' }, { created_at: 'desc' }],
      take: 50,
    })

    const items = vouchers.map((voucher) => {
      const discountAmount = Math.min(subtotal, Math.floor((subtotal * voucher.discount_percent) / 100))
      return {
        id: voucher.id,
        code: voucher.code,
        discountPercent: voucher.discount_percent,
        discountAmount,
        status: voucher.status,
        source: voucher.source,
        game: voucher.game,
        expiresAt: voucher.expires_at,
        createdAt: voucher.created_at,
      }
    })

    items.sort((a, b) => b.discountAmount - a.discountAmount || b.discountPercent - a.discountPercent)

    return NextResponse.json({
      items,
      best: items[0] ?? null,
    })
  } catch (error) {
    console.error('[MY AVAILABLE VOUCHERS]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
