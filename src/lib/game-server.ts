import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { GAME_DEFINITIONS, type GameKey, type LeaderboardPeriod, getVoucherPercentForScore } from '@/lib/game-config'

const TOKEN_SEPARATOR = ':'

export function createGameToken(userId: number, game: GameKey, secret: string) {
  const payload = [userId, game, Date.now(), crypto.randomUUID()].join(TOKEN_SEPARATOR)
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

export function verifyGameToken(token: string | undefined, userId: number, game: GameKey, secret: string) {
  if (!token) return { ok: false as const, error: 'missing-token' }

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return { ok: false as const, error: 'invalid-token' }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { ok: false as const, error: 'invalid-signature' }
  }

  const [tokenUserId, tokenGame, startedAtText] = payload.split(TOKEN_SEPARATOR)
  const startedAt = Number(startedAtText)

  if (Number(tokenUserId) !== userId || tokenGame !== game || !Number.isFinite(startedAt)) {
    return { ok: false as const, error: 'token-mismatch' }
  }

  const elapsedMs = Date.now() - startedAt
  if (elapsedMs < 0 || elapsedMs > 1000 * 60 * 60 * 2) {
    return { ok: false as const, error: 'token-expired' }
  }

  return { ok: true as const, elapsedMs, startedAt }
}

export function getPeriodDateFilter(period: LeaderboardPeriod) {
  const now = new Date()
  if (period === 'all') return undefined

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === 'week') {
    const day = start.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diffToMonday)
  }

  return { gte: start }
}

export function isScoreReasonable(game: GameKey, score: number, elapsedMs: number) {
  if (!Number.isInteger(score) || score < 0 || score > 1_000_000) return false
  if (score === 0) return true
  if (elapsedMs < 1500) return false

  const elapsedSec = Math.max(1, elapsedMs / 1000)
  const limitPerSecond = game === 'tetris' ? 350 : 650
  const burstAllowance = game === 'tetris' ? 900 : 3000
  return score <= elapsedSec * limitPerSecond + burstAllowance
}

export function normalizeDurationSec(durationSec: unknown, elapsedMs: number) {
  const fallback = Math.max(1, Math.round(elapsedMs / 1000))
  if (typeof durationSec !== 'number' || !Number.isFinite(durationSec)) return fallback
  return Math.max(1, Math.min(Math.round(durationSec), Math.max(fallback + 5, 60 * 60 * 2)))
}

export async function issueGameVoucher(
  tx: Prisma.TransactionClient,
  input: { userId: number; game: GameKey; score: number; scoreId: number },
) {
  const percent = getVoucherPercentForScore(input.game, input.score)
  if (!percent) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingToday = await tx.voucher.findMany({
    where: {
      user_id: input.userId,
      source: 'mini_game',
      game: input.game,
      created_at: { gte: today },
    },
    select: { discount_percent: true },
  })

  const highestToday = existingToday.reduce((max, item) => Math.max(max, item.discount_percent), 0)
  if (highestToday >= percent) return null

  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  const gameCode = input.game === 'tetris' ? 'TETRIS' : 'BLAST'
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

  return tx.voucher.create({
    data: {
      user_id: input.userId,
      discount_percent: percent,
      code: `${gameCode}-${percent}-${random}`,
      status: 'active',
      source: 'mini_game',
      game: input.game,
      score_id: input.scoreId,
      expires_at: expiresAt,
    },
  })
}

export function getGameTitle(game: GameKey) {
  return GAME_DEFINITIONS[game].title
}
