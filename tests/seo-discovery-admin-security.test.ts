import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

test('SEO discovery admin handlers keep authorization, strict validation, rate limits, and audit server-side', () => {
  const readRoute = read('src/app/api/admin/seo-discovery/route.ts')
  const actionRoute = read('src/app/api/admin/seo-discovery/actions/route.ts')
  const service = read('src/lib/seo-discovery/admin-api.ts')

  assert.match(readRoute, /await requireAdmin\(\)/)
  assert.match(readRoute, /isSeoDiscoveryAdminRole\(session\.user\.role\)/)
  assert.match(actionRoute, /session = await requireAdmin\(\)/)
  assert.match(actionRoute, /isSeoDiscoveryAdminRole\(session\.user\.role\)/)
  assert.match(actionRoute, /isSameOriginRequest\(request\)/)
  assert.match(actionRoute, /CANONICAL_ADMIN_ORIGIN = 'https:\/\/mushroomie\.io\.vn'/)
  assert.match(actionRoute, /DEVELOPMENT_ADMIN_ORIGINS/)
  assert.doesNotMatch(actionRoute, /forwarded-host|x-forwarded-host|x-forwarded-proto/)
  assert.match(actionRoute, /application\/json/)
  assert.match(actionRoute, /rateLimiter\.isLimited\(/)
  assert.match(actionRoute, /admin-user:\$\{String\(session\.user\.id\)\}/)
  assert.match(actionRoute, /logAdminAction\(/)
  assert.match(service, /z\.discriminatedUnion\('action'/)
  assert.match(service, /\.max\(MAX_PAGE_SIZE\)/)
  assert.match(service, /\.max\(MAX_RETRY_IDS\)/)
  assert.match(service, /MAX_DATABASE_ID = 2_147_483_647/)
  assert.match(service, /\.max\(MAX_DATABASE_ID\)/)
  assert.match(service, /z\.literal\('retry'\)/)
  assert.match(service, /z\.literal\('sync_sitemap'\)/)
  assert.match(service, /z\.literal\('test_connection'\)/)
  assert.match(service, /z\.literal\('submit_sitemap'\)/)
  assert.doesNotMatch(actionRoute, /payload\.(?:url|property|credential)/)
  assert.match(actionRoute, /submitSitemap\(FIXED_SITEMAP_URL\)/)
})
test('manual retries and configuration recovery use exact bounded lease-aware CAS branches', () => {
  const service = read('src/lib/seo-discovery/admin-api.ts')

  assert.match(service, /CONFIGURATION_RECOVERY_LIMIT = 10/)
  assert.match(service, /content_updated_at: new Date\(snapshot\.content_updated_at\.getTime\(\)\)/)
  assert.match(service, /updated_at: new Date\(snapshot\.updated_at\.getTime\(\)\)/)
  assert.match(service, /lease_token: snapshot\.lease_token/)
  assert.match(service, /lease_expires_at: snapshot\.lease_expires_at/)
  assert.match(service, /status: 'CONFIGURATION_REQUIRED'/)
  assert.match(service, /status: 'PENDING_ELIGIBILITY'/)
  assert.match(service, /status: 'RETRY'/)
})

test('admin reads use one short repeatable database snapshot before Google I/O', () => {
  const service = read('src/lib/seo-discovery/admin-api.ts')

  assert.match(service, /Prisma\.TransactionIsolationLevel\.RepeatableRead/)
  assert.match(service, /maxWait: 500/)
  assert.match(service, /timeout: 2_000/)
  assert.match(service, /prisma\.\$transaction\(async \(transaction\)/)
  assert.match(service, /const effectivePage = Math\.min\(filters\.page, totalPages\)/)
  assert.match(service, /const google = await readGoogleOverview\(\)/)
})

test('admin page stays server-side, blocks viewer access, and exposes only one focused client dashboard', () => {
  const page = read('src/app/admin/seo/lap-chi-muc/page.tsx')

  assert.doesNotMatch(page, /^['"]use client['"]/m)
  assert.match(page, /await requireAdmin\(\)/)
  assert.match(page, /<SeoDiscoveryDashboard\s*\/?>/)
  assert.doesNotMatch(page, /GOOGLE_APPLICATION_CREDENTIALS|private_key|access_token/)
})

test('dashboard and sidebar preserve accessibility, policy copy, and lightweight admin boundaries', () => {
  const dashboard = read('src/components/admin/SeoDiscoveryDashboard.tsx')
  const sidebar = read('src/components/layout/AdminSidebar.tsx')

  assert.match(sidebar, /SearchCheck/)
  assert.match(sidebar, /href: '\/admin\/seo\/lap-chi-muc'/)
  assert.match(sidebar, /label: 'Lập chỉ mục'/)
  assert.match(sidebar, /label: 'Lập chỉ mục', adminOnly: true/)
  assert.match(sidebar, /!item\.adminOnly \|\| role === 'admin' \|\| role === 'super_admin'/)
  assert.match(dashboard, /Google quyết định thời điểm và khả năng lập chỉ mục/)
  assert.match(dashboard, /min-h-11/)
  assert.match(dashboard, /aria-label=/)
  assert.match(dashboard, /requestGenerationRef/)
  assert.match(dashboard, /Google crawl:/)
  assert.doesNotMatch(dashboard, /from ['"](?:recharts|gsap|framer-motion|chart\.js)['"]/)
  assert.doesNotMatch(dashboard, /GOOGLE_APPLICATION_CREDENTIALS|private_key|access_token|raw_google_response/)
})
