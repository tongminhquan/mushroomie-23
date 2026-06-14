import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Vui lòng đăng nhập' }, { status: 401 })
    }

    const vouchers = await prisma.userVoucher.findMany({
      where: { userId: Number(session.user.id) },
      include: {
        voucher: true
      },
      orderBy: [
        { status: 'asc' }, // AVAILABLE first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, data: vouchers })
  } catch (error) {
    console.error('Fetch wallet vouchers error:', error)
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 })
  }
}
