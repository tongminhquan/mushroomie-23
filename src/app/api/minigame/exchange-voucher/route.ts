import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const exchangeSchema = z.object({
  percent: z.number().int()
})

const VOUCHER_RATES: Record<number, number> = {
  10: 10000,
  15: 15000,
  20: 20000
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = exchangeSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    const { percent } = parsed.data
    const requiredPoints = VOUCHER_RATES[percent]

    if (!requiredPoints) {
      return NextResponse.json({ error: 'Mức phần trăm không được hỗ trợ' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // Transaction to safely check points, deduct points, and create voucher
    const result = await prisma.$transaction(async (tx) => {
      const userPoint = await tx.userPoint.findUnique({ where: { user_id: userId } })
      
      if (!userPoint || userPoint.points < requiredPoints) {
        throw new Error('Không đủ điểm để đổi voucher')
      }

      // Deduct points
      await tx.userPoint.update({
        where: { user_id: userId },
        data: { points: { decrement: requiredPoints } }
      })

      // Generate Code (e.g. GAME-10-X8J2K)
      const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
      const code = `GAME-${percent}-${randomStr}`

      const voucher = await tx.voucher.create({
        data: {
          user_id: userId,
          discount_percent: percent,
          code: code
        }
      })

      return voucher
    })

    return NextResponse.json({ success: true, voucher: result })
  } catch (error: any) {
    console.error('Lỗi đổi voucher:', error)
    if (error.message === 'Không đủ điểm để đổi voucher') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
