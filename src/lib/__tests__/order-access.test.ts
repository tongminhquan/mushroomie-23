import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrderAccessToken, verifyOrderAccessToken } from '@/lib/order-access'

describe('guest order access tokens', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_SECRET', 'order-access-secret-at-least-32-characters')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows the exact order during the 24-hour validity period', () => {
    const token = createOrderAccessToken(42, 'MSH-42')

    expect(verifyOrderAccessToken(token, 42, 'MSH-42')).toBe(true)
    expect(verifyOrderAccessToken(token, 43, 'MSH-42')).toBe(false)
    expect(verifyOrderAccessToken(token, 42, 'MSH-OTHER')).toBe(false)
  })

  it('rejects missing, malformed, tampered, and expired tokens', () => {
    const token = createOrderAccessToken(42, 'MSH-42')
    const [payload, signature] = token.split('.')

    expect(verifyOrderAccessToken(undefined, 42, 'MSH-42')).toBe(false)
    expect(verifyOrderAccessToken('not-a-token', 42, 'MSH-42')).toBe(false)
    expect(verifyOrderAccessToken(`${payload}.${signature}x`, 42, 'MSH-42')).toBe(false)

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1)
    expect(verifyOrderAccessToken(token, 42, 'MSH-42')).toBe(false)
  })
})
