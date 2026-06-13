import crypto from 'node:crypto'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  limit: number
  windowMs: number
  identity?: string
}

const globalSecurityState = globalThis as typeof globalThis & {
  mushroomieRateLimits?: Map<string, RateLimitEntry>
}

const rateLimits = globalSecurityState.mushroomieRateLimits ?? new Map<string, RateLimitEntry>()
globalSecurityState.mushroomieRateLimits = rateLimits

export function getApplicationSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured with at least 32 characters')
  }
  return secret
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function checkRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const now = Date.now()
  const identity = options.identity || getClientIp(request)
  const key = `${scope}:${identity}`
  const current = rateLimits.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs
    rateLimits.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, retryAfter: 0 }
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  rateLimits.set(key, current)
  return { allowed: true, remaining: options.limit - current.count, retryAfter: 0 }
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function hashSensitiveValue(value?: string | null): string | null {
  if (!value) return null
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  if (!left || !right) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}
