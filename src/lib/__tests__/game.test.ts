import { afterEach, describe, expect, it, vi } from 'vitest'
import { GAME_DEFINITIONS, getVoucherPercentForScore, isGameKey } from '@/lib/game-config'
import {
  createGameToken,
  getGameTitle,
  getPeriodDateFilter,
  isScoreReasonable,
  issueGameVoucher,
  normalizeDurationSec,
  verifyGameToken,
} from '@/lib/game-server'

describe('mini-game domain behavior', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('recognizes supported games and applies the highest reached voucher tier', () => {
    expect(isGameKey('tetris')).toBe(true)
    expect(isGameKey('block-blast')).toBe(true)
    expect(isGameKey('snake')).toBe(false)
    expect(getVoucherPercentForScore('tetris', 499)).toBe(0)
    expect(getVoucherPercentForScore('tetris', 1_500)).toBe(10)
    expect(getVoucherPercentForScore('block-blast', 9_999)).toBe(15)
    expect(getGameTitle('tetris')).toBe(GAME_DEFINITIONS.tetris.title)
  })

  it('creates a signed token bound to the user and game', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    const secret = 'game-secret-at-least-thirty-two-characters'
    const token = createGameToken(7, 'tetris', secret)

    expect(verifyGameToken(token, 7, 'tetris', secret)).toMatchObject({ ok: true, elapsedMs: 0 })
    expect(verifyGameToken(token, 8, 'tetris', secret)).toMatchObject({ ok: false, error: 'token-mismatch' })
    expect(verifyGameToken(`${token}tampered`, 7, 'tetris', secret)).toMatchObject({ ok: false, error: 'invalid-signature' })
    expect(verifyGameToken(undefined, 7, 'tetris', secret)).toMatchObject({ ok: false, error: 'missing-token' })
  })

  it('rejects expired and implausibly fast score submissions', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    const secret = 'game-secret-at-least-thirty-two-characters'
    const token = createGameToken(7, 'block-blast', secret)
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1)

    expect(verifyGameToken(token, 7, 'block-blast', secret)).toMatchObject({ ok: false, error: 'token-expired' })
    expect(isScoreReasonable('tetris', 1, 1_499)).toBe(false)
    expect(isScoreReasonable('tetris', 0, 0)).toBe(true)
    expect(isScoreReasonable('block-blast', 4_500, 2_000)).toBe(false)
    expect(isScoreReasonable('block-blast', 500, 2_000)).toBe(true)
    expect(isScoreReasonable('tetris', 1.5, 10_000)).toBe(false)
  })

  it('normalizes client duration without trusting impossible values', () => {
    expect(normalizeDurationSec(undefined, 10_400)).toBe(10)
    expect(normalizeDurationSec(12.6, 10_400)).toBe(13)
    expect(normalizeDurationSec(-10, 10_400)).toBe(1)
    expect(normalizeDurationSec(99_999, 10_400)).toBe(7_200)
  })

  it('builds today, current-week, and all-time leaderboard filters', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 19, 15, 45))

    expect(getPeriodDateFilter('all')).toBeUndefined()
    expect(getPeriodDateFilter('today')?.gte.getHours()).toBe(0)
    expect(getPeriodDateFilter('today')?.gte.getDate()).toBe(19)
    expect(getPeriodDateFilter('week')?.gte.getDay()).toBe(1)
    expect(getPeriodDateFilter('week')?.gte.getDate()).toBe(13)
  })

  it('does not issue a reward below threshold or below the best reward already earned today', async () => {
    const tx = {
      userVoucher: {
        findMany: vi.fn().mockResolvedValue([{ voucher: { discountValue: 10 } }]),
        create: vi.fn(),
      },
      voucher: { findFirst: vi.fn(), create: vi.fn() },
    }

    await expect(issueGameVoucher(tx as never, { userId: 7, game: 'tetris', score: 100, scoreId: 1 })).resolves.toBeNull()
    await expect(issueGameVoucher(tx as never, { userId: 7, game: 'tetris', score: 1_500, scoreId: 2 })).resolves.toBeNull()
    expect(tx.userVoucher.create).not.toHaveBeenCalled()
  })

  it('creates a missing voucher template and grants a seven-day reward', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    const granted = { id: 99, voucher: { discountValue: 15 } }
    const tx = {
      userVoucher: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(granted),
      },
      voucher: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 5, discountValue: 15 }),
      },
    }

    await expect(issueGameVoucher(tx as never, { userId: 7, game: 'block-blast', score: 2_000, scoreId: 44 })).resolves.toEqual(granted)
    expect(tx.voucher.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ code: 'BLAST_15', discountValue: 15, sourceGame: 'block-blast' }),
    }))
    expect(tx.userVoucher.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 7, voucherId: 5, score: 44, expiresAt: new Date('2026-07-26T12:00:00Z') }),
    }))
  })
})
