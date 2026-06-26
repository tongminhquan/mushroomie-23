import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isGameKey } from '@/lib/game-config'
import { issueGameVoucher, isScoreReasonable, normalizeDurationSec, verifyGameToken } from '@/lib/game-server'
import { z } from 'zod'

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'mushroomie-secret-fallback'

const submitScoreSchema = z.object({
  game: z.string(),
  score: z.number().int().nonnegative(),
  lines: z.number().int().nonnegative().max(10_000).optional().default(0),
  combo: z.number().int().nonnegative().max(10_000).optional().default(0),
  level: z.number().int().nonnegative().max(10_000).optional().default(1),
  durationSec: z.number().nonnegative().optional().default(0),
  token: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = submitScoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { game, score, lines, combo, level, durationSec, token } = parsed.data
    if (!isGameKey(game)) {
      return NextResponse.json({ error: 'Invalid game' }, { status: 400 })
    }

    const userId = Number(session.user.id)
    const verified = verifyGameToken(token, userId, game, SECRET)
    if (!verified.ok) {
      return NextResponse.json({ error: 'Invalid game session' }, { status: 403 })
    }

    if (!isScoreReasonable(game, score, verified.elapsedMs)) {
      return NextResponse.json({ error: 'Score rejected' }, { status: 403 })
    }

    const safeDurationSec = normalizeDurationSec(durationSec, verified.elapsedMs)

    const result = await prisma.$transaction(async (tx) => {
      const gameScore = await tx.gameScore.create({
        data: {
          user_id: userId,
          game,
          score,
          lines,
          combo,
          level: Math.max(1, level),
          duration_sec: safeDurationSec,
        },
      })

      const points = await tx.userPoint.upsert({
        where: { user_id: userId },
        update: { points: { increment: score } },
        create: { user_id: userId, points: score },
      })

      const voucher = await issueGameVoucher(tx, {
        userId,
        game,
        score,
        scoreId: gameScore.id,
      })

      return { gameScore, points, voucher }
    })

    return NextResponse.json({
      success: true,
      score: result.gameScore,
      points: result.points.points,
      voucher: result.voucher
        ? {
            code: result.voucher.voucher.code,
            discount_percent: Number(result.voucher.voucher.discountValue),
          }
        : null,
    })
  } catch (error) {
    console.error('[GAME SUBMIT SCORE]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
