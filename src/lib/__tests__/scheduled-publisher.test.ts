import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  recordAndRevalidatePublication: vi.fn(),
  releaseExpiredOrderReservations: vi.fn(),
  runSitemapReconciliationIfDue: vi.fn(),
  runSeoDiscoveryBatchSafely: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: mocks.findMany,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}))

vi.mock('@/lib/seo-discovery/publication', () => ({
  recordAndRevalidatePublication: mocks.recordAndRevalidatePublication,
}))

vi.mock('@/lib/order-inventory', () => ({
  releaseExpiredOrderReservations: mocks.releaseExpiredOrderReservations,
}))

vi.mock('@/lib/seo-discovery/sitemap-maintenance', () => ({
  runSitemapReconciliationIfDue: mocks.runSitemapReconciliationIfDue,
}))

vi.mock('@/lib/seo-discovery/worker', () => ({
  runSeoDiscoveryBatchSafely: mocks.runSeoDiscoveryBatchSafely,
}))

import { publishDuePosts, runMaintenance } from '@/lib/scheduled-publisher'

const NOW = new Date('2026-08-11T04:00:00.000Z')
const FIRST_SAVED_ROW = {
  id: 41,
  slug: 'vong-tay-len-lich',
  updated_at: new Date('2026-08-11T04:00:01.000Z'),
}
const SECOND_SAVED_ROW = {
  id: 42,
  slug: 'moc-khoa-len-lich',
  updated_at: new Date('2026-08-11T04:00:02.000Z'),
}

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `scheduled-publisher-${code}`,
    { code, clientVersion: Prisma.prismaVersion.client },
  )
}

describe('publishDuePosts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    mocks.findMany.mockReset()
    mocks.update.mockReset()
    mocks.updateMany.mockReset()
    mocks.recordAndRevalidatePublication.mockReset()
    mocks.releaseExpiredOrderReservations.mockReset()
    mocks.runSitemapReconciliationIfDue.mockReset()
    mocks.runSeoDiscoveryBatchSafely.mockReset()
    mocks.updateMany.mockResolvedValue({ count: 2 })
    mocks.recordAndRevalidatePublication.mockResolvedValue({ recorded: true })
    mocks.releaseExpiredOrderReservations.mockResolvedValue(0)
    mocks.runSitemapReconciliationIfDue.mockResolvedValue({ status: 'not_due' })
    mocks.runSeoDiscoveryBatchSafely.mockResolvedValue({
      claimed: 0,
      processed: 0,
      failed: 0,
      configurationRequired: 0,
    })
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns Prisma-saved rows and records one scheduled event per transition', async () => {
    mocks.findMany.mockResolvedValue([{ id: 41 }, { id: 42 }])
    mocks.update
      .mockResolvedValueOnce(FIRST_SAVED_ROW)
      .mockResolvedValueOnce(SECOND_SAVED_ROW)

    await expect(publishDuePosts()).resolves.toEqual([
      FIRST_SAVED_ROW,
      SECOND_SAVED_ROW,
    ])

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        status: 'scheduled',
        published_at: { lte: NOW },
      },
      select: { id: true },
    })
    expect(mocks.update).toHaveBeenNthCalledWith(1, {
      where: { id: 41, status: 'scheduled' },
      data: { status: 'published' },
      select: { id: true, slug: true, updated_at: true },
    })
    expect(mocks.update).toHaveBeenNthCalledWith(2, {
      where: { id: 42, status: 'scheduled' },
      data: { status: 'published' },
      select: { id: true, slug: true, updated_at: true },
    })
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledTimes(2)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenNthCalledWith(1, {
      source: 'post',
      sourceId: FIRST_SAVED_ROW.id,
      url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-len-lich',
      contentUpdatedAt: FIRST_SAVED_ROW.updated_at,
      reason: 'scheduled',
    })
    expect(mocks.recordAndRevalidatePublication).toHaveBeenNthCalledWith(2, {
      source: 'post',
      sourceId: SECOND_SAVED_ROW.id,
      url: 'https://mushroomie.io.vn/tin-tuc/moc-khoa-len-lich',
      contentUpdatedAt: SECOND_SAVED_ROW.updated_at,
      reason: 'scheduled',
    })
  })

  it('does not return or emit a selected row that another worker already transitioned', async () => {
    mocks.findMany.mockResolvedValue([{ id: 41 }, { id: 42 }])
    mocks.update
      .mockResolvedValueOnce(FIRST_SAVED_ROW)
      .mockRejectedValueOnce(knownRequestError('P2025'))

    await expect(publishDuePosts()).resolves.toEqual([FIRST_SAVED_ROW])

    expect(mocks.update).toHaveBeenCalledTimes(2)
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledOnce()
    expect(mocks.recordAndRevalidatePublication).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 41, reason: 'scheduled' }),
    )
    expect(JSON.stringify(mocks.recordAndRevalidatePublication.mock.calls))
      .not.toContain('42')
  })

  it('propagates unexpected database errors instead of disguising them as a lost race', async () => {
    const databaseFailure = new Error('unexpected database failure')
    mocks.findMany.mockResolvedValue([{ id: 41 }])
    mocks.update.mockRejectedValue(databaseFailure)
    mocks.updateMany.mockRejectedValue(databaseFailure)

    await expect(publishDuePosts()).rejects.toBe(databaseFailure)

    expect(mocks.recordAndRevalidatePublication).not.toHaveBeenCalled()
  })
})

describe('runMaintenance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    mocks.findMany.mockReset()
    mocks.update.mockReset()
    mocks.recordAndRevalidatePublication.mockReset()
    mocks.releaseExpiredOrderReservations.mockReset()
    mocks.runSitemapReconciliationIfDue.mockReset()
    mocks.runSeoDiscoveryBatchSafely.mockReset()
    mocks.recordAndRevalidatePublication.mockResolvedValue({ recorded: true })
    mocks.releaseExpiredOrderReservations.mockResolvedValue(0)
    mocks.runSitemapReconciliationIfDue.mockResolvedValue({ status: 'not_due' })
    mocks.runSeoDiscoveryBatchSafely.mockResolvedValue({
      claimed: 0,
      processed: 0,
      failed: 0,
      configurationRequired: 0,
    })
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('runs one discovery batch after scheduled publishing and inventory release', async () => {
    mocks.findMany.mockResolvedValue([])
    mocks.releaseExpiredOrderReservations.mockResolvedValue(2)

    await expect(runMaintenance()).resolves.toBeUndefined()

    expect(mocks.findMany).toHaveBeenCalledOnce()
    expect(mocks.releaseExpiredOrderReservations).toHaveBeenCalledOnce()
    expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
    expect(mocks.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.releaseExpiredOrderReservations.mock.invocationCallOrder[0],
    )
    expect(mocks.releaseExpiredOrderReservations.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0],
    )
    expect(mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runSeoDiscoveryBatchSafely.mock.invocationCallOrder[0],
    )
  })

  it('still runs discovery after independent publisher and inventory failures', async () => {
    mocks.findMany.mockRejectedValue(new Error('publisher unavailable'))
    mocks.releaseExpiredOrderReservations.mockRejectedValue(
      new Error('inventory unavailable'),
    )

    await expect(runMaintenance()).resolves.toBeUndefined()

    expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
  })

  it('still runs discovery when automatic sitemap reconciliation unexpectedly throws', async () => {
    const secret = 'raw-sitemap-provider-response-sentinel'
    mocks.findMany.mockResolvedValue([])
    mocks.runSitemapReconciliationIfDue.mockRejectedValue(new Error(secret))

    await expect(runMaintenance()).resolves.toBeUndefined()

    expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(secret)
  })

  it('does not expose a worker exception while keeping the maintenance tick alive', async () => {
    const secretSentinel = 'private-service-account-key-sentinel'
    mocks.findMany.mockResolvedValue([])
    mocks.runSeoDiscoveryBatchSafely.mockRejectedValue(new Error(secretSentinel))

    await expect(runMaintenance()).resolves.toBeUndefined()

    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      secretSentinel,
    )
  })
})
