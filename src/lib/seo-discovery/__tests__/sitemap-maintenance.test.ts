import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSitemapMaintenanceCoordinator,
  type SitemapMaintenanceDependencies,
} from '@/lib/seo-discovery/sitemap-maintenance'

const SUMMARY = {
  observedCount: 138,
  createdCount: 37,
  resetCount: 0,
  unchangedCount: 101,
  removedCount: 0,
}

function harness(enabled = true) {
  let nowMs = Date.parse('2026-08-12T03:00:00.000Z')
  const sync = vi.fn().mockResolvedValue(SUMMARY)
  const logFailure = vi.fn()
  const dependencies: SitemapMaintenanceDependencies = {
    isEnabled: () => enabled,
    now: () => nowMs,
    sync,
    logFailure,
  }

  return {
    coordinator: createSitemapMaintenanceCoordinator(dependencies),
    sync,
    logFailure,
    advance: (milliseconds: number) => { nowMs += milliseconds },
    setNow: (milliseconds: number) => { nowMs = milliseconds },
  }
}

describe('sitemap maintenance coordinator', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('runs immediately, skips inside one hour, and runs at the boundary', async () => {
    const test = harness()

    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'completed',
      summary: SUMMARY,
    })
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    test.advance(3_599_999)
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    test.advance(1)
    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'completed',
      summary: SUMMARY,
    })
    expect(test.sync).toHaveBeenCalledTimes(2)
  })

  it('does not fetch or write when discovery is disabled', async () => {
    const test = harness(false)

    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'disabled' })
    expect(test.sync).not.toHaveBeenCalled()
  })

  it('does not run repeatedly when the wall clock moves backwards', async () => {
    const test = harness()

    await test.coordinator.runIfDue()
    test.setNow(Date.parse('2026-08-12T02:00:00.000Z'))

    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    expect(test.sync).toHaveBeenCalledOnce()
  })

  it('shares one in-flight reconciliation between concurrent callers', async () => {
    let resolveSync!: (value: typeof SUMMARY) => void
    const test = harness()
    test.sync.mockReturnValueOnce(new Promise((resolve) => { resolveSync = resolve }))

    const first = test.coordinator.runIfDue()
    const second = test.coordinator.runIfDue()

    await Promise.resolve()
    expect(test.sync).toHaveBeenCalledOnce()
    resolveSync(SUMMARY)
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: 'completed', summary: SUMMARY },
      { status: 'completed', summary: SUMMARY },
    ])
  })

  it('redacts a failure, leaves the success clock untouched, and retries next tick', async () => {
    const secret = 'private-service-account-key-sentinel'
    const test = harness()
    test.sync
      .mockRejectedValueOnce(new Error(secret))
      .mockResolvedValueOnce(SUMMARY)

    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'failed',
      code: 'SEO_DISCOVERY_SITEMAP_SYNC_FAILED',
    })
    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'completed',
      summary: SUMMARY,
    })

    expect(test.sync).toHaveBeenCalledTimes(2)
    expect(test.logFailure).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(test.logFailure.mock.calls)).not.toContain(secret)
  })
})
