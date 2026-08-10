import type { PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/prisma'

import { readFixedSitemap } from './sitemap-reader'

const NULL_LASTMOD_CONTENT_VERSION = new Date(0)
const REMOVED_FROM_SITEMAP = 'REMOVED_FROM_SITEMAP'

export type SitemapSyncClient = Pick<PrismaClient, '$transaction'>

export interface SitemapSyncDependencies {
  readSitemap(): Promise<Map<string, Date | null>>
  now(): Date
}

export interface SitemapSyncResult {
  observedCount: number
  createdCount: number
  resetCount: number
  unchangedCount: number
  removedCount: number
}

const DEFAULT_DEPENDENCIES: SitemapSyncDependencies = {
  readSitemap: readFixedSitemap,
  now: () => new Date(),
}

function pendingState(contentUpdatedAt: Date, now: Date) {
  return {
    content_updated_at: new Date(contentUpdatedAt.getTime()),
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
    next_attempt_at: new Date(now.getTime()),
    attempt_count: 0,
    last_error_code: null,
    last_error_message: null,
    lease_token: null,
    lease_expires_at: null,
  }
}

function contentVersion(lastModified: Date | null): Date {
  return lastModified === null
    ? new Date(NULL_LASTMOD_CONTENT_VERSION.getTime())
    : new Date(lastModified.getTime())
}

function nextObservationTimestamp(previous: Date, observedAt: Date): Date {
  return new Date(Math.max(
    observedAt.getTime(),
    previous.getTime() + 1,
  ))
}

function revivedState(now: Date) {
  return {
    status: 'PENDING_ELIGIBILITY',
    next_attempt_at: new Date(now.getTime()),
    attempt_count: 0,
    last_error_code: null,
    last_error_message: null,
    lease_token: null,
    lease_expires_at: null,
  }
}

export async function syncSitemapDiscoveryJobs(
  client: SitemapSyncClient = prisma,
  dependencies: SitemapSyncDependencies = DEFAULT_DEPENDENCIES,
): Promise<SitemapSyncResult> {
  // Fetch and parse completely before opening a transaction. A failed snapshot
  // must never be interpreted as an empty sitemap and mark durable jobs missing.
  const sitemapSnapshot = await dependencies.readSitemap()
  const entries = [...sitemapSnapshot.entries()].map(([url, lastModified]) => ({
    url,
    lastModified: lastModified === null
      ? null
      : new Date(lastModified.getTime()),
  }))
  const observedUrls = new Set(entries.map(({ url }) => url))
  const now = dependencies.now()

  const counts = await client.$transaction(async (transaction) => {
    const relevantJobs = await transaction.seoDiscoveryJob.findMany({
      where: {
        OR: [
          { source_type: 'sitemap_sync' },
          { url: { in: entries.map(({ url }) => url) } },
        ],
      },
      select: {
        id: true,
        url: true,
        source_type: true,
        content_updated_at: true,
        status: true,
        last_error_code: true,
        lease_token: true,
        lease_expires_at: true,
        updated_at: true,
      },
    })
    const existingJobs = new Map(relevantJobs.map((job) => [job.url, job]))
    const priorSitemapJobs = relevantJobs.filter(
      (job) => job.source_type === 'sitemap_sync',
    )
    const missingEntries = entries.filter(
      ({ url }) => !existingJobs.has(url),
    )

    // This is the durable equivalent of a reason='deploy_sync' publication:
    // missing URLs receive the same full pending/reset state, while the unique
    // URL plus skipDuplicates makes concurrent snapshots DB-idempotent.
    const created = missingEntries.length === 0
      ? { count: 0 }
      : await transaction.seoDiscoveryJob.createMany({
        data: missingEntries.map(({ url, lastModified }) => ({
          url,
          source_type: 'sitemap_sync',
          source_id: null,
          ...pendingState(contentVersion(lastModified), now),
          updated_at: new Date(now.getTime()),
        })),
        skipDuplicates: true,
      })

    let resetCount = 0
    for (const { url, lastModified } of entries) {
      const existing = existingJobs.get(url)
      const hasNewerLastmod = lastModified !== null
        && (!existing || lastModified.getTime() > existing.content_updated_at.getTime())

      if (existing?.source_type === 'sitemap_sync') {
        const isRemovedReappearance = existing.status === 'SKIPPED'
          && existing.last_error_code === REMOVED_FROM_SITEMAP
        const observationUpdatedAt = nextObservationTimestamp(existing.updated_at, now)
        const observed = await transaction.seoDiscoveryJob.updateMany({
          where: {
            id: existing.id,
            source_type: 'sitemap_sync',
            updated_at: existing.updated_at,
            ...(hasNewerLastmod && lastModified !== null
              ? { content_updated_at: { lt: lastModified } }
              : {}),
          },
          data: {
            ...(hasNewerLastmod && lastModified !== null
              ? pendingState(lastModified, now)
              : isRemovedReappearance
                ? revivedState(now)
                : {}),
            // Presence bookkeeping is also the CAS generation used by a stale
            // missing snapshot. It must not clear inspection evidence when the
            // content version is unchanged.
            updated_at: observationUpdatedAt,
          },
        })

        if (hasNewerLastmod || isRemovedReappearance) {
          resetCount += observed.count
        }
        continue
      }

      if (lastModified === null) continue
      if (
        existing
        && lastModified.getTime() <= existing.content_updated_at.getTime()
      ) continue

      const reset = await transaction.seoDiscoveryJob.updateMany({
        where: {
          url,
          content_updated_at: { lt: lastModified },
        },
        data: pendingState(lastModified, now),
      })
      resetCount += reset.count
    }

    let removedCount = 0
    for (const job of priorSitemapJobs) {
      if (observedUrls.has(job.url)) continue

      const alreadyRemoved = job.status === 'SKIPPED'
        && job.last_error_code === REMOVED_FROM_SITEMAP
        && job.lease_token === null
        && job.lease_expires_at === null
      if (alreadyRemoved) continue

      const removed = await transaction.seoDiscoveryJob.updateMany({
        where: {
          id: job.id,
          source_type: 'sitemap_sync',
          updated_at: job.updated_at,
          OR: [
            { status: { not: 'SKIPPED' } },
            { last_error_code: null },
            { last_error_code: { not: REMOVED_FROM_SITEMAP } },
            { lease_token: { not: null } },
            { lease_expires_at: { not: null } },
          ],
        },
        data: {
          status: 'SKIPPED',
          last_error_code: REMOVED_FROM_SITEMAP,
          last_error_message: null,
          lease_token: null,
          lease_expires_at: null,
          updated_at: nextObservationTimestamp(job.updated_at, now),
        },
      })
      removedCount += removed.count
    }

    return {
      createdCount: created.count,
      resetCount,
      removedCount,
    }
  })

  return {
    observedCount: entries.length,
    ...counts,
    unchangedCount: Math.max(
      0,
      entries.length - counts.createdCount - counts.resetCount,
    ),
  }
}
