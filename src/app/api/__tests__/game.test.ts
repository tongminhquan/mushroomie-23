import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  transaction: vi.fn(),
  gameScoreCount: vi.fn(),
  gameScoreCreate: vi.fn(),
  pointsUpsert: vi.fn(),
  userVoucherFindMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    gameScore: { count: mocks.gameScoreCount },
  },
}))

import { POST as startGame } from '@/app/api/game/start/route'
import { POST as submitScore } from '@/app/api/game/submit-score/route'

function request(path: string, body: unknown) {
  return new NextRequest(`https://mushroomie.test${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('game session routes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.auth.mockResolvedValue({ user: { id: '7' } })
    mocks.gameScoreCount.mockResolvedValue(0)
    mocks.gameScoreCreate.mockResolvedValue({ id: 9, game: 'tetris', score: 100 })
    mocks.pointsUpsert.mockResolvedValue({ points: 1_100 })
    mocks.userVoucherFindMany.mockResolvedValue([])
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      gameScore: { create: mocks.gameScoreCreate },
      userPoint: { upsert: mocks.pointsUpsert },
      userVoucher: { findMany: mocks.userVoucherFindMany, create: vi.fn() },
      voucher: { findFirst: vi.fn(), create: vi.fn() },
    }))
  })

  it('requires an authenticated game session', async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await startGame(request('/api/game/start', { game: 'tetris' }))).status).toBe(401)
    expect((await submitScore(request('/api/game/submit-score', { game: 'tetris', score: 1 }))).status).toBe(401)
  })

  it('rejects unsupported games before creating a token', async () => {
    const response = await startGame(request('/api/game/start', { game: 'snake' }))
    expect(response.status).toBe(400)
  })

  it('issues a signed token and rejects missing or tampered sessions', async () => {
    const started = await startGame(request('/api/game/start', { game: 'tetris' }))
    expect(started.status).toBe(200)
    expect((await started.json()).token).toEqual(expect.any(String))

    const missing = await submitScore(request('/api/game/submit-score', { game: 'tetris', score: 100 }))
    expect(missing.status).toBe(403)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects an implausible score before any database write', async () => {
    const started = await startGame(request('/api/game/start', { game: 'tetris' }))
    const { token } = await started.json()
    vi.advanceTimersByTime(2_000)
    const response = await submitScore(request('/api/game/submit-score', { game: 'tetris', score: 50_000, token }))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Score rejected' })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('stores normalized score data and returns updated points', async () => {
    const started = await startGame(request('/api/game/start', { game: 'tetris' }))
    const { token } = await started.json()
    vi.advanceTimersByTime(10_000)
    const response = await submitScore(request('/api/game/submit-score', {
      game: 'tetris', score: 100, lines: 2, combo: 3, level: 0, durationSec: 10, token,
    }))

    expect(response.status).toBe(200)
    expect(mocks.gameScoreCreate).toHaveBeenCalledWith({ data: {
      user_id: 7,
      game: 'tetris',
      score: 100,
      lines: 2,
      combo: 3,
      level: 1,
      duration_sec: 10,
      session_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    } })
    expect(await response.json()).toMatchObject({ success: true, points: 1_100, voucher: null })
  })
})
