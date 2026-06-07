import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (!session || !role || !['super_admin', 'admin', 'viewer'].includes(role)) return null
  return session
}

export async function GET() {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      totalIssued,
      totalUsed,
      totalActive,
      totalReserved,
      totalExpired,
      uniqueIssuedUsers,
      uniqueUsedUsers,
      discountAggregate,
      byGame,
      usedByGame,
    ] = await Promise.all([
      prisma.voucher.count(),
      prisma.voucher.count({ where: { status: 'used' } }),
      prisma.voucher.count({ where: { status: 'active' } }),
      prisma.voucher.count({ where: { status: 'reserved' } }),
      prisma.voucher.count({ where: { status: 'expired' } }),
      prisma.voucher.groupBy({ by: ['user_id'], where: { user_id: { not: null } } }),
      prisma.voucher.groupBy({ by: ['user_id'], where: { user_id: { not: null }, status: 'used' } }),
      prisma.order.aggregate({ _sum: { voucher_discount_amount: true } }),
      prisma.voucher.groupBy({
        by: ['game'],
        where: { source: 'mini_game', game: { not: null } },
        _count: { _all: true },
      }),
      prisma.voucher.groupBy({
        by: ['game'],
        where: { source: 'mini_game', game: { not: null }, status: 'used' },
        _count: { _all: true },
      }),
    ])

    return NextResponse.json({
      totalIssued,
      totalUsed,
      totalActive,
      totalReserved,
      totalExpired,
      usageRate: totalIssued > 0 ? totalUsed / totalIssued : 0,
      totalDiscountUsed: Number(discountAggregate._sum.voucher_discount_amount || 0),
      uniqueIssuedUsers: uniqueIssuedUsers.length,
      uniqueUsedUsers: uniqueUsedUsers.length,
      byGame,
      usedByGame,
    })
  } catch (error) {
    console.error('[ADMIN VOUCHER STATS]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
