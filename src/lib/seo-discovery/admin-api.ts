import 'server-only'

import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { readSeoDiscoveryConfig } from './config'
import {
  GscClientError,
  type ConnectionStatus,
  type SitemapStatus,
} from './gsc-client'
import { createGoogleSearchConsoleClient } from './google-gsc-client'
import { FIXED_SITEMAP_URL } from './sitemap-reader'

const MAX_PAGE_SIZE = 100
const MAX_PAGE = 1_000_000
const DEFAULT_PAGE_SIZE = 25
const MAX_SEARCH_LENGTH = 128
const MAX_RETRY_IDS = 100
const MAX_DATABASE_ID = 2_147_483_647
const CONFIGURATION_RECOVERY_LIMIT = 10
const ADMIN_READ_TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  maxWait: 500,
  timeout: 2_000,
} as const

const DISCOVERY_STATUSES = [
  'PENDING_ELIGIBILITY',
  'ELIGIBLE',
  'INSPECTION_SCHEDULED',
  'INDEXED',
  'NOT_INDEXED',
  'RETRY',
  'SKIPPED',
  'CONFIGURATION_REQUIRED',
  'ERROR',
] as const

const DISCOVERY_SOURCES = ['post', 'product', 'sitemap_sync'] as const

const readFilterSchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  status: z.enum(DISCOVERY_STATUSES).optional(),
  source: z.enum(DISCOVERY_SOURCES).optional(),
  search: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
}).strict()

const retryIdsSchema = z.array(
  z.number().int().positive().max(MAX_DATABASE_ID),
)
  .min(1)
  .max(MAX_RETRY_IDS)
  .refine((ids) => new Set(ids).size === ids.length)

export const adminActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('retry'), ids: retryIdsSchema }).strict(),
  z.object({ action: z.literal('sync_sitemap') }).strict(),
  z.object({ action: z.literal('test_connection') }).strict(),
  z.object({ action: z.literal('submit_sitemap') }).strict(),
])

export type SeoDiscoveryAdminAction = z.infer<typeof adminActionSchema>

export function isSeoDiscoveryAdminRole(
  role: unknown,
): role is 'admin' | 'super_admin' {
  return role === 'admin' || role === 'super_admin'
}

export interface SeoDiscoveryReadFilters {
  page: number
  pageSize: number
  status?: typeof DISCOVERY_STATUSES[number]
  source?: typeof DISCOVERY_SOURCES[number]
  search?: string
}

const JOB_SELECT = {
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
  lease_token: true,
  lease_expires_at: true,
  created_at: true,
  updated_at: true,
} as const satisfies Prisma.SeoDiscoveryJobSelect

const ACTION_SNAPSHOT_SELECT = {
  id: true,
  status: true,
  content_updated_at: true,
  lease_token: true,
  lease_expires_at: true,
  updated_at: true,
} as const satisfies Prisma.SeoDiscoveryJobSelect

type JobRow = Prisma.SeoDiscoveryJobGetPayload<{ select: typeof JOB_SELECT }>
type ActionSnapshot = Prisma.SeoDiscoveryJobGetPayload<{
  select: typeof ACTION_SNAPSHOT_SELECT
}>

export type AdminConnectionState =
  | ConnectionStatus
  | { state: 'configuration_required'; code: string }
  | { state: 'error'; code: string }

export interface SeoDiscoveryAdminOverview {
  summary: {
    total: number
    pending: number
    indexed: number
    notIndexed: number
    retrying: number
    skipped: number
    errors: number
    configurationRequired: number
  }
  connection: AdminConnectionState
  sitemap: {
    url: string
    registered: boolean
    lastSubmitted: string | null
    lastDownloaded: string | null
    pending: boolean | null
    warnings: number | null
    errors: number | null
  }
  jobs: Array<{
    id: number
    url: string | null
    sourceType: string
    sourceId: number | null
    contentUpdatedAt: string
    status: string
    eligibilityStatus: string | null
    httpStatus: number | null
    declaredCanonical: string | null
    robotsIndexable: boolean | null
    gscVerdict: string | null
    coverageState: string | null
    pageFetchState: string | null
    googleCanonical: string | null
    lastCrawlAt: string | null
    lastInspectedAt: string | null
    nextAttemptAt: string
    attemptCount: number
    lastErrorCode: string | null
    createdAt: string
    updatedAt: string
    canRetry: boolean
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

function parseSearchParameters(parameters: URLSearchParams): Record<string, string> | null {
  const allowedKeys = new Set(['page', 'pageSize', 'status', 'source', 'search'])
  const raw: Record<string, string> = {}

  for (const key of new Set(parameters.keys())) {
    if (!allowedKeys.has(key)) return null
    const values = parameters.getAll(key)
    if (values.length !== 1) return null
    raw[key] = values[0]
  }

  return raw
}

export function parseSeoDiscoveryReadFilters(
  parameters: URLSearchParams,
): { success: true; data: SeoDiscoveryReadFilters } | { success: false } {
  const raw = parseSearchParameters(parameters)
  if (raw === null) return { success: false }

  const parsed = readFilterSchema.safeParse(raw)
  if (!parsed.success) return { success: false }

  const search = parsed.data.search?.trim()
  return {
    success: true,
    data: {
      ...parsed.data,
      search: search ? search : undefined,
    },
  }
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength) || null
}

function safePublicUrl(value: unknown): string | null {
  const bounded = boundedText(value, 512)
  if (bounded === null) return null

  try {
    const parsed = new URL(bounded)
    if (
      parsed.protocol !== 'https:'
      || parsed.origin !== 'https://mushroomie.io.vn'
      || parsed.username
      || parsed.password
    ) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function safeEvidenceUrl(value: unknown): string | null {
  const bounded = boundedText(value, 512)
  if (bounded === null) return null

  try {
    const parsed = new URL(bounded)
    if (
      !['http:', 'https:'].includes(parsed.protocol)
      || parsed.username
      || parsed.password
    ) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function isoDate(value: Date | null): string | null {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return null
  return value.toISOString()
}

function hasActiveLease(job: Pick<ActionSnapshot, 'lease_token' | 'lease_expires_at'>, now: Date): boolean {
  if (job.lease_token === null) return false
  return job.lease_expires_at === null || job.lease_expires_at.getTime() > now.getTime()
}

function toJobDto(job: JobRow, now: Date): SeoDiscoveryAdminOverview['jobs'][number] {
  return {
    id: job.id,
    url: safePublicUrl(job.url),
    sourceType: boundedText(job.source_type, 32) ?? 'unknown',
    sourceId: Number.isSafeInteger(job.source_id) ? job.source_id : null,
    contentUpdatedAt: isoDate(job.content_updated_at) ?? new Date(0).toISOString(),
    status: boundedText(job.status, 40) ?? 'ERROR',
    eligibilityStatus: boundedText(job.eligibility_status, 40),
    httpStatus: Number.isSafeInteger(job.http_status) ? job.http_status : null,
    declaredCanonical: safeEvidenceUrl(job.declared_canonical),
    robotsIndexable: typeof job.robots_indexable === 'boolean' ? job.robots_indexable : null,
    gscVerdict: boundedText(job.gsc_verdict, 80),
    coverageState: boundedText(job.coverage_state, 160),
    pageFetchState: boundedText(job.page_fetch_state, 80),
    googleCanonical: safeEvidenceUrl(job.google_canonical),
    lastCrawlAt: isoDate(job.last_crawl_at),
    lastInspectedAt: isoDate(job.last_inspected_at),
    nextAttemptAt: isoDate(job.next_attempt_at) ?? new Date(0).toISOString(),
    attemptCount: Number.isSafeInteger(job.attempt_count)
      ? Math.max(0, job.attempt_count)
      : 0,
    lastErrorCode: boundedText(job.last_error_code, 80),
    createdAt: isoDate(job.created_at) ?? new Date(0).toISOString(),
    updatedAt: isoDate(job.updated_at) ?? new Date(0).toISOString(),
    canRetry: !hasActiveLease(job, now),
  }
}

function configurationCode(error: GscClientError): boolean {
  return error.configurationRequired || [
    'GSC_CONFIGURATION_REQUIRED',
    'GSC_AUTHENTICATION_FAILED',
    'GSC_UNAUTHORIZED',
    'GSC_FORBIDDEN',
    'GSC_NOT_FOUND',
  ].includes(error.code)
}

function mapConnectionFailure(error: unknown): AdminConnectionState {
  if (error instanceof GscClientError) {
    if (error.code === 'GSC_DISABLED') {
      return { state: 'disabled', code: 'GSC_DISABLED' }
    }
    if (configurationCode(error)) {
      return { state: 'configuration_required', code: error.code }
    }
    return { state: 'error', code: error.code }
  }

  return { state: 'error', code: 'GSC_STATUS_UNAVAILABLE' }
}

function emptySitemapState(): SeoDiscoveryAdminOverview['sitemap'] {
  return {
    url: FIXED_SITEMAP_URL,
    registered: false,
    lastSubmitted: null,
    lastDownloaded: null,
    pending: null,
    warnings: null,
    errors: null,
  }
}

function fixedSitemapState(sitemaps: SitemapStatus[]): SeoDiscoveryAdminOverview['sitemap'] {
  const sitemap = sitemaps.find((entry) => entry.url === FIXED_SITEMAP_URL)
  if (!sitemap) return emptySitemapState()

  return {
    url: FIXED_SITEMAP_URL,
    registered: true,
    lastSubmitted: boundedText(sitemap.lastSubmitted, 64),
    lastDownloaded: boundedText(sitemap.lastDownloaded, 64),
    pending: sitemap.pending === true,
    warnings: Number.isSafeInteger(sitemap.warnings) ? sitemap.warnings : null,
    errors: Number.isSafeInteger(sitemap.errors) ? sitemap.errors : null,
  }
}

async function readGoogleOverview(): Promise<{
  connection: AdminConnectionState
  sitemap: SeoDiscoveryAdminOverview['sitemap']
}> {
  const config = readSeoDiscoveryConfig(process.env)
  if (!config.discoveryEnabled || !config.gscEnabled) {
    return {
      connection: { state: 'disabled', code: 'GSC_DISABLED' },
      sitemap: emptySitemapState(),
    }
  }

  try {
    const sitemaps = await createGoogleSearchConsoleClient().listSitemaps()
    return {
      connection: {
        state: 'connected',
        code: 'GSC_CONNECTED',
        property: config.property,
      },
      sitemap: fixedSitemapState(sitemaps),
    }
  } catch (error) {
    return {
      connection: mapConnectionFailure(error),
      sitemap: emptySitemapState(),
    }
  }
}

function countFor(
  groups: Array<{ status: string; _count: { _all: number } }>,
  status: string,
): number {
  const count = groups.find((group) => group.status === status)?._count._all
  return Number.isSafeInteger(count) ? Math.max(0, count ?? 0) : 0
}

export async function readSeoDiscoveryAdminOverview(
  filters: SeoDiscoveryReadFilters,
  now = new Date(),
): Promise<SeoDiscoveryAdminOverview> {
  const where: Prisma.SeoDiscoveryJobWhereInput = {}
  if (filters.status) where.status = filters.status
  if (filters.source) where.source_type = filters.source
  if (filters.search) {
    where.OR = [
      { url: { contains: filters.search } },
      { source_type: { contains: filters.search } },
    ]
  }

  const database = await prisma.$transaction(async (transaction) => {
    const groups = await transaction.seoDiscoveryJob.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const total = groups.reduce((sum, group) => (
      sum + (Number.isSafeInteger(group._count._all) ? Math.max(0, group._count._all) : 0)
    ), 0)
    const filteredTotal = await transaction.seoDiscoveryJob.count({ where })
    const totalPages = Math.max(1, Math.ceil(filteredTotal / filters.pageSize))
    const effectivePage = Math.min(filters.page, totalPages)
    const jobs = await transaction.seoDiscoveryJob.findMany({
      where,
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
      skip: (effectivePage - 1) * filters.pageSize,
      take: filters.pageSize,
      select: JOB_SELECT,
    })

    return {
      effectivePage,
      filteredTotal,
      groups,
      jobs,
      total,
      totalPages,
    }
  }, ADMIN_READ_TRANSACTION_OPTIONS)
  const google = await readGoogleOverview()

  return {
    summary: {
      total: database.total,
      pending: countFor(database.groups, 'PENDING_ELIGIBILITY')
        + countFor(database.groups, 'ELIGIBLE')
        + countFor(database.groups, 'INSPECTION_SCHEDULED'),
      indexed: countFor(database.groups, 'INDEXED'),
      notIndexed: countFor(database.groups, 'NOT_INDEXED'),
      retrying: countFor(database.groups, 'RETRY'),
      skipped: countFor(database.groups, 'SKIPPED'),
      errors: countFor(database.groups, 'ERROR'),
      configurationRequired: countFor(database.groups, 'CONFIGURATION_REQUIRED'),
    },
    connection: google.connection,
    sitemap: google.sitemap,
    jobs: database.jobs.map((job) => toJobDto(job, now)),
    pagination: {
      page: database.effectivePage,
      pageSize: filters.pageSize,
      total: database.filteredTotal,
      totalPages: database.totalPages,
    },
  }
}

function exactSnapshotWhere(snapshot: ActionSnapshot) {
  return {
    id: snapshot.id,
    status: snapshot.status,
    content_updated_at: new Date(snapshot.content_updated_at.getTime()),
    updated_at: new Date(snapshot.updated_at.getTime()),
    lease_token: snapshot.lease_token,
    lease_expires_at: snapshot.lease_expires_at === null
      ? null
      : new Date(snapshot.lease_expires_at.getTime()),
  }
}

const retryState = (now: Date) => ({
  status: 'RETRY',
  next_attempt_at: new Date(now.getTime()),
  attempt_count: 0,
  last_error_code: null,
  last_error_message: null,
  lease_token: null,
  lease_expires_at: null,
})

const recoveredState = (now: Date) => ({
  ...retryState(now),
  status: 'PENDING_ELIGIBILITY',
})

export async function retrySeoDiscoveryJobs(
  ids: number[],
  now = new Date(),
): Promise<{ requestedCount: number; retriedCount: number; skippedCount: number }> {
  const snapshots = await prisma.seoDiscoveryJob.findMany({
    where: { id: { in: ids } },
    orderBy: [{ id: 'asc' }],
    take: MAX_RETRY_IDS,
    select: ACTION_SNAPSHOT_SELECT,
  })
  const available = snapshots.filter((job) => !hasActiveLease(job, now))
  const updated = available.length === 0
    ? { count: 0 }
    : await prisma.seoDiscoveryJob.updateMany({
      where: { OR: available.map(exactSnapshotWhere) },
      data: retryState(now),
    })
  const retriedCount = Math.min(available.length, Math.max(0, updated.count))

  return {
    requestedCount: ids.length,
    retriedCount,
    skippedCount: Math.max(0, ids.length - retriedCount),
  }
}

export async function recoverConfigurationRequiredJobs(
  now = new Date(),
): Promise<{ recoveredCount: number; hasMore: boolean }> {
  const snapshots = await prisma.seoDiscoveryJob.findMany({
    where: {
      status: 'CONFIGURATION_REQUIRED',
      OR: [
        { lease_token: null },
        { lease_expires_at: { lte: now } },
      ],
    },
    orderBy: [{ id: 'asc' }],
    take: CONFIGURATION_RECOVERY_LIMIT + 1,
    select: ACTION_SNAPSHOT_SELECT,
  })
  const recoverySlice = snapshots
    .filter((job) => !hasActiveLease(job, now))
    .slice(0, CONFIGURATION_RECOVERY_LIMIT)
  const updated = recoverySlice.length === 0
    ? { count: 0 }
    : await prisma.seoDiscoveryJob.updateMany({
      where: {
        status: 'CONFIGURATION_REQUIRED',
        OR: recoverySlice.map(exactSnapshotWhere),
      },
      data: recoveredState(now),
    })

  return {
    recoveredCount: Math.min(recoverySlice.length, Math.max(0, updated.count)),
    hasMore: snapshots.length > CONFIGURATION_RECOVERY_LIMIT,
  }
}

export function stableAdminActionError(error: unknown): {
  code: string
  status: number
} {
  if (error instanceof GscClientError) {
    if (error.code === 'GSC_RATE_LIMITED') return { code: error.code, status: 429 }
    if (error.code === 'GSC_REQUEST_TIMEOUT') return { code: error.code, status: 504 }
    return { code: error.code, status: 502 }
  }

  return { code: 'SEO_DISCOVERY_ACTION_FAILED', status: 500 }
}
