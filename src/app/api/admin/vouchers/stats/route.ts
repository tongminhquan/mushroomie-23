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
      prisma.userVoucher.count(),
      prisma.userVoucher.count({ where: { status: 'USED' } }),
      prisma.userVoucher.count({ where: { status: 'AVAILABLE' } }),
      prisma.userVoucher.count({ where: { status: 'REVOKED' } }),
      prisma.userVoucher.count({ where: { status: 'EXPIRED' } }),
      prisma.userVoucher.groupBy({ by: ['userId'] }),
      prisma.userVoucher.groupBy({ by: ['userId'], where: { status: 'USED' } }),
      prisma.order.aggregate({ _sum: { voucher_discount_amount: true } }),
      prisma.userVoucher.groupBy({
        by: ['sourceGame'],
        where: { source: 'mini_game', sourceGame: { not: null } },
        _count: { _all: true },
      }),
      prisma.userVoucher.groupBy({
        by: ['sourceGame'],
        where: { source: 'mini_game', sourceGame: { not: null }, status: 'USED' },
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
