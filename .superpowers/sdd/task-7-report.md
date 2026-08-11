# Task 7 report: bounded discovery worker, retries, and maintenance integration

## Outcome

Task 7 is complete. The implementation adds a server-only Google discovery worker with atomic database leasing, bounded processing, deterministic retry scheduling, Search Console evidence mapping, and fail-soft integration into both existing maintenance triggers. It does not change the Prisma schema, call a real database or Google endpoint, deploy, or alter production data.

## Implemented scope

- `src/lib/seo-discovery/worker.ts`
  - Claims at most 10 due jobs with a random, validated 2-minute lease token.
  - Uses a conditional `updateMany` claim guarded by status, due time, lease availability, and the exact claimed `content_updated_at` version.
  - Re-reads and processes only rows owned by the worker token; every completion/failure/finally write is guarded by the same token and content version.
  - Enforces a 45-second batch-start budget and clears owned leases in `finally`.
  - Rechecks post/product public state and slug identity before any external work.
  - Reads the fixed sitemap once per batch, persists eligibility evidence, and calls Google only for eligible rows.
  - Lists/submits only the fixed canonical sitemap. Healthy state is never submitted; missing/failed state is submitted at most once per batch. The successful-submit cooldown is global to the canonical sitemap and cannot be bypassed by a publication changing the local fingerprint.
  - Latches typed Google configuration/transient/malformed failures across the batch, preventing one failed provider call per URL.
  - Holds 401/403 configuration state in the in-process coordinator across sitemap fingerprint changes. Operational recovery is an application restart after configuration is corrected; no schema/global-state expansion was introduced in Task 7.
  - Maps only bounded validated inspection fields. Provider bodies, URLs, credentials, stack traces, and raw messages are neither persisted nor logged.
  - Normalizes missing/401/403 to `CONFIGURATION_REQUIRED`, 429/5xx/network/timeout to `RETRY`, malformed responses to stable redacted `ERROR`, permanent eligibility failures to `SKIPPED`, PASS to `INDEXED`, and other valid verdicts to `NOT_INDEXED`.
- `src/lib/seo-discovery/retry.ts`
  - Keeps transient scheduling pure through injected `now` and `random`, exponential jitter, and a 24-hour cap.
  - Defines exact 24-hour, 72-hour, and 7-day inspection milestones.
  - Separates transient failure count from valid inspection cadence: `attempt_count` resets after a valid inspection, while NOT_INDEXED scheduling advances through absolute milestones based on `content_updated_at`; old backfills fall back to weekly checks and content-version changes naturally restart the schedule.
- `src/lib/scheduled-publisher.ts`
  - Runs discovery once after scheduled publishing and expired inventory release.
  - Keeps publication, inventory, and discovery failure boundaries independent.
- `src/app/api/cron/publish-scheduled-posts/route.ts`
  - Preserves timing-safe Bearer authorization, GET/POST compatibility, existing success fields, and the existing publication HTTP 500 contract.
  - Adds only a bounded non-sensitive `discovery` summary: `claimed`, `processed`, `failed`, and `configurationRequired`.
  - Discovery remains fail-soft after a successful publication run.
- Runtime tests cover the real worker and real route handler with an in-memory conditional-update database adapter and mocked external boundaries; no regex-only worker/route assertion is used for the new behavior.

## TDD evidence

The implementation followed RED to GREEN in small tranches:

1. Pure retry tests first failed because `retry.ts` did not exist, then passed 4/4.
2. Lease/concurrency tests first failed because `worker.ts` did not exist, then passed 7/7.
3. State, Search Console, and sitemap tests recorded 21 expected failures before implementation, then passed 29/29.
4. Fail-soft maintenance wrapper, scheduled maintenance, and actual protected cron route each had a failing test before implementation; their focused suites then passed.
5. Time-budget and atomic eligibility-transition regressions failed before their guards were added, then passed.
6. Self-review reproduced batch API spam and configuration fingerprint bypasses: 7 expected failures, then GREEN after the latch/coordinator fix.
7. Independent review reproduced a changed-fingerprint sitemap cooldown defect and mixed transient/inspection counter contamination. The cooldown regression failed 1/1 before its global canonical cooldown. The milestone tranche failed 8 tests before the schema-free schedule separation, then passed 45/45.

Final focused worker result: **45/45 passed**.

## Concurrency, idempotency, secrecy, and performance review

- Two deterministic workers can select the same candidate, but exactly one conditional claim succeeds and exactly one eligibility flow runs.
- A newer content event or a replacement lease makes all stale completion/finally writes affect zero rows.
- Batch size is hard-capped at 10 even when a larger value is requested; a monotonic time budget stops new claims.
- Sitemap read/list/submit work is lazy and shared within a batch. One provider failure is applied to remaining owned rows without additional Google calls.
- Successful sitemap submission cannot be coupled to every publication, even when the sitemap fingerprint changes during Search Console eventual consistency.
- Transient retries no longer skip the 24-hour/72-hour/7-day inspection milestones, including multiple timeouts between valid NOT_INDEXED results.
- The worker is imported only from server maintenance code. Public layouts/routes and browser bundles are unchanged.
- Logging and responses contain stable codes/counts only. Secret sentinel tests prove thrown provider/DB messages are not exposed.

## Verification evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 681 packages installed, lockfile honored, audit reported 0 vulnerabilities; existing optional WASM peer/deprecation warnings only |
| `npx prisma generate` | PASS; Prisma Client 5.22.0 generated |
| Worker tests | PASS; 45/45 |
| SEO + maintenance + actual cron route Vitest | PASS; 12 files, 317/317 |
| Required legacy maintenance tests | PASS; 7/7 |
| `npm test` | PASS; Vitest 59 files, 702/702; legacy 319/319 |
| `npm run typecheck --if-present` | PASS; `tsc --noEmit` exit 0 |
| Scoped Task 7 ESLint | PASS; 0 errors, 0 warnings |
| Full `npm run lint` | PASS; 0 errors and 205 pre-existing warnings outside Task 7 |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| Offline production build | PASS; Next.js 16.2.11 compiled, typechecked, generated 113/113 pages, and collected traces |
| `git diff --check` | PASS; no whitespace errors (Git for Windows emitted only checkout EOL notices) |

The offline build used process-only `SEO_DISCOVERY_ENABLED=false`, `GSC_INTEGRATION_ENABLED=false`, and an intentionally unreachable loopback MySQL URL at `127.0.0.1:9`. The expected Prisma fallback messages confirm no real database was contacted; no Google operation was possible.

One initial full-suite run was intentionally concurrent with dependency audit and hit the existing 5-second timeout in the unrelated anonymous post-create auth-contract test (696 passed, 1 timed out). The exact case immediately passed 3/3 in isolation, and two subsequent serial full-suite runs passed; no source change was made for that resource-contention artifact.

## Remaining operational limitation

The sitemap registration/configuration coordinator is intentionally in-process because Task 7 adds no schema/global state. A PM2 restart clears its one-hour successful-submit cooldown and configuration block. This is bounded by the database job leases and batch limits, and the runbook should instruct operators to restart after correcting credentials/permissions. Durable cross-restart sitemap registration state can be considered separately only if quota observations justify a schema-backed maintenance record.
