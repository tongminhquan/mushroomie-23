# Task 5 report: scheduled posts, active products, and sitemap reconciliation

Date: 2026-08-11

Status: **DONE_WITH_CONCERNS**

The Task 5 behavior is implemented and the complete automated test suite passes. The remaining concerns are limited to verification-environment constraints documented below. An official review follow-up corrected the original sitemap-reappearance interpretation and added an observation-generation CAS; see the appended evidence.

## Scope and design

- Refactored scheduled publishing into the single shared `publishDuePosts()` implementation used by the in-process maintenance tick and the authenticated cron route.
- A selected scheduled post is conditionally updated with both `id` and `status: 'scheduled'`. Only the caller receiving the Prisma-saved `id`, `slug`, and `updated_at` emits a `reason: 'scheduled'` publication event. Only Prisma `P2025` is treated as an expected lost race; other errors propagate to the cron response and are isolated by the in-process maintenance wrapper.
- Added a product material-transition predicate using the actual `active` status plus rendered/SEO/merchandising fields and ordered image state. `updated_at` by itself is not a trigger.
- Active product creation, inactive-to-active transition, and material active updates now use the shared fail-soft publication helper with saved Prisma rows. A slug change invalidates old and new paths but queues only the new canonical URL. Existing `revalidateProduct()` behavior remains the fallback for non-publication branches, avoiding duplicate invalidation.
- Added fixed-sitemap reconciliation with an injected reader for DB-free unit tests. Fetch/parse completes before the transaction; new URLs receive a full pending/deploy-sync-equivalent state; strictly newer `lastmod` values reset evidence; equal, older, or null versions preserve evidence; missing sitemap-owned jobs are retained and marked `SKIPPED / REMOVED_FROM_SITEMAP` with leases cleared.
- Sitemap writes use `createMany({ skipDuplicates: true })` and conditional monotonic `updateMany` operations. No Post or Product row is touched, and no discovery job is deleted.

No dependency, Prisma schema, migration, production data, external network, deployment, or push was performed.

## Instructions and documentation read

- `.superpowers/sdd/task-5-brief.md`
- Repository `AGENTS.md`
- `test-driven-development/SKILL.md` and its testing anti-pattern reference
- `executing-plans/SKILL.md`
- `systematic-debugging/SKILL.md`
- `verification-before-completion/SKILL.md`
- `finishing-a-development-branch/SKILL.md`
- Installed Next.js 16.2.11 cache/revalidation documentation under `node_modules/next/dist/docs/`

`.codegraph/` was not present, so no CodeGraph query was available.

## Strict TDD evidence

### RED: scheduled publication and product transitions

Command:

```text
npm run test:vitest -- src/lib/__tests__/scheduled-publisher.test.ts src/lib/seo-discovery/__tests__/product-publication.test.ts src/app/api/__tests__/products-publication-routes.test.ts
```

Initial result: **3 failed files; 25 failed, 3 passed**. Failures demonstrated the old count-returning/broad-error-swallowing scheduler, the absent product material predicate, and missing active-product route events.

Source-regression command:

```text
npx tsx --test tests/seo-discovery-scheduled-products.test.ts
```

Initial result: **3 failed, 0 passed** for the missing conditional scheduler/shared cron/product-predicate guarantees.

### RED: sitemap synchronization

Command:

```text
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-sync.test.ts
```

Initial result: **1 failed suite, 0 tests executed** because `sitemap-sync.ts` did not exist.

After the first functional implementation, four newly added narrow-write/idempotency assertions failed while six passed. Those failures showed that unchanged/null-lastmod snapshots still attempted unnecessary create/reset writes; the implementation was then narrowed before GREEN.

### GREEN: focused behavior

- Scheduled/product runtime tests: **28/28 passed**.
- Scheduled/product source regressions: **4/4 passed** after adding the sitemap source assertion.
- Sitemap runtime tests: **10/10 passed**, including failed-reader isolation, repeat idempotency, missing-scope behavior, concurrent-create idempotency, and monotonic lastmod race coverage.

Exact focused command required by the brief:

```text
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-sync.test.ts
npx tsx --test tests/seo-discovery-scheduled-products.test.ts tests/product-slug-integration.test.ts tests/sitemap-post-inclusion.test.ts
```

Result: **10/10 Vitest tests passed; 12/12 legacy tests passed**.

Broader SEO regression result: **239/239 Vitest tests passed across 11 files; 22/22 focused legacy tests passed**.

## Final verification

| Check | Result |
| --- | --- |
| `npm test` | PASS — Vitest **56/56 files, 609/609 tests**; legacy **315/315 tests** |
| `npm run typecheck` | PASS — `tsc --noEmit` exited 0 |
| Focused ESLint over every changed TS file | PASS — **0 errors, 9 warnings** |
| `npx prisma generate` | PASS — Prisma Client 5.22 generated successfully |
| `git diff --check` | PASS |
| Staged secret/path scan | PASS — 13 scoped paths; 0 forbidden paths, 0 known secret signatures, 0 production secret literals |
| Production build with process-only offline `DATABASE_URL` | PASS — Next.js 16.2.11 compiled, typechecked, and generated **113 static pages** |

The nine lint warnings are pre-existing `no-explicit-any`/unused-catch warnings in the two product route files; Task 5 added no new warning category or lint error.

The first build invocation stopped in the repository's environment precheck because this isolated worktree has no `DATABASE_URL`. A second build used a process-only dummy MySQL URL targeting unreachable loopback port 1. It completed successfully without contacting or mutating a real database, but database-backed static pages emitted expected connection/fallback logs. No `.env` file was created or changed.

## Concurrency and safety self-review

- **Scheduled exact-once:** the read is only candidate selection. Emission follows a successful conditional single-row update; a worker losing the race gets `P2025` and emits nothing. Events use only the saved row returned by Prisma.
- **Error boundaries:** only the expected race code is caught in `publishDuePosts()`. Cron retains timing-safe `CRON_SECRET` authorization and returns 500 for unexpected failures. The in-process interval logs an unexpected publisher failure so the maintenance loop remains alive.
- **Product old-slug/duplicate invalidation:** publication branches call the shared helper once. Whenever a publication transition also changes the slug, including inactive-to-active activation, `previousUrl` is invalidated alongside the new path while only the new URL is recorded. The legacy helper is called only on branches that do not emit.
- **Product materiality:** table tests cover every retained material field, status transitions, Decimal comparisons, ordered images, and ignored bookkeeping-only changes.
- **Sitemap fetch failure:** reader rejection occurs before `$transaction`; it cannot be mistaken for an empty snapshot and cannot mark jobs missing.
- **Sitemap absence scope:** only pre-existing `source_type='sitemap_sync'` jobs missing from a successfully parsed snapshot are skipped. Post/product-owned jobs, Post rows, and Product rows are untouched; no jobs are deleted.
- **Sitemap concurrency/idempotency:** URL uniqueness plus `skipDuplicates` prevents duplicate creates. Reset operations require `content_updated_at < incoming lastmod`, preserving monotonic versions under a stale concurrent writer. Sitemap-owned presence observations advance an `updated_at` generation token without changing evidence; missing updates compare the exact generation read, so a stale absence cannot overwrite a later presence/reset/revival.
- **URL secrecy:** reconciliation does not log sitemap URLs. URL identity and query rejection remain delegated to the fixed-origin Task 3 reader.

## Remaining concerns

1. The build proves compilation and static-generation fallback behavior, but it does not validate database-backed page contents because using a real database was outside Task 5 authorization.
2. No production routes, PM2 process, or browser session were exercised because deployment/production/network access was explicitly out of scope.

## Git

The initial report was included in commit `9ee21a6bb74f9bf5ad055bf6258fcfe29f30691a` with subject `feat(seo): cover scheduled and product discovery`. The official-review fixes below are included in a separate follow-up commit; no push was performed.

## Official review follow-up

The review identified three runtime gaps, all fixed without changing the schema, dependencies, scheduler, cron route, or public interfaces.

### Corrected behavior

- A sitemap-owned row in `SKIPPED / REMOVED_FROM_SITEMAP` now revives on equal, older, or null-lastmod reappearance. Revival is intentionally partial: it sets `PENDING_ELIGIBILITY`, schedules the next attempt, resets `attempt_count`, clears the removal error/message and lease, and preserves `content_updated_at` plus all eligibility, HTTP, canonical, GSC, crawl, and inspection evidence.
- A strictly newer non-null lastmod still performs the original full evidence reset.
- Every observed existing `sitemap_sync` row advances only its bookkeeping `updated_at` generation when no workflow/content reset is needed. The token is deterministic and strictly greater than the value read: `max(now, prior updated_at + 1 ms)`. Post/product-owned rows are not presence-stamped.
- Missing reconciliation now compares `updated_at` exactly with the generation read earlier in the transaction and advances it on a successful removal. A presence stamp, full reset, or revival completed by another sync makes a stale missing update affect zero rows.
- Product activation now passes the old product URL whenever the saved slug differs, regardless of the old status. The route still calls the publication helper exactly once, queues only the new URL, and does not call the legacy revalidator on the publication branch.

### Follow-up RED evidence

Product command:

```text
npm run test:vitest -- src/app/api/__tests__/products-publication-routes.test.ts
```

RED result: **1 failed, 6 passed**. The helper was called once with the correct activated/new URL event, but the old URL options argument was absent.

Sitemap command:

```text
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-sync.test.ts
```

RED result: **11 failed, 7 passed**. Failures covered the missing bookkeeping generation stamps, equal/older/null reappearance remaining skipped, and deterministic stale-absence interleavings overwriting equal/null/newer presence observations.

### Follow-up GREEN and final verification

| Check | Result |
| --- | --- |
| Product route regression | PASS — **7/7** |
| Sitemap reconciliation regression | PASS — **18/18** |
| Combined Task 5 runtime tests | PASS — **47/47** across 4 files |
| Required focused legacy/source tests | PASS — **12/12** |
| Broader SEO Vitest suite | PASS — **248/248** across 11 files |
| Broader SEO legacy suite | PASS — **22/22** |
| `npm test` | PASS — Vitest **56/56 files, 618/618 tests**; legacy **315/315 tests** |
| `npm run typecheck` | PASS |
| Focused ESLint over follow-up TS scope | PASS — **0 errors, 4 pre-existing route warnings** |
| `npx prisma generate` | PASS — Prisma Client 5.22 generated successfully |
| `git diff --check` | PASS before staging |
| Staged secret/path scan | PASS — 5 scoped paths; 0 forbidden paths, 0 known secret signatures, 0 production secret literals |
| Offline production build | PASS — Next.js 16.2.11 compiled, typechecked, and generated **113 static pages** |

The DB-free concurrency fake now models `updated_at`, exact Date CAS comparison, Prisma-like automatic update advancement, and a deterministic barrier after each captured database snapshot. Tests force a stale missing transaction to resume only after a newer-lastmod reset or equal/null presence stamp and assert that the stale removal count is zero. Two concurrent missing snapshots still produce one removal transition.

The build again used only a process-local dummy MySQL URL pointing at unreachable loopback port 1. Expected Prisma connection/fallback logs were emitted; no real database or external network was used, and no `.env`, schema, migration, or dependency was changed.

## Final CAS review follow-up

A final review found that the first observation-generation CAS fix still treated a lost sitemap-owned CAS as unchanged. If an equal/null presence stamp advanced `updated_at` before a newer-lastmod writer completed, the newer writer affected zero rows and silently dropped its full reset.

### Robust retry design

- Sitemap-owned observation operations retain the exact `{ id, source_type, updated_at }` CAS.
- A zero-row CAS now re-reads the current row by URL and retries, bounded to three total CAS attempts.
- The interactive transaction runs at Prisma `ReadCommitted`, with the existing short SEO transaction limits `maxWait: 500` and `timeout: 2_000`, so a retry read can observe a concurrent MySQL commit.
- Every attempt recomputes its operation from the freshly read row and derives the next generation as `max(now, current updated_at + 1 ms)`. No retry writes a token derived from a row that already lost a CAS.
- Priority is recomputed on every retry: strictly newer incoming lastmod performs a full reset; current `SKIPPED / REMOVED_FROM_SITEMAP` with non-newer/null lastmod performs partial revival; otherwise sitemap-owned presence performs a bookkeeping-only stamp.
- If a concurrent writer already stored content at least as new as the incoming lastmod, the retry preserves that content and its evidence, then advances the observation token so a stale missing snapshot cannot match it.
- If ownership changes to post/product, non-newer/null presence performs no stamp. A still-newer lastmod uses the existing monotonic reset without changing `source_type` or `source_id`.
- Three consecutive CAS losses throw stable internal error `SEO_DISCOVERY_SITEMAP_CAS_RETRY_EXHAUSTED`. Throwing from the interactive callback rolls back all earlier writes in that sync transaction rather than committing a partial reconciliation.
- Missing reconciliation keeps its exact-token CAS and concurrent missing snapshots remain a single idempotent removal transition.

### Final follow-up RED evidence

Command:

```text
npm run test:vitest -- src/lib/seo-discovery/__tests__/sitemap-sync.test.ts
```

After correcting one test-fixture mistake where the purported “equal” lastmod was actually newer than the baseline, the accepted RED result was **7 failed, 18 passed**. Failures independently demonstrated:

1. Missing `ReadCommitted` transaction options.
2. A newer reset dropped after an equal presence stamp won the first CAS.
3. A newer reset dropped after a null presence stamp won the first CAS.
4. A newer reset dropped after an unrelated bookkeeping token advance.
5. An already-newer refreshed row did not receive a fresh protection token.
6. A still-newer reset was dropped after ownership changed to product.
7. Continuous CAS conflict resolved as unchanged instead of throwing and rolling back.

### Final follow-up GREEN and verification

| Check | Result |
| --- | --- |
| Sitemap focused regression | PASS — **25/25** |
| Combined Task 5 runtime suite | PASS — **54/54** across 4 files |
| Required legacy/source suite | PASS — **12/12** |
| Broader SEO Vitest suite | PASS — **255/255** across 11 files |
| Broader SEO legacy suite | PASS — **22/22** |
| `npm test` | PASS — Vitest **56/56 files, 625/625 tests**; legacy **315/315 tests** |
| `npm run typecheck` | PASS |
| Focused ESLint over final CAS scope | PASS — **0 errors, 0 warnings** |
| `npx prisma generate` | PASS — Prisma Client 5.22 generated successfully |
| Working diff check | PASS |
| Staged secret/path scan | PASS — 3 scoped paths; 0 forbidden paths, 0 known secret signatures, 0 production secret literals |
| Offline production build | PASS — Next.js 16.2.11 compiled, typechecked, and generated **113 static pages** |

The DB-free transaction fake now supports ReadCommitted-style current-row re-reads, deterministic pre-update concurrency barriers, ownership/content changes by competing writers, and optional rollback verification. Assertions target durable outcomes: the incoming newer content wins exactly once, full evidence is reset only when still newer, generation tokens remain strictly monotonic, ownership is preserved, and retry exhaustion leaves earlier transaction work uncommitted.

The final build used only a process-local dummy MySQL URL targeting unreachable `127.0.0.1:1`. Expected Prisma connection/fallback logs were emitted; no real database, external network, deployment, schema, migration, dependency, scheduler, cron, or product-route change was made in this follow-up.
