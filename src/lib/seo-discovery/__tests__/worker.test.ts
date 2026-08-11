import {
  GscClientError,
  type GscClientErrorCode,
  GoogleSearchConsoleClient,
  type UrlInspectionResult,
} from '@/lib/seo-discovery/gsc-client'
import type { PublicUrlEligibilityResult } from '@/lib/seo-discovery/eligibility'
import { describe, expect, it, vi } from 'vitest'

import {
  computeNextAttempt,
  computeNextInspectionAttempt,
  INSPECTION_DELAYS_MS,
} from '@/lib/seo-discovery/retry'
import {
  createSitemapRegistrationCoordinator,
  runSeoDiscoveryBatch,
  runSeoDiscoveryBatchSafely,
} from '@/lib/seo-discovery/worker'

const NOW = new Date('2026-08-11T05:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000
const SITEMAP_URL = 'https://mushroomie.io.vn/sitemap.xml'

interface FakeJob {
  id: number
  url: string
  source_type: string
  source_id: number | null
  content_updated_at: Date
  status: string
  eligibility_status: string | null
  http_status: number | null
  declared_canonical: string | null
  robots_indexable: boolean | null
  gsc_verdict: string | null
  coverage_state: string | null
  page_fetch_state: string | null
  google_canonical: string | null
  last_crawl_at: Date | null
  last_inspected_at: Date | null
  next_attempt_at: Date
  attempt_count: number
  last_error_code: string | null
  last_error_message: string | null
  lease_token: string | null
  lease_expires_at: Date | null
  created_at: Date
  updated_at: Date
}

interface FakeSourceRecord {
  id: number
  slug: string
  status: string
}

function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (Array.isArray(value)) return value.map(cloneValue) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)]),
    ) as T
  }
  return value
}

function sameValue(actual: unknown, expected: unknown): boolean {
  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime()
  }
  return actual === expected
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'OR') {
      return (expected as Record<string, unknown>[]).some((branch) => (
        matchesWhere(row, branch)
      ))
    }

    const actual = row[key]
    if (
      expected
      && typeof expected === 'object'
      && !(expected instanceof Date)
      && !Array.isArray(expected)
    ) {
      const condition = expected as Record<string, unknown>
      if ('in' in condition && !(condition.in as unknown[]).includes(actual)) return false
      if ('lte' in condition) {
        const actualTime = actual instanceof Date ? actual.getTime() : Number(actual)
        const expectedTime = condition.lte instanceof Date
          ? condition.lte.getTime()
          : Number(condition.lte)
        if (actualTime > expectedTime) return false
      }
      if ('lt' in condition) {
        const actualTime = actual instanceof Date ? actual.getTime() : Number(actual)
        const expectedTime = condition.lt instanceof Date
          ? condition.lt.getTime()
          : Number(condition.lt)
        if (actualTime >= expectedTime) return false
      }
      return true
    }

    return sameValue(actual, expected)
  })
}

function fakeJob(id: number, overrides: Partial<FakeJob> = {}): FakeJob {
  const url = `https://mushroomie.io.vn/tin-tuc/bai-viet-${id}`
  return {
    id,
    url,
    source_type: 'sitemap_sync',
    source_id: null,
    content_updated_at: new Date('2026-08-11T04:00:00.000Z'),
    status: 'PENDING_ELIGIBILITY',
    eligibility_status: null,
    http_status: null,
    declared_canonical: null,
    robots_indexable: null,
    gsc_verdict: null,
    coverage_state: null,
    page_fetch_state: null,
    google_canonical: null,
    last_crawl_at: null,
    last_inspected_at: null,
    next_attempt_at: new Date('2026-08-11T04:30:00.000Z'),
    attempt_count: 0,
    last_error_code: null,
    last_error_message: null,
    lease_token: null,
    lease_expires_at: null,
    created_at: new Date('2026-08-11T04:00:00.000Z'),
    updated_at: new Date('2026-08-11T04:00:00.000Z'),
    ...overrides,
  }
}

class FakeWorkerClient {
  readonly jobs: FakeJob[]
  readonly posts = new Map<number, FakeSourceRecord>()
  readonly products = new Map<number, FakeSourceRecord>()
  readonly updateManyCalls: Array<{
    where: Record<string, unknown>
    data: Record<string, unknown>
  }> = []
  readonly findFirstCalls: Array<Record<string, unknown>> = []
  beforeCandidateRead?: () => Promise<void>

  constructor(jobs: FakeJob[]) {
    this.jobs = jobs.map(cloneValue)
  }

  readonly seoDiscoveryJob: Record<string, (...args: never[]) => Promise<unknown>> = {}

  readonly post = {
    findUnique: async ({ where }: { where: { id: number } }) => (
      cloneValue(this.posts.get(where.id) ?? null)
    ),
  }

  readonly product = {
    findUnique: async ({ where }: { where: { id: number } }) => (
      cloneValue(this.products.get(where.id) ?? null)
    ),
  }

  initialize(): this {
    this.seoDiscoveryJob.findMany = async (args: {
      where: Record<string, unknown>
      orderBy?: Array<Record<string, 'asc' | 'desc'>>
      take?: number
    }) => {
      await this.beforeCandidateRead?.()
      const matching = this.jobs
        .filter((job) => matchesWhere(job as unknown as Record<string, unknown>, args.where))
        .sort((left, right) => (
          left.next_attempt_at.getTime() - right.next_attempt_at.getTime()
          || left.id - right.id
        ))
        .slice(0, args.take)
      return cloneValue(matching)
    }
    this.seoDiscoveryJob.findFirst = async (args: {
      where: Record<string, unknown>
    }) => {
      this.findFirstCalls.push(cloneValue(args.where))
      const found = this.jobs.find((job) => (
        matchesWhere(job as unknown as Record<string, unknown>, args.where)
      ))
      return cloneValue(found ?? null)
    }
    this.seoDiscoveryJob.updateMany = async (args: {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }) => {
      this.updateManyCalls.push(cloneValue(args))
      let count = 0
      for (const job of this.jobs) {
        if (!matchesWhere(job as unknown as Record<string, unknown>, args.where)) continue
        Object.assign(job, cloneValue(args.data), { updated_at: new Date(NOW.getTime()) })
        count += 1
      }
      return { count }
    }
    return this
  }
}

function eligible(url: string): PublicUrlEligibilityResult {
  return {
    eligible: true,
    retryable: false,
    code: 'ELIGIBLE',
    httpStatus: 200,
    declaredCanonical: url,
    robotsIndexable: true,
  }
}

function skippedEligibility(): PublicUrlEligibilityResult {
  return {
    eligible: false,
    retryable: false,
    code: 'ROBOTS_NOINDEX',
    httpStatus: 200,
    declaredCanonical: null,
    robotsIndexable: false,
  }
}

function inspectionResult(overrides: Partial<UrlInspectionResult> = {}): UrlInspectionResult {
  return {
    verdict: 'PASS',
    coverageState: 'Submitted and indexed',
    robotsTxtState: 'ALLOWED',
    indexingState: 'INDEXING_ALLOWED',
    pageFetchState: 'SUCCESSFUL',
    googleCanonical: 'https://mushroomie.io.vn/tin-tuc/bai-viet-1',
    userCanonical: 'https://mushroomie.io.vn/tin-tuc/bai-viet-1',
    lastCrawlTime: '2026-08-11T04:45:00.000Z',
    ...overrides,
  }
}

function gscClient(overrides: Partial<GoogleSearchConsoleClient> = {}): GoogleSearchConsoleClient {
  return {
    getConnectionStatus: vi.fn().mockResolvedValue({
      state: 'connected',
      code: 'GSC_CONNECTED',
      property: 'sc-domain:mushroomie.io.vn',
    }),
    listSitemaps: vi.fn().mockResolvedValue([{
      url: SITEMAP_URL,
      lastSubmitted: '2026-08-11T03:00:00.000Z',
      lastDownloaded: '2026-08-11T03:30:00.000Z',
      pending: false,
      warnings: 0,
      errors: 0,
    }]),
    submitSitemap: vi.fn().mockResolvedValue(undefined),
    inspectUrl: vi.fn().mockResolvedValue(inspectionResult()),
    ...overrides,
  }
}

function workerOptions(
  client: FakeWorkerClient,
  overrides: Record<string, unknown> = {},
) {
  return {
    client: client as never,
    config: {
      discoveryEnabled: true,
      gscEnabled: true,
      property: 'sc-domain:mushroomie.io.vn',
    },
    now: () => new Date(NOW.getTime()),
    random: () => 0.5,
    createLeaseToken: () => 'worker-token',
    readSitemap: async () => new Map(
      client.jobs.map((job) => [job.url, job.content_updated_at]),
    ),
    checkEligibility: async (url: string) => eligible(url),
    gscClient: gscClient(),
    sitemapRegistrationCoordinator: createSitemapRegistrationCoordinator(),
    ...overrides,
  }
}

describe('computeNextAttempt', () => {
  it('schedules an eligible never-inspected URL immediately', () => {
    expect(computeNextAttempt({
      kind: 'inspection',
      attemptCount: 0,
      now: NOW,
      random: () => 0.5,
    })).toEqual(NOW)
  })

  it('uses the exact 24-hour, 72-hour, then 7-day inspection cadence', () => {
    expect(INSPECTION_DELAYS_MS).toEqual([
      DAY_MS,
      3 * DAY_MS,
      7 * DAY_MS,
    ])

    for (const [attemptCount, delay] of INSPECTION_DELAYS_MS.entries()) {
      expect(computeNextAttempt({
        kind: 'inspection',
        attemptCount: attemptCount + 1,
        now: NOW,
        random: () => 0.5,
      })).toEqual(new Date(NOW.getTime() + delay))
    }

    expect(computeNextAttempt({
      kind: 'inspection',
      attemptCount: 999,
      now: NOW,
      random: () => 0.5,
    })).toEqual(new Date(NOW.getTime() + 7 * DAY_MS))
  })

  it('uses content-version milestones without scheduling in the past', () => {
    const contentUpdatedAt = new Date('2026-08-11T04:00:00.000Z')

    expect(computeNextInspectionAttempt({
      contentUpdatedAt,
      lastInspectedAt: null,
      now: NOW,
    })).toEqual(NOW)
    expect(computeNextInspectionAttempt({
      contentUpdatedAt,
      lastInspectedAt: NOW,
      now: NOW,
    })).toEqual(new Date(contentUpdatedAt.getTime() + DAY_MS))

    const afterFirstMilestone = new Date(contentUpdatedAt.getTime() + DAY_MS + 60_000)
    expect(computeNextInspectionAttempt({
      contentUpdatedAt,
      lastInspectedAt: afterFirstMilestone,
      now: afterFirstMilestone,
    })).toEqual(new Date(contentUpdatedAt.getTime() + (3 * DAY_MS)))

    const afterSecondMilestone = new Date(contentUpdatedAt.getTime() + (3 * DAY_MS) + 60_000)
    expect(computeNextInspectionAttempt({
      contentUpdatedAt,
      lastInspectedAt: afterSecondMilestone,
      now: afterSecondMilestone,
    })).toEqual(new Date(contentUpdatedAt.getTime() + (7 * DAY_MS)))

    const oldBackfillNow = new Date(contentUpdatedAt.getTime() + (30 * DAY_MS))
    expect(computeNextInspectionAttempt({
      contentUpdatedAt,
      lastInspectedAt: oldBackfillNow,
      now: oldBackfillNow,
    })).toEqual(new Date(oldBackfillNow.getTime() + (7 * DAY_MS)))
  })

  it('treats inspection evidence older than the content version as due now', () => {
    expect(computeNextInspectionAttempt({
      contentUpdatedAt: NOW,
      lastInspectedAt: new Date(NOW.getTime() - DAY_MS),
      now: new Date(NOW.getTime() + 60_000),
    })).toEqual(new Date(NOW.getTime() + 60_000))
  })

  it('injects deterministic transient jitter and caps retries at 24 hours', () => {
    const firstLow = computeNextAttempt({
      kind: 'transient',
      attemptCount: 1,
      now: NOW,
      random: () => 0,
    })
    const firstHigh = computeNextAttempt({
      kind: 'transient',
      attemptCount: 1,
      now: NOW,
      random: () => 1,
    })
    const capped = computeNextAttempt({
      kind: 'transient',
      attemptCount: 100,
      now: NOW,
      random: () => 1,
    })

    expect(firstLow.getTime() - NOW.getTime()).toBe(45_000)
    expect(firstHigh.getTime() - NOW.getTime()).toBe(75_000)
    expect(capped.getTime() - NOW.getTime()).toBe(DAY_MS)
  })

  it('clamps invalid random samples without mutating the injected date', () => {
    const before = NOW.getTime()

    expect(computeNextAttempt({
      kind: 'transient',
      attemptCount: 1,
      now: NOW,
      random: () => Number.NaN,
    })).toEqual(new Date(NOW.getTime() + 60_000))
    expect(NOW.getTime()).toBe(before)
  })
})

describe('runSeoDiscoveryBatch leasing', () => {
  it('does no database or Google work while discovery is disabled', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const candidateRead = vi.fn(async () => undefined)
    client.beforeCandidateRead = candidateRead
    const google = gscClient()

    await expect(runSeoDiscoveryBatch(workerOptions(client, {
      config: {
        discoveryEnabled: false,
        gscEnabled: false,
        property: 'sc-domain:mushroomie.io.vn',
      },
      gscClient: google,
    }))).resolves.toEqual({
      claimed: 0,
      processed: 0,
      failed: 0,
      configurationRequired: 0,
    })

    expect(candidateRead).not.toHaveBeenCalled()
    expect(google.listSitemaps).not.toHaveBeenCalled()
    expect(google.inspectUrl).not.toHaveBeenCalled()
  })

  it('claims at most ten due rows with a random two-minute conditional lease', async () => {
    const client = new FakeWorkerClient(
      Array.from({ length: 12 }, (_unused, index) => fakeJob(index + 1)),
    ).initialize()

    const summary = await runSeoDiscoveryBatch(workerOptions(client, {
      batchSize: 99,
      checkEligibility: async () => skippedEligibility(),
    }))

    expect(summary).toEqual({
      claimed: 10,
      processed: 10,
      failed: 0,
      configurationRequired: 0,
    })
    const claimCalls = client.updateManyCalls.filter(({ data }) => (
      data.lease_token === 'worker-token'
    ))
    expect(claimCalls).toHaveLength(10)
    for (const call of claimCalls) {
      expect(call.where).toMatchObject({
        content_updated_at: new Date('2026-08-11T04:00:00.000Z'),
        status: { in: expect.any(Array) },
        next_attempt_at: { lte: NOW },
      })
      expect(call.where.OR).toEqual([
        { lease_token: null },
        { lease_expires_at: { lte: NOW } },
      ])
      expect(call.data).toEqual({
        lease_token: 'worker-token',
        lease_expires_at: new Date(NOW.getTime() + 2 * 60 * 1000),
      })
    }
    expect(client.jobs.filter((job) => job.status === 'SKIPPED')).toHaveLength(10)
    expect(client.jobs.filter((job) => job.status === 'PENDING_ELIGIBILITY')).toHaveLength(2)
  })

  it('stops claiming new rows when the strict batch time budget is exhausted', async () => {
    const client = new FakeWorkerClient([fakeJob(1), fakeJob(2)]).initialize()
    const monotonicSamples = [0, 0, 1_001]

    const summary = await runSeoDiscoveryBatch(workerOptions(client, {
      batchTimeBudgetMs: 1_000,
      monotonicNow: () => monotonicSamples.shift() ?? 1_001,
      checkEligibility: async () => skippedEligibility(),
    }))

    expect(summary).toMatchObject({ claimed: 1, processed: 1 })
    expect(client.jobs[0].status).toBe('SKIPPED')
    expect(client.jobs[1].status).toBe('PENDING_ELIGIBILITY')
  })

  it('atomically lets only one of two workers lease and process the same row', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    let readers = 0
    let releaseReaders!: () => void
    const readerGate = new Promise<void>((resolve) => {
      releaseReaders = resolve
    })
    client.beforeCandidateRead = async () => {
      readers += 1
      if (readers === 2) releaseReaders()
      await readerGate
    }
    const checkEligibility = vi.fn(async () => skippedEligibility())

    const [first, second] = await Promise.all([
      runSeoDiscoveryBatch(workerOptions(client, {
        createLeaseToken: () => 'worker-alpha',
        checkEligibility,
      })),
      runSeoDiscoveryBatch(workerOptions(client, {
        createLeaseToken: () => 'worker-beta',
        checkEligibility,
      })),
    ])

    expect(first.claimed + second.claimed).toBe(1)
    expect(first.processed + second.processed).toBe(1)
    expect(checkEligibility).toHaveBeenCalledOnce()
    const claimedTokens = client.updateManyCalls
      .filter(({ data }) => typeof data.lease_token === 'string')
      .map(({ data }) => data.lease_token)
    expect(claimedTokens).toEqual(expect.arrayContaining(['worker-alpha', 'worker-beta']))
    expect(client.findFirstCalls).toHaveLength(1)
    expect(client.findFirstCalls[0]).toMatchObject({
      id: 1,
      lease_token: expect.stringMatching(/^worker-(alpha|beta)$/),
      content_updated_at: new Date('2026-08-11T04:00:00.000Z'),
    })
  })

  it('guards every completion and finally cleanup by lease token and claimed content version', async () => {
    const oldVersion = new Date('2026-08-11T04:00:00.000Z')
    const newVersion = new Date('2026-08-11T04:30:00.000Z')
    const client = new FakeWorkerClient([
      fakeJob(1, { content_updated_at: oldVersion }),
    ]).initialize()
    const checkEligibility = vi.fn(async () => {
      Object.assign(client.jobs[0], {
        content_updated_at: newVersion,
        status: 'PENDING_ELIGIBILITY',
        lease_token: null,
        lease_expires_at: null,
        next_attempt_at: NOW,
      })
      return skippedEligibility()
    })

    const summary = await runSeoDiscoveryBatch(workerOptions(client, {
      checkEligibility,
    }))

    expect(summary).toMatchObject({ claimed: 1, processed: 0 })
    expect(client.jobs[0]).toMatchObject({
      content_updated_at: newVersion,
      status: 'PENDING_ELIGIBILITY',
      lease_token: null,
      lease_expires_at: null,
    })
    const postClaimWrites = client.updateManyCalls.slice(1)
    expect(postClaimWrites.length).toBeGreaterThanOrEqual(2)
    for (const call of postClaimWrites) {
      expect(call.where).toMatchObject({
        id: 1,
        lease_token: 'worker-token',
        content_updated_at: oldVersion,
      })
    }
  })

  it('redacts an infrastructure failure in the fail-soft maintenance wrapper', async () => {
    const secretSentinel = 'sensitive-database-error-sentinel'
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    client.seoDiscoveryJob.findMany = vi.fn().mockRejectedValue(
      new Error(secretSentinel),
    )
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(runSeoDiscoveryBatchSafely(workerOptions(client))).resolves.toEqual({
      claimed: 0,
      processed: 0,
      failed: 1,
      configurationRequired: 0,
    })

    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(secretSentinel)
    expect(errorLog).toHaveBeenCalledWith('[seo-discovery] maintenance batch failed', {
      code: 'SEO_DISCOVERY_WORKER_ERROR',
    })
  })
})

describe('runSeoDiscoveryBatch state transitions', () => {
  it('stores permanent eligibility evidence and skips Google', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const google = gscClient()

    await runSeoDiscoveryBatch(workerOptions(client, {
      checkEligibility: async () => skippedEligibility(),
      gscClient: google,
    }))

    expect(client.jobs[0]).toMatchObject({
      status: 'SKIPPED',
      eligibility_status: 'ROBOTS_NOINDEX',
      http_status: 200,
      declared_canonical: null,
      robots_indexable: false,
      attempt_count: 0,
      last_error_code: 'ROBOTS_NOINDEX',
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
    })
    expect(google.listSitemaps).not.toHaveBeenCalled()
    expect(google.inspectUrl).not.toHaveBeenCalled()
  })

  it('atomically stores retryable eligibility evidence with its backoff transition', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const retryableEligibility: PublicUrlEligibilityResult = {
      eligible: false,
      retryable: true,
      code: 'HTTP_RETRYABLE',
      httpStatus: 503,
      declaredCanonical: client.jobs[0].url,
      robotsIndexable: true,
    }

    await runSeoDiscoveryBatch(workerOptions(client, {
      checkEligibility: async () => retryableEligibility,
    }))

    expect(client.jobs[0]).toMatchObject({
      status: 'RETRY',
      eligibility_status: 'HTTP_RETRYABLE',
      http_status: 503,
      declared_canonical: client.jobs[0].url,
      robots_indexable: true,
      next_attempt_at: new Date(NOW.getTime() + 60_000),
      attempt_count: 1,
      last_error_code: 'HTTP_RETRYABLE',
    })
    const retryTransitions = client.updateManyCalls.filter(({ data }) => (
      data.status === 'RETRY'
    ))
    expect(retryTransitions).toHaveLength(1)
    expect(retryTransitions[0].data).toMatchObject({
      eligibility_status: 'HTTP_RETRYABLE',
      http_status: 503,
      declared_canonical: client.jobs[0].url,
      robots_indexable: true,
    })
  })

  it('moves a due eligible job to configuration-required once when credentials are missing', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const google = gscClient({
      listSitemaps: vi.fn().mockRejectedValue(new GscClientError(
        'GSC_CONFIGURATION_REQUIRED',
        { configurationRequired: true },
      )),
    })
    const coordinator = createSitemapRegistrationCoordinator()
    const options = workerOptions(client, {
      gscClient: google,
      sitemapRegistrationCoordinator: coordinator,
    })

    const first = await runSeoDiscoveryBatch(options)
    const second = await runSeoDiscoveryBatch(options)

    expect(first).toEqual({
      claimed: 1,
      processed: 1,
      failed: 0,
      configurationRequired: 1,
    })
    expect(second).toEqual({
      claimed: 0,
      processed: 0,
      failed: 0,
      configurationRequired: 0,
    })
    expect(client.jobs[0]).toMatchObject({
      status: 'CONFIGURATION_REQUIRED',
      eligibility_status: 'ELIGIBLE',
      last_error_code: 'GSC_CONFIGURATION_REQUIRED',
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
    })
    expect(google.listSitemaps).toHaveBeenCalledOnce()
    expect(google.inspectUrl).not.toHaveBeenCalled()
  })

  it('inspects a newly eligible never-inspected URL immediately and persists mapped PASS evidence', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const inspected = inspectionResult({
      googleCanonical: client.jobs[0].url,
      userCanonical: client.jobs[0].url,
    })
    const google = gscClient({
      inspectUrl: vi.fn().mockResolvedValue(inspected),
    })

    const summary = await runSeoDiscoveryBatch(workerOptions(client, {
      gscClient: google,
    }))

    expect(summary).toEqual({
      claimed: 1,
      processed: 1,
      failed: 0,
      configurationRequired: 0,
    })
    expect(google.inspectUrl).toHaveBeenCalledOnce()
    expect(google.inspectUrl).toHaveBeenCalledWith(client.jobs[0].url)
    expect(client.jobs[0]).toMatchObject({
      status: 'INDEXED',
      eligibility_status: 'ELIGIBLE',
      http_status: 200,
      declared_canonical: client.jobs[0].url,
      robots_indexable: true,
      gsc_verdict: 'PASS',
      coverage_state: 'Submitted and indexed',
      page_fetch_state: 'SUCCESSFUL',
      google_canonical: client.jobs[0].url,
      last_crawl_at: new Date('2026-08-11T04:45:00.000Z'),
      last_inspected_at: NOW,
      next_attempt_at: new Date(NOW.getTime() + 7 * DAY_MS),
      attempt_count: 0,
      last_error_code: null,
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
    })
  })

  it.each([
    ['first', 0, DAY_MS],
    ['second', DAY_MS, 3 * DAY_MS],
    ['third', 3 * DAY_MS, 7 * DAY_MS],
  ])(
    'schedules the %s NOT_INDEXED content-version milestone and resets transient failures',
    async (_stage, elapsedSinceContentUpdate, expectedMilestone) => {
      const contentUpdatedAt = new Date(NOW.getTime() - elapsedSinceContentUpdate)
      const client = new FakeWorkerClient([fakeJob(1, {
        content_updated_at: contentUpdatedAt,
        status: elapsedSinceContentUpdate === 0 ? 'PENDING_ELIGIBILITY' : 'NOT_INDEXED',
        attempt_count: 9,
        last_inspected_at: elapsedSinceContentUpdate === 0
          ? null
          : new Date(NOW.getTime() - 60_000),
      })]).initialize()
      const google = gscClient({
        inspectUrl: vi.fn().mockResolvedValue(inspectionResult({
          verdict: 'NEUTRAL',
          coverageState: 'Discovered - currently not indexed',
          googleCanonical: null,
          lastCrawlTime: null,
        })),
      })

      await runSeoDiscoveryBatch(workerOptions(client, { gscClient: google }))

      expect(client.jobs[0]).toMatchObject({
        status: 'NOT_INDEXED',
        gsc_verdict: 'NEUTRAL',
        coverage_state: 'Discovered - currently not indexed',
        last_inspected_at: NOW,
        next_attempt_at: new Date(contentUpdatedAt.getTime() + expectedMilestone),
        attempt_count: 0,
        last_error_code: null,
      })
    },
  )

  it('keeps an old backfill on a bounded weekly cadence after valid inspection', async () => {
    const contentUpdatedAt = new Date(NOW.getTime() - (30 * DAY_MS))
    const client = new FakeWorkerClient([fakeJob(1, {
      content_updated_at: contentUpdatedAt,
      last_inspected_at: null,
    })]).initialize()
    const google = gscClient({
      inspectUrl: vi.fn().mockResolvedValue(inspectionResult({ verdict: 'NEUTRAL' })),
    })

    await runSeoDiscoveryBatch(workerOptions(client, { gscClient: google }))

    expect(client.jobs[0]).toMatchObject({
      status: 'NOT_INDEXED',
      attempt_count: 0,
      next_attempt_at: new Date(NOW.getTime() + (7 * DAY_MS)),
    })
  })

  it('rechecks unchanged indexed content weekly without resetting its content version', async () => {
    const version = new Date('2026-08-01T00:00:00.000Z')
    const client = new FakeWorkerClient([fakeJob(1, {
      content_updated_at: version,
      status: 'INDEXED',
      eligibility_status: 'ELIGIBLE',
      gsc_verdict: 'PASS',
      last_inspected_at: new Date('2026-08-04T05:00:00.000Z'),
      next_attempt_at: NOW,
    })]).initialize()

    await runSeoDiscoveryBatch(workerOptions(client))

    expect(client.jobs[0]).toMatchObject({
      content_updated_at: version,
      status: 'INDEXED',
      next_attempt_at: new Date(NOW.getTime() + 7 * DAY_MS),
      attempt_count: 0,
    })
  })

  it.each([
    'GSC_RATE_LIMITED',
    'GSC_SERVER_ERROR',
    'GSC_REQUEST_TIMEOUT',
    'GSC_NETWORK_ERROR',
  ] satisfies GscClientErrorCode[])(
    'backs off a transient %s failure with deterministic jitter',
    async (code) => {
      const client = new FakeWorkerClient([fakeJob(1)]).initialize()
      const google = gscClient({
        inspectUrl: vi.fn().mockRejectedValue(new GscClientError(code, {
          retryable: true,
        })),
      })
      const options = workerOptions(client, {
        gscClient: google,
        random: () => 0.5,
      })

      const first = await runSeoDiscoveryBatch(options)
      const immediateRepeat = await runSeoDiscoveryBatch(options)

      expect(first).toMatchObject({ claimed: 1, processed: 1, failed: 1 })
      expect(immediateRepeat).toMatchObject({ claimed: 0, processed: 0 })
      expect(client.jobs[0]).toMatchObject({
        status: 'RETRY',
        next_attempt_at: new Date(NOW.getTime() + 60_000),
        attempt_count: 1,
        last_error_code: code,
        last_error_message: null,
      })
      expect(google.inspectUrl).toHaveBeenCalledOnce()
    },
  )

  it('starts the 24-hour inspection cadence after an initial 429 retry succeeds', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    let currentTime = new Date(NOW.getTime())
    const google = gscClient({
      inspectUrl: vi.fn()
        .mockRejectedValueOnce(new GscClientError('GSC_RATE_LIMITED', {
          retryable: true,
        }))
        .mockResolvedValueOnce(inspectionResult({ verdict: 'NEUTRAL' })),
    })
    const options = workerOptions(client, {
      now: () => new Date(currentTime.getTime()),
      gscClient: google,
    })

    await runSeoDiscoveryBatch(options)
    currentTime = new Date(client.jobs[0].next_attempt_at.getTime())
    await runSeoDiscoveryBatch(options)

    expect(client.jobs[0]).toMatchObject({
      status: 'NOT_INDEXED',
      attempt_count: 0,
      last_inspected_at: currentTime,
      next_attempt_at: new Date(
        client.jobs[0].content_updated_at.getTime() + DAY_MS,
      ),
    })
  })

  it('does not let repeated timeouts between NOT_INDEXED results skip the 72-hour milestone', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    let currentTime = new Date(NOW.getTime())
    const google = gscClient({
      inspectUrl: vi.fn()
        .mockResolvedValueOnce(inspectionResult({ verdict: 'NEUTRAL' }))
        .mockRejectedValueOnce(new GscClientError('GSC_REQUEST_TIMEOUT', {
          retryable: true,
        }))
        .mockRejectedValueOnce(new GscClientError('GSC_REQUEST_TIMEOUT', {
          retryable: true,
        }))
        .mockResolvedValueOnce(inspectionResult({ verdict: 'NEUTRAL' })),
    })
    const options = workerOptions(client, {
      now: () => new Date(currentTime.getTime()),
      gscClient: google,
    })

    await runSeoDiscoveryBatch(options)
    currentTime = new Date(client.jobs[0].next_attempt_at.getTime())
    await runSeoDiscoveryBatch(options)
    currentTime = new Date(client.jobs[0].next_attempt_at.getTime())
    await runSeoDiscoveryBatch(options)
    currentTime = new Date(client.jobs[0].next_attempt_at.getTime())
    await runSeoDiscoveryBatch(options)

    expect(client.jobs[0]).toMatchObject({
      status: 'NOT_INDEXED',
      attempt_count: 0,
      last_inspected_at: currentTime,
      next_attempt_at: new Date(
        client.jobs[0].content_updated_at.getTime() + (3 * DAY_MS),
      ),
    })
  })

  it.each([
    ['GSC_UNAUTHORIZED', 401],
    ['GSC_FORBIDDEN', 403],
  ] as const)(
    'stops automatic calls after %s configuration failure',
    async (code, httpStatus) => {
      const client = new FakeWorkerClient([fakeJob(1)]).initialize()
      const google = gscClient({
        inspectUrl: vi.fn().mockRejectedValue(new GscClientError(code, {
          configurationRequired: true,
          httpStatus,
        })),
      })
      const options = workerOptions(client, { gscClient: google })

      await runSeoDiscoveryBatch(options)
      await runSeoDiscoveryBatch(options)

      expect(client.jobs[0]).toMatchObject({
        status: 'CONFIGURATION_REQUIRED',
        attempt_count: 0,
        last_error_code: code,
        last_error_message: null,
      })
      expect(google.inspectUrl).toHaveBeenCalledOnce()
    },
  )

  it.each([
    ['GSC_UNAUTHORIZED', 401],
    ['GSC_FORBIDDEN', 403],
  ] as const)(
    'latches %s across one batch instead of repeating a bad authenticated call',
    async (code, httpStatus) => {
      const client = new FakeWorkerClient([fakeJob(1), fakeJob(2)]).initialize()
      const google = gscClient({
        inspectUrl: vi.fn().mockRejectedValue(new GscClientError(code, {
          configurationRequired: true,
          httpStatus,
        })),
      })

      const summary = await runSeoDiscoveryBatch(workerOptions(client, {
        gscClient: google,
      }))

      expect(summary).toEqual({
        claimed: 2,
        processed: 2,
        failed: 0,
        configurationRequired: 2,
      })
      expect(google.inspectUrl).toHaveBeenCalledOnce()
      expect(client.jobs.map(({ status }) => status)).toEqual([
        'CONFIGURATION_REQUIRED',
        'CONFIGURATION_REQUIRED',
      ])
    },
  )

  it.each([
    'GSC_RATE_LIMITED',
    'GSC_SERVER_ERROR',
    'GSC_REQUEST_TIMEOUT',
    'GSC_NETWORK_ERROR',
  ] satisfies GscClientErrorCode[])(
    'latches transient %s across one batch and backs off every owned row',
    async (code) => {
      const client = new FakeWorkerClient([fakeJob(1), fakeJob(2)]).initialize()
      const google = gscClient({
        inspectUrl: vi.fn().mockRejectedValue(new GscClientError(code, {
          retryable: true,
        })),
      })

      const summary = await runSeoDiscoveryBatch(workerOptions(client, {
        gscClient: google,
      }))

      expect(summary).toEqual({
        claimed: 2,
        processed: 2,
        failed: 2,
        configurationRequired: 0,
      })
      expect(google.inspectUrl).toHaveBeenCalledOnce()
      expect(client.jobs.map(({ status }) => status)).toEqual(['RETRY', 'RETRY'])
      expect(client.jobs.map(({ last_error_code }) => last_error_code)).toEqual([
        code,
        code,
      ])
    },
  )

  it('keeps a configuration block when a later publication changes the sitemap fingerprint', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const google = gscClient({
      inspectUrl: vi.fn().mockRejectedValue(new GscClientError(
        'GSC_FORBIDDEN',
        { configurationRequired: true, httpStatus: 403 },
      )),
    })
    const coordinator = createSitemapRegistrationCoordinator()
    const options = workerOptions(client, {
      gscClient: google,
      sitemapRegistrationCoordinator: coordinator,
    })

    await runSeoDiscoveryBatch(options)
    client.jobs.push(fakeJob(2))
    const second = await runSeoDiscoveryBatch(options)

    expect(second).toEqual({
      claimed: 1,
      processed: 1,
      failed: 0,
      configurationRequired: 1,
    })
    expect(google.listSitemaps).toHaveBeenCalledOnce()
    expect(google.inspectUrl).toHaveBeenCalledOnce()
    expect(client.jobs[1]).toMatchObject({
      status: 'CONFIGURATION_REQUIRED',
      last_error_code: 'GSC_FORBIDDEN',
    })
  })

  it('stores a stable redacted ERROR for a malformed inspection response', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const secretSentinel = 'private-provider-body-token-sentinel'
    const google = gscClient({
      inspectUrl: vi.fn().mockResolvedValue({
        ...inspectionResult(),
        verdict: null,
        coverageState: secretSentinel,
      }),
    })
    const options = workerOptions(client, { gscClient: google })

    const first = await runSeoDiscoveryBatch(options)
    const second = await runSeoDiscoveryBatch(options)

    expect(first).toMatchObject({ claimed: 1, processed: 1, failed: 1 })
    expect(second).toMatchObject({ claimed: 0, processed: 0 })
    expect(client.jobs[0]).toMatchObject({
      status: 'ERROR',
      last_error_code: 'GSC_INVALID_RESPONSE',
      last_error_message: null,
      gsc_verdict: null,
      coverage_state: null,
    })
    expect(JSON.stringify(client.jobs[0])).not.toContain(secretSentinel)
  })

  it.each([
    ['post', 'draft', 'SOURCE_NOT_PUBLIC'],
    ['product', 'inactive', 'SOURCE_NOT_PUBLIC'],
  ])('skips a %s row whose source is no longer public', async (
    sourceType,
    sourceStatus,
    expectedCode,
  ) => {
    const url = sourceType === 'post'
      ? 'https://mushroomie.io.vn/tin-tuc/nguon-1'
      : 'https://mushroomie.io.vn/san-pham/nguon-1'
    const client = new FakeWorkerClient([fakeJob(1, {
      url,
      source_type: sourceType,
      source_id: 91,
    })]).initialize()
    const sourceMap = sourceType === 'post' ? client.posts : client.products
    sourceMap.set(91, { id: 91, slug: 'nguon-1', status: sourceStatus })
    const checkEligibility = vi.fn(async (candidate: string) => eligible(candidate))

    await runSeoDiscoveryBatch(workerOptions(client, { checkEligibility }))

    expect(client.jobs[0]).toMatchObject({
      status: 'SKIPPED',
      eligibility_status: expectedCode,
      last_error_code: expectedCode,
    })
    expect(checkEligibility).not.toHaveBeenCalled()
  })

  it('skips a public source whose current slug no longer matches the claimed URL', async () => {
    const client = new FakeWorkerClient([fakeJob(1, {
      url: 'https://mushroomie.io.vn/tin-tuc/slug-cu',
      source_type: 'post',
      source_id: 91,
    })]).initialize()
    client.posts.set(91, { id: 91, slug: 'slug-moi', status: 'published' })
    const checkEligibility = vi.fn(async (candidate: string) => eligible(candidate))

    await runSeoDiscoveryBatch(workerOptions(client, { checkEligibility }))

    expect(client.jobs[0]).toMatchObject({
      status: 'SKIPPED',
      eligibility_status: 'SOURCE_URL_MISMATCH',
      last_error_code: 'SOURCE_URL_MISMATCH',
    })
    expect(checkEligibility).not.toHaveBeenCalled()
  })
})

describe('sitemap registration coordination', () => {
  it('lists a healthy unchanged sitemap once for multiple jobs and does not resubmit it', async () => {
    const client = new FakeWorkerClient([fakeJob(1), fakeJob(2)]).initialize()
    const google = gscClient({
      inspectUrl: vi.fn(async (url: string) => inspectionResult({
        googleCanonical: url,
        userCanonical: url,
      })),
    })

    await runSeoDiscoveryBatch(workerOptions(client, { gscClient: google }))

    expect(google.listSitemaps).toHaveBeenCalledOnce()
    expect(google.submitSitemap).not.toHaveBeenCalled()
    expect(google.inspectUrl).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['missing', []],
    ['failed', [{
      url: SITEMAP_URL,
      lastSubmitted: '2026-08-11T03:00:00.000Z',
      lastDownloaded: '2026-08-11T03:30:00.000Z',
      pending: false,
      warnings: 0,
      errors: 1,
    }]],
  ])('submits a %s canonical sitemap at most once per batch', async (_state, sitemaps) => {
    const client = new FakeWorkerClient([fakeJob(1), fakeJob(2)]).initialize()
    const google = gscClient({
      listSitemaps: vi.fn().mockResolvedValue(sitemaps),
      inspectUrl: vi.fn(async (url: string) => inspectionResult({
        googleCanonical: url,
        userCanonical: url,
      })),
    })

    await runSeoDiscoveryBatch(workerOptions(client, { gscClient: google }))

    expect(google.listSitemaps).toHaveBeenCalledOnce()
    expect(google.submitSitemap).toHaveBeenCalledOnce()
    expect(google.submitSitemap).toHaveBeenCalledWith(SITEMAP_URL)
    expect(google.inspectUrl).toHaveBeenCalledTimes(2)
  })

  it('backs off an unchanged missing sitemap fingerprint across maintenance batches', async () => {
    const firstJob = fakeJob(1)
    const secondJob = fakeJob(2, {
      next_attempt_at: new Date('2026-08-12T05:00:00.000Z'),
    })
    const client = new FakeWorkerClient([firstJob, secondJob]).initialize()
    const google = gscClient({
      listSitemaps: vi.fn().mockResolvedValue([]),
    })
    const coordinator = createSitemapRegistrationCoordinator()
    const options = workerOptions(client, {
      gscClient: google,
      sitemapRegistrationCoordinator: coordinator,
    })

    await runSeoDiscoveryBatch(options)
    client.jobs[1].next_attempt_at = new Date(NOW.getTime())
    await runSeoDiscoveryBatch(options)

    expect(google.submitSitemap).toHaveBeenCalledOnce()
  })

  it('does not resubmit during the canonical sitemap cooldown when publication changes its fingerprint', async () => {
    const client = new FakeWorkerClient([fakeJob(1)]).initialize()
    const google = gscClient({
      listSitemaps: vi.fn().mockResolvedValue([]),
    })
    const coordinator = createSitemapRegistrationCoordinator()
    const options = workerOptions(client, {
      gscClient: google,
      sitemapRegistrationCoordinator: coordinator,
    })

    await runSeoDiscoveryBatch(options)
    client.jobs.push(fakeJob(2))
    await runSeoDiscoveryBatch(options)

    expect(google.listSitemaps).toHaveBeenCalledOnce()
    expect(google.submitSitemap).toHaveBeenCalledOnce()
    expect(google.inspectUrl).toHaveBeenCalledTimes(2)
  })
})
