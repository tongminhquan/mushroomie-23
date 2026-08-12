import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

type BackfillModule = {
  parseSeoDiscoveryBackfillArguments(arguments_: readonly string[]): { apply: boolean }
  runSeoDiscoveryBackfill(options: Record<string, unknown>): Promise<{
    scanned: number
    wouldCreate: number
    wouldReset: number
    unchanged: number
    errors: number
  }>
  runSeoDiscoveryBackfillCli(
    arguments_: readonly string[],
    options: Record<string, unknown>,
    writeOutput: (output: string) => void,
  ): Promise<unknown>
}

async function loadBackfillModule(): Promise<BackfillModule | null> {
  try {
    return await import(new URL('../scripts/seo-discovery-backfill.ts', import.meta.url).href) as BackfillModule
  } catch {
    return null
  }
}

test('defaults to a no-write dry-run over only public posts and products', async () => {
  const backfill = await loadBackfillModule()
  assert.ok(backfill, 'the SEO discovery backfill runner is not implemented')

  const postQueries: unknown[] = []
  const productQueries: unknown[] = []
  const jobQueries: unknown[] = []
  const recorded: unknown[] = []
  let postPage = 0
  let productPage = 0

  const client = {
    post: {
      findMany: async (query: unknown) => {
        postQueries.push(query)
        postPage += 1
        return postPage === 1
          ? [
              {
                id: 1,
                slug: 'bai-viet-moi',
                updated_at: new Date('2026-08-10T00:00:00.000Z'),
              },
              {
                id: 2,
                slug: 'bai-viet-cap-nhat',
                updated_at: new Date('2026-08-11T00:00:00.000Z'),
              },
            ]
          : []
      },
    },
    product: {
      findMany: async (query: unknown) => {
        productQueries.push(query)
        productPage += 1
        return productPage === 1
          ? [{
              id: 3,
              slug: 'vong-tay-khong-doi',
              updated_at: new Date('2026-08-09T00:00:00.000Z'),
            }]
          : []
      },
    },
    seoDiscoveryJob: {
      findMany: async (query: unknown) => {
        jobQueries.push(query)
        return [
          {
            url: 'https://mushroomie.io.vn/tin-tuc/bai-viet-cap-nhat',
            content_updated_at: new Date('2026-08-10T00:00:00.000Z'),
          },
          {
            url: 'https://mushroomie.io.vn/san-pham/vong-tay-khong-doi',
            content_updated_at: new Date('2026-08-09T00:00:00.000Z'),
          },
        ]
      },
    },
  }

  const summary = await backfill.runSeoDiscoveryBackfill({
    client,
    recordPublication: async (event: unknown) => {
      recorded.push(event)
      return { recorded: true }
    },
  })

  assert.deepEqual(summary, {
    scanned: 3,
    wouldCreate: 1,
    wouldReset: 1,
    unchanged: 1,
    errors: 0,
  })
  assert.equal(recorded.length, 0, 'dry-run must not call the durable repository')

  assert.deepEqual(postQueries[0], {
    where: { status: 'published', deleted_at: null },
    select: { id: true, slug: true, updated_at: true },
    orderBy: { id: 'asc' },
    take: 100,
  })
  assert.deepEqual(productQueries[0], {
    where: { status: 'active' },
    select: { id: true, slug: true, updated_at: true },
    orderBy: { id: 'asc' },
    take: 100,
  })

  const queriedUrls = jobQueries.flatMap((query) => (
    (query as { where?: { url?: { in?: string[] } } }).where?.url?.in ?? []
  ))
  assert.deepEqual(queriedUrls.sort(), [
    'https://mushroomie.io.vn/san-pham/vong-tay-khong-doi',
    'https://mushroomie.io.vn/tin-tuc/bai-viet-cap-nhat',
    'https://mushroomie.io.vn/tin-tuc/bai-viet-moi',
  ])
})

test('explicit apply records each public row through the shared publication repository contract', async () => {
  const backfill = await loadBackfillModule()
  assert.ok(backfill, 'the SEO discovery backfill runner is not implemented')

  const recorded: unknown[] = []
  let postPage = 0
  const client = {
    post: {
      findMany: async () => {
        postPage += 1
        return postPage === 1
          ? [{
              id: 41,
              slug: 'cach-phoi-vong-tay',
              updated_at: new Date('2026-08-11T04:30:00.000Z'),
            }]
          : []
      },
    },
    product: { findMany: async () => [] },
    seoDiscoveryJob: { findMany: async () => [] },
  }

  const summary = await backfill.runSeoDiscoveryBackfill({
    apply: true,
    client,
    recordPublication: async (event: unknown) => {
      recorded.push(event)
      return { recorded: true }
    },
  })

  assert.deepEqual(summary, {
    scanned: 1,
    wouldCreate: 1,
    wouldReset: 0,
    unchanged: 0,
    errors: 0,
  })
  assert.deepEqual(recorded, [{
    source: 'post',
    sourceId: 41,
    url: 'https://mushroomie.io.vn/tin-tuc/cach-phoi-vong-tay',
    contentUpdatedAt: new Date('2026-08-11T04:30:00.000Z'),
    reason: 'deploy_sync',
  }])
})

test('paginates public content in stable batches of exactly 100 rows', async () => {
  const backfill = await loadBackfillModule()
  assert.ok(backfill, 'the SEO discovery backfill runner is not implemented')

  const postQueries: unknown[] = []
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    slug: `bai-viet-${index + 1}`,
    updated_at: new Date('2026-08-11T00:00:00.000Z'),
  }))

  const client = {
    post: {
      findMany: async (query: unknown) => {
        postQueries.push(query)
        if (postQueries.length === 1) return firstPage
        if (postQueries.length === 2) {
          return [{
            id: 101,
            slug: 'bai-viet-101',
            updated_at: new Date('2026-08-11T00:00:00.000Z'),
          }]
        }
        return []
      },
    },
    product: { findMany: async () => [] },
    seoDiscoveryJob: { findMany: async () => [] },
  }

  const summary = await backfill.runSeoDiscoveryBackfill({ client })

  assert.equal(summary.scanned, 101)
  assert.equal(summary.wouldCreate, 101)
  assert.deepEqual(postQueries[0], {
    where: { status: 'published', deleted_at: null },
    select: { id: true, slug: true, updated_at: true },
    orderBy: { id: 'asc' },
    take: 100,
  })
  assert.deepEqual(postQueries[1], {
    where: { status: 'published', deleted_at: null },
    select: { id: true, slug: true, updated_at: true },
    orderBy: { id: 'asc' },
    take: 100,
    cursor: { id: 100 },
    skip: 1,
  })
})

test('CLI requires the exact apply flag and delegates writes to the shared repository', async () => {
  const backfill = await loadBackfillModule()
  assert.ok(backfill, 'the SEO discovery backfill runner is not implemented')
  assert.equal(
    typeof backfill.parseSeoDiscoveryBackfillArguments,
    'function',
    'the backfill CLI argument parser is not implemented',
  )

  assert.deepEqual(backfill.parseSeoDiscoveryBackfillArguments([]), { apply: false })
  assert.deepEqual(backfill.parseSeoDiscoveryBackfillArguments(['--apply']), { apply: true })
  assert.throws(
    () => backfill.parseSeoDiscoveryBackfillArguments(['--aply']),
    /SEO_DISCOVERY_BACKFILL_INVALID_ARGUMENTS/,
  )
  assert.throws(
    () => backfill.parseSeoDiscoveryBackfillArguments(['--apply', '--apply']),
    /SEO_DISCOVERY_BACKFILL_INVALID_ARGUMENTS/,
  )

  const source = await readFile(
    new URL('../scripts/seo-discovery-backfill.ts', import.meta.url),
    'utf8',
  )
  assert.match(
    source,
    /recordPublicContentPublication/,
    'apply mode must reuse the live idempotent queue repository',
  )
  assert.doesNotMatch(source, /seoDiscoveryJob\.(?:delete|deleteMany)\s*\(/)
})

test('CLI prints its bounded summary but exits nonzero when any row fails', async () => {
  const backfill = await loadBackfillModule()
  assert.ok(backfill, 'the SEO discovery backfill runner is not implemented')
  assert.equal(
    typeof backfill.runSeoDiscoveryBackfillCli,
    'function',
    'the backfill CLI contract is not independently testable',
  )

  const output: string[] = []
  let postPage = 0
  const client = {
    post: {
      findMany: async () => {
        postPage += 1
        return postPage === 1
          ? [{
              id: 73,
              slug: 'bai-viet-that-bai',
              updated_at: new Date('2026-08-11T05:00:00.000Z'),
            }]
          : []
      },
    },
    product: { findMany: async () => [] },
    seoDiscoveryJob: { findMany: async () => [] },
  }

  await assert.rejects(
    () => backfill.runSeoDiscoveryBackfillCli(
      ['--apply'],
      {
        client,
        recordPublication: async () => ({ recorded: false }),
      },
      (value) => output.push(value),
    ),
    /SEO_DISCOVERY_BACKFILL_PARTIAL_FAILURE/,
  )
  assert.equal(output.length, 1)
  assert.deepEqual(JSON.parse(output[0]!), {
    mode: 'apply',
    scanned: 1,
    wouldCreate: 1,
    wouldReset: 0,
    unchanged: 0,
    errors: 1,
  })
})
