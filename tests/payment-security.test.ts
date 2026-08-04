import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { buildVietQRPayload, buildVietQRUrl } from '../src/lib/payment/qr-generator'
import {
  extractOrderCodes,
  redactWebhookPayload,
  sanitizeWebhookHeaders,
} from '../src/lib/payment/webhook-security'
import { VietQRCassoProvider } from '../src/lib/payment/providers/vietqr-casso'
import { VietQRSePayProvider } from '../src/lib/payment/providers/vietqr-sepay'

test('VietQR URL preserves bank data and safely encodes transfer content', () => {
  const url = new URL(buildVietQRUrl({
    bankBin: '970436',
    bankAccount: '123456789',
    amount: 250_000,
    addInfo: 'MUSHROOMIE-ABC 123 & gift',
    accountName: 'MUSHROOMIE SHOP',
  }))

  assert.equal(url.protocol, 'https:')
  assert.equal(url.hostname, 'img.vietqr.io')
  assert.equal(url.pathname, '/image/970436-123456789-compact2.png')
  assert.equal(url.searchParams.get('amount'), '250000')
  assert.equal(url.searchParams.get('addInfo'), 'MUSHROOMIE-ABC 123 & gift')
  assert.equal(url.searchParams.get('accountName'), 'MUSHROOMIE SHOP')

  assert.deepEqual(JSON.parse(buildVietQRPayload({
    bankBin: '970436', bankAccount: '123456789', amount: 250_000, addInfo: 'ORDER-1',
  })), {
    bankBin: '970436', bankAccount: '123456789', amount: 250_000, addInfo: 'ORDER-1',
  })
})

test('webhook audit redacts nested secrets, headers and oversized content', () => {
  const redacted = redactWebhookPayload({
    signature: 'sig',
    nested: { authorization: 'Bearer secret', safe: 'ok' },
    bank_sub_acc_id: '123456789',
    subAccId: '123456789',
    long: 'x'.repeat(600),
    items: Array.from({ length: 25 }, (_, index) => index),
  }) as Record<string, unknown>

  assert.equal(redacted.signature, '[redacted]')
  assert.deepEqual(redacted.nested, { authorization: '[redacted]', safe: 'ok' })
  assert.equal(redacted.bank_sub_acc_id, '[redacted]')
  assert.equal(redacted.subAccId, '[redacted]')
  assert.match(String(redacted.long), /\[truncated\]$/)
  assert.equal((redacted.items as unknown[]).length, 20)

  const headers = sanitizeWebhookHeaders(new Headers({
    Authorization: 'Bearer secret',
    Cookie: 'session=secret',
    'Content-Type': 'application/json',
  }))
  assert.equal(headers.authorization, '[REDACTED]')
  assert.equal(headers.cookie, '[REDACTED]')
  assert.equal(headers['content-type'], 'application/json')
})

test('webhook audit redacts the Casso secure-token header', () => {
  const headers = sanitizeWebhookHeaders(new Headers({
    'Secure-Token': 'casso-production-secret',
  }))

  assert.equal(headers['secure-token'], '[REDACTED]')
})

test('webhook order code extraction normalizes separators, case and duplicates', () => {
  assert.deepEqual(
    extractOrderCodes('payment mushroomie abc123 and MUSHROOMIE-ABC123, MUSHROOMIE XYZ9', 'MUSHROOMIE'),
    ['MUSHROOMIE-ABC123', 'MUSHROOMIE-XYZ9'],
  )
  assert.deepEqual(extractOrderCodes('PAY SHOP.X-ABC1', 'SHOP.X'), ['SHOP.X-ABC1'])
})

test('webhook order code extraction requires a delimited canonical token', () => {
  assert.deepEqual(extractOrderCodes('PAY NOTMSH-99', 'MSH'), [])
  assert.deepEqual(extractOrderCodes('PAY MSH99', 'MSH'), [])
  assert.deepEqual(extractOrderCodes('PAY MSH-99 OR MSH 100', 'MSH'), ['MSH-99', 'MSH-100'])
})

test('Casso webhook verification is fail-closed and validates configured token', async () => {
  const previous = process.env.PAYMENT_WEBHOOK_SECRET
  try {
    delete process.env.PAYMENT_WEBHOOK_SECRET
    const provider = new VietQRCassoProvider()
    const payload = JSON.stringify({ data: [{ id: 7, tid: 'TX7', amount: 150000, description: 'MUSHROOMIE-A1' }] })
    const missingSecret = await provider.verifyWebhookSignature(new Request('https://example.com', {
      method: 'POST', body: payload, headers: { 'Secure-Token': '' },
    }))
    assert.equal(missingSecret.isValid, false)

    process.env.PAYMENT_WEBHOOK_SECRET = 'casso-test-secret'
    const valid = await provider.verifyWebhookSignature(new Request('https://example.com', {
      method: 'POST', body: payload, headers: { 'Secure-Token': 'casso-test-secret' },
    }))
    assert.equal(valid.isValid, true)
    assert.equal(valid.amount, 150000)
    assert.equal(valid.transferContent, 'MUSHROOMIE-A1')

    const invalidJson = await provider.verifyWebhookSignature(new Request('https://example.com', {
      method: 'POST', body: '{',
    }))
    assert.equal(invalidJson.isValid, false)
  } finally {
    process.env.PAYMENT_WEBHOOK_SECRET = previous
  }
})

test('SePay webhook verification validates HMAC over the exact request body', async () => {
  const previous = process.env.PAYMENT_WEBHOOK_SECRET
  const secret = 'sepay-test-secret'
  const body = JSON.stringify({ id: 9, referenceCode: 'TX9', transferAmount: 250000, content: 'MUSHROOMIE-B2' })
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    process.env.PAYMENT_WEBHOOK_SECRET = secret
    const provider = new VietQRSePayProvider()
    const valid = await provider.verifyWebhookSignature(new Request('https://example.com', {
      method: 'POST', body, headers: { 'X-Sepay-Signature': signature },
    }))
    assert.equal(valid.isValid, true)
    assert.equal(valid.transactionCode, 'TX9')

    const invalid = await provider.verifyWebhookSignature(new Request('https://example.com', {
      method: 'POST', body, headers: { 'X-Sepay-Signature': `${signature}0` },
    }))
    assert.equal(invalid.isValid, false)
  } finally {
    process.env.PAYMENT_WEBHOOK_SECRET = previous
  }
})
