import { Prisma } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'

import {
  syncSitemapDiscoveryJobs,
  type SitemapSyncClient,
  type SitemapSyncDependencies,
} from '@/lib/seo-discovery/sitemap-sync'

const NOW = new Date('2026-08-11T05:00:00.000Z')
const OLD_LASTMOD = new Date('2026-08-08T00:00:00.000Z')
const EQUAL_LASTMOD = new Date('2026-08-09T00:00:00.000Z')
const NEW_LASTMOD = new Date('2026-08-10T00:00:00.000Z')
const NEWEST_LASTMOD = new Date('2026-08-11T00:00:00.000Z')
const OBSERVED_AT = new Date('2026-08-10T02:00:00.000Z')
const PRODUCT_URL = 'https://mushroomie.io.vn/san-pham/moc-khoa-nam'
const STATIC_URL = 'https://mushroomie.io.vn/gioi-thieu'
const CONTACT_URL = 'https://mushroomie.io.vn/lien-he'

type StoredJob = {
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
  updated_at: Date
}

function storedJob(overrides: Partial<StoredJob> = {}): StoredJob {
  return {
    id: 1,
    url: STATIC_URL,
    source_type: 'sitemap_sync',
    source_id: null,
    content_updated_at: EQUAL_LASTMOD,
    status: 'INDEXED',
    eligibility_status: 'ELIGIBLE',
    http_status: 200,
    declared_canonical: STATIC_URL,
    robots_indexable: true,
    gsc_verdict: 'PASS',
    coverage_state: 'Submitted and indexed',
    page_fetch_state: 'SUCCESSFUL',
    google_canonical: STATIC_URL,
    last_crawl_at: new Date('2026-08-10T03:00:00.000Z'),
    last_inspected_at: new Date('2026-08-10T04:00:00.000Z'),
    next_attempt_at: new Date('2026-08-20T00:00:00.000Z'),
    attempt_count: 4,
    last_error_code: 'OLD_ERROR',
    last_error_message: 'old diagnostic',
    lease_token: 'lease-token',
    lease_expires_at: new Date('2026-08-11T05:10:00.000Z'),
    updated_at: OBSERVED_AT,
    ...overrides,
  }
}

type UpdateManyArgs = {
  where: {
    id?: number
    url?: string
    source_type?: string
    content_updated_at?: { lt: Date }
    updated_at?: Date
  }
  data: Partial<StoredJob>
}

interface InMemorySitemapClientOptions {
  afterFindMany?(callNumber: number): Promise<void>
  beforeUpdateMany?(
    args: UpdateManyArgs,
    callNumber: number,
    jobs: Map<string, StoredJob>,
  ): Promise<void>
  rollbackOnTransactionError?: boolean
}

class InMemorySitemapClient {
  readonly jobs = new Map<string, StoredJob>()
  private nextId = 1
  private findManyCallCount = 0
  private updateManyCallCount = 0
  private readonly afterFindMany: (callNumber: number) => Promise<void>
  private readonly beforeUpdateMany: NonNullable<
    InMemorySitemapClientOptions['beforeUpdateMany']
  >
  private readonly rollbackOnTransactionError: boolean

  readonly postUpdate = vi.fn(() => {
    throw new Error('sitemap sync must not mutate posts')
  })
  readonly productUpdate = vi.fn(() => {
    throw new Error('sitemap sync must not mutate products')
  })
  readonly deleteJob = vi.fn(() => {
    throw new Error('sitemap sync must not delete jobs')
  })
  readonly findMany = vi.fn(async (args: { where?: { source_type?: string } }) => {
    const callNumber = ++this.findManyCallCount
    const snapshot = [...this.jobs.values()]
      .filter((job) => !args.where?.source_type || job.source_type === args.where.source_type)
      .map((job) => ({ ...job }))

    // Yield after capturing the snapshot so concurrent tests exercise stale reads.
    await this.afterFindMany(callNumber)
    return snapshot
  })
  readonly findUnique = vi.fn(async (args: {
    where: { id?: number, url?: string }
  }) => {
    const job = [...this.jobs.values()].find((candidate) => (
      (args.where.id === undefined || candidate.id === args.where.id)
      && (args.where.url === undefined || candidate.url === args.where.url)
    ))
    return job ? { ...job } : null
  })
  readonly createMany = vi.fn(async (args: {
    data: Array<Omit<StoredJob, 'id' | 'updated_at'> & { updated_at?: Date }>
    skipDuplicates?: boolean
  }) => {
    let count = 0
    for (const data of args.data) {
      if (this.jobs.has(data.url)) {
        if (args.skipDuplicates) continue
        throw new Error('duplicate URL')
      }
      const saved = {
        ...data,
        id: this.nextId++,
        updated_at: data.updated_at ?? new Date(NOW.getTime()),
      }
      this.jobs.set(saved.url, saved)
      count += 1
    }
    return { count }
  })
  readonly updateMany = vi.fn(async (args: UpdateManyArgs) => {
    const callNumber = ++this.updateManyCallCount
    await this.beforeUpdateMany(args, callNumber, this.jobs)

    const candidates = [...this.jobs.values()].filter((job) => {
      if (args.where.id !== undefined && job.id !== args.where.id) return false
      if (args.where.url !== undefined && job.url !== args.where.url) return false
      if (args.where.source_type !== undefined && job.source_type !== args.where.source_type) {
        return false
      }
      if (
        args.where.content_updated_at?.lt
        && job.content_updated_at.getTime() >= args.where.content_updated_at.lt.getTime()
      ) {
        return false
      }
      if (
        args.where.updated_at
        && job.updated_at.getTime() !== args.where.updated_at.getTime()
      ) {
        return false
      }
      return true
    })

    let count = 0
    for (const job of candidates) {
      const changesState = Object.entries(args.data).some(([field, value]) => {
        const current = job[field as keyof StoredJob]
        if (current instanceof Date || value instanceof Date) {
          return !(current instanceof Date)
            || !(value instanceof Date)
            || current.getTime() !== value.getTime()
        }
        return current !== value
      })
      if (!changesState) continue

      Object.assign(job, args.data)
      if (args.data.updated_at === undefined) {
        job.updated_at = new Date(job.updated_at.getTime() + 1)
      }
      count += 1
    }
    return { count }
  })

  readonly transaction = vi.fn(async (
    callback: (client: unknown) => Promise<unknown>,
  ) => {
    const beforeTransaction = new Map(
      [...this.jobs.entries()].map(([url, job]) => [url, { ...job }]),
    )

    try {
      return await callback({
        seoDiscoveryJob: {
          findMany: this.findMany,
          findUnique: this.findUnique,
          createMany: this.createMany,
          updateMany: this.updateMany,
          delete: this.deleteJob,
          deleteMany: this.deleteJob,
        },
        post: { update: this.postUpdate, updateMany: this.postUpdate },
        product: { update: this.productUpdate, updateMany: this.productUpdate },
      })
    } catch (error) {
      if (this.rollbackOnTransactionError) {
        this.jobs.clear()
        for (const [url, job] of beforeTransaction) {
          this.jobs.set(url, job)
        }
      }
      throw error
    }
  })

  constructor(
    initialJobs: StoredJob[] = [],
    options: InMemorySitemapClientOptions | ((callNumber: number) => Promise<void>) = {},
  ) {
    const normalizedOptions = typeof options === 'function'
      ? { afterFindMany: options }
      : options
    this.afterFindMany = normalizedOptions.afterFindMany ?? (async () => {
      await Promise.resolve()
    })
    this.beforeUpdateMany = normalizedOptions.beforeUpdateMany ?? (async () => {
      await Promise.resolve()
    })
    this.rollbackOnTransactionError = normalizedOptions.rollbackOnTransactionError ?? false

    for (const job of initialJobs) {
      this.jobs.set(job.url, { ...job })
      this.nextId = Math.max(this.nextId, job.id + 1)
    }
  }

  get client(): SitemapSyncClient {
    return { $transaction: this.transaction } as unknown as SitemapSyncClient
  }

  get(url: string): StoredJob {
    const job = this.jobs.get(url)
    if (!job) throw new Error(`missing test job: ${url}`)
    return job
  }
}

function dependencies(
  entries: ReadonlyMap<string, Date | null>,
  now: Date = NOW,
): SitemapSyncDependencies {
  return {
    readSitemap: vi.fn(async () => new Map(entries)),
    now: vi.fn(() => new Date(now.getTime())),
  }
}

function expectPendingReset(job: StoredJob, contentUpdatedAt: Date) {
  expect(job).toMatchObject({
    content_updated_at: contentUpdatedAt,
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
    next_attempt_at: NOW,
    attempt_count: 0,
    last_error_code: null,
    last_error_message: null,
    lease_token: null,
    lease_expires_at: null,
  })
}

function expectInspectionEvidenceFieldsPreserved(saved: StoredJob, initial: StoredJob) {
  expect(saved).toMatchObject({
    eligibility_status: initial.eligibility_status,
    http_status: initial.http_status,
    declared_canonical: initial.declared_canonical,
    robots_indexable: initial.robots_indexable,
    gsc_verdict: initial.gsc_verdict,
    coverage_state: initial.coverage_state,
    page_fetch_state: initial.page_fetch_state,
    google_canonical: initial.google_canonical,
    last_crawl_at: initial.last_crawl_at,
    last_inspected_at: initial.last_inspected_at,
  })
}

function expectInspectionEvidencePreserved(saved: StoredJob, initial: StoredJob) {
  expect(saved.content_updated_at).toEqual(initial.content_updated_at)
  expectInspectionEvidenceFieldsPreserved(saved, initial)
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('syncSitemapDiscoveryJobs', () => {
  it('creates a new exact sitemap URL with deploy-sync full pending state', async () => {
    const prisma = new InMemorySitemapClient()
    const deps = dependencies(new Map([[STATIC_URL, NEW_LASTMOD]]))

    await expect(syncSitemapDiscoveryJobs(prisma.client, deps)).resolves.toEqual({
      observedCount: 1,
      createdCount: 1,
      resetCount: 0,
      unchangedCount: 0,
      removedCount: 0,
    })

    const saved = prisma.get(STATIC_URL)
    expect(saved).toMatchObject({
      url: STATIC_URL,
      source_type: 'sitemap_sync',
      source_id: null,
    })
    expectPendingReset(saved, NEW_LASTMOD)
    expect(prisma.createMany).toHaveBeenCalledWith(expect.objectContaining({
      skipDuplicates: true,
    }))
  })

  it('resets evidence only for a strictly newer lastmod and preserves source identity', async () => {
    const initial = storedJob({
      url: PRODUCT_URL,
      source_type: 'product',
      source_id: 24,
      content_updated_at: OLD_LASTMOD,
    })
    const prisma = new InMemorySitemapClient([initial])

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[PRODUCT_URL, NEW_LASTMOD]])),
    )

    expect(result).toEqual({
      observedCount: 1,
      createdCount: 0,
      resetCount: 1,
      unchangedCount: 0,
      removedCount: 0,
    })
    const saved = prisma.get(PRODUCT_URL)
    expect(saved).toMatchObject({ source_type: 'product', source_id: 24 })
    expectPendingReset(saved, NEW_LASTMOD)
  })

  it.each([
    ['equal', EQUAL_LASTMOD],
    ['older', OLD_LASTMOD],
    ['missing', null],
  ])('preserves all inspection evidence for %s lastmod', async (_label, lastmod) => {
    const initial = storedJob()
    const prisma = new InMemorySitemapClient([initial])

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, lastmod]])),
    )

    const saved = prisma.get(STATIC_URL)
    expectInspectionEvidencePreserved(saved, initial)
    expect(saved).toMatchObject({
      status: initial.status,
      next_attempt_at: initial.next_attempt_at,
      attempt_count: initial.attempt_count,
      last_error_code: initial.last_error_code,
      last_error_message: initial.last_error_message,
      lease_token: initial.lease_token,
      lease_expires_at: initial.lease_expires_at,
    })
    expect(saved.updated_at.getTime()).toBeGreaterThan(initial.updated_at.getTime())
    expect(result).toMatchObject({
      observedCount: 1,
      createdCount: 0,
      resetCount: 0,
      unchangedCount: 1,
      removedCount: 0,
    })
    expect(prisma.createMany).not.toHaveBeenCalled()
    expect(prisma.updateMany.mock.calls.filter(([args]) => (
      args.where.content_updated_at !== undefined
    ))).toHaveLength(0)
  })

  it('uses a deterministic null-lastmod version and never resets it on repeat sync', async () => {
    const prisma = new InMemorySitemapClient()
    const deps = dependencies(new Map([[CONTACT_URL, null]]))

    const first = await syncSitemapDiscoveryJobs(prisma.client, deps)
    const firstState = { ...prisma.get(CONTACT_URL) }
    const second = await syncSitemapDiscoveryJobs(prisma.client, deps)
    const secondState = { ...prisma.get(CONTACT_URL) }
    const { updated_at: firstObservedAt, ...firstDurableState } = firstState
    const { updated_at: secondObservedAt, ...secondDurableState } = secondState

    expect(first).toMatchObject({ createdCount: 1, resetCount: 0 })
    expect(second).toMatchObject({ createdCount: 0, resetCount: 0, unchangedCount: 1 })
    expect(secondDurableState).toEqual(firstDurableState)
    expect(secondObservedAt.getTime()).toBeGreaterThan(firstObservedAt.getTime())
    expect(firstState.content_updated_at).toEqual(new Date(0))
    expect(prisma.createMany).toHaveBeenCalledOnce()
  })

  it.each([
    ['equal', EQUAL_LASTMOD],
    ['older', OLD_LASTMOD],
    ['null', null],
  ])('partially revives a removed sitemap job on %s lastmod reappearance', async (
    _label,
    lastmod,
  ) => {
    const initial = storedJob({
      status: 'SKIPPED',
      attempt_count: 7,
      last_error_code: 'REMOVED_FROM_SITEMAP',
      last_error_message: 'removed by an earlier snapshot',
    })
    const prisma = new InMemorySitemapClient([initial])

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, lastmod]])),
    )

    const saved = prisma.get(STATIC_URL)
    expect(result).toMatchObject({
      observedCount: 1,
      createdCount: 0,
      resetCount: 1,
      unchangedCount: 0,
      removedCount: 0,
    })
    expect(saved).toMatchObject({
      status: 'PENDING_ELIGIBILITY',
      next_attempt_at: NOW,
      attempt_count: 0,
      last_error_code: null,
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
    })
    expectInspectionEvidencePreserved(saved, initial)
    expect(saved.updated_at.getTime()).toBeGreaterThan(initial.updated_at.getTime())
  })

  it('fully resets evidence when a removed sitemap job reappears with newer lastmod', async () => {
    const initial = storedJob({
      content_updated_at: OLD_LASTMOD,
      status: 'SKIPPED',
      last_error_code: 'REMOVED_FROM_SITEMAP',
      last_error_message: 'removed by an earlier snapshot',
    })
    const prisma = new InMemorySitemapClient([initial])

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )

    expect(result).toMatchObject({ resetCount: 1, unchangedCount: 0 })
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
    expect(prisma.get(STATIC_URL).updated_at.getTime()).toBeGreaterThan(
      initial.updated_at.getTime(),
    )
  })

  it('marks only missing sitemap-sync jobs without deleting jobs or content rows', async () => {
    const missing = storedJob({ id: 1, url: STATIC_URL })
    const present = storedJob({ id: 2, url: CONTACT_URL, lease_token: null, lease_expires_at: null })
    const product = storedJob({
      id: 3,
      url: PRODUCT_URL,
      source_type: 'product',
      source_id: 24,
    })
    const prisma = new InMemorySitemapClient([missing, present, product])
    const deps = dependencies(new Map([[CONTACT_URL, EQUAL_LASTMOD]]))

    const first = await syncSitemapDiscoveryJobs(prisma.client, deps)

    expect(first.removedCount).toBe(1)
    expect(prisma.get(STATIC_URL)).toMatchObject({
      status: 'SKIPPED',
      last_error_code: 'REMOVED_FROM_SITEMAP',
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
      http_status: missing.http_status,
      gsc_verdict: missing.gsc_verdict,
      last_inspected_at: missing.last_inspected_at,
    })
    const observedPresent = prisma.get(CONTACT_URL)
    expectInspectionEvidencePreserved(observedPresent, present)
    expect(observedPresent.updated_at.getTime()).toBeGreaterThan(present.updated_at.getTime())
    expect(prisma.get(PRODUCT_URL)).toEqual(product)
    expect(prisma.postUpdate).not.toHaveBeenCalled()
    expect(prisma.productUpdate).not.toHaveBeenCalled()
    expect(prisma.deleteJob).not.toHaveBeenCalled()

    const missingAfterFirstSync = { ...prisma.get(STATIC_URL) }
    const presentAfterFirstSync = { ...prisma.get(CONTACT_URL) }
    const second = await syncSitemapDiscoveryJobs(prisma.client, deps)
    expect(second.removedCount).toBe(0)
    expect(prisma.get(STATIC_URL)).toEqual(missingAfterFirstSync)
    expectInspectionEvidencePreserved(prisma.get(CONTACT_URL), presentAfterFirstSync)
    expect(prisma.get(CONTACT_URL).updated_at.getTime()).toBeGreaterThan(
      presentAfterFirstSync.updated_at.getTime(),
    )
    expect(prisma.get(PRODUCT_URL)).toEqual(product)
  })

  it('does not open a transaction or mark URLs missing when the reader fails', async () => {
    const initial = storedJob()
    const prisma = new InMemorySitemapClient([initial])
    const readerFailure = new Error('fixed sitemap fetch failed')
    const deps: SitemapSyncDependencies = {
      readSitemap: vi.fn(async () => { throw readerFailure }),
      now: vi.fn(() => NOW),
    }

    await expect(syncSitemapDiscoveryJobs(prisma.client, deps)).rejects.toBe(readerFailure)

    expect(prisma.transaction).not.toHaveBeenCalled()
    expect(prisma.get(STATIC_URL)).toEqual(initial)
  })

  it('uses ReadCommitted with the bounded SEO transaction wait and timeout', async () => {
    const prisma = new InMemorySitemapClient()

    await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )

    expect(prisma.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 500,
      timeout: 2_000,
    })
  })

  it('is DB-idempotent when concurrent syncs both observe one missing URL', async () => {
    const prisma = new InMemorySitemapClient()
    const snapshot = new Map([[STATIC_URL, NEW_LASTMOD]])

    await Promise.all([
      syncSitemapDiscoveryJobs(prisma.client, dependencies(snapshot)),
      syncSitemapDiscoveryJobs(prisma.client, dependencies(snapshot)),
    ])

    expect(prisma.jobs.size).toBe(1)
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
  })

  it.each([
    ['equal', EQUAL_LASTMOD],
    ['null', null],
  ])('prevents a stale missing snapshot after a later %s presence observation', async (
    _label,
    lastmod,
  ) => {
    const initial = storedJob({ lease_token: null, lease_expires_at: null })
    const staleReadCaptured = deferred()
    const releaseStaleRead = deferred()
    const prisma = new InMemorySitemapClient([initial], async (callNumber) => {
      if (callNumber === 1) {
        staleReadCaptured.resolve()
        await releaseStaleRead.promise
      } else {
        await Promise.resolve()
      }
    })

    const staleMissingSync = syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map()),
    )
    await staleReadCaptured.promise

    const presentResult = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, lastmod]])),
    )
    releaseStaleRead.resolve()
    const staleResult = await staleMissingSync

    expect(presentResult).toMatchObject({ resetCount: 0, unchangedCount: 1 })
    expect(staleResult.removedCount).toBe(0)
    const saved = prisma.get(STATIC_URL)
    expect(saved.status).toBe(initial.status)
    expect(saved.last_error_code).toBe(initial.last_error_code)
    expectInspectionEvidencePreserved(saved, initial)
    expect(saved.updated_at.getTime()).toBeGreaterThan(initial.updated_at.getTime())
  })

  it('prevents a stale missing snapshot from overwriting a later newer-lastmod reset', async () => {
    const initial = storedJob({
      content_updated_at: OLD_LASTMOD,
      lease_token: null,
      lease_expires_at: null,
    })
    const staleReadCaptured = deferred()
    const releaseStaleRead = deferred()
    const prisma = new InMemorySitemapClient([initial], async (callNumber) => {
      if (callNumber === 1) {
        staleReadCaptured.resolve()
        await releaseStaleRead.promise
      } else {
        await Promise.resolve()
      }
    })

    const staleMissingSync = syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map()),
    )
    await staleReadCaptured.promise

    const presentResult = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )
    releaseStaleRead.resolve()
    const staleResult = await staleMissingSync

    expect(presentResult.resetCount).toBe(1)
    expect(staleResult.removedCount).toBe(0)
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
  })

  it.each([
    ['equal', EQUAL_LASTMOD],
    ['null', null],
  ])('retries a newer lastmod after a concurrent %s presence stamp wins the first CAS', async (
    _label,
    competingLastmod,
  ) => {
    const initial = storedJob({ content_updated_at: EQUAL_LASTMOD })
    const newerCasCaptured = deferred()
    const releaseNewerCas = deferred()
    const prisma = new InMemorySitemapClient([initial], {
      beforeUpdateMany: async (args, callNumber) => {
        if (callNumber === 1 && args.where.id === initial.id) {
          newerCasCaptured.resolve()
          await releaseNewerCas.promise
        }
      },
    })

    const newerSync = syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )
    await newerCasCaptured.promise

    const competingResult = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, competingLastmod]])),
    )
    const competingToken = new Date(prisma.get(STATIC_URL).updated_at.getTime())
    releaseNewerCas.resolve()
    const newerResult = await newerSync

    expect(competingResult).toMatchObject({ resetCount: 0, unchangedCount: 1 })
    expect(newerResult).toMatchObject({ resetCount: 1, unchangedCount: 0 })
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
    expect(prisma.get(STATIC_URL).updated_at.getTime()).toBeGreaterThan(
      competingToken.getTime(),
    )
  })

  it('retries a newer lastmod after an unrelated bookkeeping token advance', async () => {
    const initial = storedJob({ content_updated_at: OLD_LASTMOD })
    const competingToken = new Date(NOW.getTime() + 60_000)
    let conflictApplied = false
    const prisma = new InMemorySitemapClient([initial], {
      beforeUpdateMany: async (args, _callNumber, jobs) => {
        if (conflictApplied || args.where.id !== initial.id) return
        conflictApplied = true
        const current = jobs.get(STATIC_URL)
        if (current) current.updated_at = new Date(competingToken.getTime())
      },
    })

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )

    expect(result).toMatchObject({ resetCount: 1, unchangedCount: 0 })
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
    expect(prisma.get(STATIC_URL).updated_at.getTime()).toBeGreaterThan(
      competingToken.getTime(),
    )
  })

  it('recomputes priority when a conflicting writer already stored newer content', async () => {
    const initial = storedJob({ content_updated_at: OLD_LASTMOD })
    const competingToken = new Date(NOW.getTime() + 60_000)
    let conflictApplied = false
    const prisma = new InMemorySitemapClient([initial], {
      beforeUpdateMany: async (args, _callNumber, jobs) => {
        if (conflictApplied || args.where.id !== initial.id) return
        conflictApplied = true
        const current = jobs.get(STATIC_URL)
        if (!current) return
        current.content_updated_at = new Date(NEWEST_LASTMOD.getTime())
        current.updated_at = new Date(competingToken.getTime())
      },
    })

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )

    const saved = prisma.get(STATIC_URL)
    expect(result).toMatchObject({ resetCount: 0, unchangedCount: 1 })
    expect(saved.content_updated_at).toEqual(NEWEST_LASTMOD)
    expectInspectionEvidenceFieldsPreserved(saved, initial)
    expect(saved.updated_at.getTime()).toBeGreaterThan(competingToken.getTime())
  })

  it('preserves new ownership while applying a still-newer monotonic reset after conflict', async () => {
    const initial = storedJob({ content_updated_at: OLD_LASTMOD })
    const competingToken = new Date(NOW.getTime() + 60_000)
    let conflictApplied = false
    const prisma = new InMemorySitemapClient([initial], {
      beforeUpdateMany: async (args, _callNumber, jobs) => {
        if (conflictApplied || args.where.id !== initial.id) return
        conflictApplied = true
        const current = jobs.get(STATIC_URL)
        if (!current) return
        current.source_type = 'product'
        current.source_id = 24
        current.updated_at = new Date(competingToken.getTime())
      },
    })

    const result = await syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([[STATIC_URL, NEW_LASTMOD]])),
    )

    expect(result).toMatchObject({ resetCount: 1, unchangedCount: 0 })
    expect(prisma.get(STATIC_URL)).toMatchObject({
      source_type: 'product',
      source_id: 24,
    })
    expectPendingReset(prisma.get(STATIC_URL), NEW_LASTMOD)
    expect(prisma.get(STATIC_URL).updated_at.getTime()).toBeGreaterThan(
      competingToken.getTime(),
    )
  })

  it('fails with a stable error and rolls back after three observation CAS conflicts', async () => {
    const first = storedJob({
      id: 2,
      url: CONTACT_URL,
      lease_token: null,
      lease_expires_at: null,
    })
    const conflicted = storedJob({
      id: 1,
      url: STATIC_URL,
      content_updated_at: OLD_LASTMOD,
    })
    let targetConflicts = 0
    const prisma = new InMemorySitemapClient([first, conflicted], {
      rollbackOnTransactionError: true,
      beforeUpdateMany: async (args, _callNumber, jobs) => {
        if (args.where.id !== conflicted.id || args.where.updated_at === undefined) return
        targetConflicts += 1
        const current = jobs.get(STATIC_URL)
        if (current) {
          current.updated_at = new Date(current.updated_at.getTime() + 1)
        }
      },
    })

    await expect(syncSitemapDiscoveryJobs(
      prisma.client,
      dependencies(new Map([
        [CONTACT_URL, EQUAL_LASTMOD],
        [STATIC_URL, NEW_LASTMOD],
      ])),
    )).rejects.toThrow('SEO_DISCOVERY_SITEMAP_CAS_RETRY_EXHAUSTED')

    expect(targetConflicts).toBe(3)
    expect(prisma.get(CONTACT_URL)).toEqual(first)
    expect(prisma.get(STATIC_URL)).toEqual(conflicted)
  })

  it('keeps concurrent missing snapshots idempotent with one removal transition', async () => {
    const initial = storedJob({ lease_token: null, lease_expires_at: null })
    const prisma = new InMemorySitemapClient([initial])

    const results = await Promise.all([
      syncSitemapDiscoveryJobs(prisma.client, dependencies(new Map())),
      syncSitemapDiscoveryJobs(prisma.client, dependencies(new Map())),
    ])

    expect(results.reduce((count, result) => count + result.removedCount, 0)).toBe(1)
    expect(prisma.get(STATIC_URL)).toMatchObject({
      status: 'SKIPPED',
      last_error_code: 'REMOVED_FROM_SITEMAP',
      last_error_message: null,
      lease_token: null,
      lease_expires_at: null,
    })
  })

  it('keeps content_updated_at monotonic when an older concurrent snapshot finishes last', async () => {
    const initial = storedJob({
      url: PRODUCT_URL,
      source_type: 'product',
      source_id: 24,
      content_updated_at: OLD_LASTMOD,
    })
    const prisma = new InMemorySitemapClient([initial])

    await Promise.all([
      syncSitemapDiscoveryJobs(
        prisma.client,
        dependencies(new Map([[PRODUCT_URL, NEWEST_LASTMOD]])),
      ),
      syncSitemapDiscoveryJobs(
        prisma.client,
        dependencies(new Map([[PRODUCT_URL, NEW_LASTMOD]])),
      ),
    ])

    expect(prisma.get(PRODUCT_URL).content_updated_at).toEqual(NEWEST_LASTMOD)
    expectPendingReset(prisma.get(PRODUCT_URL), NEWEST_LASTMOD)
  })
})
