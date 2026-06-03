import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const scoreSchema = z.object({
  score: z.number().int().nonnegative()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = scoreSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Điểm số không hợp lệ' }, { status: 400 })
    }

    const { score } = parsed.data
    
    if (score === 0) {
       // Không cần cộng điểm
       return NextResponse.json({ success: true })
    }

    // Upsert UserPoint
    const userPoint = await prisma.userPoint.upsert({
      where: { user_id: parseInt(session.user.id) },
      update: { points: { increment: score } },
      create: { user_id: parseInt(session.user.id), points: score }
    })

    return NextResponse.json({ success: true, points: userPoint.points })
  } catch (error) {
    console.error('Lỗi submit score:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
