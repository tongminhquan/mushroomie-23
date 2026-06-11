import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  count: number
  expiresAt: number
}

class InMemRateLimiter {
  private store: Map<string, RateLimitStore> = new Map()
  private gcInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start GC to clear expired entries every 1 minute
    if (typeof setInterval !== 'undefined') {
      this.gcInterval = setInterval(() => this.gc(), 60000)
    }
  }

  private gc() {
    const now = Date.now()
    for (const [key, val] of this.store.entries()) {
      if (now > val.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Check if the request should be rate limited.
   * @param req NextRequest
   * @param limit Maximum number of requests
   * @param windowMs Time window in milliseconds
   * @param prefix Prefix for the key
   * @returns true if limited, false otherwise
   */
  public isLimited(req: NextRequest, limit: number, windowMs: number, prefix: string = 'global'): boolean {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip'
    const key = `${prefix}:${ip}`
    const now = Date.now()

    const current = this.store.get(key)
    if (!current || now > current.expiresAt) {
      this.store.set(key, { count: 1, expiresAt: now + windowMs })
      return false
    }

    if (current.count >= limit) {
      return true
    }

    current.count += 1
    return false
  }

  public getLimitResponse(): NextResponse {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Vui lòng thử lại sau ít phút.' },
      { status: 429 }
    )
  }
}

// Global instance for the whole app
export const rateLimiter = new InMemRateLimiter()
