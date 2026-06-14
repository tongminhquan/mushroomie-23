import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)

    const userPoint = await prisma.userPoint.findUnique({
      where: { user_id: userId }
    })

    const userVouchers = await prisma.userVoucher.findMany({
      where: { userId: userId },
      include: { voucher: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      points: userPoint?.points || 0,
      vouchers: userVouchers
    })
  } catch (error) {
    console.error('Lỗi lấy điểm:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
