# Automatic Sitemap Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tự động phát hiện URL trang tĩnh/local/catalog mới trong sitemap ngay sau startup và tối đa mỗi giờ, trước discovery worker, không cần thao tác quản trị và không gọi Google khi GSC đang tắt.

**Architecture:** Một coordinator server-only cấp process giữ `lastSuccessfulAtMs` và một in-flight promise trên `globalThis`. Coordinator gọi implementation `syncSitemapDiscoveryJobs()` hiện có, chạy fail-soft và được dùng bởi cả interval maintenance lẫn protected cron backstop; transaction/CAS/idempotency vẫn thuộc sitemap-sync hiện hữu.

**Tech Stack:** Next.js 16.2.11 App Router, TypeScript, Prisma 5.22/MySQL 8, Vitest 4, Node test runner, PM2 standalone, Nginx.

## Global Constraints

- Không thay đổi Prisma schema hoặc chạy DDL.
- Không thêm dependency.
- Không tạo, đọc, ghi hoặc log Google service-account credential.
- `GSC_INTEGRATION_ENABLED=false` trong toàn bộ rollout sitemap maintenance.
- Sitemap cố định là `https://mushroomie.io.vn/sitemap.xml`; không nhận URL từ request hoặc user.
- Chạy ngay lần đầu sau process start; sau đó tối đa một lần thành công mỗi 60 phút.
- Failure không ghi `lastSuccessfulAtMs`; tick sau phải retry.
- Reconciliation phải hoàn tất trước worker trong maintenance và protected cron.
- Worker vẫn có `MAX_BATCH_SIZE = 10` và public import graph không được chạm coordinator/worker/GSC/admin.
- Không thay đổi response contract của protected cron.
- Không dùng `deploy.sh`; giữ release trước đó cho rollback và không xóa uploads/backups/.env/database.
- Chỉ deploy lên VPS mới `103.77.242.153`; tuyệt đối không chạm VPS cũ `103.173.226.86`.

---

## File Map

- Create `src/lib/seo-discovery/sitemap-maintenance.ts`: coordinator, interval gate, concurrency dedupe, fail-soft result và global singleton.
- Create `src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts`: unit tests bằng injected dependencies, không network/DB.
- Modify `tests/seo-discovery-performance-boundaries.test.ts`: cấm coordinator trong toàn bộ public rendering graph và khóa interval một giờ.
- Modify `src/lib/scheduled-publisher.ts`: gọi automatic reconciliation giữa inventory và worker.
- Modify `src/lib/__tests__/scheduled-publisher.test.ts`: khóa ordering, independent failure và sanitized log.
- Modify `src/app/api/cron/publish-scheduled-posts/route.ts`: protected cron dùng cùng coordinator trước worker.
- Modify `src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts`: khóa auth, ordering, response compatibility và fail-soft.
- Modify `docs/operations/google-search-console.md`: mô tả startup/hourly sync, expected queue và rollback.

---

### Task 1: Process-local sitemap maintenance coordinator

**Files:**
- Create: `src/lib/seo-discovery/sitemap-maintenance.ts`
- Create: `src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts`
- Modify: `tests/seo-discovery-performance-boundaries.test.ts:150-225`

**Interfaces:**
- Consumes: `readSeoDiscoveryConfig(process.env)` and `syncSitemapDiscoveryJobs(): Promise<SitemapSyncResult>`.
- Produces: `createSitemapMaintenanceCoordinator(dependencies?)` and `runSitemapReconciliationIfDue(): Promise<SitemapMaintenanceResult>`.
- `SitemapMaintenanceResult` is a bounded discriminated union with status `disabled`, `not_due`, `completed`, or `failed`; only `completed` carries numeric `SitemapSyncResult`.

- [ ] **Step 1: Read the relevant server lifecycle documentation completely**

Run:

```powershell
Get-Content -Raw node_modules/next/dist/docs/01-app/02-guides/instrumentation.md
Get-Content -Raw node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
```

Expected: both files describe server-side instrumentation/register behavior; no Client Component or request-render integration is introduced.

- [ ] **Step 2: Write RED unit tests for first-run, hourly gate and disabled mode**

Create `src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts` with the following test scaffold and cases:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSitemapMaintenanceCoordinator,
  type SitemapMaintenanceDependencies,
} from '@/lib/seo-discovery/sitemap-maintenance'

const SUMMARY = {
  observedCount: 138,
  createdCount: 37,
  resetCount: 0,
  unchangedCount: 101,
  removedCount: 0,
}

function harness(enabled = true) {
  let nowMs = Date.parse('2026-08-12T03:00:00.000Z')
  const sync = vi.fn().mockResolvedValue(SUMMARY)
  const logFailure = vi.fn()
  const dependencies: SitemapMaintenanceDependencies = {
    isEnabled: () => enabled,
    now: () => nowMs,
    sync,
    logFailure,
  }
  return {
    coordinator: createSitemapMaintenanceCoordinator(dependencies),
    sync,
    logFailure,
    advance: (milliseconds: number) => { nowMs += milliseconds },
    setNow: (milliseconds: number) => { nowMs = milliseconds },
  }
}

describe('sitemap maintenance coordinator', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('runs immediately, skips inside one hour, and runs at the boundary', async () => {
    const test = harness()

    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'completed',
      summary: SUMMARY,
    })
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    test.advance(3_599_999)
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    test.advance(1)
    await expect(test.coordinator.runIfDue()).resolves.toEqual({
      status: 'completed',
      summary: SUMMARY,
    })
    expect(test.sync).toHaveBeenCalledTimes(2)
  })

  it('does not fetch or write when discovery is disabled', async () => {
    const test = harness(false)
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'disabled' })
    expect(test.sync).not.toHaveBeenCalled()
  })

  it('does not run repeatedly when the wall clock moves backwards', async () => {
    const test = harness()
    await test.coordinator.runIfDue()
    test.setNow(Date.parse('2026-08-12T02:00:00.000Z'))
    await expect(test.coordinator.runIfDue()).resolves.toEqual({ status: 'not_due' })
    expect(test.sync).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: Run the unit test and verify RED is caused by the missing module**

Run:

```powershell
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts
```

Expected: FAIL because `@/lib/seo-discovery/sitemap-maintenance` does not exist; zero production code has been written.

- [ ] **Step 4: Add the RED public-graph boundary before production implementation**

In `tests/seo-discovery-performance-boundaries.test.ts`, add the future file to the forbidden list:

```ts
'src/lib/seo-discovery/sitemap-maintenance.ts',
```

Extend `maintenance processing remains bounded...` with:

```ts
const sitemapMaintenancePath = path.join(
  sourceRoot,
  'lib',
  'seo-discovery',
  'sitemap-maintenance.ts',
)
const sitemapMaintenanceSource = await readFile(sitemapMaintenancePath, 'utf8')
assert.match(sitemapMaintenanceSource, /60 \* 60 \* 1_000/)
assert.ok(
  [...publicGraph.visited].every((filePath) => (
    path.normalize(filePath) !== sitemapMaintenancePath
  )),
)
```

Run:

```powershell
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts
```

Expected: FAIL with `ENOENT` for `sitemap-maintenance.ts`. This is the RED proof that the boundary test covers the new production unit, not an intentionally incorrect assertion.

- [ ] **Step 5: Add RED concurrency and retry tests before production implementation**

Append these cases inside the same `describe`:

```ts
it('shares one in-flight reconciliation between concurrent callers', async () => {
  let resolveSync!: (value: typeof SUMMARY) => void
  const test = harness()
  test.sync.mockReturnValueOnce(new Promise((resolve) => { resolveSync = resolve }))

  const first = test.coordinator.runIfDue()
  const second = test.coordinator.runIfDue()

  await Promise.resolve()
  expect(test.sync).toHaveBeenCalledOnce()
  resolveSync(SUMMARY)
  await expect(Promise.all([first, second])).resolves.toEqual([
    { status: 'completed', summary: SUMMARY },
    { status: 'completed', summary: SUMMARY },
  ])
})

it('redacts a failure, leaves the success clock untouched, and retries next tick', async () => {
  const secret = 'private-service-account-key-sentinel'
  const test = harness()
  test.sync
    .mockRejectedValueOnce(new Error(secret))
    .mockResolvedValueOnce(SUMMARY)

  await expect(test.coordinator.runIfDue()).resolves.toEqual({
    status: 'failed',
    code: 'SEO_DISCOVERY_SITEMAP_SYNC_FAILED',
  })
  await expect(test.coordinator.runIfDue()).resolves.toEqual({
    status: 'completed',
    summary: SUMMARY,
  })

  expect(test.sync).toHaveBeenCalledTimes(2)
  expect(test.logFailure).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(test.logFailure.mock.calls)).not.toContain(secret)
})
```

Run the same focused command again. Expected: still FAIL only because the production module is missing.

- [ ] **Step 6: Implement the minimal coordinator**

Create `src/lib/seo-discovery/sitemap-maintenance.ts`:

```ts
import 'server-only'

import { readSeoDiscoveryConfig } from './config'
import {
  syncSitemapDiscoveryJobs,
  type SitemapSyncResult,
} from './sitemap-sync'

const RECONCILIATION_INTERVAL_MS = 60 * 60 * 1_000
const FAILURE_CODE = 'SEO_DISCOVERY_SITEMAP_SYNC_FAILED'

export type SitemapMaintenanceResult =
  | { status: 'disabled' }
  | { status: 'not_due' }
  | { status: 'completed'; summary: SitemapSyncResult }
  | { status: 'failed'; code: typeof FAILURE_CODE }

export interface SitemapMaintenanceDependencies {
  isEnabled(): boolean
  now(): number
  sync(): Promise<SitemapSyncResult>
  logFailure(): void
}

export interface SitemapMaintenanceCoordinator {
  runIfDue(): Promise<SitemapMaintenanceResult>
}

const DEFAULT_DEPENDENCIES: SitemapMaintenanceDependencies = {
  isEnabled: () => readSeoDiscoveryConfig(process.env).discoveryEnabled,
  now: () => Date.now(),
  sync: () => syncSitemapDiscoveryJobs(),
  logFailure: () => {
    console.error('[seo-discovery] automatic sitemap reconciliation failed', {
      code: FAILURE_CODE,
    })
  },
}

export function createSitemapMaintenanceCoordinator(
  dependencies: SitemapMaintenanceDependencies = DEFAULT_DEPENDENCIES,
): SitemapMaintenanceCoordinator {
  let lastSuccessfulAtMs: number | null = null
  let inFlight: Promise<SitemapMaintenanceResult> | null = null

  return {
    runIfDue() {
      if (!dependencies.isEnabled()) {
        return Promise.resolve({ status: 'disabled' })
      }
      if (inFlight) return inFlight

      const nowMs = dependencies.now()
      if (
        lastSuccessfulAtMs !== null
        && nowMs - lastSuccessfulAtMs < RECONCILIATION_INTERVAL_MS
      ) {
        return Promise.resolve({ status: 'not_due' })
      }

      const operation: Promise<SitemapMaintenanceResult> = Promise.resolve()
        .then(() => dependencies.sync())
        .then((summary) => {
          lastSuccessfulAtMs = dependencies.now()
          return { status: 'completed', summary } as const
        })
        .catch(() => {
          try {
            dependencies.logFailure()
          } catch {
            // Logging must not turn a fail-soft maintenance action into an outage.
          }
          return { status: 'failed', code: FAILURE_CODE } as const
        })
        .finally(() => {
          if (inFlight === operation) inFlight = null
        })

      inFlight = operation
      return operation
    },
  }
}

type SitemapMaintenanceGlobal = typeof globalThis & {
  __mushroomieSitemapMaintenanceCoordinator?: SitemapMaintenanceCoordinator
}

const globalStore = globalThis as SitemapMaintenanceGlobal

export function runSitemapReconciliationIfDue(): Promise<SitemapMaintenanceResult> {
  const coordinator = globalStore.__mushroomieSitemapMaintenanceCoordinator
    ?? createSitemapMaintenanceCoordinator()
  globalStore.__mushroomieSitemapMaintenanceCoordinator = coordinator
  return coordinator.runIfDue()
}
```

- [ ] **Step 7: Verify GREEN and focused type/lint gates**

Run:

```powershell
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts tests/site-build-boundaries.test.ts
npm run typecheck
npx eslint src/lib/seo-discovery/sitemap-maintenance.ts src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts tests/seo-discovery-performance-boundaries.test.ts
git diff --check
```

Expected: all coordinator tests PASS, typecheck exit 0, scoped ESLint 0 errors/0 warnings, diff check exit 0.

- [ ] **Step 8: Commit the independent coordinator deliverable**

```powershell
git add src/lib/seo-discovery/sitemap-maintenance.ts src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts tests/seo-discovery-performance-boundaries.test.ts
git diff --cached --check
git commit -m "feat(seo): schedule sitemap reconciliation safely"
```

Expected: exactly three files in the commit; no environment, credential, artifact or build output.

---

### Task 2: Integrate reconciliation before the worker in interval and protected cron

**Files:**
- Modify: `src/lib/scheduled-publisher.ts:1-110`
- Modify: `src/lib/__tests__/scheduled-publisher.test.ts:1-220`
- Modify: `src/app/api/cron/publish-scheduled-posts/route.ts:1-80`
- Modify: `src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts:1-130`

**Interfaces:**
- Consumes: `runSitemapReconciliationIfDue(): Promise<SitemapMaintenanceResult>` from Task 1.
- Produces: both server maintenance entrypoints call the same process-global coordinator before `runSeoDiscoveryBatchSafely()`.
- Protected cron response remains `{ success, publishedCount, postIds, discovery }`.

- [ ] **Step 1: Write RED interval-maintenance ordering and failure-isolation tests**

In `src/lib/__tests__/scheduled-publisher.test.ts`, add `runSitemapReconciliationIfDue` to `mocks`, mock `@/lib/seo-discovery/sitemap-maintenance`, reset it in both `beforeEach` blocks, and default it to:

```ts
mocks.runSitemapReconciliationIfDue.mockResolvedValue({ status: 'not_due' })
```

Update the existing ordering assertion to require:

```ts
expect(mocks.releaseExpiredOrderReservations.mock.invocationCallOrder[0]).toBeLessThan(
  mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0],
)
expect(mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0]).toBeLessThan(
  mocks.runSeoDiscoveryBatchSafely.mock.invocationCallOrder[0],
)
```

Add this failure boundary case:

```ts
it('still runs discovery when automatic sitemap reconciliation unexpectedly throws', async () => {
  const secret = 'raw-sitemap-provider-response-sentinel'
  mocks.findMany.mockResolvedValue([])
  mocks.runSitemapReconciliationIfDue.mockRejectedValue(new Error(secret))

  await expect(runMaintenance()).resolves.toBeUndefined()

  expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(secret)
})
```

- [ ] **Step 2: Run interval tests and verify RED**

Run:

```powershell
npm run test:vitest -- src/lib/__tests__/scheduled-publisher.test.ts
```

Expected: FAIL because `runMaintenance()` does not call `runSitemapReconciliationIfDue()`.

- [ ] **Step 3: Write RED protected-cron ordering and failure-isolation tests**

In `src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts`, add/reset/default the same mock. Extend the unauthorized test to assert the sitemap mock is not called. Extend the successful ordering test:

```ts
expect(mocks.publishDuePosts.mock.invocationCallOrder[0]).toBeLessThan(
  mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0],
)
expect(mocks.runSitemapReconciliationIfDue.mock.invocationCallOrder[0]).toBeLessThan(
  mocks.runSeoDiscoveryBatchSafely.mock.invocationCallOrder[0],
)
```

Add:

```ts
it('keeps the successful response and runs discovery after a sitemap invariant failure', async () => {
  const secret = 'private-sitemap-response-sentinel'
  mocks.runSitemapReconciliationIfDue.mockRejectedValue(new Error(secret))

  const response = await GET(request())

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    success: true,
    publishedCount: 1,
    postIds: [41],
    discovery: DISCOVERY_SUMMARY,
  })
  expect(mocks.runSeoDiscoveryBatchSafely).toHaveBeenCalledOnce()
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(secret)
})
```

- [ ] **Step 4: Run cron tests and verify RED**

Run:

```powershell
npm run test:vitest -- src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
```

Expected: FAIL because the cron route does not call the coordinator.

- [ ] **Step 5: Integrate the interval maintenance with a redacted outer boundary**

In `src/lib/scheduled-publisher.ts`, import the coordinator and insert this block after inventory release and before the worker block:

```ts
import { runSitemapReconciliationIfDue } from '@/lib/seo-discovery/sitemap-maintenance'

// Inside runMaintenance(), after inventory and before runSeoDiscoveryBatchSafely():
try {
  await runSitemapReconciliationIfDue()
} catch {
  console.error('[seo-discovery] sitemap maintenance integration failed', {
    code: 'SEO_DISCOVERY_SITEMAP_MAINTENANCE_ERROR',
  })
}
```

Do not merge this block with the worker boundary; each failure remains independent.

- [ ] **Step 6: Integrate the protected cron without changing its response**

In `src/app/api/cron/publish-scheduled-posts/route.ts`, add:

```ts
import { runSitemapReconciliationIfDue } from '@/lib/seo-discovery/sitemap-maintenance'

async function runSitemapBackstop(): Promise<void> {
  try {
    await runSitemapReconciliationIfDue()
  } catch {
    console.error('[cron/publish-scheduled] Sitemap integration failed', {
      code: 'SEO_DISCOVERY_SITEMAP_MAINTENANCE_ERROR',
    })
  }
}
```

Inside the authorized success path, place exactly:

```ts
await runSitemapBackstop()
const discovery = await runDiscoveryBackstop()
```

Do not add sitemap fields to the JSON response.

- [ ] **Step 7: Verify GREEN for both entrypoints and their compatibility contracts**

Run:

```powershell
npm run test:vitest -- src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
npx tsx --test tests/seo-discovery-scheduled-products.test.ts
npm run typecheck
npx eslint src/lib/scheduled-publisher.ts src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/route.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
git diff --check
```

Expected: all runtime and source-contract tests PASS; cron auth/response remain unchanged; typecheck/lint/diff checks pass.

- [ ] **Step 8: Commit interval and cron integration**

```powershell
git add src/lib/scheduled-publisher.ts src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/route.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
git diff --cached --check
git commit -m "feat(seo): reconcile sitemap during maintenance"
```

Expected: exactly four files in this commit.

---

### Task 3: Document automatic reconciliation operations

**Files:**
- Modify: `docs/operations/google-search-console.md:90-105,164-230`

**Interfaces:**
- Consumes: coordinator and maintenance behavior from Tasks 1-2.
- Produces: an operator-visible startup/hourly/rollback contract; the public import regression gate was committed with the coordinator in Task 1.

- [ ] **Step 1: Re-run the committed performance boundary before changing docs**

Run:

```powershell
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts tests/site-build-boundaries.test.ts
```

Expected: PASS; every `(user)` and root rendering entry remains covered, with no coordinator/worker/GSC/admin import.

- [ ] **Step 2: Update the operations runbook with exact behavior**

Add this subsection after the disabled-GSC behavior section in `docs/operations/google-search-console.md`:

```markdown
### Tự động đối soát sitemap

Khi `SEO_DISCOVERY_ENABLED=true`, maintenance đối soát sitemap ngay sau khi
process PM2 khởi động và sau đó tối đa một lần thành công mỗi 60 phút. Interval
60 giây chỉ kiểm tra điều kiện đến hạn; nó không tải sitemap mỗi phút. Protected
cron dùng chung coordinator trong cùng process, vì vậy hai trigger đồng thời chỉ
có một fetch/transaction.

Reconciliation chạy trước discovery worker. Nếu fetch, XML hoặc transaction lỗi,
mốc thành công không tiến lên và tick sau retry; publication, inventory và worker
vẫn tiếp tục. Khi `GSC_INTEGRATION_ENABLED=false`, bước này chỉ đối soát database,
không gọi Google.
```

In the rollout section, insert the acceptance snapshot:

```markdown
- Baseline 2026-08-12: sitemap 138 URL, queue 102 job, thiếu 37 URL
  trang tĩnh/local/catalog.
- Sau restart rollout: chờ tối đa bốn worker tick để 37 URL mới hoàn tất
  eligibility; khi GSC còn tắt, kỳ vọng 138 URL hợp lệ ở
  `CONFIGURATION_REQUIRED`, một URL legacy ở `SKIPPED`, và không có lease treo.
```

In rollback, state that disabling `SEO_DISCOVERY_ENABLED` stops automatic sitemap fetches; disabling only GSC leaves DB reconciliation active without Google calls.

- [ ] **Step 3: Run docs/source checks and focused discovery suites**

Run:

```powershell
rg -n "Tự động đối soát sitemap|138 URL|37 URL|60 phút" docs/operations/google-search-console.md
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts src/lib/seo-discovery/__tests__/sitemap-sync.test.ts src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts tests/site-build-boundaries.test.ts tests/seo-discovery-scheduled-products.test.ts
git diff --check
```

Expected: all focused suites pass; runbook contains exact interval/baseline/rollback statements; diff check passes.

- [ ] **Step 4: Commit the runbook change**

```powershell
git add docs/operations/google-search-console.md
git diff --cached --check
git commit -m "docs(ops): document automatic sitemap discovery"
```

Expected: exactly the runbook in this commit.

---

### Task 4: Full verification and independent review

**Files:**
- Verify all files from Tasks 1-3.

**Interfaces:**
- Consumes: complete implementation.
- Produces: repeatable evidence that code, build, security, dependencies and public bundle remain healthy.

- [ ] **Step 1: Install exact lockfile dependencies and regenerate Prisma client**

```powershell
npm ci --legacy-peer-deps
npx prisma generate
npm audit --omit=dev
```

Expected: install succeeds, Prisma generation succeeds without DB access, audit reports 0 vulnerabilities.

- [ ] **Step 2: Run focused suites serially**

```powershell
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts src/lib/seo-discovery/__tests__/sitemap-sync.test.ts src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts tests/site-build-boundaries.test.ts tests/seo-discovery-scheduled-products.test.ts
```

Expected: all tests pass with no timeout or network access.

- [ ] **Step 3: Run the complete project test suite serially**

```powershell
npm test
```

Expected: all Vitest and legacy tests pass. If a pre-existing 5-second auth test times out under resource contention, isolate that exact test, verify it passes, then rerun the full suite serially; do not change unrelated auth code without a reproducing assertion failure.

- [ ] **Step 4: Run type and lint gates**

```powershell
npm run typecheck
npx eslint src/lib/seo-discovery/sitemap-maintenance.ts src/lib/seo-discovery/__tests__/sitemap-maintenance.test.ts src/lib/scheduled-publisher.ts src/lib/__tests__/scheduled-publisher.test.ts src/app/api/cron/publish-scheduled-posts/route.ts src/app/api/cron/publish-scheduled-posts/__tests__/route.test.ts tests/seo-discovery-performance-boundaries.test.ts
npm run lint
```

Expected: typecheck and scoped lint pass with 0 errors/0 warnings; full lint has 0 errors and only already-known warnings outside changed files.

- [ ] **Step 5: Run an offline production build**

Use a process-local dummy URL pointing to an unreachable loopback port; do not write it to any file:

```powershell
$env:DATABASE_URL='mysql://offline:offline@127.0.0.1:9/offline'
$env:SEO_DISCOVERY_ENABLED='false'
$env:GSC_INTEGRATION_ENABLED='false'
npm run build
Remove-Item Env:DATABASE_URL,Env:SEO_DISCOVERY_ENABLED,Env:GSC_INTEGRATION_ENABLED
```

Expected: Next 16.2.11 compiles, typechecks, emits all routes and standalone traces; database-backed static fallbacks may log the expected unreachable-loopback message, but build exits 0 and performs no real DB/Google mutation.

- [ ] **Step 6: Run staged scope, secret and artifact checks**

```powershell
git status --short
git diff --check
git diff HEAD~3..HEAD --check
git diff HEAD~3..HEAD --name-only
git grep -n -E "BEGIN PRIVATE KEY|client_email.*@.*iam\.gserviceaccount\.com|AIza[0-9A-Za-z_-]{20,}" HEAD -- ':!package-lock.json'
```

Expected: only planned source/test/docs changes across implementation commits; no `.env`, credential, build output, Lighthouse artifact, upload, backup or secret signature.

- [ ] **Step 7: Request an independent read-only code review**

Use `requesting-code-review` against the implementation commit range. Reviewer must verify:

- exact 60-minute successful-run gate;
- synchronous and asynchronous failure handling;
- in-flight cleanup and retry after rejection;
- `globalThis` singleton sharing across interval/cron;
- no response-contract change;
- no public import leak;
- no Google call when GSC is disabled;
- no hidden DB/schema mutation beyond `syncSitemapDiscoveryJobs()`.

Expected: no Critical/Important/Minor findings. Any actionable finding gets a new RED test, minimal fix, full focused rerun and separate follow-up commit.

---

### Task 5: Merge, push and safe production rollout

**Files:**
- No new source files.
- Production paths: `/var/www/mushroomie`, `.next-release.<timestamp>-<sha>`, `.next/standalone`, `.next/standalone.previous.<timestamp>-<sha>`.

**Interfaces:**
- Consumes: verified feature branch commits.
- Produces: GitHub `main`, production release and DB evidence showing all 138 sitemap URLs represented in queue.

- [ ] **Step 1: Push the verified feature branch**

```powershell
git status --short --branch
git push origin codex/automatic-google-discovery
```

Expected: clean feature worktree and remote branch advances to the verified HEAD.

- [ ] **Step 2: Fast-forward local main without touching user-owned untracked files**

From `C:\Users\Admin\OneDrive\Tài liệu\mushroomie`:

```powershell
git status --short --branch
git fetch origin
git merge --ff-only codex/automatic-google-discovery
git push origin main
```

Expected: fast-forward only; stop before merge if any tracked user modification overlaps. Do not add, move or remove user-owned uploads/docs/temp files.

- [ ] **Step 3: Revalidate production backup and pull only the fast-forwarded main**

SSH with `~/.ssh/id_ed25519_codex_mushroomie` to `103.77.242.153` and run read-only checks first:

```bash
hostname
git -C /var/www/mushroomie status --short --branch
gzip -t /var/www/mushroomie/backups/db/mysql-20260812T020407Z.sql.gz
tar -tzf /var/www/mushroomie/backups/uploads/uploads-20260812T020407Z.tar.gz >/dev/null
git -C /var/www/mushroomie fetch origin
git -C /var/www/mushroomie merge --ff-only origin/main
```

Expected: hostname `Mushroomie`, both backups validate, and production checkout reaches the pushed main SHA. Stop if checkout has overlapping tracked changes.

- [ ] **Step 4: Verify Node, install, test and build on VPS with GSC disabled**

```bash
cd /var/www/mushroomie
npm run check:node
npm ci --legacy-peer-deps
npx prisma generate
npm run typecheck
npm test
SEO_DISCOVERY_ENABLED=false GSC_INTEGRATION_ENABLED=false NEXT_DIST_DIR=.next-deploy npm run build
```

Expected: Node >=22, audit/install clean, all tests pass, production build emits all routes. Root and active release `.env` remain external/untracked.

- [ ] **Step 5: Stage and smoke a rollback-safe standalone release**

Execute Steps 5 and 6 as consecutive sections of one base64-encoded remote Bash script in one foreground SSH session. The validated `release_id` and `stage` variables must not be assumed to persist across separate tool calls.

Create a timestamped staging directory on the same filesystem. Stream the standalone tree through `tar` while excluding `public/uploads`, so no disposable 43 MB upload copy is created. Copy the correct dist-dir static tree, all root public assets except uploads, add an absolute uploads symlink, and install `.env` mode `0600`:

```bash
set -eu
cd /var/www/mushroomie
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
stage="/var/www/mushroomie/.next-release.${release_id}"
test ! -e "$stage"
mkdir -p "$stage" "$stage/.next-deploy/static" "$stage/public"
tar -C .next-deploy/standalone --exclude='./public/uploads' -cf - . \
  | tar -C "$stage" -xf -
cp -a .next-deploy/static/. "$stage/.next-deploy/static/"
find public -mindepth 1 -maxdepth 1 ! -name uploads \
  -exec cp -a -t "$stage/public" -- {} +
test ! -e "$stage/public/uploads"
ln -s /var/www/mushroomie/public/uploads "$stage/public/uploads"
install -m 0600 .env "$stage/.env"
```

Confirm:

```bash
test -L "$stage/public/uploads"
test "$(readlink -f "$stage/public/uploads")" = '/var/www/mushroomie/public/uploads'
test -d "$stage/.next-deploy/static"
test "$(stat -c '%a' "$stage/.env")" = '600'
```

Start the staged `server.js` temporarily on `127.0.0.1:3101` with GSC disabled and verify:

```bash
smoke_log="$(mktemp /tmp/mushroomie-sitemap-smoke.XXXXXX.log)"
(
  cd "$stage"
  env PORT=3101 HOSTNAME=127.0.0.1 \
    SEO_DISCOVERY_ENABLED=false GSC_INTEGRATION_ENABLED=false \
    node server.js
) >"$smoke_log" 2>&1 &
smoke_pid=$!
cleanup_smoke() {
  if kill -0 "$smoke_pid" 2>/dev/null; then kill "$smoke_pid"; fi
  wait "$smoke_pid" 2>/dev/null || true
}
trap cleanup_smoke EXIT
for attempt in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:3101/api/health >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:3101/api/health
curl -I http://127.0.0.1:3101/sitemap.xml
curl -I http://127.0.0.1:3101/admin/seo/lap-chi-muc
if grep -Eqi 'fatal|uncaught|out of memory' "$smoke_log"; then
  sed -n '1,120p' "$smoke_log"
  exit 1
fi
cleanup_smoke
trap - EXIT
```

Expected: health/database OK, sitemap 200 XML, admin route redirects to login, and no fatal log. Stop the smoke process before activation.

- [ ] **Step 6: Activate by same-filesystem rename and retain previous release**

Rename current `.next/standalone` to a timestamped `.next/standalone.previous.*`, rename stage to `.next/standalone`, and copy `.next-deploy/static/.` additively to `/var/www/mushroomie/.next/static/`. Validate every path before either rename:

```bash
set -eu
cd /var/www/mushroomie
active='/var/www/mushroomie/.next/standalone'
previous="/var/www/mushroomie/.next/standalone.previous.${release_id}"
test -d "$active"
test -d "$stage"
test ! -e "$previous"
test "$(dirname "$active")" = '/var/www/mushroomie/.next'
test "$(dirname "$previous")" = '/var/www/mushroomie/.next'
mv "$active" "$previous"
if ! mv "$stage" "$active"; then
  mv "$previous" "$active"
  exit 1
fi
mkdir -p /var/www/mushroomie/.next/static
cp -a "$active/.next-deploy/static/." /var/www/mushroomie/.next/static/
```

Then restart and check health:

```bash
pm2 restart mushroomie_pm2 --update-env
pm2 save
curl -fsS https://mushroomie.io.vn/api/health
```

Expected: PM2 online, health/database OK. If health, route or MIME verification fails, stop the new process, move the failed active release to a unique `.failed.<timestamp>` path, restore `previous` by exact path, restart PM2, and report rollback; do not delete either release.

Rollback commands, only after validating that `active` and `previous` are the exact paths established above:

```bash
failed="/var/www/mushroomie/.next/standalone.failed.$(date -u +%Y%m%dT%H%M%SZ)"
test -d "$active"
test -d "$previous"
test ! -e "$failed"
pm2 stop mushroomie_pm2
mv "$active" "$failed"
mv "$previous" "$active"
pm2 restart mushroomie_pm2 --update-env
pm2 save
curl -fsS https://mushroomie.io.vn/api/health
```

- [ ] **Step 7: Verify automatic startup reconciliation with Google still disabled**

Confirm both root and active release environments have:

```text
SEO_DISCOVERY_ENABLED=true
GSC_INTEGRATION_ENABLED=false
```

After restart, poll read-only DB summaries for at most five minutes. Expected progression:

- total jobs: 139 (138 sitemap URLs plus one legacy invalid job);
- sitemap intersection: 138/138;
- eventually `CONFIGURATION_REQUIRED / GSC_DISABLED`: 138;
- `SKIPPED / INVALID_PUBLIC_URL`: 1;
- active leases: 0 after the batch settles;
- no raw URL/key/provider response in PM2 logs.

Do not alter production content to manufacture a page; the 37 previously missing sitemap URLs are the acceptance fixture.

- [ ] **Step 8: Run final route, MIME, upload and performance-boundary verification**

Verify HTTP status for `/`, `/san-pham`, `/tin-tuc`, `/cau-chuyen`, `/mini-game`, `/tai-khoan/dang-nhap`, `/gio-hang`, `/thanh-toan`, `/admin`, `/admin/seo/lap-chi-muc`, `/sitemap.xml` and `/feed.xml`. Extract real CSS/JS URLs from HTML and require CSS `text/css`, JS `application/javascript` or `text/javascript`, all 200. Verify a real `/uploads/<file>` returns image MIME. Check PM2/Nginx logs, MySQL, disk, RAM/swap and binding only on `127.0.0.1:3001`.

Run the already-committed performance/import boundary tests once more against the deployed SHA. Do not claim Lighthouse 100/100; retain the measured post-feature medians already recorded (99/92 home, 99/94 catalog, 99/92 news) and report that this scheduler change does not enter the public graph.

- [ ] **Step 9: Preserve rollback assets and report the remaining GSC IAM gate**

Do not delete the previous standalone release, backup files or the copied release artifact until GSC credential rollout is independently complete. Report exact production SHA, PM2 status, queue counts, route/MIME results and disk usage.

The next separate authorized operation is Google Cloud IAM: create/use a dedicated project, enable Search Console API, create a service account/key outside Git, grant the service account access to `sc-domain:mushroomie.io.vn`, probe Sitemap and URL Inspection while worker GSC remains false, then enable `GSC_INTEGRATION_ENABLED=true`. This plan does not authorize those IAM changes.
