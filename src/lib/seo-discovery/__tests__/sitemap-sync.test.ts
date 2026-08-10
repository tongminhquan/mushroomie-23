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
    ...overrides,
  }
}

class InMemorySitemapClient {
  readonly jobs = new Map<string, StoredJob>()
  private nextId = 1

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
    const snapshot = [...this.jobs.values()]
      .filter((job) => !args.where?.source_type || job.source_type === args.where.source_type)
      .map((job) => ({ ...job }))

    // Yield after capturing the snapshot so concurrent tests exercise stale reads.
    await Promise.resolve()
    return snapshot
  })
  readonly createMany = vi.fn(async (args: {
    data: Array<Omit<StoredJob, 'id'>>
    skipDuplicates?: boolean
  }) => {
    let count = 0
    for (const data of args.data) {
      if (this.jobs.has(data.url)) {
        if (args.skipDuplicates) continue
        throw new Error('duplicate URL')
      }
      const saved = { ...data, id: this.nextId++ }
      this.jobs.set(saved.url, saved)
      count += 1
    }
    return { count }
  })
  readonly updateMany = vi.fn(async (args: {
    where: {
      id?: number
      url?: string
      source_type?: string
      content_updated_at?: { lt: Date }
    }
    data: Partial<StoredJob>
  }) => {
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
      count += 1
    }
    return { count }
  })

  readonly transaction = vi.fn(async (
    callback: (client: unknown) => Promise<unknown>,
  ) => callback({
    seoDiscoveryJob: {
      findMany: this.findMany,
      createMany: this.createMany,
      updateMany: this.updateMany,
      delete: this.deleteJob,
      deleteMany: this.deleteJob,
    },
    post: { update: this.postUpdate, updateMany: this.postUpdate },
    product: { update: this.productUpdate, updateMany: this.productUpdate },
  }))

  constructor(initialJobs: StoredJob[] = []) {
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

    expect(prisma.get(STATIC_URL)).toEqual(initial)
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

    expect(first).toMatchObject({ createdCount: 1, resetCount: 0 })
    expect(second).toMatchObject({ createdCount: 0, resetCount: 0, unchangedCount: 1 })
    expect(prisma.get(CONTACT_URL)).toEqual(firstState)
    expect(firstState.content_updated_at).toEqual(new Date(0))
    expect(prisma.createMany).toHaveBeenCalledOnce()
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
    expect(prisma.get(CONTACT_URL)).toEqual(present)
    expect(prisma.get(PRODUCT_URL)).toEqual(product)
    expect(prisma.postUpdate).not.toHaveBeenCalled()
    expect(prisma.productUpdate).not.toHaveBeenCalled()
    expect(prisma.deleteJob).not.toHaveBeenCalled()

    const stateAfterFirstSync = [...prisma.jobs.values()].map((job) => ({ ...job }))
    const second = await syncSitemapDiscoveryJobs(prisma.client, deps)
    expect(second.removedCount).toBe(0)
    expect([...prisma.jobs.values()]).toEqual(stateAfterFirstSync)
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
