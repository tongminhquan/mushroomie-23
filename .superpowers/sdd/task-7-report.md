# Task 7 report: bounded discovery worker, retries, and maintenance integration

## Outcome

Task 7 is complete. The implementation adds a server-only Google discovery worker with atomic database leasing, bounded processing, deterministic retry scheduling, Search Console evidence mapping, and fail-soft integration into both existing maintenance triggers. It does not change the Prisma schema, call a real database or Google endpoint, deploy, or alter production data.

## Implemented scope

- `src/lib/seo-discovery/worker.ts`
  - Claims at most 10 due jobs with a random, validated 2-minute lease token.
  - Uses a conditional `updateMany` claim guarded by status, due time, lease availability, and the exact claimed `content_updated_at` version.
  - Re-reads and processes only rows owned by the worker token; every completion/failure/finally write is guarded by the same token and content version.
  - Enforces one absolute monotonic 45-second decision deadline, requires five seconds of headroom before known network operations, and clears owned leases in `finally` even when the owned-row re-read is late, missing, or throws.
  - Rechecks post/product public state and slug identity before any external work.
  - Reads the fixed sitemap once per batch, persists eligibility evidence, and calls Google only for eligible rows.
  - Lists/submits only the fixed canonical sitemap. Healthy state is never submitted; missing/failed state is submitted at most once per batch. The successful-submit cooldown is global to the canonical sitemap and cannot be bypassed by a publication changing the local fingerprint.
  - Latches typed Google configuration/transient/malformed failures across the batch, preventing one failed provider call per URL.
  - Recovers `CONFIGURATION_REQUIRED` rows after an operator fixes Search Console and restarts the process without requiring a new publication. The process-shared recovery coordinator probes only when a blocked slice exists, reuses the batch's single sitemap-readiness request, applies deterministic transient backoff, and latches only actual configuration failures.
  - Requeues at most 10 lease-available rows per batch using exact status/content-version/lease snapshot CAS branches. Active leases and newer publications are never revoked or overwritten; recovery remains incomplete until all bounded slices are drained.
  - Maps only bounded validated inspection fields. Provider bodies, URLs, credentials, stack traces, and raw messages are neither persisted nor logged.
  - Normalizes missing/401/403 to `CONFIGURATION_REQUIRED`, 429/5xx/network/timeout to `RETRY`, malformed responses to stable redacted `ERROR`, PASS to `INDEXED`, and other valid verdicts to `NOT_INDEXED`. A first `HTTP_NOT_FOUND` observation is retained as a zero-counter confirmation retry; only a second independent observation for the same content version becomes `SKIPPED`.
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
7. Independent review reproduced a changed-fingerprint sitemap cooldown defect and mixed transient/inspection counter contamination. The cooldown regression failed 1/1 before its global canonical cooldown. The milestone tranche failed 8 tests before the schema-free schedule separation.
8. Review-hardening tests first failed for configuration recovery, 404 confirmation, retry counter ownership, and claim-scoped cleanup. They then passed after adding process-shared recovery, confirmation evidence, zero-count terminal errors, and the immediate `try/finally` lease boundary.
9. Strict-budget regressions first failed for late/hung dependencies, insufficient network headroom, owned-row re-read failures, and late claims. They passed after introducing the absolute decision deadline and late-result write guards.
10. Three reviewer regressions first failed because a recovery mutation could outlive a JavaScript race, recovery was unbounded/could clear an active lease, and a committed owned write could be reported as failed. Recovery mutations are now awaited, exact-CAS recovery is limited to 10 non-leased snapshots, and no post-commit deadline assertion rewrites the summary.
11. A production-shaped recovery test proves the configuration probe and normal processing share one sitemap-list operation. A 12-row test proves recovery drains 10 then 2 without a second provider probe.

Final focused worker result: **68/68 passed**.

## Concurrency, idempotency, secrecy, and performance review

- Two deterministic workers can select the same candidate, but exactly one conditional claim succeeds and exactly one eligibility flow runs.
- A newer content event or a replacement lease makes all stale completion/finally writes affect zero rows.
- Batch size and configuration-recovery size are independently hard-capped at 10 even when a larger value is requested; an absolute monotonic deadline stops new decisions and external work.
- Sitemap read/list/submit work is lazy and shared within a batch. One provider failure is applied to remaining owned rows without additional Google calls.
- Successful sitemap submission cannot be coupled to every publication, even when the sitemap fingerprint changes during Search Console eventual consistency.
- Transient retries no longer skip the 24-hour/72-hour/7-day inspection milestones, including multiple timeouts between valid NOT_INDEXED results.
- The worker is imported only from server maintenance code. Public layouts/routes and browser bundles are unchanged.
- Logging and responses contain stable codes/counts only. Secret sentinel tests prove thrown provider/DB messages are not exposed.
- `attempt_count` records only consecutive transient worker failures. Valid inspection evidence and stable terminal errors reset it to zero, so transport failures cannot advance inspection cadence.
- First-observation 404 confirmation survives a process restart through stable database evidence and does not call Google. A propagated route continues to inspection; a second same-version 404 is terminal.
- Recovery and business mutations are not placed inside an abandonable `Promise.race`: Prisma 5.22 does not offer cancellation for delegate mutations, so each started mutation is awaited and its committed result is reported accurately.

## Verification evidence

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 681 packages installed, lockfile honored, audit reported 0 vulnerabilities; existing optional WASM peer/deprecation warnings only |
| `npx prisma generate` | PASS; Prisma Client 5.22.0 generated |
| Worker tests | PASS; 68/68 |
| Focused anonymous-auth rerun after one cold-cache timeout | PASS; 83/83 |
| `npm test` | PASS; Vitest 59 files, 725/725; legacy 319/319 |
| `npm run typecheck --if-present` | PASS; `tsc --noEmit` exit 0 |
| Scoped Task 7 ESLint | PASS; 0 errors, 0 warnings |
| Full `npm run lint` | PASS; 0 errors and 205 pre-existing warnings outside Task 7 |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| Offline production build | PASS; Next.js 16.2.11 compiled, typechecked, generated 113/113 pages, and collected traces |
| `git diff --check` | PASS; no whitespace errors (Git for Windows emitted only checkout EOL notices) |

The offline build used process-only `SEO_DISCOVERY_ENABLED=false`, `GSC_INTEGRATION_ENABLED=false`, and an intentionally unreachable loopback MySQL URL at `127.0.0.1:9`. The expected Prisma fallback messages confirm no real database was contacted; no Google operation was possible.

The first cold-cache full-suite run immediately after `npm ci` hit the existing 5-second timeout in one unrelated anonymous post-create auth-contract case (719 passed, 1 timed out). The complete auth suite immediately passed 83/83, and the subsequent serial full suite passed 725/725 plus 319/319 legacy tests; no source change was made for that resource-contention artifact.

## Remaining operational limitations

- The sitemap-registration and configuration-recovery coordinators are intentionally process-local (`globalThis`) because Task 7 adds no schema/control record. A PM2 restart clears their one-hour sitemap cooldown and probe/backoff memory. Correctness remains protected by exact database CAS and 10-row batch limits; durable cross-restart quota state would require a separately designed schema-backed maintenance record.
- Prisma 5.22 delegate reads and mutations do not accept an `AbortSignal` or per-query statement timeout. Read/external decisions are deadline-raced and every production HTTP/provider operation already has an internal five-second timeout. Mutations are deliberately never abandoned: the worker checks headroom before starting them, awaits the actual result, then stops opening work. Consequently a database statement stalled below Prisma can exceed the 45-second wall clock, although the normal 45-second budget remains below the two-minute lease. A hard database wall-clock guarantee requires a broader driver/database cancellation or statement-timeout design.
- No real database, Search Console property, production server, deployment, or migration was used in Task 7 verification.
