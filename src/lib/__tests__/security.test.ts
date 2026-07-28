import { afterEach, describe, expect, it, vi } from 'vitest'

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  deleteMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: prismaMocks.transaction,
    rateLimitBucket: { deleteMany: prismaMocks.deleteMany },
  },
}))

import {
  checkRateLimit,
  getApplicationSecret,
  getClientIp,
  hashSensitiveValue,
  safeJsonLd,
  timingSafeStringEqual,
} from '@/lib/security'

describe('security helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requires a sufficiently long application secret', () => {
    vi.stubEnv('AUTH_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', 'too-short')
    expect(() => getApplicationSecret()).toThrow(/at least 32 characters/)

    vi.stubEnv('AUTH_SECRET', 'a'.repeat(32))
    expect(getApplicationSecret()).toBe('a'.repeat(32))
  })

  it('uses the first forwarded address, then real IP, then a safe unknown fallback', () => {
    expect(getClientIp(new Request('https://example.test', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }))).toBe('1.2.3.4')
    expect(getClientIp(new Request('https://example.test', { headers: { 'x-real-ip': '9.8.7.6' } }))).toBe('9.8.7.6')
    expect(getClientIp(new Request('https://example.test'))).toBe('unknown')
  })

  it('limits repeated requests per scope and resets after the configured window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T00:00:00Z'))
    const buckets = new Map<string, { count: number; reset_at: Date }>()
    prismaMocks.transaction.mockImplementation(async (callback) => callback({
      rateLimitBucket: {
        findUnique: vi.fn(({ where: { key } }) => buckets.get(key) ?? null),
        upsert: vi.fn(({ where: { key }, create, update }) => {
          const next = buckets.has(key) ? update : create
          const bucket = { count: next.count, reset_at: next.reset_at }
          buckets.set(key, bucket)
          return bucket
        }),
        update: vi.fn(({ where: { key } }) => {
          const current = buckets.get(key)
          if (!current) throw new Error('Missing test rate-limit bucket')
          const bucket = { ...current, count: current.count + 1 }
          buckets.set(key, bucket)
          return bucket
        }),
      },
    }))
    const request = new Request('https://example.test', { headers: { 'x-real-ip': '203.0.113.9' } })
    const scope = `test-${crypto.randomUUID()}`

    await expect(checkRateLimit(request, scope, { limit: 2, windowMs: 10_000 }))
      .resolves.toMatchObject({ allowed: true, remaining: 1 })
    await expect(checkRateLimit(request, scope, { limit: 2, windowMs: 10_000 }))
      .resolves.toMatchObject({ allowed: true, remaining: 0 })
    await expect(checkRateLimit(request, scope, { limit: 2, windowMs: 10_000 }))
      .resolves.toMatchObject({ allowed: false, retryAfter: 10 })

    vi.advanceTimersByTime(10_001)
    await expect(checkRateLimit(request, scope, { limit: 2, windowMs: 10_000 }))
      .resolves.toMatchObject({ allowed: true, remaining: 1 })
  })

  it('escapes JSON-LD control characters and hashes sensitive values', () => {
    const json = safeJsonLd({ value: '</script>&\u2028' })
    expect(json).not.toContain('</script>')
    expect(json).toContain('\\u003c')
    expect(hashSensitiveValue('secret')).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashSensitiveValue('')).toBeNull()
  })

  it('compares non-empty strings without accepting different lengths or values', () => {
    expect(timingSafeStringEqual('same', 'same')).toBe(true)
    expect(timingSafeStringEqual('same', 'different')).toBe(false)
    expect(timingSafeStringEqual('', '')).toBe(false)
  })
})
