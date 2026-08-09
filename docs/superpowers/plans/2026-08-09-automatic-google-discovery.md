# Automatic Google Discovery and Indexing Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically make newly public Mushroomie articles, products, and deployed pages discoverable through the canonical sitemap, then monitor their Google Search Console inspection state without misusing Google's Indexing API or promising guaranteed indexing.

**Architecture:** Publication routes emit one normalized event into a durable Prisma queue and invalidate the relevant Next.js paths. A bounded maintenance worker validates eligibility, synchronizes sitemap URLs, and optionally calls the Search Console Sitemap and URL Inspection APIs through a disabled-by-default adapter. A protected admin dashboard exposes queue health, configuration state, retries, and inspection evidence. All external calls are same-origin or fixed Google endpoints, use timeouts, and remain idempotent.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Prisma 5/MySQL, Vitest 4, Node test runner, `google-auth-library@11.0.0`, PM2, Nginx.

## Global Constraints

- Work from a clean `codex/automatic-google-discovery` branch based on the current `main`; do not implement in the detached/dirty auxiliary worktree.
- Before changing Next.js cache behavior, read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md` and the applicable route-handler documentation shipped with this installed Next.js version.
- Use test-driven development: write the failing test, run it and confirm the expected failure, implement only enough behavior to pass, then refactor.
- Never call Google's Indexing API for ordinary Mushroomie blog, product, category, or static pages. Only Search Console Sitemap and URL Inspection APIs are in scope; URL Inspection is read-only.
- Treat sitemap submission as a discovery hint, not a guarantee of indexing. Submit only when the sitemap has changed since the last successful submission.
- Default both feature flags to disabled. Missing credentials must produce `CONFIGURATION_REQUIRED`, never crash the app or block publishing.
- Store the Google service-account JSON outside the repository and outside `public/`; never log its private key, OAuth token, raw credential content, cookies, or session data.
- All public URLs must have exact origin `https://mushroomie.io.vn`; reject credentials, fragments, non-default ports, unapproved query strings, redirects off-origin, and private/admin/account/payment routes.
- Do not alter checkout, payment, voucher, upload, auth, user, or order behavior.
- Before applying the migration to production: run `./scripts/backup-production.sh`, inspect the backup, run a migration dry-run/SQL review, and obtain the user's explicit production-apply confirmation. This plan does not authorize that destructive-risk step by itself.
- Rollback is feature-flag-first: disable workers and GSC calls while retaining the additive table for audit history. Do not drop the table during an incident rollback.

---

### Task 1: Add the durable SEO discovery queue schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260809090000_add_seo_discovery_jobs/migration.sql`
- Create: `tests/seo-discovery-schema.test.ts`

- [ ] **Step 1: Write a failing schema contract test**

Add a legacy Node test that reads `prisma/schema.prisma` and the migration SQL and asserts the table, unique URL, scheduling index, source index, lease fields, and all required evidence columns exist:

```ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync('prisma/schema.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260809090000_add_seo_discovery_jobs/migration.sql',
  'utf8',
)

test('SeoDiscoveryJob stores durable scheduling and inspection evidence', () => {
  for (const field of [
    'url', 'source_type', 'source_id', 'content_updated_at', 'status',
    'eligibility_status', 'http_status', 'declared_canonical', 'robots_indexable',
    'gsc_verdict', 'coverage_state', 'page_fetch_state', 'google_canonical',
    'last_crawl_at', 'last_inspected_at', 'next_attempt_at', 'attempt_count',
    'last_error_code', 'last_error_message', 'lease_token', 'lease_expires_at',
  ]) assert.match(schema, new RegExp(`\\b${field}\\b`))

  assert.match(migration, /CREATE TABLE `seo_discovery_jobs`/)
  assert.match(migration, /UNIQUE INDEX `seo_discovery_jobs_url_key`/)
  assert.match(migration, /INDEX `seo_discovery_jobs_status_next_attempt_at_idx`/)
})
```

- [ ] **Step 2: Run the test and confirm it fails because the model/migration is absent**

Run: `npx tsx --test tests/seo-discovery-schema.test.ts`

Expected: FAIL with an `ENOENT` for the migration or a missing `SeoDiscoveryJob` field assertion.

- [ ] **Step 3: Add the additive Prisma model**

Append this model near the other operational/audit tables:

```prisma
model SeoDiscoveryJob {
  id                   Int       @id @default(autoincrement())
  url                  String    @unique @db.VarChar(512)
  source_type          String    @db.VarChar(32)
  source_id            Int?
  content_updated_at   DateTime
  status               String    @default("PENDING_ELIGIBILITY") @db.VarChar(40)
  eligibility_status   String?   @db.VarChar(40)
  http_status          Int?
  declared_canonical   String?   @db.VarChar(512)
  robots_indexable     Boolean?
  gsc_verdict          String?   @db.VarChar(80)
  coverage_state       String?   @db.VarChar(160)
  page_fetch_state     String?   @db.VarChar(80)
  google_canonical     String?   @db.VarChar(512)
  last_crawl_at        DateTime?
  last_inspected_at    DateTime?
  next_attempt_at      DateTime  @default(now())
  attempt_count        Int       @default(0)
  last_error_code      String?   @db.VarChar(80)
  last_error_message   String?   @db.Text
  lease_token          String?   @db.VarChar(64)
  lease_expires_at     DateTime?
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt

  @@index([status, next_attempt_at])
  @@index([source_type, source_id])
  @@index([lease_expires_at])
  @@map("seo_discovery_jobs")
}
```

Create matching MySQL SQL with `utf8mb4`-safe column widths and only additive `CREATE TABLE`/indexes. Do not edit old migrations.

- [ ] **Step 4: Validate schema and migration contract locally without touching any database**

Run: `npx prisma format && npx prisma validate && npx tsx --test tests/seo-discovery-schema.test.ts`

Expected: Prisma validation succeeds and the test passes. No `prisma db push` or migration apply occurs.

- [ ] **Step 5: Commit the schema unit**

```bash
git add prisma/schema.prisma prisma/migrations/20260809090000_add_seo_discovery_jobs/migration.sql tests/seo-discovery-schema.test.ts
git commit -m "feat(seo): add discovery job queue schema"
```

---

### Task 2: Implement configuration, normalized events, and idempotent queue recording

**Files:**
- Create: `src/lib/seo-discovery/types.ts`
- Create: `src/lib/seo-discovery/config.ts`
- Create: `src/lib/seo-discovery/urls.ts`
- Create: `src/lib/seo-discovery/repository.ts`
- Create: `src/lib/seo-discovery/__tests__/config.test.ts`
- Create: `src/lib/seo-discovery/__tests__/urls.test.ts`
- Create: `src/lib/seo-discovery/__tests__/repository.test.ts`

- [ ] **Step 1: Write failing tests for safe defaults and canonical URL construction**

Test that flags are false unless the literal value is `true`, the default property is `sc-domain:mushroomie.io.vn`, slugs are encoded as path segments, and all constructed URLs use the production origin:

```ts
expect(readSeoDiscoveryConfig({})).toMatchObject({
  discoveryEnabled: false,
  gscEnabled: false,
  property: 'sc-domain:mushroomie.io.vn',
})
expect(buildPublicContentUrl('post', 'vong tay do')).toBe(
  'https://mushroomie.io.vn/tin-tuc/vong%20tay%20do',
)
```

- [ ] **Step 2: Run the focused tests and confirm module-not-found failures**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/config.test.ts src/lib/seo-discovery/__tests__/urls.test.ts`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Define the public contract and explicit status union**

```ts
export type SeoDiscoveryStatus =
  | 'PENDING_ELIGIBILITY' | 'ELIGIBLE' | 'INSPECTION_SCHEDULED'
  | 'INDEXED' | 'NOT_INDEXED' | 'RETRY' | 'SKIPPED'
  | 'CONFIGURATION_REQUIRED' | 'ERROR'

export interface PublicContentPublication {
  source: 'post' | 'product' | 'sitemap_sync'
  sourceId?: number
  url: string
  contentUpdatedAt: Date
  reason: 'created' | 'published' | 'updated' | 'activated' | 'scheduled' | 'deploy_sync'
}
```

Implement `readSeoDiscoveryConfig(env)`, `buildPublicContentUrl(source, slug)`, and `assertProductionUrl(url)` without accepting a caller-controlled origin.

- [ ] **Step 4: Write a failing repository test with a mocked Prisma client**

Verify `recordPublicContentPublication()` uses `upsert({ where: { url } })`; a newer `contentUpdatedAt` resets status, attempts, errors, and inspection evidence; an older/equal event does not reset an indexed job.

- [ ] **Step 5: Implement idempotent persistence**

Use one comparison read followed by an upsert. Normalize the URL before persistence. On a newer version set:

```ts
{
  status: 'PENDING_ELIGIBILITY',
  eligibility_status: null,
  next_attempt_at: new Date(),
  attempt_count: 0,
  last_error_code: null,
  last_error_message: null,
  last_inspected_at: null,
  lease_token: null,
  lease_expires_at: null,
}
```

Do not make publication fail if queue recording fails: log only the source type/id and a stable error code, then return `{ recorded: false }`.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__ && npm run typecheck`

Expected: all focused tests and TypeScript pass.

- [ ] **Step 7: Commit the core queue contract**

```bash
git add src/lib/seo-discovery
git commit -m "feat(seo): add discovery queue contract"
```

---

### Task 3: Build the SSRF-safe eligibility gate and sitemap parser

**Files:**
- Create: `src/lib/seo-discovery/eligibility.ts`
- Create: `src/lib/seo-discovery/sitemap-reader.ts`
- Create: `src/lib/seo-discovery/__tests__/eligibility.test.ts`
- Create: `src/lib/seo-discovery/__tests__/sitemap-reader.test.ts`

- [ ] **Step 1: Write a table-driven failing URL safety test**

Cover valid `/tin-tuc/<slug>`, `/san-pham/<slug>`, categories, and static pages. Reject HTTP, other hosts, credentials, fragments, explicit ports, unapproved queries, encoded path traversal, duplicate slashes, and these prefixes:

```ts
const blockedPrefixes = [
  '/admin', '/api', '/tai-khoan', '/gio-hang', '/thanh-toan',
  '/checkout', '/uploads', '/_next',
]
```

- [ ] **Step 2: Write failing response checks**

Mock `fetch` to assert a 5-second abort timeout, maximum five redirects handled manually, every redirect revalidated as exact-origin, final `200`, canonical exact match, no `noindex`, and sitemap membership. Include failures for 404, 500, cross-origin redirect, canonical mismatch, robots noindex, oversized body, and timeout.

- [ ] **Step 3: Implement the pure URL gate and bounded fetch**

Use `redirect: 'manual'`, `AbortSignal.timeout(5_000)`, a maximum 256 KiB HTML read, and accept `text/html` only. Resolve relative canonical URLs against the already validated final URL. Never fetch a URL until `validatePublicUrl()` passes.

- [ ] **Step 4: Implement fixed sitemap reading**

Fetch only the constant `https://mushroomie.io.vn/sitemap.xml`, with the same timeout/redirect/origin rules and a 2 MiB limit. Parse the generated sitemap's `<url>`, `<loc>`, and optional `<lastmod>` blocks, decode XML entities, reject duplicate/conflicting URLs, and return `Map<string, Date | null>`. Do not accept a sitemap URL from query/body input.

- [ ] **Step 5: Run the eligibility suite**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/eligibility.test.ts src/lib/seo-discovery/__tests__/sitemap-reader.test.ts`

Expected: all valid/invalid, redirect, timeout, canonical, robots, and sitemap cases pass.

- [ ] **Step 6: Commit the eligibility boundary**

```bash
git add src/lib/seo-discovery/eligibility.ts src/lib/seo-discovery/sitemap-reader.ts src/lib/seo-discovery/__tests__
git commit -m "feat(seo): validate discovery eligibility safely"
```

---

### Task 4: Centralize publication recording and Next.js cache revalidation

**Files:**
- Create: `src/lib/seo-discovery/publication.ts`
- Create: `src/lib/seo-discovery/__tests__/publication.test.ts`
- Modify: `src/app/api/posts/route.ts`
- Modify: `src/app/api/posts/[id]/route.ts`
- Modify: `src/app/api/posts/bulk/route.ts`
- Modify: `src/app/api/posts/bulk-import/route.ts`
- Create: `tests/seo-discovery-publish-paths.test.ts`

- [ ] **Step 1: Read installed Next.js cache documentation**

Read the full local `revalidatePath` guide and record any Next.js 16 constraints in the implementation commit message/body. Do not rely on remembered APIs.

- [ ] **Step 2: Write failing publication helper tests**

Mock `next/cache` and the repository. For a post event require revalidation of the detail URL, `/tin-tuc`, `/sitemap.xml`, `/feed.xml`, and `/` only because the current homepage consumes recent posts. For a product event require the detail URL, `/san-pham`, `/sitemap.xml`, and `/`.

- [ ] **Step 3: Implement the single orchestration entry point**

```ts
export async function recordAndRevalidatePublication(
  event: PublicContentPublication,
): Promise<{ recorded: boolean }> {
  revalidatePublishedContent(event)
  return recordPublicContentPublication(event)
}
```

Cache invalidation must happen even when discovery is disabled; durable queue recording happens only when `SEO_DISCOVERY_ENABLED=true`.

- [ ] **Step 4: Add source-level regression tests for every post publication path**

`tests/seo-discovery-publish-paths.test.ts` must assert the helper is called after the database write in:

- create with `status === 'published'`;
- update from non-public to `published`;
- update an already published post when slug/content/SEO/canonical changes;
- bulk `publish` for each successfully transitioned post;
- bulk import for each created/updated published row.

It must also assert draft, scheduled-future, private, hidden, trash, failed imports, and autosaves do not enqueue.

- [ ] **Step 5: Wire the four route families**

Build each event from the post returned by Prisma, never directly from untrusted request fields. When the slug changes, revalidate the old detail path and enqueue only the new canonical URL. Await the helper after the successful write/logging operation; catch queue failures inside the helper so API success semantics stay unchanged.

- [ ] **Step 6: Run focused and full legacy regression tests**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/publication.test.ts && npx tsx --test tests/seo-discovery-publish-paths.test.ts tests/bulk-import.test.ts tests/sitemap-post-inclusion.test.ts`

Expected: all pass; existing post visibility rules remain unchanged.

- [ ] **Step 7: Commit publication integration**

```bash
git add src/lib/seo-discovery/publication.ts src/lib/seo-discovery/__tests__/publication.test.ts src/app/api/posts tests/seo-discovery-publish-paths.test.ts
git commit -m "feat(seo): enqueue published content changes"
```

---

### Task 5: Cover scheduled posts, active products, and sitemap/deploy synchronization

**Files:**
- Modify: `src/lib/scheduled-publisher.ts`
- Modify: `src/app/api/cron/publish-scheduled-posts/route.ts`
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/products/[id]/route.ts`
- Modify: `src/lib/product-revalidate.ts`
- Create: `src/lib/seo-discovery/sitemap-sync.ts`
- Create: `src/lib/seo-discovery/__tests__/sitemap-sync.test.ts`
- Create: `tests/seo-discovery-scheduled-products.test.ts`

- [ ] **Step 1: Write failing scheduled-publication tests**

Require `publishDuePosts()` to return the exact rows actually transitioned, including `id`, `slug`, and `updated_at`, rather than only a count. Simulate a race where another worker already published one selected row and assert that row is not emitted twice.

- [ ] **Step 2: Refactor scheduled publishing into one shared implementation**

Make both the in-process tick and `/api/cron/publish-scheduled-posts` call `publishDuePosts()`. Select due rows, conditionally update each row with `where: { id, status: 'scheduled' }`, and emit only successful transitions. Then record/revalidate a `reason: 'scheduled'` event for each result. Preserve the cron response fields and `CRON_SECRET` timing-safe authorization.

- [ ] **Step 3: Write failing product transition tests**

Require a queue event when creating an active product, changing inactive→active, or materially updating an already active product. Do not enqueue inactive products. If an active product slug changes, invalidate both old and new detail paths and enqueue only the new URL.

- [ ] **Step 4: Wire product routes through the shared publication helper**

Expand the update route's existing selection to include `status` and `updated_at`; build events from saved Prisma rows. Keep the existing `revalidateProduct()` behavior or fold it into the central helper without duplicate invalidation.

- [ ] **Step 5: Write and implement sitemap synchronization**

Tests must prove `syncSitemapDiscoveryJobs()`:

- upserts newly observed exact-origin URLs with `source_type='sitemap_sync'` and `reason='deploy_sync'` semantics;
- resets a job only when `<lastmod>` advances;
- leaves unchanged URLs and inspection evidence untouched;
- marks missing formerly synchronized URLs `SKIPPED` with `last_error_code='REMOVED_FROM_SITEMAP'` but does not delete them;
- never changes post/product rows based only on absence from one sitemap fetch.

- [ ] **Step 6: Run focused regression tests**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-sync.test.ts && npx tsx --test tests/seo-discovery-scheduled-products.test.ts tests/product-slug-integration.test.ts tests/sitemap-post-inclusion.test.ts`

Expected: scheduled and product transitions are exact-once at the event level; sitemap sync is idempotent.

- [ ] **Step 7: Commit source coverage**

```bash
git add src/lib/scheduled-publisher.ts src/app/api/cron/publish-scheduled-posts/route.ts src/app/api/products src/lib/product-revalidate.ts src/lib/seo-discovery/sitemap-sync.ts src/lib/seo-discovery/__tests__/sitemap-sync.test.ts tests/seo-discovery-scheduled-products.test.ts
git commit -m "feat(seo): cover scheduled and product discovery"
```

---

### Task 6: Add the Google Search Console adapter with disabled mode

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/seo-discovery/gsc-client.ts`
- Create: `src/lib/seo-discovery/google-gsc-client.ts`
- Create: `src/lib/seo-discovery/__tests__/gsc-client.test.ts`
- Modify: `.env.example` if it exists; otherwise create: `docs/operations/google-search-console.md`

- [ ] **Step 1: Add the official server-only authentication library**

Run: `npm install google-auth-library@11.0.0 --save-exact`

Then run: `npm audit --omit=dev`

Expected: lockfile changes only for the official Google authentication dependency tree; no new high/critical vulnerability. Stop and investigate rather than overriding an audit failure.

- [ ] **Step 2: Write failing adapter contract tests**

Define and test:

```ts
export interface GoogleSearchConsoleClient {
  getConnectionStatus(): Promise<ConnectionStatus>
  listSitemaps(): Promise<SitemapStatus[]>
  submitSitemap(sitemapUrl: string): Promise<void>
  inspectUrl(url: string): Promise<UrlInspectionResult>
}
```

Tests must verify disabled/missing-credential status, exact Search Console REST endpoints, encoded property and sitemap parameters, `inspectionUrl`/`siteUrl` request body, 5-second timeouts, redacted errors, and typed handling for 401, 403, 404, 429, and 5xx. Mock both auth and `fetch`; never call Google in tests.

- [ ] **Step 3: Implement disabled-first client selection**

`createGoogleSearchConsoleClient()` returns a no-network disabled adapter unless both `SEO_DISCOVERY_ENABLED` and `GSC_INTEGRATION_ENABLED` are true and `GOOGLE_APPLICATION_CREDENTIALS` points to a readable regular file outside the repository/public tree.

- [ ] **Step 4: Implement least-privilege authenticated REST calls**

Use `GoogleAuth` with scope `https://www.googleapis.com/auth/webmasters`, obtain authorization headers server-side, and call only:

- `https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps`
- `https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}`
- `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

Validate all inspected URLs with `assertProductionUrl()` before the call. Never expose the adapter in client components.

- [ ] **Step 5: Document secure configuration**

Document these exact flags and the service-account ownership steps:

```dotenv
SEO_DISCOVERY_ENABLED=false
GSC_INTEGRATION_ENABLED=false
GSC_PROPERTY=sc-domain:mushroomie.io.vn
GOOGLE_APPLICATION_CREDENTIALS=/etc/mushroomie/gsc-service-account.json
```

State that the service account must be added to the Search Console property with least privilege and that enabling occurs only after a successful connection check.

- [ ] **Step 6: Run tests, audit, and typecheck**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/gsc-client.test.ts && npm audit --omit=dev && npm run typecheck`

Expected: tests pass, no high/critical production vulnerability, TypeScript passes.

- [ ] **Step 7: Commit the adapter**

```bash
git add package.json package-lock.json src/lib/seo-discovery/gsc-client.ts src/lib/seo-discovery/google-gsc-client.ts src/lib/seo-discovery/__tests__/gsc-client.test.ts docs/operations/google-search-console.md
git commit -m "feat(seo): add Search Console inspection adapter"
```

---

### Task 7: Implement bounded worker leasing, retries, and inspection schedule

**Files:**
- Create: `src/lib/seo-discovery/worker.ts`
- Create: `src/lib/seo-discovery/retry.ts`
- Create: `src/lib/seo-discovery/__tests__/worker.test.ts`
- Modify: `src/lib/scheduled-publisher.ts`
- Modify: `src/app/api/cron/publish-scheduled-posts/route.ts`

- [ ] **Step 1: Write failing lease and concurrency tests**

Assert a batch size of at most 10, a 2-minute lease, an atomic conditional `updateMany` claim per candidate, and processing only rows carrying this worker's random lease token. Simulate two workers selecting the same row and prove only one obtains the lease.

- [ ] **Step 2: Write failing state-transition tests**

Cover:

- eligibility failure → `SKIPPED` with evidence;
- missing GSC configuration → `CONFIGURATION_REQUIRED` without rapid retries;
- eligible, never inspected → next inspection now;
- not indexed → inspections at approximately 24 hours, 72 hours, then 7 days;
- indexed → weekly recheck only when content has not changed;
- 429/5xx/network timeout → exponential backoff with deterministic testable jitter injection;
- 401/403 → `CONFIGURATION_REQUIRED` and no repeated calls every minute;
- malformed API response → `ERROR` with a redacted stable code.

- [ ] **Step 3: Implement pure retry scheduling**

```ts
export const INSPECTION_DELAYS_MS = [
  24 * 60 * 60 * 1000,
  72 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
] as const
```

Keep `computeNextAttempt()` pure by injecting `now` and `random`; cap transient retries at 24 hours and inspection retries at 7 days.

- [ ] **Step 4: Implement worker flow**

For each leased row: re-read it, validate eligibility, persist eligibility evidence, optionally ensure the sitemap is registered only if its fingerprint/last successful state changed, inspect when due, map Google results into the stored evidence columns, schedule the next attempt, and clear the lease in a `finally` path. Publication is never rolled back because the worker fails.

- [ ] **Step 5: Integrate with both maintenance triggers**

After scheduled publishing and inventory release, run one bounded discovery batch only when enabled. The protected cron endpoint should also run one batch and return a non-sensitive `discovery` summary (`claimed`, `processed`, `failed`, `configurationRequired`) while preserving current response compatibility.

- [ ] **Step 6: Run worker and maintenance tests**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/worker.test.ts && npx tsx --test tests/admin-maintenance.test.ts tests/seo-discovery-scheduled-products.test.ts`

Expected: concurrency, retries, and disabled mode pass; maintenance remains resilient.

- [ ] **Step 7: Commit worker integration**

```bash
git add src/lib/seo-discovery/worker.ts src/lib/seo-discovery/retry.ts src/lib/seo-discovery/__tests__/worker.test.ts src/lib/scheduled-publisher.ts src/app/api/cron/publish-scheduled-posts/route.ts
git commit -m "feat(seo): process discovery jobs safely"
```

---

### Task 8: Add protected admin APIs and indexing monitor UI

**Files:**
- Create: `src/app/api/admin/seo-discovery/route.ts`
- Create: `src/app/api/admin/seo-discovery/actions/route.ts`
- Create: `src/app/admin/seo/lap-chi-muc/page.tsx`
- Create: `src/components/admin/SeoDiscoveryDashboard.tsx`
- Modify: `src/components/layout/AdminSidebar.tsx`
- Create: `src/lib/seo-discovery/__tests__/admin-api.test.ts`
- Create: `src/components/admin/__tests__/SeoDiscoveryDashboard.test.tsx`
- Create: `tests/seo-discovery-admin-security.test.ts`

- [ ] **Step 1: Write failing API authorization and validation tests**

Require admin/super-admin session for reads and actions, reject anonymous/user roles, validate filters and IDs with Zod, cap page size at 100, and rate-limit mutating actions. Supported actions are exactly `retry`, `sync_sitemap`, `test_connection`, and `submit_sitemap`; no arbitrary URL, property, or credential input is accepted.

- [ ] **Step 2: Implement paginated read API**

Return summary counts, connection state, last sitemap submission, and a paginated job list with filters for status/source/search. Search must be bounded and URL/source only. Do not return credential paths, tokens, stack traces, or raw Google responses.

- [ ] **Step 3: Implement audited actions API**

`retry` resets selected non-leased jobs to `RETRY`/now; `sync_sitemap` invokes the fixed sitemap sync; `test_connection` calls `getConnectionStatus`; `submit_sitemap` submits only the fixed canonical sitemap when configured. Log admin actions using `logAdminAction()` with counts/IDs, not secrets.

- [ ] **Step 4: Write failing dashboard interaction tests**

Test loading, empty, configured/unconfigured, partial error, filtered table, pagination, retry confirmation, disabled buttons while pending, and readable Vietnamese status labels. Ensure all controls have accessible names and minimum 44px mobile targets.

- [ ] **Step 5: Implement the admin page and client island**

Keep `page.tsx` as a Server Component that checks the existing admin layout/session boundary and renders one focused client dashboard. Add summary cards for pending/indexed/not indexed/errors, configuration banner, filters, evidence columns, timestamps, and explicit copy: “Google quyết định thời điểm và khả năng lập chỉ mục; hệ thống này chỉ hỗ trợ khám phá và theo dõi.”

- [ ] **Step 6: Add sidebar navigation**

Add a Search icon entry under “Nội dung & hệ thống”:

```ts
{ href: '/admin/seo/lap-chi-muc', icon: SearchCheck, label: 'Lập chỉ mục' }
```

- [ ] **Step 7: Run API/UI/security tests**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/admin-api.test.ts src/components/admin/__tests__/SeoDiscoveryDashboard.test.tsx && npx tsx --test tests/seo-discovery-admin-security.test.ts`

Expected: all tests pass; ordinary users cannot read or mutate discovery state.

- [ ] **Step 8: Verify responsive UI with Chrome DevTools MCP**

Start the app with test data, inspect `/admin/seo/lap-chi-muc` at 1440px, 1366px, 390px, and 360px. Verify no horizontal page scroll, table remains usable, no broken icons/images, no serious console errors, and no failed API request. If Chrome DevTools MCP is unavailable, report that limitation and do not claim browser verification.

- [ ] **Step 9: Commit the admin surface**

```bash
git add src/app/api/admin/seo-discovery src/app/admin/seo/lap-chi-muc src/components/admin/SeoDiscoveryDashboard.tsx src/components/admin/__tests__/SeoDiscoveryDashboard.test.tsx src/components/layout/AdminSidebar.tsx src/lib/seo-discovery/__tests__/admin-api.test.ts tests/seo-discovery-admin-security.test.ts
git commit -m "feat(admin): monitor Google discovery status"
```

---

### Task 9: Add rollout tooling, documentation, and full verification

**Files:**
- Create: `scripts/seo-discovery-backfill.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/operations/google-search-console.md`
- Create: `tests/seo-discovery-backfill.test.ts`

- [ ] **Step 1: Write a failing dry-run backfill test**

Require dry-run by default, explicit `--apply`, fixed-origin URL construction, public posts/products only, batches of 100, idempotent upserts, no deletes, and a summary with `scanned`, `wouldCreate`, `wouldReset`, `unchanged`, and `errors`.

- [ ] **Step 2: Implement the safe backfill command**

Add scripts:

```json
{
  "seo:discovery:backfill": "tsx scripts/seo-discovery-backfill.ts",
  "seo:discovery:backfill:apply": "tsx scripts/seo-discovery-backfill.ts --apply"
}
```

Dry-run must make no writes. Apply must use the same repository logic as live publication events.

- [ ] **Step 3: Document operations and rollback**

Update README and the runbook with architecture, flags, credential placement/permissions, service-account Search Console access, dry-run/apply commands, admin route, interpretation of statuses, quotas, 24h/72h/7d schedule, sitemap-hint disclaimer, monitoring commands, and feature-flag rollback. Explicitly state that “Request indexing” cannot be automated through URL Inspection API.

- [ ] **Step 4: Run the complete local verification gate**

Run in this order:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run test
npm run lint --if-present
npm run typecheck --if-present
npm run build
npm audit --omit=dev
```

Expected: all commands pass and audit reports no high/critical production vulnerability. If lint reveals pre-existing out-of-scope failures, capture exact evidence and do not hide/ignore them.

- [ ] **Step 5: Review the entire diff for secrets and scope**

Run:

```bash
git diff --check
git diff --stat main...
git diff main... -- . ':(exclude)package-lock.json'
git status --short
```

Confirm there are no credentials, private keys, `.env`, build output, uploads, backups, logs, temporary files, or unrelated user artifacts staged.

- [ ] **Step 6: Commit documentation and rollout tooling**

```bash
git add scripts/seo-discovery-backfill.ts package.json package-lock.json README.md docs/operations/google-search-console.md tests/seo-discovery-backfill.test.ts
git commit -m "docs(seo): add discovery rollout runbook"
```

- [ ] **Step 7: Request code review before production migration/deploy**

Use the `requesting-code-review` skill, resolve actionable findings, rerun affected tests, and present the final commit list and risk report. Do not push/deploy until review is clean.

- [ ] **Step 8: Prepare the production database change, then stop for confirmation**

On the new production VPS (not the stale `103.173.226.86` host), verify the exact host/project path, create and inspect `./scripts/backup-production.sh` output, inspect pending migration SQL, and run only non-mutating status/dry-run checks. Present the backup path, SQL summary, expected lock/unique-index warning, rollback plan, and ask for explicit confirmation before `prisma migrate deploy` or equivalent schema application.

- [ ] **Step 9: After confirmation, deploy with the repository production skill**

Use `source-command-deploy-production` and preserve the required standalone layout: release assets at `<release>/.next-deploy/static`, public files excluding uploads, absolute `public/uploads` symlink, release `.env`, Nginx static copy at `/var/www/mushroomie/.next/static`, and `standalone.previous.<timestamp>` until health/MIME checks pass. Do not run a deploy path that deletes rollback releases or performs an uncontrolled `db push`.

- [ ] **Step 10: Verify production before enabling Google calls**

With both flags still false, verify PM2 logs, `/`, `/san-pham`, `/tin-tuc`, `/sitemap.xml`, `/feed.xml`, `/admin/seo/lap-chi-muc`, `/mini-game`, `/tai-khoan/dang-nhap`, `/gio-hang`, `/thanh-toan`, `/admin`, CSS/JS MIME, uploads, product images, and payment QR. Then enable only `SEO_DISCOVERY_ENABLED=true`, run/inspect the backfill, and observe queue health. Enable `GSC_INTEGRATION_ENABLED=true` only after `test_connection` succeeds and the Search Console property confirms access.

- [ ] **Step 11: Final production acceptance**

Publish one controlled article or activate one controlled product, verify its canonical URL appears in `/sitemap.xml`, confirm exactly one durable job, confirm eligibility evidence, confirm no Indexing API call, and confirm URL Inspection evidence is stored after the first scheduled inspection run. Report Google state as observed evidence, never as a guaranteed indexed result.

---

## Acceptance Checklist

- [ ] Every public post path, scheduled publication, active product path, and sitemap/deploy sync records an idempotent canonical job.
- [ ] Draft/private/hidden/trash/inactive/admin/account/checkout URLs never enter eligible processing.
- [ ] Publishing succeeds even when the discovery subsystem or Google is unavailable.
- [ ] Cache invalidation covers detail, listing, sitemap, feed (articles), and homepage only where content is consumed.
- [ ] The sitemap is submitted only when changed; URL Inspection is read-only; Indexing API is absent.
- [ ] Worker concurrency cannot process one job simultaneously; retries are bounded and observable.
- [ ] Missing/bad credentials become `CONFIGURATION_REQUIRED` without log spam or server crashes.
- [ ] Admin APIs enforce backend authorization, validation, rate limits, pagination, and redacted responses.
- [ ] Admin UI is usable at desktop and 360/390px mobile sizes with no serious console/network errors.
- [ ] Migration is additive, backed up, reviewed, explicitly confirmed, and retains data on rollback.
- [ ] Full tests, lint, typecheck, build, audit, PM2, production routes, asset MIME, uploads/images, and QR checks pass before completion is claimed.
