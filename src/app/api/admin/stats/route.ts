import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalOrders, totalRevenue, totalProducts, totalPosts, totalContacts, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { payment_status: 'PAID' } }),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.post.count({ where: { status: 'published' } }),
      prisma.contact.count({ where: { status: 'unread' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { payment: true },
      }),
    ])

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProducts,
      totalPosts,
      unreadContacts: totalContacts,
      recentOrders,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
