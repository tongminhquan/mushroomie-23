import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { createOrderAccessToken, verifyOrderAccessToken } from '../src/lib/order-access'
import {
  getApplicationSecret,
  getClientIp,
  hashSensitiveValue,
  safeJsonLd,
  timingSafeStringEqual,
} from '../src/lib/security'

const testSecret = 'order-access-test-secret-at-least-32-characters'

test('guest order access token is bound to order, code and signature', () => {
  const previous = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = testSecret
  try {
    const token = createOrderAccessToken(42, 'MUSHROOMIE-ABC123')
    assert.equal(verifyOrderAccessToken(token, 42, 'MUSHROOMIE-ABC123'), true)
    assert.equal(verifyOrderAccessToken(token, 43, 'MUSHROOMIE-ABC123'), false)
    assert.equal(verifyOrderAccessToken(token, 42, 'MUSHROOMIE-OTHER'), false)
    assert.equal(verifyOrderAccessToken(`${token}x`, 42, 'MUSHROOMIE-ABC123'), false)
    assert.equal(verifyOrderAccessToken(null, 42, 'MUSHROOMIE-ABC123'), false)
  } finally {
    process.env.AUTH_SECRET = previous
  }
})

test('guest order access token rejects expired and malformed payloads', () => {
  const previous = process.env.AUTH_SECRET
  process.env.AUTH_SECRET = testSecret
  try {
    const payload = Buffer.from(`42:MUSHROOMIE-ABC123:${Date.now() - 1}`).toString('base64url')
    const signature = crypto.createHmac('sha256', testSecret).update(payload).digest('base64url')
    assert.equal(verifyOrderAccessToken(`${payload}.${signature}`, 42, 'MUSHROOMIE-ABC123'), false)
    assert.equal(verifyOrderAccessToken('invalid', 42, 'MUSHROOMIE-ABC123'), false)
  } finally {
    process.env.AUTH_SECRET = previous
  }
})

test('application secret fails closed when missing or too short', () => {
  const previousAuth = process.env.AUTH_SECRET
  const previousNextAuth = process.env.NEXTAUTH_SECRET
  delete process.env.AUTH_SECRET
  delete process.env.NEXTAUTH_SECRET
  try {
    assert.throws(() => getApplicationSecret(), /at least 32 characters/)
    process.env.AUTH_SECRET = 'too-short'
    assert.throws(() => getApplicationSecret(), /at least 32 characters/)
    process.env.AUTH_SECRET = testSecret
    assert.equal(getApplicationSecret(), testSecret)
  } finally {
    process.env.AUTH_SECRET = previousAuth
    process.env.NEXTAUTH_SECRET = previousNextAuth
  }
})

test('client IP only accepts valid forwarded addresses in trusted order', () => {
  assert.equal(getClientIp(new Request('https://example.com', {
    headers: {
      'cf-connecting-ip': '203.0.113.10',
      'x-real-ip': '198.51.100.20',
      'x-forwarded-for': '192.0.2.30, 10.0.0.1',
    },
  })), '203.0.113.10')

  assert.equal(getClientIp(new Request('https://example.com', {
    headers: { 'cf-connecting-ip': 'invalid', 'x-forwarded-for': '192.0.2.30, 10.0.0.1' },
  })), '192.0.2.30')
  assert.equal(getClientIp(new Request('https://example.com')), 'unknown')
})

test('security helpers escape JSON-LD and compare secrets safely', () => {
  const json = safeJsonLd({ value: '</script><script>alert(1)</script>&' })
  assert.equal(json.includes('<'), false)
  assert.equal(json.includes('>'), false)
  assert.equal(json.includes('&'), false)
  assert.deepEqual(JSON.parse(json), { value: '</script><script>alert(1)</script>&' })

  assert.equal(timingSafeStringEqual('same', 'same'), true)
  assert.equal(timingSafeStringEqual('same', 'different'), false)
  assert.equal(timingSafeStringEqual('', ''), false)
  assert.match(hashSensitiveValue('secret-value') || '', /^sha256:[a-f0-9]{64}$/)
  assert.equal(hashSensitiveValue(null), null)
})
