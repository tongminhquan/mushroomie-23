import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const authMocks = vi.hoisted(() => ({ auth: vi.fn() }))
const prismaTrap = vi.hoisted(() => new Proxy({}, {
  get(_target, property) {
    throw new Error(`Database accessed before authorization: ${String(property)}`)
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: authMocks.auth,
  requireAuth: vi.fn().mockRejectedValue(new Error('UNAUTHORIZED')),
  requireAdmin: vi.fn().mockRejectedValue(new Error('UNAUTHORIZED')),
  requireSuperAdmin: vi.fn().mockRejectedValue(new Error('UNAUTHORIZED')),
}))
vi.mock('@/lib/prisma', () => ({ prisma: prismaTrap }))
vi.mock('@/lib/admin-logger', () => ({ logAdminAction: vi.fn() }))

interface ProtectedRouteCase {
  name: string
  load: () => Promise<Record<string, unknown>>
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
}

const protectedRoutes: ProtectedRouteCase[] = [
  { name: 'admin logs', load: () => import('@/app/api/admin-logs/route'), method: 'GET', path: '/api/admin-logs' },
  { name: 'admin dashboard', load: () => import('@/app/api/admin/dashboard/stats/route'), method: 'GET', path: '/api/admin/dashboard/stats' },
  { name: 'admin settings read', load: () => import('@/app/api/admin/settings/route'), method: 'GET', path: '/api/admin/settings' },
  { name: 'admin settings write', load: () => import('@/app/api/admin/settings/route'), method: 'POST', path: '/api/admin/settings' },
  { name: 'admin stats', load: () => import('@/app/api/admin/stats/route'), method: 'GET', path: '/api/admin/stats' },
  { name: 'admin voucher create', load: () => import('@/app/api/admin/vouchers/route'), method: 'POST', path: '/api/admin/vouchers' },
  { name: 'admin voucher history', load: () => import('@/app/api/admin/vouchers/history/route'), method: 'GET', path: '/api/admin/vouchers/history' },
  { name: 'admin voucher stats', load: () => import('@/app/api/admin/vouchers/stats/route'), method: 'GET', path: '/api/admin/vouchers/stats' },
  { name: 'admin user vouchers', load: () => import('@/app/api/admin/vouchers/user/[userId]/route'), method: 'GET', path: '/api/admin/vouchers/user/7' },
  { name: 'admin webhook test', load: () => import('@/app/api/admin/webhook-logs/test/route'), method: 'POST', path: '/api/admin/webhook-logs/test' },
  { name: 'banner create', load: () => import('@/app/api/banners/route'), method: 'POST', path: '/api/banners' },
  { name: 'banner update', load: () => import('@/app/api/banners/[id]/route'), method: 'PUT', path: '/api/banners/7' },
  { name: 'category create', load: () => import('@/app/api/categories/route'), method: 'POST', path: '/api/categories' },
  { name: 'category update', load: () => import('@/app/api/categories/[id]/route'), method: 'PUT', path: '/api/categories/7' },
  { name: 'contact inbox', load: () => import('@/app/api/contacts/route'), method: 'GET', path: '/api/contacts' },
  { name: 'contact update', load: () => import('@/app/api/contacts/[id]/route'), method: 'PUT', path: '/api/contacts/7' },
  { name: 'mini-game points', load: () => import('@/app/api/minigame/get-points/route'), method: 'GET', path: '/api/minigame/get-points' },
  { name: 'mini-game start', load: () => import('@/app/api/minigame/start/route'), method: 'POST', path: '/api/minigame/start' },
  { name: 'mini-game score', load: () => import('@/app/api/minigame/submit-score/route'), method: 'POST', path: '/api/minigame/submit-score' },
  { name: 'mini-game voucher exchange', load: () => import('@/app/api/minigame/exchange-voucher/route'), method: 'POST', path: '/api/minigame/exchange-voucher' },
  { name: 'order list', load: () => import('@/app/api/orders/route'), method: 'GET', path: '/api/orders' },
  { name: 'order review', load: () => import('@/app/api/orders/[id]/reviews/route'), method: 'POST', path: '/api/orders/7/reviews' },
  { name: 'payment admin list', load: () => import('@/app/api/payments/route'), method: 'GET', path: '/api/payments' },
  { name: 'post create', load: () => import('@/app/api/posts/route'), method: 'POST', path: '/api/posts' },
  { name: 'post update', load: () => import('@/app/api/posts/[id]/route'), method: 'PUT', path: '/api/posts/7' },
  { name: 'post autosave', load: () => import('@/app/api/posts/autosave/route'), method: 'POST', path: '/api/posts/autosave' },
  { name: 'product create', load: () => import('@/app/api/products/route'), method: 'POST', path: '/api/products' },
  { name: 'product update', load: () => import('@/app/api/products/[id]/route'), method: 'PUT', path: '/api/products/7' },
  { name: 'profile avatar', load: () => import('@/app/api/user/update-avatar/route'), method: 'PUT', path: '/api/user/update-avatar' },
  { name: 'profile details', load: () => import('@/app/api/user/update-profile/route'), method: 'PUT', path: '/api/user/update-profile' },
  { name: 'user list', load: () => import('@/app/api/users/route'), method: 'GET', path: '/api/users' },
  { name: 'user delete', load: () => import('@/app/api/users/[id]/route'), method: 'DELETE', path: '/api/users/7' },
  { name: 'user role', load: () => import('@/app/api/users/[id]/role/route'), method: 'PATCH', path: '/api/users/7/role' },
  { name: 'available vouchers', load: () => import('@/app/api/vouchers/my-available/route'), method: 'GET', path: '/api/vouchers/my-available' },
  { name: 'voucher wallet', load: () => import('@/app/api/vouchers/my-wallet/route'), method: 'GET', path: '/api/vouchers/my-wallet' },
  { name: 'voucher redeem', load: () => import('@/app/api/vouchers/redeem/route'), method: 'POST', path: '/api/vouchers/redeem' },
  { name: 'webhook logs', load: () => import('@/app/api/webhooks/logs/route'), method: 'GET', path: '/api/webhooks/logs' },
]

const adminOnlyRoutes = protectedRoutes.filter(({ name }) => [
  'admin logs',
  'admin dashboard',
  'admin settings read',
  'admin settings write',
  'admin stats',
  'admin voucher create',
  'admin voucher history',
  'admin voucher stats',
  'admin user vouchers',
  'admin webhook test',
  'banner create',
  'banner update',
  'category create',
  'category update',
  'contact inbox',
  'contact update',
  'payment admin list',
  'post create',
  'post update',
  'post autosave',
  'product create',
  'product update',
  'user list',
  'user delete',
  'user role',
  'webhook logs',
].includes(name))

const adminWriteRoutes = adminOnlyRoutes.filter(({ name }) => [
  'admin settings write',
  'admin voucher create',
  'admin webhook test',
  'banner create',
  'banner update',
  'category create',
  'category update',
  'contact update',
  'post create',
  'post update',
  'post autosave',
  'product create',
  'product update',
  'user delete',
  'user role',
].includes(name))

const superAdminOnlyRoutes = protectedRoutes.filter(({ name }) => [
  'admin logs',
  'user list',
  'user delete',
  'user role',
].includes(name))

async function callProtectedRoute({ load, method, path }: ProtectedRouteCase) {
  const routeModule = await load()
  const handler = routeModule[method] as (
    request: NextRequest,
    context: { params: Promise<{ id: string; userId: string }> },
  ) => Promise<Response>
  const request = new NextRequest(`https://mushroomie.test${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: ['POST', 'PUT', 'PATCH'].includes(method) ? '{}' : undefined,
  })
  return handler(request, { params: Promise.resolve({ id: '7', userId: '7' }) })
}

describe('API authorization contract', () => {
  beforeEach(() => {
    authMocks.auth.mockResolvedValue(null)
  })

  it.each(protectedRoutes)('$name rejects anonymous access before database work', async ({ load, method, path }) => {
    const response = await callProtectedRoute({ name: '', load, method, path })

    expect([401, 403]).toContain(response.status)
  })

  it.each(adminOnlyRoutes)('$name rejects an authenticated regular user before database work', async (routeCase) => {
    authMocks.auth.mockResolvedValue({ user: { id: '7', email: 'user@example.com', role: 'user' } })
    const response = await callProtectedRoute(routeCase)

    expect([401, 403]).toContain(response.status)
  })

  it.each(adminWriteRoutes)('$name rejects a read-only viewer before database work', async (routeCase) => {
    authMocks.auth.mockResolvedValue({ user: { id: '8', email: 'viewer@example.com', role: 'viewer' } })
    const response = await callProtectedRoute(routeCase)

    expect([401, 403]).toContain(response.status)
  })

  it.each(superAdminOnlyRoutes)('$name rejects an ordinary admin before database work', async (routeCase) => {
    authMocks.auth.mockResolvedValue({ user: { id: '1', email: 'admin@example.com', role: 'admin' } })
    const response = await callProtectedRoute(routeCase)

    expect([401, 403]).toContain(response.status)
  })

  it('returns an explicit anonymous mini-game summary without database work', async () => {
    const { GET } = await import('@/app/api/minigame/player-summary/route')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ authenticated: false })
  })
})
