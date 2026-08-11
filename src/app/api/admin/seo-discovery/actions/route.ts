import { NextRequest, NextResponse } from 'next/server'

import { logAdminAction } from '@/lib/admin-logger'
import { requireAdmin } from '@/lib/auth'
import { rateLimiter } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/security'
import {
  adminActionSchema,
  isSeoDiscoveryAdminRole,
  recoverConfigurationRequiredJobs,
  retrySeoDiscoveryJobs,
  stableAdminActionError,
  type SeoDiscoveryAdminAction,
} from '@/lib/seo-discovery/admin-api'
import { createGoogleSearchConsoleClient } from '@/lib/seo-discovery/google-gsc-client'
import { FIXED_SITEMAP_URL } from '@/lib/seo-discovery/sitemap-reader'
import { syncSitemapDiscoveryJobs } from '@/lib/seo-discovery/sitemap-sync'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_ACTION_BODY_BYTES = 16 * 1024
const ACTION_RATE_LIMIT = 12
const ACTION_RATE_WINDOW_MS = 60_000
const CANONICAL_ADMIN_ORIGIN = 'https://mushroomie.io.vn'
const DEVELOPMENT_ADMIN_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
])

class ActionBodyError extends Error {
  constructor(readonly status: number) {
    super('SEO_DISCOVERY_INVALID_ACTION_BODY')
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

function authError(error: unknown): NextResponse | null {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return json({ error: 'Bạn cần đăng nhập' }, 401)
  }
  if (error instanceof Error && error.message === 'FORBIDDEN') {
    return json({ error: 'Bạn không có quyền truy cập' }, 403)
  }
  return null
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false

  let parsedOrigin: string
  try {
    parsedOrigin = new URL(origin).origin
  } catch {
    return false
  }
  const originAllowed = parsedOrigin === CANONICAL_ADMIN_ORIGIN
    || (
      process.env.NODE_ENV !== 'production'
      && DEVELOPMENT_ADMIN_ORIGINS.has(parsedOrigin)
    )
  if (!originAllowed) return false

  const fetchSite = request.headers.get('sec-fetch-site')
  return fetchSite === null || fetchSite === 'same-origin'
}

async function readBoundedJson(request: NextRequest): Promise<unknown> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength)
    if (!Number.isFinite(parsedLength) || parsedLength > MAX_ACTION_BODY_BYTES) {
      throw new ActionBodyError(413)
    }
  }

  if (!request.body) throw new ActionBodyError(400)
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_ACTION_BODY_BYTES) {
      void reader.cancel()
      throw new ActionBodyError(413)
    }
    chunks.push(value)
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body))
  } catch {
    throw new ActionBodyError(400)
  }
}

function auditDetails(
  action: SeoDiscoveryAdminAction,
  result: Record<string, unknown>,
): Record<string, unknown> {
  if (result.ok === false) {
    return {
      tool: 'seo-discovery',
      action: action.action,
      outcome: 'blocked',
      code: typeof result.code === 'string'
        ? result.code
        : 'SEO_DISCOVERY_ACTION_BLOCKED',
    }
  }

  if (action.action === 'retry') {
    return {
      tool: 'seo-discovery',
      action: action.action,
      outcome: 'success',
      requestedCount: result.requestedCount,
      retriedCount: result.retriedCount,
      ids: action.ids,
    }
  }

  return {
    tool: 'seo-discovery',
    action: action.action,
    outcome: 'success',
    ...result,
  }
}

async function executeAction(
  action: SeoDiscoveryAdminAction,
  now: Date,
): Promise<Record<string, unknown>> {
  if (action.action === 'retry') {
    const result = await retrySeoDiscoveryJobs(action.ids, now)
    return { ok: true, action: action.action, ...result }
  }

  if (action.action === 'sync_sitemap') {
    const result = await syncSitemapDiscoveryJobs()
    return { ok: true, action: action.action, result }
  }

  const client = createGoogleSearchConsoleClient()
  const connection = await client.getConnectionStatus()

  if (action.action === 'test_connection') {
    const recovery = connection.state === 'connected'
      ? await recoverConfigurationRequiredJobs(now)
      : { recoveredCount: 0, hasMore: false }
    return {
      ok: true,
      action: action.action,
      connection,
      recoveredCount: recovery.recoveredCount,
      recoveryHasMore: recovery.hasMore,
    }
  }

  if (connection.state !== 'connected') {
    return {
      ok: false,
      action: action.action,
      connection,
      code: connection.code,
      status: 409,
    }
  }

  await client.submitSitemap(FIXED_SITEMAP_URL)
  return {
    ok: true,
    action: action.action,
    sitemapUrl: FIXED_SITEMAP_URL,
  }
}

export async function POST(request: NextRequest) {
  let session: Awaited<ReturnType<typeof requireAdmin>>
  try {
    session = await requireAdmin()
  } catch (error) {
    return authError(error) ?? json({ error: 'Không thể xác thực quyền quản trị' }, 500)
  }
  if (!isSeoDiscoveryAdminRole(session.user.role)) {
    return json({ error: 'Bạn không có quyền truy cập' }, 403)
  }

  if (!isSameOriginRequest(request)) {
    return json({ error: 'Nguồn yêu cầu không hợp lệ' }, 403)
  }
  const mediaType = request.headers.get('content-type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== 'application/json') {
    return json({ error: 'Content-Type phải là application/json' }, 415)
  }
  let isLimited: boolean
  try {
    isLimited = await rateLimiter.isLimited(
      request,
      ACTION_RATE_LIMIT,
      ACTION_RATE_WINDOW_MS,
      'admin_seo_discovery_actions',
      `admin-user:${String(session.user.id)}`,
    )
  } catch {
    console.error('[SEO_DISCOVERY_ADMIN_RATE_LIMIT_FAILED]', {
      code: 'RATE_LIMIT_UNAVAILABLE',
    })
    return json({
      error: 'Hệ thống giới hạn thao tác tạm thời không khả dụng',
      code: 'RATE_LIMIT_UNAVAILABLE',
    }, 503)
  }

  if (isLimited) {
    return rateLimiter.getLimitResponse()
  }

  let payload: unknown
  try {
    payload = await readBoundedJson(request)
  } catch (error) {
    return json(
      { error: 'Dữ liệu thao tác không hợp lệ' },
      error instanceof ActionBodyError ? error.status : 400,
    )
  }

  const parsed = adminActionSchema.safeParse(payload)
  if (!parsed.success) {
    return json({ error: 'Thao tác không hợp lệ' }, 400)
  }

  const userId = Number(session.user.id)
  const ipAddress = getClientIp(request)
  try {
    const result = await executeAction(parsed.data, new Date())
    const responseStatus = typeof result.status === 'number' ? result.status : 200
    const responseBody = { ...result }
    delete responseBody.status
    await logAdminAction({
      userId,
      action: 'OTHER',
      entity: 'SYSTEM',
      details: auditDetails(parsed.data, responseBody),
      ipAddress,
    })
    return json(responseBody, responseStatus)
  } catch (error) {
    const failure = stableAdminActionError(error)
    console.error('[SEO_DISCOVERY_ADMIN_ACTION_FAILED]', { code: failure.code })
    await logAdminAction({
      userId,
      action: 'OTHER',
      entity: 'SYSTEM',
      details: {
        tool: 'seo-discovery',
        action: parsed.data.action,
        outcome: 'failed',
        code: failure.code,
      },
      ipAddress,
    })
    return json({ error: 'Không thể hoàn tất thao tác', code: failure.code }, failure.status)
  }
}
