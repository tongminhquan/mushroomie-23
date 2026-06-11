import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'
import { rateLimiter } from '@/lib/rate-limit'

const usedTokensCache = new Map<string, number>()
// Clean up cache periodically (every 1 hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [token, timestamp] of usedTokensCache.entries()) {
      if (now - timestamp > 24 * 60 * 60 * 1000) {
        usedTokensCache.delete(token)
      }
    }
  }, 3600000)
}

const SECRET = process.env.NEXTAUTH_SECRET || 'mushroomie-secret-fallback'

const scoreSchema = z.object({
  score: z.number().int().nonnegative(),
  token: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const req = request as any
    if (rateLimiter.isLimited(req, 10, 60000, 'minigame_submit')) {
      return rateLimiter.getLimitResponse()
    }

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = scoreSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    const { score, token } = parsed.data
    
    if (score === 0) {
       return NextResponse.json({ success: true })
    }

    if (!token) {
       return NextResponse.json({ error: 'Thiếu token xác thực' }, { status: 403 })
    }

    const [payload, signature] = token.split('.')
    if (!payload || !signature) {
       return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 403 })
    }

    const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
    if (signature !== expectedSignature) {
       return NextResponse.json({ error: 'Sai chữ ký token' }, { status: 403 })
    }

    if (usedTokensCache.has(token)) {
      return NextResponse.json({ error: 'Token đã được sử dụng' }, { status: 403 })
    }
    usedTokensCache.set(token, Date.now())

    const [userId, startTimeStr] = payload.split(':')
    if (userId !== session.user.id) {
       return NextResponse.json({ error: 'Token không thuộc về user này' }, { status: 403 })
    }

    const elapsed = Date.now() - parseInt(startTimeStr)
    // Giả sử mỗi điểm cần ít nhất 100ms để đạt được (chống hack điểm quá cao trong thời gian quá ngắn)
    // Nếu điểm > 100 và điểm > (elapsed / 100), nghi ngờ gian lận
    if (score > 100 && score > elapsed / 50) {
       return NextResponse.json({ error: 'Phát hiện bất thường trong quá trình chơi' }, { status: 403 })
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
