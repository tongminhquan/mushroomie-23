import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GAME_KEYS, type GameKey } from '@/lib/game-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false })
    }

    const userId = Number(session.user.id)
    const [userPoint, vouchers, gameRows] = await Promise.all([
      prisma.userPoint.findUnique({ where: { user_id: userId } }),
      prisma.userVoucher.findMany({
        where: {
          userId: userId,
          status: 'AVAILABLE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { voucher: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.gameScore.findMany({
        where: { user_id: userId },
        orderBy: [{ score: 'desc' }, { created_at: 'desc' }],
        take: 100,
      }),
    ])

    const games = Object.fromEntries(
      GAME_KEYS.map((game) => {
        const best = gameRows.find((row) => row.game === game)
        return [
          game,
          {
            bestScore: best?.score ?? 0,
            lastPlayedAt: best?.created_at ?? null,
          },
        ]
      }),
    ) as Record<GameKey, { bestScore: number; lastPlayedAt: Date | null }>

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      points: userPoint?.points ?? 0,
      vouchers: vouchers.map((uv) => ({
        id: uv.id,
        code: uv.voucher.code,
        discount_percent: Number(uv.voucher.discountValue),
        status: uv.status,
        expiresAt: uv.expiresAt,
      })),
      games,
    })
  } catch (error) {
    console.error('[MINIGAME PLAYER SUMMARY]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
