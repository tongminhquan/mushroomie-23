import { Prisma } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  recordPublicContentPublication,
  type SeoDiscoveryQueueClient,
  type SeoDiscoveryRetryDependencies,
} from '@/lib/seo-discovery/repository'
import type {
  PublicContentPublication,
} from '@/lib/seo-discovery/types'

const NOW = new Date('2026-08-10T04:30:00.000Z')
const CONTENT_VERSION = new Date('2026-08-10T04:00:00.000Z')
const OLDER_VERSION = new Date('2026-08-09T04:00:00.000Z')
const NEWER_VERSION = new Date('2026-08-11T04:00:00.000Z')

const publication: PublicContentPublication = {
  source: 'post',
  sourceId: 42,
  url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
  contentUpdatedAt: CONTENT_VERSION,
  reason: 'updated',
}

type ExistingJob = {
  content_updated_at: Date
  status: string
}

function knownRequestError(code: 'P2002' | 'P2034') {
  return new Prisma.PrismaClientKnownRequestError(
    `retryable-${code}`,
    { code, clientVersion: Prisma.prismaVersion.client },
  )
}

function createPrismaMock(existing: ExistingJob | null = null) {
  const findUnique = vi.fn().mockResolvedValue(existing)
  const upsert = vi.fn().mockResolvedValue({ id: 1 })
  const transactionClient = {
    seoDiscoveryJob: { findUnique, upsert },
  }
  let transactionActive = false
  const transaction = vi.fn(async (...args: [
    callback: (client: typeof transactionClient) => Promise<unknown>,
    options?: unknown,
  ]) => {
    const [callback] = args
    transactionActive = true
    try {
      return await callback(transactionClient)
    } finally {
      transactionActive = false
    }
  })

  return {
    client: { $transaction: transaction } as unknown as SeoDiscoveryQueueClient,
    findUnique,
    upsert,
    transaction,
    isTransactionActive: () => transactionActive,
  }
}

function createRetryDependencies(
  randomValue = 0,
  sleepImplementation: (milliseconds: number) => Promise<void> = async () => undefined,
) {
  return {
    random: vi.fn(() => randomValue),
    sleep: vi.fn(sleepImplementation),
  } satisfies SeoDiscoveryRetryDependencies
}

function expectFullReset(update: unknown, contentUpdatedAt = CONTENT_VERSION) {
  expect(update).toEqual({
    source_type: 'post',
    source_id: 42,
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

describe('recordPublicContentPublication', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('normalizes before a Serializable transaction and creates a missing URL-keyed job', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const event: PublicContentPublication = {
      ...publication,
      url: 'HTTPS://MUSHROOMIE.IO.VN:443/tin-tuc/vong tay do?utm_source=email&token=query-redaction-sentinel#preview',
    }

    await expect(recordPublicContentPublication(event, prisma.client, dependencies))
      .resolves.toEqual({ recorded: true })

    const normalizedUrl = 'https://mushroomie.io.vn/tin-tuc/vong%20tay%20do'
    expect(prisma.transaction).toHaveBeenCalledOnce()
    expect(prisma.transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 500,
        timeout: 2_000,
      },
    )
    expect(prisma.findUnique).toHaveBeenCalledOnce()
    expect(prisma.findUnique).toHaveBeenCalledWith({
      where: { url: normalizedUrl },
      select: { content_updated_at: true, status: true },
    })
    expect(prisma.upsert).toHaveBeenCalledOnce()
    expect(prisma.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { url: normalizedUrl },
      create: expect.objectContaining({
        url: normalizedUrl,
        source_type: 'post',
        source_id: 42,
        content_updated_at: CONTENT_VERSION,
        status: 'PENDING_ELIGIBILITY',
        next_attempt_at: NOW,
        attempt_count: 0,
      }),
    }))
    expect(dependencies.sleep).not.toHaveBeenCalled()
    expect(dependencies.random).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('fully resets an existing job only for strictly newer content', async () => {
    const prisma = createPrismaMock({
      content_updated_at: OLDER_VERSION,
      status: 'INDEXED',
    })

    await recordPublicContentPublication(publication, prisma.client)

    const upsert = prisma.upsert.mock.calls[0][0]
    expectFullReset(upsert.update)
  })

  it.each([
    ['equal', CONTENT_VERSION],
    ['older', NEWER_VERSION],
  ])('preserves every indexed field for an %s event', async (_label, storedVersion) => {
    const prisma = createPrismaMock({
      content_updated_at: storedVersion,
      status: 'INDEXED',
    })

    await recordPublicContentPublication(publication, prisma.client)

    expect(prisma.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: {},
    }))
  })

  it('freshly rereads and applies newer content after losing the missing-row race', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies(
      0,
      async () => expect(prisma.isTransactionActive()).toBe(false),
    )
    prisma.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ content_updated_at: OLDER_VERSION, status: 'INDEXED' })
    prisma.upsert
      .mockRejectedValueOnce(knownRequestError('P2002'))
      .mockResolvedValueOnce({ id: 1 })

    await expect(recordPublicContentPublication(publication, prisma.client, dependencies))
      .resolves.toEqual({ recorded: true })

    expect(prisma.transaction).toHaveBeenCalledTimes(2)
    expect(prisma.findUnique).toHaveBeenCalledTimes(2)
    expect(prisma.upsert).toHaveBeenCalledTimes(2)
    expect(dependencies.sleep).toHaveBeenCalledWith(0)
    expectFullReset(prisma.upsert.mock.calls[1][0].update)
  })

  it('freshly rereads and preserves newer indexed evidence when an older event loses the race', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies(
      0,
      async () => expect(prisma.isTransactionActive()).toBe(false),
    )
    const olderEvent = { ...publication, contentUpdatedAt: OLDER_VERSION }
    prisma.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ content_updated_at: NEWER_VERSION, status: 'INDEXED' })
    prisma.upsert
      .mockRejectedValueOnce(knownRequestError('P2002'))
      .mockResolvedValueOnce({ id: 1 })

    await expect(recordPublicContentPublication(olderEvent, prisma.client, dependencies))
      .resolves.toEqual({ recorded: true })

    expect(prisma.transaction).toHaveBeenCalledTimes(2)
    expect(prisma.findUnique).toHaveBeenCalledTimes(2)
    expect(prisma.upsert.mock.calls[1][0].update).toEqual({})
    expect(dependencies.sleep).toHaveBeenCalledWith(0)
  })

  it('retries an actual P2034 with a fresh read and sleeps outside the transaction', async () => {
    const prisma = createPrismaMock({
      content_updated_at: OLDER_VERSION,
      status: 'INDEXED',
    })
    const dependencies = createRetryDependencies(
      0.5,
      async () => expect(prisma.isTransactionActive()).toBe(false),
    )
    dependencies.random.mockImplementation(() => {
      expect(prisma.isTransactionActive()).toBe(false)
      return 0.5
    })
    prisma.upsert
      .mockRejectedValueOnce(knownRequestError('P2034'))
      .mockResolvedValueOnce({ id: 1 })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(recordPublicContentPublication(publication, prisma.client, dependencies))
      .resolves.toEqual({ recorded: true })

    expect(prisma.transaction).toHaveBeenCalledTimes(2)
    expect(prisma.findUnique).toHaveBeenCalledTimes(2)
    expect(dependencies.random).toHaveBeenCalledOnce()
    expect(dependencies.sleep).toHaveBeenCalledWith(5)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it.each(['P2034', 'P2002'] as const)(
    'stops after three total attempts for exhausted %s conflicts and logs once',
    async (code) => {
      const prisma = createPrismaMock({
        content_updated_at: OLDER_VERSION,
        status: 'INDEXED',
      })
      const dependencies = createRetryDependencies(
        0.999,
        async () => expect(prisma.isTransactionActive()).toBe(false),
      )
      prisma.upsert.mockRejectedValue(knownRequestError(code))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      await expect(recordPublicContentPublication(publication, prisma.client, dependencies))
        .resolves.toEqual({ recorded: false })

      expect(prisma.transaction).toHaveBeenCalledTimes(3)
      for (const [, options] of prisma.transaction.mock.calls) {
        expect(options).toEqual({
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 500,
          timeout: 2_000,
        })
      }
      expect(prisma.findUnique).toHaveBeenCalledTimes(3)
      expect(prisma.upsert).toHaveBeenCalledTimes(3)
      expect(dependencies.random).toHaveBeenCalledTimes(2)
      expect(dependencies.sleep.mock.calls.map(([delay]) => delay)).toEqual([10, 20])
      expect(consoleError).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalledWith(
        '[SEO_DISCOVERY_QUEUE_RECORD_FAILED]',
        {
          code: 'SEO_DISCOVERY_QUEUE_RECORD_FAILED',
          source_type: 'post',
          source_id: 42,
        },
      )
    },
  )

  it('does not retry a non-Prisma failure and never logs its sensitive details', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies()
    prisma.upsert.mockRejectedValue(
      new Error('repository credential-redaction-sentinel database-redaction-sentinel'),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(recordPublicContentPublication(publication, prisma.client, dependencies))
      .resolves.toEqual({ recorded: false })

    expect(prisma.transaction).toHaveBeenCalledOnce()
    expect(dependencies.sleep).not.toHaveBeenCalled()
    expect(dependencies.random).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledOnce()
    const serializedLog = JSON.stringify(consoleError.mock.calls)
    expect(serializedLog).not.toContain('credential-redaction-sentinel')
    expect(serializedLog).not.toContain('database-redaction-sentinel')
    expect(serializedLog).not.toContain('Error:')
  })

  it('does not retry an error object that only imitates a Prisma conflict code', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies()
    prisma.upsert.mockRejectedValue({
      code: 'P2034',
      message: 'lookalike-conflict',
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(recordPublicContentPublication(publication, prisma.client, dependencies))
      .resolves.toEqual({ recorded: false })

    expect(prisma.transaction).toHaveBeenCalledOnce()
    expect(dependencies.sleep).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('rejects invalid input before opening a transaction and logs safe context once', async () => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(recordPublicContentPublication({
      ...publication,
      url: 'https://mushroomie.io.vn.evil.test/tin-tuc/post?token=query-redaction-sentinel',
    }, prisma.client, dependencies)).resolves.toEqual({ recorded: false })

    expect(prisma.transaction).not.toHaveBeenCalled()
    expect(dependencies.sleep).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      '[SEO_DISCOVERY_QUEUE_RECORD_FAILED]',
      {
        code: 'SEO_DISCOVERY_QUEUE_RECORD_FAILED',
        source_type: 'post',
        source_id: 42,
      },
    )
  })

  it.each([
    ['invalid content date', { contentUpdatedAt: new Date('invalid') }],
    ['non-positive source id', { sourceId: 0 }],
  ])('rejects %s before opening a transaction', async (_label, override) => {
    const prisma = createPrismaMock()
    const dependencies = createRetryDependencies()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(recordPublicContentPublication({
      ...publication,
      ...override,
    }, prisma.client, dependencies)).resolves.toEqual({ recorded: false })

    expect(prisma.transaction).not.toHaveBeenCalled()
    expect(dependencies.sleep).not.toHaveBeenCalled()
  })

  it('still resolves false when terminal logging itself throws', async () => {
    const prisma = createPrismaMock()
    prisma.upsert.mockRejectedValue(new Error('terminal-failure'))
    vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('logger-failure')
    })

    await expect(recordPublicContentPublication(publication, prisma.client))
      .resolves.toEqual({ recorded: false })
  })
})
