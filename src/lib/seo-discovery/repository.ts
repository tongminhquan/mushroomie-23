import { Prisma, type PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/prisma'

import type { PublicContentPublication } from './types'
import { assertProductionUrl } from './urls'

const RECORD_FAILURE_CODE = 'SEO_DISCOVERY_QUEUE_RECORD_FAILED'
const MAX_TRANSACTION_ATTEMPTS = 3
const RETRY_JITTER_MAX_MS = [10, 20] as const
const TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 500,
  timeout: 2_000,
} as const

const PUBLICATION_SOURCES = new Set<PublicContentPublication['source']>([
  'post',
  'product',
  'sitemap_sync',
])

export type SeoDiscoveryQueueClient = Pick<PrismaClient, '$transaction'>

export interface SeoDiscoveryRetryDependencies {
  sleep(milliseconds: number): Promise<void>
  random(): number
}

export interface RecordPublicationResult {
  recorded: boolean
}

const DEFAULT_RETRY_DEPENDENCIES: SeoDiscoveryRetryDependencies = {
  sleep: (milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  }),
  random: Math.random,
}

function normalizePublication(event: PublicContentPublication) {
  if (!PUBLICATION_SOURCES.has(event.source)) {
    throw new Error('SEO_DISCOVERY_INVALID_EVENT')
  }

  if (
    event.sourceId !== undefined
    && (!Number.isSafeInteger(event.sourceId) || event.sourceId <= 0)
  ) {
    throw new Error('SEO_DISCOVERY_INVALID_EVENT')
  }

  if (
    !(event.contentUpdatedAt instanceof Date)
    || !Number.isFinite(event.contentUpdatedAt.getTime())
  ) {
    throw new Error('SEO_DISCOVERY_INVALID_EVENT')
  }

  return {
    source: event.source,
    sourceId: event.sourceId ?? null,
    url: assertProductionUrl(event.url),
    contentUpdatedAt: new Date(event.contentUpdatedAt.getTime()),
  }
}

function safeLogContext(event: PublicContentPublication) {
  const sourceType = PUBLICATION_SOURCES.has(event.source)
    ? event.source
    : 'unknown'
  const sourceId = Number.isSafeInteger(event.sourceId) && event.sourceId! > 0
    ? event.sourceId
    : null

  return {
    code: RECORD_FAILURE_CODE,
    source_type: sourceType,
    source_id: sourceId,
  }
}

function logRecordFailure(event: PublicContentPublication): void {
  try {
    console.error(`[${RECORD_FAILURE_CODE}]`, safeLogContext(event))
  } catch {
    // Queue failures, including logging failures, must not break publication.
  }
}

function isRetryableTransactionConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && (error.code === 'P2034' || error.code === 'P2002')
}

function computeRetryJitter(maximum: number, random: () => number): number {
  const sample = random()
  if (!Number.isFinite(sample)) return 0

  const boundedSample = Math.min(1, Math.max(0, sample))
  return Math.min(maximum, Math.floor(boundedSample * (maximum + 1)))
}

export async function recordPublicContentPublication(
  event: PublicContentPublication,
  client: SeoDiscoveryQueueClient = prisma,
  dependencies: SeoDiscoveryRetryDependencies = DEFAULT_RETRY_DEPENDENCIES,
): Promise<RecordPublicationResult> {
  try {
    const normalized = normalizePublication(event)

    for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        await client.$transaction(async (transaction) => {
          const existing = await transaction.seoDiscoveryJob.findUnique({
            where: { url: normalized.url },
            select: { content_updated_at: true, status: true },
          })
          const resetState = {
            source_type: normalized.source,
            source_id: normalized.sourceId,
            content_updated_at: normalized.contentUpdatedAt,
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
            next_attempt_at: new Date(),
            attempt_count: 0,
            last_error_code: null,
            last_error_message: null,
            lease_token: null,
            lease_expires_at: null,
          }
          const hasNewerContent = existing === null
            || normalized.contentUpdatedAt.getTime() > existing.content_updated_at.getTime()

          await transaction.seoDiscoveryJob.upsert({
            where: { url: normalized.url },
            create: {
              url: normalized.url,
              ...resetState,
            },
            update: hasNewerContent ? resetState : {},
          })
        }, TRANSACTION_OPTIONS)

        return { recorded: true }
      } catch (error) {
        const canRetry = attempt < MAX_TRANSACTION_ATTEMPTS - 1
          && isRetryableTransactionConflict(error)

        if (!canRetry) throw error

        const maximumJitter = RETRY_JITTER_MAX_MS[attempt]
        const delay = computeRetryJitter(maximumJitter, dependencies.random)
        await dependencies.sleep(delay)
      }
    }

    throw new Error('SEO_DISCOVERY_TRANSACTION_RETRY_EXHAUSTED')
  } catch {
    logRecordFailure(event)
    return { recorded: false }
  }
}
