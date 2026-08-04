import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const payosMocks = vi.hoisted(() => ({
  create: vi.fn(),
  get: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('@payos/node', () => ({
  PayOS: class {
    paymentRequests = { create: payosMocks.create, get: payosMocks.get }
    webhooks = { verify: payosMocks.verify }
  },
}))

import { PayOSProvider } from '@/lib/payment/providers/payos'
import { VietQRCassoProvider } from '@/lib/payment/providers/vietqr-casso'
import { VietQRSePayProvider } from '@/lib/payment/providers/vietqr-sepay'

const paymentInput = {
  orderId: 42,
  orderCode: 'MSH-42',
  amount: 125_000,
  customerEmail: 'buyer@example.com',
  customerName: 'Buyer',
  expiresAt: new Date('2026-07-20T00:00:00Z'),
}

describe('payment providers', () => {
  beforeEach(() => {
    vi.stubEnv('BANK_BIN', '970436')
    vi.stubEnv('BANK_ACCOUNT_NUMBER', '123456789')
    vi.stubEnv('BANK_ACCOUNT_NAME', 'MUSHROOMIE')
    vi.stubEnv('BANK_NAME', 'VCB')
    vi.stubEnv('PAYMENT_WEBHOOK_SECRET', 'webhook-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates Casso payment details without a network request', async () => {
    const provider = new VietQRCassoProvider()
    const result = await provider.createPayment(paymentInput)

    expect(result).toMatchObject({
      transferContent: 'MSH-42',
      bankBin: '970436',
      bankAccount: '123456789',
      accountName: 'MUSHROOMIE',
    })
    expect(result.qrCodeUrl).toContain('https://img.vietqr.io/image/970436-123456789')
    expect(JSON.parse(result.qrCodePayload || '{}')).toMatchObject({ amount: 125_000, addInfo: 'MSH-42' })
  })

  it('validates Casso secure-token webhooks and normalizes transaction fields', async () => {
    const provider = new VietQRCassoProvider()
    const request = new Request('https://example.test/webhook', {
      method: 'POST',
      headers: { 'Secure-Token': 'webhook-secret' },
      body: JSON.stringify({ data: [{ id: 9, tid: 'TX-9', amount: 125_000, description: 'MSH-42' }] }),
    })

    await expect(provider.verifyWebhookSignature(request)).resolves.toMatchObject({
      isValid: true,
      eventId: '9',
      transactionCode: 'TX-9',
      amount: 125_000,
      transferContent: 'MSH-42',
    })
    await expect(provider.verifyWebhookSignature(new Request('https://example.test', { method: 'POST', body: '{bad' }))).resolves.toMatchObject({ isValid: false, rawPayload: null })
  })

  it('preserves every transaction from a legacy Casso webhook batch', async () => {
    const provider = new VietQRCassoProvider()
    const request = new Request('https://example.test/webhook', {
      method: 'POST',
      headers: { 'Secure-Token': 'webhook-secret' },
      body: JSON.stringify({
        error: 0,
        data: [
          { id: 9, tid: 'TX-9', amount: 125_000, description: 'MSH-42', bank_sub_acc_id: '123456789' },
          { id: 10, tid: 'TX-10', amount: 90_000, description: 'MSH-43', subAccId: '123456789' },
        ],
      }),
    })

    const result = await provider.verifyWebhookSignature(request)

    expect(result.isValid).toBe(true)
    expect(result.transactions).toEqual([
      {
        eventId: '9',
        transactionCode: 'TX-9',
        amount: 125_000,
        transferContent: 'MSH-42',
        receivingAccount: '123456789',
      },
      {
        eventId: '10',
        transactionCode: 'TX-10',
        amount: 90_000,
        transferContent: 'MSH-43',
        receivingAccount: '123456789',
      },
    ])
  })

  it('validates and normalizes Casso Webhook V2 using the official SHA-512 algorithm', async () => {
    vi.stubEnv('PAYMENT_WEBHOOK_SECRET', 'g3oZ950pJQ4k6REhOPGkx37RsXgWz9QJ9RCAZ7i0yagLF32XQZtemQ6r3JIo4MCr')
    const provider = new VietQRCassoProvider()
    const body = JSON.stringify({
      error: 0,
      data: {
        id: 218897,
        reference: 'FT24364030863634',
        description: 'hoi lai 100 bao mun dua',
        amount: 16_775_000,
        runningBalance: 16_775_000,
        transactionDateTime: '2024-12-23 07:00:00',
        accountNumber: '123456789',
        bankName: 'MBBank',
        bankAbbreviation: 'MBB',
        virtualAccountNumber: '',
        virtualAccountName: '',
        counterAccountName: '',
        counterAccountNumber: '',
        counterAccountBankId: '',
        counterAccountBankName: '',
      },
    })
    const request = new Request('https://example.test/webhook', {
      method: 'POST',
      headers: {
        'X-Casso-Signature': 't=1734924830020,v1=b3d9438862f167b4e441451b46adaff01f4aaa0c05fa86df1803b7452616c449b9f69837be23b76f79862b346c8bc90a4f1152397a886d4ec24e857cdf6ad08f',
      },
      body,
    })

    await expect(provider.verifyWebhookSignature(request)).resolves.toMatchObject({
      isValid: true,
      eventId: '218897',
      transactionCode: 'FT24364030863634',
      amount: 16_775_000,
      transferContent: 'hoi lai 100 bao mun dua',
      receivingAccount: '123456789',
    })
  })

  it('maps Casso transaction lookup failures and matches to pending/paid statuses', async () => {
    const provider = new VietQRCassoProvider()
    vi.stubEnv('PAYMENT_API_KEY', 'test-key')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { records: [{ tid: 'TX-9' }] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(provider.getTransactionStatus('TX-9')).resolves.toBe('PAID')
    await expect(provider.getTransactionStatus('missing')).resolves.toBe('PENDING')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('oauth.casso.vn'), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Apikey test-key' }),
    }))
  })

  it('validates SePay HMAC signatures over the exact request body', async () => {
    const provider = new VietQRSePayProvider()
    const body = JSON.stringify({ id: 8, referenceCode: 'SEP-8', transferAmount: 90_000, content: 'MSH-42' })
    const signature = crypto.createHmac('sha256', 'webhook-secret').update(body).digest('hex')

    const valid = await provider.verifyWebhookSignature(new Request('https://example.test', {
      method: 'POST', headers: { 'X-Sepay-Signature': signature }, body,
    }))
    const invalid = await provider.verifyWebhookSignature(new Request('https://example.test', {
      method: 'POST', headers: { 'X-Sepay-Signature': 'bad' }, body,
    }))

    expect(valid).toMatchObject({ isValid: true, eventId: '8', transactionCode: 'SEP-8', amount: 90_000, transferContent: 'MSH-42' })
    expect(invalid.isValid).toBe(false)
    await expect(provider.getTransactionStatus('anything')).resolves.toBe('PENDING')
  })

  it('returns a PayOS link when available and keeps VietQR fallback when link creation fails', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    payosMocks.create.mockResolvedValueOnce({ checkoutUrl: 'https://pay.payos.vn/link' }).mockRejectedValueOnce(new Error('offline'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const provider = new PayOSProvider()

    await expect(provider.createPayment(paymentInput)).resolves.toMatchObject({
      paymentUrl: 'https://pay.payos.vn/link', transferContent: 'MSH-42', bankAccount: '123456789',
    })
    const fallback = await provider.createPayment(paymentInput)
    expect(fallback.paymentUrl).toBe('')
    expect(fallback.qrCodeUrl).toContain('img.vietqr.io')
    expect(warn).toHaveBeenCalledOnce()
  })

  it('verifies PayOS webhooks and maps remote payment status safely', async () => {
    payosMocks.verify.mockResolvedValue({})
    payosMocks.get.mockResolvedValueOnce({ status: 'PAID' }).mockRejectedValueOnce(new Error('offline'))
    const provider = new PayOSProvider()
    const payload = { code: 'event-1', signature: 'sig', data: { reference: 'REF-1', amount: 125_000, description: 'MSH-42' } }

    await expect(provider.verifyWebhookSignature(new Request('https://example.test', { method: 'POST', body: JSON.stringify(payload) }))).resolves.toMatchObject({
      isValid: true, eventId: 'event-1', transactionCode: 'REF-1', amount: 125_000, transferContent: 'MSH-42', signature: 'sig',
    })
    await expect(provider.verifyWebhookSignature(new Request('https://example.test', { method: 'POST', body: 'invalid' }))).resolves.toMatchObject({ isValid: false, rawPayload: null })
    await expect(provider.getTransactionStatus('100')).resolves.toBe('PAID')
    await expect(provider.getTransactionStatus('101')).resolves.toBe('PENDING')
  })
})
