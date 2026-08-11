import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  publishDuePosts: vi.fn(),
  runSeoDiscoveryBatchSafely: vi.fn(),
}))

vi.mock('@/lib/scheduled-publisher', () => ({
  publishDuePosts: mocks.publishDuePosts,
}))

vi.mock('@/lib/seo-discovery/worker', () => ({
  runSeoDiscoveryBatchSafely: mocks.runSeoDiscoveryBatchSafely,
}))

import { GET, POST } from '@/app/api/cron/publish-scheduled-posts/route'

const DISCOVERY_SUMMARY = {
  claimed: 3,
  processed: 2,
  failed: 1,
  configurationRequired: 0,
}

function request(token = 'cron-secret'): NextRequest {
  return new NextRequest(
    'https://mushroomie.io.vn/api/cron/publish-scheduled-posts',
    { headers: { authorization: `Bearer ${token}` } },
  )
}

describe('publish scheduled posts cron discovery integration', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'cron-secret')
    mocks.publishDuePosts.mockReset()
    mocks.runSeoDiscoveryBatchSafely.mockReset()
    mocks.publishDuePosts.mockResolvedValue([
      {
        id: 41,
        slug: 'bai-viet-41',
        updated_at: new Date('2026-08-11T05:00:00.000Z'),
      },
    ])
    mocks.runSeoDiscoveryBatchSafely.mockResolvedValue(DISCOVERY_SUMMARY)
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('keeps Bearer protection and does no maintenance work for an invalid token', async () => {
    const response = await GET(request('wrong-secret'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(mocks.publishDuePosts).not.toHaveBeenCalled()
    expect(mocks.runSeoDiscoveryBatchSafely).not.toHaveBeenCalled()
  })

  it('preserves the existing response fields and adds only a bounded discovery summary', async () => {
    const response = await GET(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      publishedCount: 1,
      postIds: [41],
      discovery: DISCOVERY_SUMMARY,
    })
    expect(mocks.publishDuePosts).toHaveBeenCalledOnce()
    expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
    expect(mocks.publishDuePosts.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runSeoDiscoveryBatchSafely.mock.invocationCallOrder[0],
    )
    expect(POST).toBe(GET)
  })

  it('does not roll back a successful publication response when discovery unexpectedly throws', async () => {
    const secretSentinel = 'provider-private-key-sentinel'
    mocks.runSeoDiscoveryBatchSafely.mockRejectedValue(new Error(secretSentinel))

    const response = await GET(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      publishedCount: 1,
      postIds: [41],
      discovery: {
        claimed: 0,
        processed: 0,
        failed: 1,
        configurationRequired: 0,
      },
    })
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      secretSentinel,
    )
  })

  it('retains the existing 500 contract when scheduled publication itself fails', async () => {
    mocks.publishDuePosts.mockRejectedValue(new Error('database unavailable'))

    const response = await GET(request())

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Server error' })
    expect(mocks.runSeoDiscoveryBatchSafely).not.toHaveBeenCalled()
  })
})
