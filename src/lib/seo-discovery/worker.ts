import 'server-only'

import { createHash, randomUUID } from 'node:crypto'

import type { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/prisma'

import { readSeoDiscoveryConfig, type SeoDiscoveryConfig } from './config'
import {
  checkPublicUrlEligibility,
  type PublicUrlEligibilityResult,
} from './eligibility'
import {
  GscClientError,
  type GoogleSearchConsoleClient,
  type UrlInspectionResult,
} from './gsc-client'
import { createGoogleSearchConsoleClient } from './google-gsc-client'
import {
  computeNextAttempt,
  computeNextInspectionAttempt,
} from './retry'
import {
  FIXED_SITEMAP_URL,
  readFixedSitemap,
  SitemapReaderError,
} from './sitemap-reader'
import { buildPublicContentUrl } from './urls'

const MAX_BATCH_SIZE = 10
const LEASE_DURATION_MS = 2 * 60 * 1000
const MAX_BATCH_TIME_BUDGET_MS = 45 * 1000
const MAX_NETWORK_OPERATION_MS = 5 * 1000
const SITEMAP_SUBMISSION_COOLDOWN_MS = 60 * 60 * 1000
const WORKER_ERROR_CODE = 'SEO_DISCOVERY_WORKER_ERROR'
const INVALID_GSC_RESPONSE_CODE = 'GSC_INVALID_RESPONSE'

const CLAIMABLE_STATUSES = [
  'PENDING_ELIGIBILITY',
  'ELIGIBLE',
  'INSPECTION_SCHEDULED',
  'INDEXED',
  'NOT_INDEXED',
  'RETRY',
] as const

const WORKER_JOB_SELECT = {
  id: true,
  url: true,
  source_type: true,
  source_id: true,
  content_updated_at: true,
  status: true,
  eligibility_status: true,
  http_status: true,
  declared_canonical: true,
  robots_indexable: true,
  gsc_verdict: true,
  coverage_state: true,
  page_fetch_state: true,
  google_canonical: true,
  last_crawl_at: true,
  last_inspected_at: true,
  next_attempt_at: true,
  attempt_count: true,
  last_error_code: true,
  last_error_message: true,
  lease_token: true,
  lease_expires_at: true,
  created_at: true,
  updated_at: true,
} as const satisfies Prisma.SeoDiscoveryJobSelect

type WorkerJob = Prisma.SeoDiscoveryJobGetPayload<{
  select: typeof WORKER_JOB_SELECT
}>

export type SeoDiscoveryWorkerClient = Pick<
  PrismaClient,
  'seoDiscoveryJob' | 'post' | 'product'
>

type CheckEligibility = (
  url: string,
  sitemapEntries: ReadonlyMap<string, Date | null>,
) => Promise<PublicUrlEligibilityResult>

export interface SeoDiscoverySummary {
  claimed: number
  processed: number
  failed: number
  configurationRequired: number
}

export type SitemapRegistrationOutcome =
  | { state: 'ready' }
  | { state: 'configuration_required'; code: string }
  | { state: 'retry'; code: string }
  | { state: 'error'; code: string }

export interface SitemapRegistrationCoordinator {
  ensure(input: {
    client: GoogleSearchConsoleClient
    sitemapEntries: ReadonlyMap<string, Date | null>
    now: Date
    random: () => number
    runNetwork?: <T>(operation: () => Promise<T>) => Promise<T>
  }): Promise<SitemapRegistrationOutcome>
  markConfigurationRequired?(code: string): void
}

export interface ConfigurationRecoveryCoordinator {
  recover(input: {
    enabled: boolean
    now: Date
    random: () => number
    probe: () => Promise<SitemapRegistrationOutcome>
    requeue: () => Promise<{ count: number; hasMore: boolean }>
  }): Promise<number>
  markConfigurationRequired?(): void
}

export interface SeoDiscoveryWorkerOptions {
  batchSize?: number
  batchTimeBudgetMs?: number
  client?: SeoDiscoveryWorkerClient
  config?: SeoDiscoveryConfig
  now?: () => Date
  monotonicNow?: () => number
  networkOperationMaxMs?: number
  random?: () => number
  createLeaseToken?: () => string
  readSitemap?: () => Promise<Map<string, Date | null>>
  checkEligibility?: CheckEligibility
  gscClient?: GoogleSearchConsoleClient
  sitemapRegistrationCoordinator?: SitemapRegistrationCoordinator
  configurationRecoveryCoordinator?: ConfigurationRecoveryCoordinator
}

const EMPTY_SUMMARY: SeoDiscoverySummary = {
  claimed: 0,
  processed: 0,
  failed: 0,
  configurationRequired: 0,
}

interface CachedSitemapOutcome {
  fingerprint: string
  outcome: SitemapRegistrationOutcome
  nextAttemptAt: Date | null
}

class BatchDeadlineExceeded extends Error {
  constructor() {
    super('SEO_DISCOVERY_BATCH_DEADLINE_EXCEEDED')
    this.name = 'BatchDeadlineExceeded'
  }
}

interface BatchDeadline {
  assertOpen(requiredHeadroomMs?: number): void
  expired(): boolean
  wait<T>(
    operation: () => Promise<T>,
    requiredHeadroomMs?: number,
  ): Promise<T>
}

function createBatchDeadline(input: {
  monotonicNow: () => number
  budgetMs: number
}): BatchDeadline {
  const expiresAt = input.monotonicNow() + input.budgetMs
  const remaining = () => expiresAt - input.monotonicNow()
  const assertOpen = (requiredHeadroomMs = 0) => {
    const remainingMs = remaining()
    if (remainingMs <= 0 || remainingMs < requiredHeadroomMs) {
      throw new BatchDeadlineExceeded()
    }
  }

  return {
    assertOpen,
    expired: () => remaining() <= 0,
    async wait<T>(
      operation: () => Promise<T>,
      requiredHeadroomMs = 0,
    ): Promise<T> {
      assertOpen(requiredHeadroomMs)
      const remainingMs = Math.max(1, Math.ceil(remaining()))
      let timer: ReturnType<typeof setTimeout> | undefined

      try {
        const value = await Promise.race([
          Promise.resolve().then(() => {
            assertOpen(requiredHeadroomMs)
            return operation()
          }),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => {
              reject(new BatchDeadlineExceeded())
            }, remainingMs)
          }),
        ])
        assertOpen()
        return value
      } catch (error) {
        if (error instanceof BatchDeadlineExceeded || remaining() <= 0) {
          throw new BatchDeadlineExceeded()
        }
        throw error
      } finally {
        if (timer !== undefined) clearTimeout(timer)
      }
    },
  }
}

function sitemapFingerprint(entries: ReadonlyMap<string, Date | null>): string {
  const hash = createHash('sha256')
  for (const [url, lastModified] of [...entries.entries()].sort(([left], [right]) => (
    left.localeCompare(right)
  ))) {
    hash.update(url)
    hash.update('\0')
    hash.update(lastModified === null ? '-' : lastModified.toISOString())
    hash.update('\n')
  }
  return hash.digest('hex')
}

type FailureDisposition =
  | { kind: 'configuration_required'; code: string }
  | { kind: 'retry'; code: string }
  | { kind: 'error'; code: string }

function classifyFailure(error: unknown): FailureDisposition {
  if (error instanceof GscClientError) {
    if (
      error.configurationRequired
      || error.code === 'GSC_DISABLED'
      || error.code === 'GSC_CONFIGURATION_REQUIRED'
      || error.code === 'GSC_NOT_FOUND'
    ) {
      return { kind: 'configuration_required', code: error.code }
    }
    if (error.retryable) return { kind: 'retry', code: error.code }
    return { kind: 'error', code: error.code }
  }

  if (error instanceof SitemapReaderError) {
    return {
      kind: error.retryable ? 'retry' : 'error',
      code: error.code,
    }
  }

  return { kind: 'retry', code: WORKER_ERROR_CODE }
}

function coordinatorOutcome(disposition: FailureDisposition): SitemapRegistrationOutcome {
  switch (disposition.kind) {
    case 'configuration_required':
      return { state: 'configuration_required', code: disposition.code }
    case 'retry':
      return { state: 'retry', code: disposition.code }
    case 'error':
      return { state: 'error', code: disposition.code }
  }
}

export function createSitemapRegistrationCoordinator(): SitemapRegistrationCoordinator {
  let cached: CachedSitemapOutcome | null = null
  let inFlight: Promise<SitemapRegistrationOutcome> | null = null
  let transientAttemptCount = 0

  return {
    ensure(input) {
      const fingerprint = sitemapFingerprint(input.sitemapEntries)
      if (
        cached?.outcome.state === 'configuration_required'
        && cached.nextAttemptAt === null
      ) {
        return Promise.resolve(cached.outcome)
      }
      if (
        cached?.outcome.state === 'ready'
        && cached.nextAttemptAt !== null
        && cached.nextAttemptAt.getTime() > input.now.getTime()
      ) {
        return Promise.resolve(cached.outcome)
      }
      if (
        cached?.outcome.state === 'retry'
        && cached.nextAttemptAt !== null
        && cached.nextAttemptAt.getTime() > input.now.getTime()
      ) {
        return Promise.resolve(cached.outcome)
      }
      if (cached?.fingerprint === fingerprint) {
        if (cached.nextAttemptAt === null) return Promise.resolve(cached.outcome)
        if (cached.nextAttemptAt.getTime() > input.now.getTime()) {
          return Promise.resolve(cached.outcome)
        }
      }
      if (inFlight) return inFlight

      inFlight = (async () => {
        try {
          const runNetwork = input.runNetwork ?? (async <T>(
            operation: () => Promise<T>,
          ) => operation())
          const sitemaps = await runNetwork(() => input.client.listSitemaps())
          const canonical = sitemaps.find(({ url }) => url === FIXED_SITEMAP_URL)
          const needsSubmission = !canonical || (
            !canonical.pending
            && canonical.errors !== null
            && canonical.errors > 0
          )

          if (!needsSubmission) {
            transientAttemptCount = 0
            cached = null
            return { state: 'ready' } as const
          }

          await runNetwork(() => input.client.submitSitemap(FIXED_SITEMAP_URL))
          transientAttemptCount = 0
          const outcome = { state: 'ready' } as const
          cached = {
            fingerprint,
            outcome,
            nextAttemptAt: new Date(
              input.now.getTime() + SITEMAP_SUBMISSION_COOLDOWN_MS,
            ),
          }
          return outcome
        } catch (error) {
          if (error instanceof BatchDeadlineExceeded) throw error
          const disposition = classifyFailure(error)
          const outcome = coordinatorOutcome(disposition)
          if (disposition.kind === 'configuration_required' || disposition.kind === 'error') {
            cached = { fingerprint, outcome, nextAttemptAt: null }
          } else {
            transientAttemptCount += 1
            cached = {
              fingerprint,
              outcome,
              nextAttemptAt: computeNextAttempt({
                kind: 'transient',
                attemptCount: transientAttemptCount,
                now: input.now,
                random: input.random,
              }),
            }
          }
          return outcome
        }
      })().finally(() => {
        inFlight = null
      })

      return inFlight
    },
    markConfigurationRequired(code) {
      cached = {
        fingerprint: '',
        outcome: { state: 'configuration_required', code },
        nextAttemptAt: null,
      }
    },
  }
}

export function createConfigurationRecoveryCoordinator(): ConfigurationRecoveryCoordinator {
  let connectionReady = false
  let completed = false
  let inFlight: Promise<number> | null = null
  let transientAttemptCount = 0
  let nextProbeAt: Date | null = null

  return {
    recover(input) {
      if (!input.enabled || completed) return Promise.resolve(0)
      if (nextProbeAt !== null && nextProbeAt.getTime() > input.now.getTime()) {
        return Promise.resolve(0)
      }
      if (inFlight) return inFlight

      inFlight = (async () => {
        if (!connectionReady) {
          let outcome: SitemapRegistrationOutcome
          try {
            outcome = await input.probe()
          } catch (error) {
            if (error instanceof BatchDeadlineExceeded) throw error
            const failure = classifyFailure(error)
            if (failure.kind !== 'retry') {
              completed = true
              return 0
            }
            transientAttemptCount += 1
            nextProbeAt = computeNextAttempt({
              kind: 'transient',
              attemptCount: transientAttemptCount,
              now: input.now,
              random: input.random,
            })
            return 0
          }

          if (outcome.state === 'retry') {
            transientAttemptCount += 1
            nextProbeAt = computeNextAttempt({
              kind: 'transient',
              attemptCount: transientAttemptCount,
              now: input.now,
              random: input.random,
            })
            return 0
          }
          if (outcome.state !== 'ready') {
            completed = true
            return 0
          }
          connectionReady = true
        }

        transientAttemptCount = 0
        nextProbeAt = null
        const recovered = await input.requeue()
        completed = !recovered.hasMore
        return recovered.count
      })().finally(() => {
        inFlight = null
      })

      return inFlight
    },
    markConfigurationRequired() {
      completed = true
      connectionReady = false
      nextProbeAt = null
      transientAttemptCount = 0
    },
  }
}

type SeoDiscoveryCoordinatorGlobal = typeof globalThis & {
  __mushroomieSeoDiscoverySitemapCoordinator?: SitemapRegistrationCoordinator
  __mushroomieSeoDiscoveryConfigurationRecovery?: ConfigurationRecoveryCoordinator
}

const coordinatorGlobal = globalThis as SeoDiscoveryCoordinatorGlobal
const defaultSitemapRegistrationCoordinator = (
  coordinatorGlobal.__mushroomieSeoDiscoverySitemapCoordinator
  ??= createSitemapRegistrationCoordinator()
)
const defaultConfigurationRecoveryCoordinator = (
  coordinatorGlobal.__mushroomieSeoDiscoveryConfigurationRecovery
  ??= createConfigurationRecoveryCoordinator()
)

function boundedBatchSize(requested: number | undefined): number {
  if (!Number.isFinite(requested)) return MAX_BATCH_SIZE
  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(requested!)))
}

function boundedTimeBudget(requested: number | undefined): number {
  if (!Number.isFinite(requested)) return MAX_BATCH_TIME_BUDGET_MS
  return Math.min(
    MAX_BATCH_TIME_BUDGET_MS,
    Math.max(1, Math.floor(requested!)),
  )
}

function boundedNetworkOperationMax(requested: number | undefined): number {
  if (!Number.isFinite(requested)) return MAX_NETWORK_OPERATION_MS
  return Math.min(
    MAX_NETWORK_OPERATION_MS,
    Math.max(0, Math.floor(requested!)),
  )
}

function validLeaseToken(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
    throw new Error('SEO_DISCOVERY_INVALID_LEASE_TOKEN')
  }
  return value
}

function ownedWhere(job: WorkerJob, leaseToken: string) {
  return {
    id: job.id,
    lease_token: leaseToken,
    content_updated_at: new Date(job.content_updated_at.getTime()),
  }
}

async function writeOwnedJob(
  client: SeoDiscoveryWorkerClient,
  job: WorkerJob,
  leaseToken: string,
  data: Prisma.SeoDiscoveryJobUpdateManyMutationInput,
  deadline?: BatchDeadline,
): Promise<boolean> {
  deadline?.assertOpen()
  const updated = await client.seoDiscoveryJob.updateMany({
    where: ownedWhere(job, leaseToken),
    data,
  })
  return updated.count === 1
}

function eligibilityEvidence(result: PublicUrlEligibilityResult) {
  return {
    eligibility_status: result.code,
    http_status: result.httpStatus,
    declared_canonical: result.declaredCanonical,
    robots_indexable: result.robotsIndexable,
  }
}

type SourceEligibilityCode =
  | 'SOURCE_INVALID'
  | 'SOURCE_NOT_PUBLIC'
  | 'SOURCE_URL_MISMATCH'

async function sourceEligibilityFailure(
  client: SeoDiscoveryWorkerClient,
  job: WorkerJob,
): Promise<SourceEligibilityCode | null> {
  if (job.source_type === 'sitemap_sync') return null
  if (job.source_id === null) return 'SOURCE_INVALID'

  if (job.source_type === 'post') {
    const post = await client.post.findUnique({
      where: { id: job.source_id },
      select: { id: true, slug: true, status: true },
    })
    if (!post || post.status !== 'published') return 'SOURCE_NOT_PUBLIC'
    return buildPublicContentUrl('post', post.slug) === job.url
      ? null
      : 'SOURCE_URL_MISMATCH'
  }

  if (job.source_type === 'product') {
    const product = await client.product.findUnique({
      where: { id: job.source_id },
      select: { id: true, slug: true, status: true },
    })
    if (!product || product.status !== 'active') return 'SOURCE_NOT_PUBLIC'
    return buildPublicContentUrl('product', product.slug) === job.url
      ? null
      : 'SOURCE_URL_MISMATCH'
  }

  return 'SOURCE_INVALID'
}

function invalidInspectionResponse(): never {
  throw new GscClientError(INVALID_GSC_RESPONSE_CODE)
}

function validatedNullableProviderString(
  value: unknown,
  maximumLength: number,
): string | null {
  if (value === null) return null
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > maximumLength
    || /[\u0000-\u001f\u007f]/.test(value)
  ) {
    invalidInspectionResponse()
  }
  return value
}

interface ValidatedInspectionEvidence {
  verdict: string
  coverageState: string | null
  pageFetchState: string | null
  googleCanonical: string | null
  lastCrawlAt: Date | null
}

function validateInspectionResult(result: unknown): ValidatedInspectionEvidence {
  if (typeof result !== 'object' || result === null || Array.isArray(result)) {
    invalidInspectionResponse()
  }

  const candidate = result as Partial<Record<keyof UrlInspectionResult, unknown>>
  const verdict = validatedNullableProviderString(candidate.verdict, 80)
  if (verdict === null) invalidInspectionResponse()

  validatedNullableProviderString(candidate.robotsTxtState, 80)
  validatedNullableProviderString(candidate.indexingState, 80)
  validatedNullableProviderString(candidate.userCanonical, 512)

  const lastCrawlTime = validatedNullableProviderString(candidate.lastCrawlTime, 80)
  let lastCrawlAt: Date | null = null
  if (lastCrawlTime !== null) {
    lastCrawlAt = new Date(lastCrawlTime)
    if (!Number.isFinite(lastCrawlAt.getTime())) invalidInspectionResponse()
  }

  return {
    verdict,
    coverageState: validatedNullableProviderString(candidate.coverageState, 160),
    pageFetchState: validatedNullableProviderString(candidate.pageFetchState, 80),
    googleCanonical: validatedNullableProviderString(candidate.googleCanonical, 512),
    lastCrawlAt,
  }
}

async function persistFailure(
  client: SeoDiscoveryWorkerClient,
  job: WorkerJob,
  leaseToken: string,
  failure: FailureDisposition,
  attemptedAt: Date,
  random: () => number,
  evidence: Prisma.SeoDiscoveryJobUpdateManyMutationInput = {},
  deadline?: BatchDeadline,
): Promise<{ persisted: boolean; failed: boolean; configurationRequired: boolean }> {
  if (failure.kind === 'configuration_required') {
    return {
      persisted: await writeOwnedJob(client, job, leaseToken, {
        ...evidence,
        status: 'CONFIGURATION_REQUIRED',
        attempt_count: 0,
        last_error_code: failure.code,
        last_error_message: null,
      }, deadline),
      failed: false,
      configurationRequired: true,
    }
  }

  if (failure.kind === 'retry') {
    const attemptCount = job.attempt_count + 1
    return {
      persisted: await writeOwnedJob(client, job, leaseToken, {
        ...evidence,
        status: 'RETRY',
        next_attempt_at: computeNextAttempt({
          kind: 'transient',
          attemptCount,
          now: attemptedAt,
          random,
        }),
        attempt_count: attemptCount,
        last_error_code: failure.code,
        last_error_message: null,
      }, deadline),
      failed: true,
      configurationRequired: false,
    }
  }

  return {
    persisted: await writeOwnedJob(client, job, leaseToken, {
      ...evidence,
      status: 'ERROR',
      attempt_count: 0,
      last_error_code: failure.code,
      last_error_message: null,
    }, deadline),
    failed: true,
    configurationRequired: false,
  }
}

export async function runSeoDiscoveryBatch(
  options: SeoDiscoveryWorkerOptions = {},
): Promise<SeoDiscoverySummary> {
  const config = options.config ?? readSeoDiscoveryConfig(process.env)
  if (!config.discoveryEnabled) return { ...EMPTY_SUMMARY }

  const client = options.client ?? prisma
  const now = options.now ?? (() => new Date())
  const monotonicNow = options.monotonicNow ?? (() => performance.now())
  const random = options.random ?? Math.random
  const createLeaseToken = options.createLeaseToken ?? (() => randomUUID().replaceAll('-', ''))
  const readSitemap = options.readSitemap ?? readFixedSitemap
  const checkEligibility = options.checkEligibility ?? checkPublicUrlEligibility
  const gscClient = options.gscClient ?? createGoogleSearchConsoleClient()
  const sitemapRegistrationCoordinator = options.sitemapRegistrationCoordinator
    ?? defaultSitemapRegistrationCoordinator
  const configurationRecoveryCoordinator = options.configurationRecoveryCoordinator
    ?? defaultConfigurationRecoveryCoordinator
  const batchTimeBudget = boundedTimeBudget(options.batchTimeBudgetMs)
  const networkOperationMax = boundedNetworkOperationMax(
    options.networkOperationMaxMs,
  )
  const deadline = createBatchDeadline({ monotonicNow, budgetMs: batchTimeBudget })
  const summary: SeoDiscoverySummary = { ...EMPTY_SUMMARY }
  const candidateReadAt = now()
  const leaseToken = validLeaseToken(createLeaseToken())
  let sitemapPromise: Promise<Map<string, Date | null>> | undefined
  let sitemapReadinessPromise: Promise<SitemapRegistrationOutcome> | undefined
  let batchGoogleFailure: FailureDisposition | null = null
  const getSitemap = () => {
    sitemapPromise ??= deadline.wait(readSitemap, networkOperationMax)
    return sitemapPromise
  }
  const getSitemapReadiness = (entries: ReadonlyMap<string, Date | null>) => {
    sitemapReadinessPromise ??= deadline.wait(
      () => sitemapRegistrationCoordinator.ensure({
        client: gscClient,
        sitemapEntries: entries,
        now: now(),
        random,
        runNetwork: (operation) => deadline.wait(
          operation,
          networkOperationMax,
        ),
      }),
    )
    return sitemapReadinessPromise
  }

  try {
    if (config.gscEnabled) {
      const recoveryLimit = boundedBatchSize(options.batchSize)
      const configurationSnapshots = await deadline.wait(
        () => client.seoDiscoveryJob.findMany({
          where: { status: 'CONFIGURATION_REQUIRED' },
          orderBy: [{ id: 'asc' }],
          take: MAX_BATCH_SIZE + 1,
          select: WORKER_JOB_SELECT,
        }),
      )
      const recoverySlice = configurationSnapshots.filter((job) => (
        job.lease_token === null
        || (
          job.lease_expires_at !== null
          && job.lease_expires_at.getTime() <= candidateReadAt.getTime()
        )
      )).slice(0, recoveryLimit)
      if (recoverySlice.length > 0) {
        await configurationRecoveryCoordinator.recover({
          enabled: true,
          now: candidateReadAt,
          random,
          probe: async () => getSitemapReadiness(await getSitemap()),
          requeue: async () => {
            deadline.assertOpen()
            const recovered = await client.seoDiscoveryJob.updateMany({
              where: {
                status: 'CONFIGURATION_REQUIRED',
                OR: recoverySlice.map((job) => ({
                  id: job.id,
                  content_updated_at: new Date(job.content_updated_at.getTime()),
                  lease_token: job.lease_token,
                  lease_expires_at: job.lease_expires_at === null
                    ? null
                    : new Date(job.lease_expires_at.getTime()),
                })),
              },
              data: {
                status: 'PENDING_ELIGIBILITY',
                next_attempt_at: candidateReadAt,
                attempt_count: 0,
                lease_token: null,
                lease_expires_at: null,
              },
            })
            return {
              count: recovered.count,
              hasMore: configurationSnapshots.length > recoverySlice.length,
            }
          },
        })
      }
    }
    deadline.assertOpen()
  } catch (error) {
    if (error instanceof BatchDeadlineExceeded) return summary
    throw error
  }

  let candidates: WorkerJob[]
  try {
    candidates = await deadline.wait(() => client.seoDiscoveryJob.findMany({
      where: {
        status: { in: [...CLAIMABLE_STATUSES] },
        next_attempt_at: { lte: candidateReadAt },
        OR: [
          { lease_token: null },
          { lease_expires_at: { lte: candidateReadAt } },
        ],
      },
      orderBy: [
        { next_attempt_at: 'asc' },
        { id: 'asc' },
      ],
      take: boundedBatchSize(options.batchSize),
      select: WORKER_JOB_SELECT,
    }))
  } catch (error) {
    if (error instanceof BatchDeadlineExceeded) return summary
    throw error
  }

  for (const candidate of candidates) {
    if (deadline.expired()) break

    const claimStartedAt = now()
    const leaseExpiresAt = new Date(claimStartedAt.getTime() + LEASE_DURATION_MS)
    let claimed: { count: number }
    try {
      deadline.assertOpen()
      claimed = await client.seoDiscoveryJob.updateMany({
        where: {
          id: candidate.id,
          content_updated_at: new Date(candidate.content_updated_at.getTime()),
          status: { in: [...CLAIMABLE_STATUSES] },
          next_attempt_at: { lte: claimStartedAt },
          OR: [
            { lease_token: null },
            { lease_expires_at: { lte: claimStartedAt } },
          ],
        },
        data: {
          lease_token: leaseToken,
          lease_expires_at: leaseExpiresAt,
        },
      })
    } catch (error) {
      if (error instanceof BatchDeadlineExceeded || deadline.expired()) break
      throw error
    }
    if (claimed.count !== 1) continue
    summary.claimed += 1

    let leasedJob: WorkerJob | null = null
    let failureCounted = false
    let stopBatch = false
    try {
      deadline.assertOpen()
      leasedJob = await deadline.wait(() => client.seoDiscoveryJob.findFirst({
        where: ownedWhere(candidate, leaseToken),
        select: WORKER_JOB_SELECT,
      }))
      if (!leasedJob) {
        summary.failed += 1
        failureCounted = true
        continue
      }

      const sourceFailure = await deadline.wait(
        () => sourceEligibilityFailure(client, leasedJob!),
      )
      if (sourceFailure !== null) {
        const persisted = await writeOwnedJob(client, leasedJob, leaseToken, {
          status: 'SKIPPED',
          eligibility_status: sourceFailure,
          http_status: null,
          declared_canonical: null,
          robots_indexable: null,
          attempt_count: 0,
          last_error_code: sourceFailure,
          last_error_message: null,
        }, deadline)
        if (persisted) summary.processed += 1
        continue
      }

      const sitemapEntries = await getSitemap()
      const eligibility = await deadline.wait(
        () => checkEligibility(leasedJob!.url, sitemapEntries),
        networkOperationMax,
      )
      if (
        !eligibility.eligible
        && eligibility.code === 'HTTP_NOT_FOUND'
        && !(
          leasedJob.status === 'RETRY'
          && leasedJob.last_error_code === 'HTTP_NOT_FOUND'
        )
      ) {
        const persisted = await writeOwnedJob(client, leasedJob, leaseToken, {
          ...eligibilityEvidence(eligibility),
          status: 'RETRY',
          next_attempt_at: computeNextAttempt({
            kind: 'transient',
            attemptCount: 1,
            now: now(),
            random,
          }),
          attempt_count: 0,
          last_error_code: eligibility.code,
          last_error_message: null,
        }, deadline)
        if (persisted) summary.processed += 1
        continue
      }
      if (!eligibility.eligible && !eligibility.retryable) {
        const persisted = await writeOwnedJob(client, leasedJob, leaseToken, {
          ...eligibilityEvidence(eligibility),
          status: 'SKIPPED',
          attempt_count: 0,
          last_error_code: eligibility.code,
          last_error_message: null,
        }, deadline)
        if (persisted) summary.processed += 1
        continue
      }

      if (!eligibility.eligible) {
        const transition = await persistFailure(
          client,
          leasedJob,
          leaseToken,
          { kind: 'retry', code: eligibility.code },
          now(),
          random,
          eligibilityEvidence(eligibility),
          deadline,
        )
        if (transition.persisted) {
          summary.processed += 1
          summary.failed += 1
          failureCounted = true
        }
        continue
      }

      const eligibilityPersisted = await writeOwnedJob(client, leasedJob, leaseToken, {
        ...eligibilityEvidence(eligibility),
        status: 'ELIGIBLE',
        last_error_code: null,
        last_error_message: null,
      }, deadline)
      if (!eligibilityPersisted) continue

      if (batchGoogleFailure !== null) {
        const transition = await persistFailure(
          client,
          leasedJob,
          leaseToken,
          batchGoogleFailure,
          now(),
          random,
          {},
          deadline,
        )
        if (transition.persisted) {
          summary.processed += 1
          if (transition.failed) {
            summary.failed += 1
            failureCounted = true
          }
          if (transition.configurationRequired) {
            summary.configurationRequired += 1
          }
        }
        continue
      }

      const sitemapReadiness = await getSitemapReadiness(sitemapEntries)
      if (sitemapReadiness.state !== 'ready') {
        const registrationFailure: FailureDisposition = {
          kind: sitemapReadiness.state,
          code: sitemapReadiness.code,
        }
        batchGoogleFailure = registrationFailure
        if (registrationFailure.kind === 'configuration_required') {
          configurationRecoveryCoordinator.markConfigurationRequired?.()
        }
        const transition = await persistFailure(
          client,
          leasedJob,
          leaseToken,
          registrationFailure,
          now(),
          random,
          {},
          deadline,
        )
        if (transition.persisted) {
          summary.processed += 1
          if (transition.failed) {
            summary.failed += 1
            failureCounted = true
          }
          if (transition.configurationRequired) {
            summary.configurationRequired += 1
          }
        }
        continue
      }

      const inspectedAt = now()
      let inspection: ValidatedInspectionEvidence
      try {
        inspection = validateInspectionResult(
          await deadline.wait(
            () => gscClient.inspectUrl(leasedJob!.url),
            networkOperationMax,
          ),
        )
      } catch (error) {
        if (error instanceof BatchDeadlineExceeded) throw error
        if (error instanceof GscClientError) {
          batchGoogleFailure = classifyFailure(error)
          if (batchGoogleFailure.kind === 'configuration_required') {
            sitemapRegistrationCoordinator.markConfigurationRequired?.(
              batchGoogleFailure.code,
            )
            configurationRecoveryCoordinator.markConfigurationRequired?.()
          }
        }
        throw error
      }
      const indexed = inspection.verdict === 'PASS'
      const nextAttemptAt = indexed
        ? computeNextAttempt({
          kind: 'inspection',
          attemptCount: 3,
          now: inspectedAt,
          random,
        })
        : computeNextInspectionAttempt({
          contentUpdatedAt: leasedJob.content_updated_at,
          lastInspectedAt: inspectedAt,
          now: inspectedAt,
        })
      const persisted = await writeOwnedJob(client, leasedJob, leaseToken, {
        status: indexed ? 'INDEXED' : 'NOT_INDEXED',
        gsc_verdict: inspection.verdict,
        coverage_state: inspection.coverageState,
        page_fetch_state: inspection.pageFetchState,
        google_canonical: inspection.googleCanonical,
        last_crawl_at: inspection.lastCrawlAt,
        last_inspected_at: inspectedAt,
        next_attempt_at: nextAttemptAt,
        attempt_count: 0,
        last_error_code: null,
        last_error_message: null,
      }, deadline)
      if (persisted) summary.processed += 1
    } catch (error) {
      if (error instanceof BatchDeadlineExceeded) {
        if (!failureCounted) {
          summary.failed += 1
          failureCounted = true
        }
        stopBatch = true
      } else if (leasedJob === null) {
        summary.failed += 1
        failureCounted = true
      } else {
        try {
          const transition = await persistFailure(
            client,
            leasedJob,
            leaseToken,
            classifyFailure(error),
            now(),
            random,
            {},
            deadline,
          )
          if (transition.persisted) {
            summary.processed += 1
            if (transition.failed) {
              summary.failed += 1
              failureCounted = true
            }
            if (transition.configurationRequired) {
              summary.configurationRequired += 1
            }
          }
        } catch (persistError) {
          if (persistError instanceof BatchDeadlineExceeded) stopBatch = true
          if (!failureCounted) {
            summary.failed += 1
            failureCounted = true
          }
        }
      }
    } finally {
      try {
        await client.seoDiscoveryJob.updateMany({
          where: ownedWhere(candidate, leaseToken),
          data: {
            lease_token: null,
            lease_expires_at: null,
          },
        })
      } catch {
        if (!failureCounted) {
          summary.failed += 1
          failureCounted = true
        }
      }
    }
    if (stopBatch) break
  }

  return summary
}

export async function runSeoDiscoveryBatchSafely(
  options: SeoDiscoveryWorkerOptions = {},
): Promise<SeoDiscoverySummary> {
  try {
    return await runSeoDiscoveryBatch(options)
  } catch {
    try {
      console.error('[seo-discovery] maintenance batch failed', {
        code: WORKER_ERROR_CODE,
      })
    } catch {
      // Logging is best-effort; discovery must never break publication.
    }
    return {
      ...EMPTY_SUMMARY,
      failed: 1,
    }
  }
}
