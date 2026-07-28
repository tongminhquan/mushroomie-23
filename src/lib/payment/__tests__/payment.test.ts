import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPaymentProvider } from '@/lib/payment/factory'
import { buildVietQRPayload, buildVietQRUrl } from '@/lib/payment/qr-generator'
import { redactWebhookPayload } from '@/lib/payment/webhook-security'
import { PayOSProvider } from '@/lib/payment/providers/payos'
import { VietQRCassoProvider } from '@/lib/payment/providers/vietqr-casso'
import { VietQRSePayProvider } from '@/lib/payment/providers/vietqr-sepay'

describe('payment helpers and provider selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds an encoded HTTPS VietQR image URL and serializable payload', () => {
    const params = {
      bankBin: '970436',
      bankAccount: '123456789',
      amount: 125_000,
      addInfo: 'MSH 42/2026',
      accountName: 'Mushroomie & Co',
    }

    const url = new URL(buildVietQRUrl(params))
    expect(url.protocol).toBe('https:')
    expect(url.hostname).toBe('img.vietqr.io')
    expect(url.pathname).toBe('/image/970436-123456789-compact2.png')
    expect(url.searchParams.get('amount')).toBe('125000')
    expect(url.searchParams.get('addInfo')).toBe('MSH 42/2026')
    expect(JSON.parse(buildVietQRPayload(params))).toEqual(expect.objectContaining({ amount: 125_000, addInfo: 'MSH 42/2026' }))
  })

  it.each([
    ['vietqr_casso', VietQRCassoProvider],
    ['vietqr_sepay', VietQRSePayProvider],
    ['payos', PayOSProvider],
  ])('selects the configured %s provider', (key, Provider) => {
    vi.stubEnv('PAYMENT_PROVIDER', key)
    expect(getPaymentProvider()).toBeInstanceOf(Provider)
  })

  it('rejects an absent or unsupported provider configuration', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'unsupported')
    expect(() => getPaymentProvider()).toThrow(/không được hỗ trợ|khÃ´ng Ä‘Æ°á»£c há»— trá»£/)
  })

  it('redacts sensitive fields, caps arrays, depth, and oversized strings', () => {
    const result = redactWebhookPayload({
      signature: 'secret-signature',
      authorization: 'Bearer token',
      public: 'visible',
      nested: { bankAccount: '1234', amount: 125_000 },
      rows: Array.from({ length: 25 }, (_, index) => index),
      long: 'x'.repeat(501),
      deep: { a: { b: { c: { d: { e: { f: { g: 'hidden' } } } } } } },
    }) as Record<string, unknown>

    expect(result.signature).toBe('[redacted]')
    expect(result.authorization).toBe('[redacted]')
    expect(result.public).toBe('visible')
    expect(result.nested).toEqual({ bankAccount: '[redacted]', amount: 125_000 })
    expect(result.rows).toHaveLength(20)
    expect(result.long).toBe(`${'x'.repeat(500)}...[truncated]`)
    expect(JSON.stringify(result.deep)).toContain('[truncated]')
  })
})
