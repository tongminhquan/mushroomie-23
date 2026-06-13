import { handlers } from '@/lib/auth'
import { checkRateLimit } from '@/lib/security'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'auth', { limit: 30, windowMs: 15 * 60 * 1000 })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many authentication requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  return handlers.POST(request)
}
