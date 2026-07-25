import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPasswordResetToken,
  getPasswordResetLookupTokens,
  hashPasswordResetToken,
  isValidPasswordResetToken,
} from '../src/lib/password-reset-token'
import { getAuthErrorStatus } from '../src/lib/auth-errors'
import {
  MAX_QR_IMAGE_BYTES,
  parseAllowedQrUrl,
  readResponseBodyWithLimit,
} from '../src/lib/qr-proxy'
import { getUploadErrorDetails } from '../src/lib/upload-errors'
import { MAIL_TRANSPORT_SECURITY } from '../src/lib/mail-security'

test('password reset tokens are random, validated and stored as hashes', () => {
  const first = createPasswordResetToken()
  const second = createPasswordResetToken()

  assert.match(first, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
  assert.equal(isValidPasswordResetToken(first), true)
  assert.equal(isValidPasswordResetToken('not-a-token'), false)

  const hashed = hashPasswordResetToken(first)
  assert.match(hashed, /^sha256:[a-f0-9]{64}$/)
  assert.notEqual(hashed, first)
  assert.deepEqual(getPasswordResetLookupTokens(first), [hashed, first])
})

test('auth errors map to stable HTTP status codes without leaking details', () => {
  assert.equal(getAuthErrorStatus(new Error('UNAUTHORIZED')), 401)
  assert.equal(getAuthErrorStatus(new Error('FORBIDDEN')), 403)
  assert.equal(getAuthErrorStatus(new Error('database password leaked')), null)
  assert.equal(getAuthErrorStatus('UNAUTHORIZED'), null)
})

test('upload errors expose only known validation messages', () => {
  assert.deepEqual(getUploadErrorDetails(new Error('UNAUTHORIZED')), {
    status: 401,
    message: 'Unauthorized',
  })
  assert.deepEqual(getUploadErrorDetails(new Error('FORBIDDEN')), {
    status: 403,
    message: 'Forbidden',
  })
  assert.deepEqual(getUploadErrorDetails(new Error('Invalid image MIME type')), {
    status: 400,
    message: 'Invalid image MIME type',
  })
  assert.deepEqual(getUploadErrorDetails(new Error('database password leaked')), {
    status: 500,
    message: 'Upload failed',
  })
})

test('mail transports cannot read local files or remote URLs', () => {
  assert.deepEqual(MAIL_TRANSPORT_SECURITY, {
    disableFileAccess: true,
    disableUrlAccess: true,
  })
  assert.equal(Object.isFrozen(MAIL_TRANSPORT_SECURITY), true)
})

test('QR proxy accepts only the exact VietQR HTTPS origin', () => {
  assert.equal(
    parseAllowedQrUrl('https://img.vietqr.io/image/970415-123-compact.png').origin,
    'https://img.vietqr.io',
  )

  for (const value of [
    'http://img.vietqr.io/image/test.png',
    'https://img.vietqr.io.evil.example/image/test.png',
    'https://user:password@img.vietqr.io/image/test.png',
    'https://img.vietqr.io:444/image/test.png',
  ]) {
    assert.throws(() => parseAllowedQrUrl(value), /QR URL/)
  }
})

test('QR proxy rejects response bodies above the configured limit', async () => {
  const allowed = new Response(new Uint8Array([1, 2, 3]))
  assert.deepEqual(await readResponseBodyWithLimit(allowed, 3), new Uint8Array([1, 2, 3]))

  const oversizedByHeader = new Response(new Uint8Array([1]), {
    headers: { 'content-length': String(MAX_QR_IMAGE_BYTES + 1) },
  })
  await assert.rejects(() => readResponseBodyWithLimit(oversizedByHeader), /too large/)

  const oversizedByStream = new Response(new Uint8Array([1, 2, 3, 4]))
  await assert.rejects(() => readResponseBodyWithLimit(oversizedByStream, 3), /too large/)
})
