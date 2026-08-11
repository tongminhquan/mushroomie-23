import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
  groupBy: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  readConfig: vi.fn(),
  createGscClient: vi.fn(),
  getConnectionStatus: vi.fn(),
  listSitemaps: vi.fn(),
  submitSitemap: vi.fn(),
  inspectUrl: vi.fn(),
  syncSitemap: vi.fn(),
  isLimited: vi.fn(),
  getLimitResponse: vi.fn(),
  logAdminAction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    seoDiscoveryJob: {
      groupBy: mocks.groupBy,
      count: mocks.count,
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
    },
  },
}))
vi.mock('@/lib/seo-discovery/config', () => ({
  readSeoDiscoveryConfig: mocks.readConfig,
}))
vi.mock('@/lib/seo-discovery/google-gsc-client', () => ({
  createGoogleSearchConsoleClient: mocks.createGscClient,
}))
vi.mock('@/lib/seo-discovery/sitemap-sync', () => ({
  syncSitemapDiscoveryJobs: mocks.syncSitemap,
}))
vi.mock('@/lib/rate-limit', () => ({
  rateLimiter: {
    isLimited: mocks.isLimited,
    getLimitResponse: mocks.getLimitResponse,
  },
}))
vi.mock('@/lib/admin-logger', () => ({ logAdminAction: mocks.logAdminAction }))

import { GET } from '@/app/api/admin/seo-discovery/route'
import { POST } from '@/app/api/admin/seo-discovery/actions/route'
import { FIXED_SITEMAP_URL } from '@/lib/seo-discovery/sitemap-reader'
import { GscClientError } from '@/lib/seo-discovery/gsc-client'

const NOW = new Date('2026-08-11T08:00:00.000Z')
const CONTENT_VERSION = new Date('2026-08-10T07:00:00.000Z')
const UPDATED_AT = new Date('2026-08-11T07:30:00.000Z')

const baseJob = {
  id: 41,
  url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-nam',
  source_type: 'post',
  source_id: 7,
  content_updated_at: CONTENT_VERSION,
  status: 'NOT_INDEXED',
  eligibility_status: 'ELIGIBLE',
  http_status: 200,
  declared_canonical: 'https://mushroomie.io.vn/tin-tuc/vong-tay-nam',
  robots_indexable: true,
  gsc_verdict: 'NEUTRAL',
  coverage_state: 'Discovered - currently not indexed',
  page_fetch_state: 'SUCCESSFUL',
  google_canonical: null,
  last_crawl_at: null,
  last_inspected_at: new Date('2026-08-11T06:00:00.000Z'),
  next_attempt_at: new Date('2026-08-12T06:00:00.000Z'),
  attempt_count: 0,
  last_error_code: null,
  last_error_message: null,
  lease_token: null,
  lease_expires_at: null,
  created_at: new Date('2026-08-10T07:00:00.000Z'),
  updated_at: UPDATED_AT,
  credential_path: 'C:\\secret\\gsc-service-account.json',
  raw_google_response: 'private-key-sentinel',
}

function readRequest(query = '') {
  return new NextRequest(`https://mushroomie.io.vn/api/admin/seo-discovery${query}`)
}

function actionRequest(
  body: unknown,
  options: {
    origin?: string | null
    contentType?: string
    requestUrl?: string
    headers?: Record<string, string>
  } = {},
) {
  const headers = new Headers({
    'content-type': options.contentType ?? 'application/json',
    'x-forwarded-for': '127.0.0.1',
  })
  if (options.origin !== null) {
    headers.set('origin', options.origin ?? 'https://mushroomie.io.vn')
    headers.set('sec-fetch-site', 'same-origin')
  }
  for (const [name, value] of Object.entries(options.headers ?? {})) {
    headers.set(name, value)
  }

  return new NextRequest(
    options.requestUrl ?? 'https://mushroomie.io.vn/api/admin/seo-discovery/actions',
    {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    },
  )
}

describe('SEO discovery admin APIs', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.setSystemTime(NOW)
    mocks.requireAdmin.mockReset()
    mocks.transaction.mockReset()
    mocks.groupBy.mockReset()
    mocks.count.mockReset()
    mocks.findMany.mockReset()
    mocks.updateMany.mockReset()
    mocks.readConfig.mockReset()
    mocks.createGscClient.mockReset()
    mocks.getConnectionStatus.mockReset()
    mocks.listSitemaps.mockReset()
    mocks.submitSitemap.mockReset()
    mocks.inspectUrl.mockReset()
    mocks.syncSitemap.mockReset()
    mocks.isLimited.mockReset()
    mocks.getLimitResponse.mockReset()
    mocks.logAdminAction.mockReset()

    mocks.requireAdmin.mockResolvedValue({
      user: { id: '7', role: 'admin', email: 'admin@mushroomie.io.vn' },
    })
    mocks.groupBy.mockResolvedValue([
      { status: 'PENDING_ELIGIBILITY', _count: { _all: 2 } },
      { status: 'INDEXED', _count: { _all: 3 } },
      { status: 'NOT_INDEXED', _count: { _all: 4 } },
      { status: 'RETRY', _count: { _all: 1 } },
      { status: 'ERROR', _count: { _all: 1 } },
      { status: 'CONFIGURATION_REQUIRED', _count: { _all: 2 } },
    ])
    mocks.count.mockResolvedValue(13)
    mocks.findMany.mockResolvedValue([baseJob])
    mocks.updateMany.mockResolvedValue({ count: 1 })
    mocks.readConfig.mockReturnValue({
      discoveryEnabled: true,
      gscEnabled: true,
      property: 'sc-domain:mushroomie.io.vn',
    })
    mocks.createGscClient.mockReturnValue({
      getConnectionStatus: mocks.getConnectionStatus,
      listSitemaps: mocks.listSitemaps,
      submitSitemap: mocks.submitSitemap,
      inspectUrl: mocks.inspectUrl,
    })
    mocks.getConnectionStatus.mockResolvedValue({
      state: 'connected',
      code: 'GSC_CONNECTED',
      property: 'sc-domain:mushroomie.io.vn',
    })
    mocks.listSitemaps.mockResolvedValue([{
      url: FIXED_SITEMAP_URL,
      lastSubmitted: '2026-08-10T06:00:00.000Z',
      lastDownloaded: '2026-08-11T06:00:00.000Z',
      pending: false,
      warnings: 0,
      errors: 0,
    }])
    mocks.submitSitemap.mockResolvedValue(undefined)
    mocks.syncSitemap.mockResolvedValue({
      observedCount: 12,
      createdCount: 2,
      resetCount: 1,
      unchangedCount: 9,
      removedCount: 0,
    })
    mocks.isLimited.mockResolvedValue(false)
    mocks.getLimitResponse.mockReturnValue(Response.json(
      { error: 'Too Many Requests' },
      { status: 429 },
    ))
    mocks.logAdminAction.mockResolvedValue(undefined)
    mocks.transaction.mockImplementation(async (callback) => callback({
      seoDiscoveryJob: {
        groupBy: mocks.groupBy,
        count: mocks.count,
        findMany: mocks.findMany,
      },
    }))
  })

  it.each([
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
  ])('rejects %s reads before database or Google access', async (code, status) => {
    mocks.requireAdmin.mockRejectedValue(new Error(code))

    const response = await GET(readRequest())

    expect(response.status).toBe(status)
    expect(mocks.groupBy).not.toHaveBeenCalled()
    expect(mocks.createGscClient).not.toHaveBeenCalled()
  })

  it('strictly validates bounded read filters and rejects duplicates', async () => {
    for (const query of [
      '?page=0',
      '?page=1000001',
      '?pageSize=101',
      '?status=NOT_A_STATUS',
      '?source=customer',
      `?search=${'a'.repeat(129)}`,
      '?page=1&page=2',
      '?credentialPath=%2Ftmp%2Fsecret.json',
    ]) {
      const response = await GET(readRequest(query))
      expect(response.status, query).toBe(400)
    }

    expect(mocks.groupBy).not.toHaveBeenCalled()
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it('returns a paginated allowlisted DTO, aggregate counts, and fixed sitemap state', async () => {
    const response = await GET(readRequest(
      '?page=2&pageSize=25&status=NOT_INDEXED&source=post&search=vong%20tay',
    ))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    const body = await response.json()
    expect(body).toMatchObject({
      summary: {
        total: 13,
        pending: 2,
        indexed: 3,
        notIndexed: 4,
        retrying: 1,
        errors: 1,
        configurationRequired: 2,
      },
      connection: {
        state: 'connected',
        code: 'GSC_CONNECTED',
        property: 'sc-domain:mushroomie.io.vn',
      },
      sitemap: {
        url: FIXED_SITEMAP_URL,
        registered: true,
        lastSubmitted: '2026-08-10T06:00:00.000Z',
        pending: false,
        warnings: 0,
        errors: 0,
      },
      pagination: {
        page: 1,
        pageSize: 25,
        total: 13,
        totalPages: 1,
      },
      jobs: [{
        id: 41,
        url: baseJob.url,
        sourceType: 'post',
        sourceId: 7,
        status: 'NOT_INDEXED',
        eligibilityStatus: 'ELIGIBLE',
        canRetry: true,
      }],
    })
    expect(JSON.stringify(body)).not.toContain('credential_path')
    expect(JSON.stringify(body)).not.toContain('private-key-sentinel')
    expect(JSON.stringify(body)).not.toContain('lease_token')
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 25,
      where: {
        status: 'NOT_INDEXED',
        source_type: 'post',
        OR: [
          { url: { contains: 'vong tay' } },
          { source_type: { contains: 'vong tay' } },
        ],
      },
      select: expect.any(Object),
    }))
  })

  it('reads one repeatable snapshot, clamps the effective page, then contacts Google outside the transaction', async () => {
    const events: string[] = []
    mocks.groupBy.mockImplementation(async () => {
      events.push('groupBy')
      return [{ status: 'INDEXED', _count: { _all: 26 } }]
    })
    mocks.count.mockImplementation(async () => {
      events.push('count')
      return 26
    })
    mocks.findMany.mockImplementation(async () => {
      events.push('findMany')
      return [baseJob]
    })
    mocks.transaction.mockImplementation(async (callback) => {
      events.push('transaction:start')
      const result = await callback({
        seoDiscoveryJob: {
          groupBy: mocks.groupBy,
          count: mocks.count,
          findMany: mocks.findMany,
        },
      })
      events.push('transaction:end')
      return result
    })
    mocks.listSitemaps.mockImplementation(async () => {
      events.push('google')
      return []
    })

    const response = await GET(readRequest('?page=99&pageSize=25'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: 'RepeatableRead',
        maxWait: 500,
        timeout: 2_000,
      },
    )
    expect(events).toEqual([
      'transaction:start',
      'groupBy',
      'count',
      'findMany',
      'transaction:end',
      'google',
    ])
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 25,
      take: 25,
    }))
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 25,
      total: 26,
      totalPages: 2,
    })
  })

  it('keeps job data available when Search Console status has a sanitized partial failure', async () => {
    mocks.listSitemaps.mockRejectedValue(new Error(
      'private-key-sentinel https://oauth.example/token',
    ))

    const response = await GET(readRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.jobs).toHaveLength(1)
    expect(body.connection).toEqual({
      state: 'error',
      code: 'GSC_STATUS_UNAVAILABLE',
    })
    expect(body.sitemap).toEqual(expect.objectContaining({
      url: FIXED_SITEMAP_URL,
      registered: false,
    }))
    expect(JSON.stringify(body)).not.toContain('private-key-sentinel')
    expect(JSON.stringify(body)).not.toContain('oauth.example')
  })

  it('does not contact the adapter when both feature flags are disabled', async () => {
    mocks.readConfig.mockReturnValue({
      discoveryEnabled: false,
      gscEnabled: false,
      property: 'sc-domain:mushroomie.io.vn',
    })

    const response = await GET(readRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.connection).toEqual({ state: 'disabled', code: 'GSC_DISABLED' })
    expect(mocks.createGscClient).not.toHaveBeenCalled()
  })

  it.each([
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
  ])('rejects %s actions before rate limiting or mutation', async (code, status) => {
    mocks.requireAdmin.mockRejectedValue(new Error(code))

    const response = await POST(actionRequest({ action: 'sync_sitemap' }))

    expect(response.status).toBe(status)
    expect(mocks.isLimited).not.toHaveBeenCalled()
    expect(mocks.syncSitemap).not.toHaveBeenCalled()
  })

  it.each(['viewer', 'user'])(
    'fails closed when the auth boundary returns a %s session',
    async (role) => {
      mocks.requireAdmin.mockResolvedValue({
        user: { id: '17', role, email: `${role}@mushroomie.io.vn` },
      })

      const readResponse = await GET(readRequest())
      const actionResponse = await POST(actionRequest({ action: 'sync_sitemap' }))

      expect(readResponse.status).toBe(403)
      expect(actionResponse.status).toBe(403)
      expect(mocks.transaction).not.toHaveBeenCalled()
      expect(mocks.isLimited).not.toHaveBeenCalled()
      expect(mocks.syncSitemap).not.toHaveBeenCalled()
    },
  )

  it.each(['admin', 'super_admin'])(
    'allows %s sessions to read and mutate discovery state',
    async (role) => {
      mocks.requireAdmin.mockResolvedValue({
        user: { id: '17', role, email: `${role}@mushroomie.io.vn` },
      })

      const readResponse = await GET(readRequest())
      const actionResponse = await POST(actionRequest({ action: 'sync_sitemap' }))

      expect(readResponse.status).toBe(200)
      expect(actionResponse.status).toBe(200)
      expect(mocks.transaction).toHaveBeenCalledOnce()
      expect(mocks.syncSitemap).toHaveBeenCalledOnce()
    },
  )

  it('requires exact same-origin JSON mutations', async () => {
    const crossOrigin = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { origin: 'https://evil.example' },
    ))
    const missingOrigin = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { origin: null },
    ))
    const wrongContentType = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { contentType: 'text/plain' },
    ))
    const deceptiveContentType = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { contentType: 'application/jsonp' },
    ))

    expect(crossOrigin.status).toBe(403)
    expect(missingOrigin.status).toBe(403)
    expect(wrongContentType.status).toBe(415)
    expect(deceptiveContentType.status).toBe(415)
    expect(mocks.syncSitemap).not.toHaveBeenCalled()
  })

  it('accepts the canonical browser origin behind Nginx and explicit localhost development origins', async () => {
    const proxiedProduction = await POST(actionRequest(
      { action: 'sync_sitemap' },
      {
        requestUrl: 'http://127.0.0.1:3001/api/admin/seo-discovery/actions',
        origin: 'https://mushroomie.io.vn',
      },
    ))
    const localDevelopment = await POST(actionRequest(
      { action: 'sync_sitemap' },
      {
        requestUrl: 'http://127.0.0.1:3001/api/admin/seo-discovery/actions',
        origin: 'http://localhost:3000',
      },
    ))

    expect(proxiedProduction.status).toBe(200)
    expect(localDevelopment.status).toBe(200)
    expect(mocks.syncSitemap).toHaveBeenCalledTimes(2)
  })

  it('rejects canonical lookalikes even when forwarded host headers claim the production domain', async () => {
    for (const origin of [
      'https://mushroomie.io.vn.evil.example',
      'https://evil-mushroomie.io.vn',
      'https://www.mushroomie.io.vn',
    ]) {
      const response = await POST(actionRequest(
        { action: 'sync_sitemap' },
        {
          requestUrl: 'http://127.0.0.1:3001/api/admin/seo-discovery/actions',
          origin,
          headers: {
            'forwarded': 'host=mushroomie.io.vn;proto=https',
            'x-forwarded-host': 'mushroomie.io.vn',
            'x-forwarded-proto': 'https',
          },
        },
      ))
      expect(response.status, origin).toBe(403)
    }

    expect(mocks.syncSitemap).not.toHaveBeenCalled()
  })

  it('accepts exactly four action shapes and no URL, property, or credential input', async () => {
    for (const body of [
      { action: 'inspect_url', url: baseJob.url },
      { action: 'submit_sitemap', url: 'https://evil.example/sitemap.xml' },
      { action: 'test_connection', property: 'https://evil.example/' },
      { action: 'sync_sitemap', credential: 'private-key-sentinel' },
      { action: 'retry', ids: [] },
      { action: 'retry', ids: [1, 1] },
      { action: 'retry', ids: [0] },
      { action: 'retry', ids: [2_147_483_648] },
      { action: 'retry', ids: Array.from({ length: 101 }, (_, index) => index + 1) },
    ]) {
      const response = await POST(actionRequest(body))
      expect(response.status, JSON.stringify(body)).toBe(400)
    }

    expect(mocks.syncSitemap).not.toHaveBeenCalled()
    expect(mocks.submitSitemap).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it('rejects an oversized JSON body before parsing or mutation', async () => {
    const oversizedBody = JSON.stringify({
      action: 'sync_sitemap',
      padding: 'a'.repeat(17 * 1024),
    })

    const response = await POST(actionRequest(oversizedBody))

    expect(response.status).toBe(413)
    expect(mocks.syncSitemap).not.toHaveBeenCalled()
    expect(mocks.logAdminAction).not.toHaveBeenCalled()
  })

  it('rate-limits every valid action before external or database mutation', async () => {
    mocks.isLimited.mockResolvedValue(true)

    const response = await POST(actionRequest({ action: 'sync_sitemap' }))

    expect(response.status).toBe(429)
    expect(mocks.isLimited).toHaveBeenCalledWith(
      expect.any(NextRequest),
      expect.any(Number),
      expect.any(Number),
      'admin_seo_discovery_actions',
      'admin-user:7',
    )
    expect(mocks.syncSitemap).not.toHaveBeenCalled()
  })

  it('binds action limits to the authenticated user instead of spoofable client IP headers', async () => {
    const attempts = new Map<string, number>()
    mocks.isLimited.mockImplementation(async (
      _request,
      _limit,
      _windowMs,
      _prefix,
      identity: string,
    ) => {
      const count = (attempts.get(identity) ?? 0) + 1
      attempts.set(identity, count)
      return count > 1
    })

    const first = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { headers: { 'cf-connecting-ip': '198.51.100.10' } },
    ))
    const rotatedIp = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { headers: { 'cf-connecting-ip': '203.0.113.20' } },
    ))

    mocks.requireAdmin.mockResolvedValue({
      user: { id: '8', role: 'admin', email: 'admin-8@mushroomie.io.vn' },
    })
    const distinctUser = await POST(actionRequest(
      { action: 'sync_sitemap' },
      { headers: { 'cf-connecting-ip': '203.0.113.20' } },
    ))

    expect(first.status).toBe(200)
    expect(rotatedIp.status).toBe(429)
    expect(distinctUser.status).toBe(200)
    expect(mocks.syncSitemap).toHaveBeenCalledTimes(2)
    expect([...attempts.keys()]).toEqual(['admin-user:7', 'admin-user:8'])
  })

  it('fails closed with a stable response when rate limiting is unavailable', async () => {
    mocks.isLimited.mockRejectedValue(new Error(
      'private-key-sentinel database-password-sentinel',
    ))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(actionRequest({ action: 'sync_sitemap' }))
    const responseText = await response.text()

    expect(response.status).toBe(503)
    expect(responseText).toContain('RATE_LIMIT_UNAVAILABLE')
    expect(responseText).not.toContain('private-key-sentinel')
    expect(responseText).not.toContain('database-password-sentinel')
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('private-key-sentinel')
    expect(mocks.syncSitemap).not.toHaveBeenCalled()
    expect(mocks.logAdminAction).not.toHaveBeenCalled()
  })

  it('retries only exact non-active-lease snapshots with a CAS update and audits IDs', async () => {
    const activeLease = {
      ...baseJob,
      id: 42,
      status: 'RETRY',
      lease_token: 'active-lease-token',
      lease_expires_at: new Date('2026-08-11T08:01:00.000Z'),
    }
    mocks.findMany.mockResolvedValue([baseJob, activeLease])

    const response = await POST(actionRequest({ action: 'retry', ids: [41, 42, 99] }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      action: 'retry',
      requestedCount: 3,
      retriedCount: 1,
      skippedCount: 2,
    })
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [{
          id: 41,
          status: 'NOT_INDEXED',
          content_updated_at: CONTENT_VERSION,
          updated_at: UPDATED_AT,
          lease_token: null,
          lease_expires_at: null,
        }],
      },
      data: {
        status: 'RETRY',
        next_attempt_at: NOW,
        attempt_count: 0,
        last_error_code: null,
        last_error_message: null,
        lease_token: null,
        lease_expires_at: null,
      },
    })
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      action: 'OTHER',
      entity: 'SYSTEM',
      details: {
        tool: 'seo-discovery',
        action: 'retry',
        outcome: 'success',
        requestedCount: 3,
        retriedCount: 1,
        ids: [41, 42, 99],
      },
    }))
    expect(JSON.stringify(mocks.logAdminAction.mock.calls)).not.toContain('active-lease-token')
  })

  it('allows an expired lease only through an exact token-and-expiry CAS snapshot', async () => {
    const expiredAt = new Date('2026-08-11T07:59:00.000Z')
    mocks.findMany.mockResolvedValue([{
      ...baseJob,
      id: 43,
      status: 'ERROR',
      lease_token: 'expired-lease-token',
      lease_expires_at: expiredAt,
    }])

    const response = await POST(actionRequest({ action: 'retry', ids: [43] }))

    expect(response.status).toBe(200)
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [{
          id: 43,
          status: 'ERROR',
          content_updated_at: CONTENT_VERSION,
          updated_at: UPDATED_AT,
          lease_token: 'expired-lease-token',
          lease_expires_at: expiredAt,
        }],
      },
      data: expect.objectContaining({
        status: 'RETRY',
        lease_token: null,
        lease_expires_at: null,
      }),
    }))
    expect(JSON.stringify(mocks.logAdminAction.mock.calls)).not.toContain('expired-lease-token')
  })

  it('runs the fixed sitemap sync action and returns only bounded counts', async () => {
    const response = await POST(actionRequest({ action: 'sync_sitemap' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      action: 'sync_sitemap',
      result: {
        observedCount: 12,
        createdCount: 2,
        resetCount: 1,
        unchangedCount: 9,
        removedCount: 0,
      },
    })
    expect(mocks.syncSitemap).toHaveBeenCalledWith()
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({
        tool: 'seo-discovery',
        action: 'sync_sitemap',
        outcome: 'success',
      }),
    }))
  })

  it('tests the connection and safely recovers one bounded CONFIGURATION_REQUIRED slice', async () => {
    mocks.findMany.mockResolvedValue(Array.from({ length: 11 }, (_, index) => ({
      ...baseJob,
      id: 100 + index,
      status: 'CONFIGURATION_REQUIRED',
      content_updated_at: new Date(CONTENT_VERSION.getTime() + index),
      updated_at: new Date(UPDATED_AT.getTime() + index),
    })))
    mocks.updateMany.mockResolvedValue({ count: 10 })

    const response = await POST(actionRequest({ action: 'test_connection' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      action: 'test_connection',
      connection: {
        state: 'connected',
        code: 'GSC_CONNECTED',
        property: 'sc-domain:mushroomie.io.vn',
      },
      recoveredCount: 10,
      recoveryHasMore: true,
    })
    expect(mocks.getConnectionStatus).toHaveBeenCalledOnce()
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'CONFIGURATION_REQUIRED',
        OR: expect.arrayContaining([expect.objectContaining({
          id: 100,
          content_updated_at: CONTENT_VERSION,
          updated_at: UPDATED_AT,
          lease_token: null,
          lease_expires_at: null,
        })]),
      },
      data: {
        status: 'PENDING_ELIGIBILITY',
        next_attempt_at: NOW,
        attempt_count: 0,
        last_error_code: null,
        last_error_message: null,
        lease_token: null,
        lease_expires_at: null,
      },
    }))
    expect((mocks.updateMany.mock.calls[0][0].where.OR as unknown[])).toHaveLength(10)
  })

  it('does not recover jobs when the connection still needs configuration', async () => {
    mocks.getConnectionStatus.mockResolvedValue({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })

    const response = await POST(actionRequest({ action: 'test_connection' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      action: 'test_connection',
      connection: {
        state: 'configuration_required',
        code: 'GSC_CONFIGURATION_REQUIRED',
      },
      recoveredCount: 0,
      recoveryHasMore: false,
    })
    expect(mocks.findMany).not.toHaveBeenCalled()
    expect(mocks.updateMany).not.toHaveBeenCalled()
  })

  it('submits only the compiled canonical sitemap without accepting a target', async () => {
    const response = await POST(actionRequest({ action: 'submit_sitemap' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      action: 'submit_sitemap',
      sitemapUrl: FIXED_SITEMAP_URL,
    })
    expect(mocks.getConnectionStatus).toHaveBeenCalledOnce()
    expect(mocks.submitSitemap).toHaveBeenCalledWith(FIXED_SITEMAP_URL)
  })

  it('reports an unconfigured sitemap submission as blocked instead of auditing success', async () => {
    mocks.getConnectionStatus.mockResolvedValue({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })

    const response = await POST(actionRequest({ action: 'submit_sitemap' }))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      ok: false,
      action: 'submit_sitemap',
      connection: {
        state: 'configuration_required',
        code: 'GSC_CONFIGURATION_REQUIRED',
      },
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    expect(mocks.submitSitemap).not.toHaveBeenCalled()
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      details: {
        tool: 'seo-discovery',
        action: 'submit_sitemap',
        outcome: 'blocked',
        code: 'GSC_CONFIGURATION_REQUIRED',
      },
    }))
  })

  it('redacts provider failures in the response, logs, and audit record', async () => {
    mocks.getConnectionStatus.mockRejectedValue(new GscClientError(
      'GSC_FORBIDDEN',
      { configurationRequired: true, httpStatus: 403 },
    ))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(actionRequest({ action: 'test_connection' }))
    const text = await response.text()

    expect(response.status).toBe(502)
    expect(text).toContain('GSC_FORBIDDEN')
    expect(text).not.toContain('private-key')
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('private-key')
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      details: {
        tool: 'seo-discovery',
        action: 'test_connection',
        outcome: 'failed',
        code: 'GSC_FORBIDDEN',
      },
    }))
  })
})
