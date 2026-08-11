import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security'

class DistributedRateLimiter {
  /**
   * Check if the request should be rate limited.
   * @param req NextRequest
   * @param limit Maximum number of requests
   * @param windowMs Time window in milliseconds
   * @param prefix Prefix for the key
   * @returns true if limited, false otherwise
   */
  public async isLimited(
    req: NextRequest,
    limit: number,
    windowMs: number,
    prefix: string = 'global',
    identity?: string,
  ): Promise<boolean> {
    const result = await checkRateLimit(req, prefix, {
      limit,
      windowMs,
      ...(identity ? { identity } : {}),
    })
    return !result.allowed
  }

  public getLimitResponse(): NextResponse {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Vui lòng thử lại sau ít phút.' },
      { status: 429 }
    )
  }
}

// Global instance for the whole app
export const rateLimiter = new DistributedRateLimiter()
