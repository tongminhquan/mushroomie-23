#!/usr/bin/env tsx

import { pathToFileURL } from 'node:url'

import { prisma } from '../src/lib/prisma'
import { recordPublicContentPublication } from '../src/lib/seo-discovery/repository'
import { buildPublicContentUrl } from '../src/lib/seo-discovery/urls'
import type { PublicContentPublication } from '../src/lib/seo-discovery/types'

export const SEO_DISCOVERY_BACKFILL_BATCH_SIZE = 100

type BackfillSource = Extract<PublicContentPublication['source'], 'post' | 'product'>

interface BackfillContentRow {
  id: number
  slug: string
  updated_at: Date
}

interface BackfillJobRow {
  url: string
  content_updated_at: Date
}

interface BackfillFindMany<Model> {
  findMany(query: unknown): Promise<Model[]>
}

export interface SeoDiscoveryBackfillClient {
  post: BackfillFindMany<BackfillContentRow>
  product: BackfillFindMany<BackfillContentRow>
  seoDiscoveryJob: BackfillFindMany<BackfillJobRow>
}

export interface SeoDiscoveryBackfillSummary {
  scanned: number
  wouldCreate: number
  wouldReset: number
  unchanged: number
  errors: number
}

export interface RunSeoDiscoveryBackfillOptions {
  apply?: boolean
  client: SeoDiscoveryBackfillClient
  recordPublication?: (
    event: PublicContentPublication,
  ) => Promise<{ recorded: boolean }>
}

const EMPTY_SUMMARY: SeoDiscoveryBackfillSummary = {
  scanned: 0,
  wouldCreate: 0,
  wouldReset: 0,
  unchanged: 0,
  errors: 0,
}

export function parseSeoDiscoveryBackfillArguments(
  arguments_: readonly string[],
): { apply: boolean } {
  if (arguments_.length === 0) return { apply: false }
  if (arguments_.length === 1 && arguments_[0] === '--apply') return { apply: true }

  throw new Error('SEO_DISCOVERY_BACKFILL_INVALID_ARGUMENTS')
}

function contentQuery(source: BackfillSource, cursor?: number) {
  return {
    where: source === 'post'
      ? { status: 'published', deleted_at: null }
      : { status: 'active' },
    select: { id: true, slug: true, updated_at: true },
    orderBy: { id: 'asc' },
    take: SEO_DISCOVERY_BACKFILL_BATCH_SIZE,
    ...(cursor === undefined ? {} : { cursor: { id: cursor }, skip: 1 }),
  }
}

async function inspectOneSource(
  source: BackfillSource,
  client: SeoDiscoveryBackfillClient,
  summary: SeoDiscoveryBackfillSummary,
  apply: boolean,
  recordPublication?: RunSeoDiscoveryBackfillOptions['recordPublication'],
): Promise<void> {
  let cursor: number | undefined

  while (true) {
    const rows = await client[source].findMany(contentQuery(source, cursor))
    if (rows.length === 0) return
    summary.scanned += rows.length

    const events: PublicContentPublication[] = []
    for (const row of rows) {
      try {
        events.push({
          source,
          sourceId: row.id,
          url: buildPublicContentUrl(source, row.slug),
          contentUpdatedAt: row.updated_at,
          reason: 'deploy_sync',
        })
      } catch {
        summary.errors += 1
      }
    }

    if (events.length > 0) {
      const existingJobs = await client.seoDiscoveryJob.findMany({
        where: { url: { in: events.map((event) => event.url) } },
        select: { url: true, content_updated_at: true },
      })
      const existingByUrl = new Map(existingJobs.map((job) => [job.url, job]))

      for (const event of events) {
        const existing = existingByUrl.get(event.url)
        if (!existing) {
          summary.wouldCreate += 1
        } else if (event.contentUpdatedAt.getTime() > existing.content_updated_at.getTime()) {
          summary.wouldReset += 1
        } else {
          summary.unchanged += 1
        }

        if (apply) {
          try {
            const result = await recordPublication!(event)
            if (!result.recorded) summary.errors += 1
          } catch {
            summary.errors += 1
          }
        }
      }
    }

    if (rows.length < SEO_DISCOVERY_BACKFILL_BATCH_SIZE) return
    cursor = rows[rows.length - 1]!.id
  }
}

export async function runSeoDiscoveryBackfill({
  apply = false,
  client,
  recordPublication,
}: RunSeoDiscoveryBackfillOptions): Promise<SeoDiscoveryBackfillSummary> {
  if (apply && !recordPublication) {
    throw new Error('SEO_DISCOVERY_BACKFILL_RECORDER_REQUIRED')
  }

  const summary = { ...EMPTY_SUMMARY }
  await inspectOneSource('post', client, summary, apply, recordPublication)
  await inspectOneSource('product', client, summary, apply, recordPublication)
  return summary
}

export async function runSeoDiscoveryBackfillCli(
  arguments_: readonly string[],
  options: Omit<RunSeoDiscoveryBackfillOptions, 'apply'>,
  writeOutput: (output: string) => void = (output) => process.stdout.write(output),
): Promise<SeoDiscoveryBackfillSummary> {
  const { apply } = parseSeoDiscoveryBackfillArguments(arguments_)
  const summary = await runSeoDiscoveryBackfill({
    apply,
    ...options,
  })

  writeOutput(`${JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    ...summary,
  }, null, 2)}\n`)

  if (summary.errors > 0) {
    throw new Error('SEO_DISCOVERY_BACKFILL_PARTIAL_FAILURE')
  }
  return summary
}

async function main(arguments_: readonly string[]): Promise<void> {
  await runSeoDiscoveryBackfillCli(arguments_, {
    client: prisma as unknown as SeoDiscoveryBackfillClient,
    recordPublication: recordPublicContentPublication,
  })
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main(process.argv.slice(2))
    .catch((error) => {
      const code = error instanceof Error && error.message.startsWith('SEO_DISCOVERY_')
        ? error.message
        : 'SEO_DISCOVERY_BACKFILL_FAILED'
      process.stderr.write(`${code}\n`)
      process.exitCode = 1
    })
    .finally(async () => {
      try {
        await prisma.$disconnect()
      } catch {
        process.exitCode = 1
      }
    })
}
