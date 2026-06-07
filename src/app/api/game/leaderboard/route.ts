import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isGameKey, type LeaderboardPeriod } from '@/lib/game-config'
import { getPeriodDateFilter } from '@/lib/game-server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PERIODS: LeaderboardPeriod[] = ['today', 'week', 'all']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameParam = searchParams.get('game')
    const periodParam = searchParams.get('period') || 'today'

    if (!isGameKey(gameParam)) {
      return NextResponse.json({ error: 'Invalid game' }, { status: 400 })
    }

    const period = PERIODS.includes(periodParam as LeaderboardPeriod)
      ? (periodParam as LeaderboardPeriod)
      : 'today'

    const session = await auth()
    const currentUserId = session?.user?.id ? Number(session.user.id) : null
    const dateFilter = getPeriodDateFilter(period)

    const scores = await prisma.gameScore.findMany({
      where: {
        game: gameParam,
        user_id: { not: null },
        ...(dateFilter ? { created_at: dateFilter } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { score: 'desc' },
        { duration_sec: 'asc' },
        { created_at: 'asc' },
      ],
      take: 500,
    })

    const seen = new Set<number>()
    const items = scores
      .filter((score) => {
        if (!score.user_id || seen.has(score.user_id)) return false
        seen.add(score.user_id)
        return true
      })
      .slice(0, 50)
      .map((score, index) => ({
        rank: index + 1,
        userId: score.user_id,
        name: score.user?.name || score.user?.email || 'Mushroomie User',
        score: score.score,
        lines: score.lines,
        combo: score.combo,
        level: score.level,
        durationSec: score.duration_sec,
        createdAt: score.created_at,
        game: score.game,
        isCurrentUser: currentUserId === score.user_id,
      }))

    return NextResponse.json({
      game: gameParam,
      period,
      items,
      myRank: items.find((item) => item.userId === currentUserId)?.rank ?? null,
    })
  } catch (error) {
    console.error('[GAME LEADERBOARD]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
