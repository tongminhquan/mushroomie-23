import crypto from 'node:crypto'
import { getApplicationSecret, timingSafeStringEqual } from '@/lib/security'

const ORDER_ACCESS_TTL_MS = 24 * 60 * 60 * 1000

export function createOrderAccessToken(orderId: number, orderCode: string): string {
  const expiresAt = Date.now() + ORDER_ACCESS_TTL_MS
  const payload = `${orderId}:${orderCode}:${expiresAt}`
  const encodedPayload = Buffer.from(payload).toString('base64url')
  const signature = crypto
    .createHmac('sha256', getApplicationSecret())
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

export function verifyOrderAccessToken(
  token: string | null | undefined,
  orderId: number,
  orderCode: string,
): boolean {
  if (!token) return false
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  const expected = crypto
    .createHmac('sha256', getApplicationSecret())
    .update(encodedPayload)
    .digest('base64url')

  if (!timingSafeStringEqual(signature, expected)) return false

  try {
    const [tokenOrderId, tokenOrderCode, expiresAtText] = Buffer.from(encodedPayload, 'base64url')
      .toString('utf8')
      .split(':')
    const expiresAt = Number(expiresAtText)

    return (
      Number(tokenOrderId) === orderId &&
      tokenOrderCode === orderCode &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now()
    )
  } catch {
    return false
  }
}
