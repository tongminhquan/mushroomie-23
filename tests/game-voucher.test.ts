import assert from 'node:assert/strict'
import test from 'node:test'
import type { Prisma } from '@prisma/client'
import { getVoucherPercentForScore, isGameKey } from '../src/lib/game-config'
import {
  createGameToken,
  getGameTitle,
  getPeriodDateFilter,
  issueGameVoucher,
  normalizeDurationSec,
  verifyGameToken,
} from '../src/lib/game-server'

const secret = 'test-secret-that-is-at-least-32-characters'

test('game configuration validates keys, titles and reward tiers', () => {
  assert.equal(isGameKey('tetris'), true)
  assert.equal(isGameKey('block-blast'), true)
  assert.equal(isGameKey('other'), false)
  assert.equal(getGameTitle('tetris'), 'Tetris Mushroomie')
  assert.equal(getVoucherPercentForScore('tetris', 499), 0)
  assert.equal(getVoucherPercentForScore('tetris', 500), 5)
  assert.equal(getVoucherPercentForScore('tetris', 3500), 15)
})

test('game tokens report missing, invalid and mismatched cases', () => {
  assert.deepEqual(verifyGameToken(undefined, 1, 'tetris', secret), { ok: false, error: 'missing-token' })
  assert.deepEqual(verifyGameToken('invalid', 1, 'tetris', secret), { ok: false, error: 'invalid-token' })

  const token = createGameToken(1, 'tetris', secret)
  assert.equal(verifyGameToken(token, 2, 'tetris', secret).error, 'token-mismatch')
})

test('leaderboard periods and client duration are normalized', () => {
  assert.equal(getPeriodDateFilter('all'), undefined)
  const today = getPeriodDateFilter('today')?.gte
  assert.ok(today)
  assert.equal(today.getHours(), 0)
  assert.equal(today.getMinutes(), 0)

  const week = getPeriodDateFilter('week')?.gte
  assert.ok(week)
  assert.equal(week.getDay(), 1)

  assert.equal(normalizeDurationSec(undefined, 10_000), 10)
  assert.equal(normalizeDurationSec(Number.NaN, 10_000), 10)
  assert.equal(normalizeDurationSec(999_999, 10_000), 60 * 60 * 2)
  assert.equal(normalizeDurationSec(12, 10_000), 12)
  assert.equal(normalizeDurationSec(0, 10_000), 1)
})

test('game voucher is not issued below threshold or when equal reward is available', async () => {
  const tx = createFakeTransaction({
    available: [{ voucher: { discountValue: 10 } }],
  })
  assert.equal(await issueGameVoucher(tx, { userId: 1, game: 'tetris', score: 100, scoreId: 10 }), null)
  assert.equal(await issueGameVoucher(tx, { userId: 1, game: 'tetris', score: 1500, scoreId: 11 }), null)
})

test('game voucher creates reward template and wallet entry when needed', async () => {
  const calls: string[] = []
  const tx = createFakeTransaction({ calls })
  const result = await issueGameVoucher(tx, { userId: 7, game: 'block-blast', score: 1200, scoreId: 99 })

  assert.equal((result as unknown as { voucherId: string }).voucherId, 'voucher-55')
  assert.deepEqual(calls, ['voucher.create', 'userVoucher.create'])
})

test('game voucher refreshes an existing wallet entry instead of duplicating it', async () => {
  const calls: string[] = []
  const tx = createFakeTransaction({ calls, existingWallet: { id: 'wallet-1' } })
  const result = await issueGameVoucher(tx, { userId: 7, game: 'tetris', score: 500, scoreId: 100 })

  assert.equal((result as { id: string }).id, 'wallet-1')
  assert.deepEqual(calls, ['voucher.create', 'userVoucher.update'])
})

function createFakeTransaction(options: {
  available?: Array<{ voucher: { discountValue: number } }>
  existingWallet?: { id: string } | null
  calls?: string[]
} = {}) {
  const calls = options.calls || []
  const tx = {
    userVoucher: {
      findMany: async () => options.available || [],
      findFirst: async () => options.existingWallet || null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push('userVoucher.create')
        return { ...data, id: 'wallet-new' }
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        calls.push('userVoucher.update')
        return { ...data, id: where.id }
      },
    },
    voucher: {
      findFirst: async () => null,
      create: async () => {
        calls.push('voucher.create')
        return { id: 'voucher-55', discountValue: 10 }
      },
    },
  }
  return tx as unknown as Prisma.TransactionClient
}
