import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import {
  isSeoDiscoveryAdminRole,
  parseSeoDiscoveryReadFilters,
  readSeoDiscoveryAdminOverview,
} from '@/lib/seo-discovery/admin-api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof requireAdmin>>
  try {
    session = await requireAdmin()
  } catch (error) {
    return authError(error) ?? json({ error: 'Không thể xác thực quyền quản trị' }, 500)
  }
  if (!isSeoDiscoveryAdminRole(session.user.role)) {
    return json({ error: 'Bạn không có quyền truy cập' }, 403)
  }

  const parsed = parseSeoDiscoveryReadFilters(request.nextUrl.searchParams)
  if (!parsed.success) {
    return json({ error: 'Bộ lọc không hợp lệ' }, 400)
  }

  try {
    return json(await readSeoDiscoveryAdminOverview(parsed.data))
  } catch {
    console.error('[SEO_DISCOVERY_ADMIN_READ_FAILED]', {
      code: 'SEO_DISCOVERY_ADMIN_READ_FAILED',
    })
    return json({ error: 'Không thể tải trạng thái lập chỉ mục' }, 500)
  }
}
