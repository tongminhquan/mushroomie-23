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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await params
    const id = Number(userId)
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'Invalid user' }, { status: 400 })

    const [user, vouchers, scores] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, phone: true, created_at: true },
      }),
      prisma.voucher.findMany({
        where: { user_id: id },
        include: { score: true, order: true },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
      prisma.gameScore.findMany({
        where: { user_id: id },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
    ])

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user, vouchers, scores })
  } catch (error) {
    console.error('[ADMIN VOUCHER USER]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
