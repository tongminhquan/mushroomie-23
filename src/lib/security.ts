import crypto from 'node:crypto'
import net from 'node:net'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

interface RateLimitOptions {
  limit: number
  windowMs: number
  identity?: string
}

export function getApplicationSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured with at least 32 characters')
  }
  return secret
}

export function getClientIp(request: Request): string {
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ]

  return candidates.find((value): value is string => Boolean(value && net.isIP(value))) || 'unknown'
}

export async function checkRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const now = Date.now()
  const identity = options.identity || getClientIp(request)
  const key = crypto.createHash('sha256').update(`${scope}:${identity}`).digest('hex')

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.rateLimitBucket.findUnique({ where: { key } })
        const resetAt = new Date(now + options.windowMs)

        if (!current || current.reset_at.getTime() <= now) {
          await tx.rateLimitBucket.upsert({
            where: { key },
            create: { key, count: 1, reset_at: resetAt },
            update: { count: 1, reset_at: resetAt },
          })
          return { allowed: true, remaining: Math.max(0, options.limit - 1), retryAfter: 0 }
        }

        const updated = await tx.rateLimitBucket.update({
          where: { key },
          data: { count: { increment: 1 } },
        })
        const allowed = updated.count <= options.limit
        return {
          allowed,
          remaining: allowed ? Math.max(0, options.limit - updated.count) : 0,
          retryAfter: allowed ? 0 : Math.max(1, Math.ceil((updated.reset_at.getTime() - now) / 1000)),
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

      if (Math.random() < 0.01) {
        void prisma.rateLimitBucket.deleteMany({ where: { reset_at: { lt: new Date(now - 24 * 60 * 60 * 1000) } } })
      }
      return result
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      if (!retryable || attempt === 2) throw error
    }
  }

  throw new Error('RATE_LIMIT_UNAVAILABLE')
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
