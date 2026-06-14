import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (!session || !role || !['super_admin', 'admin', 'viewer'].includes(role)) return null
  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)))
    const status = searchParams.get('status') || ''
    const game = searchParams.get('game') || ''
    const code = searchParams.get('code') || ''
    const user = searchParams.get('user') || ''
    const order = searchParams.get('order') || ''

    const where: any = {}
    if (status) where.status = status.toUpperCase()
    if (game) where.sourceGame = game
    if (code) where.voucher = { code: { contains: code } }
    if (user) {
      where.user = {
        OR: [
          { name: { contains: user } },
          { email: { contains: user } },
          { phone: { contains: user } },
        ],
      }
    }
    if (order) where.order = { order_code: { contains: order } }

    const [items, total] = await Promise.all([
      prisma.userVoucher.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          voucher: true,
          order: {
            select: {
              id: true,
              order_code: true,
              total: true,
              subtotal: true,
              voucher_discount_amount: true,
              payment_status: true,
              order_status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userVoucher.count({ where }),
    ])

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[ADMIN VOUCHER HISTORY]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
