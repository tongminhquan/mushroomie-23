# Task 5 report: scheduled posts, active products, and sitemap reconciliation

Date: 2026-08-11

Status: **DONE_WITH_CONCERNS**

The Task 5 behavior is implemented and the complete automated test suite passes. The remaining concerns are verification-environment limitations and one deliberately conservative sitemap-reappearance rule, both documented below.

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
- **Product old-slug/duplicate invalidation:** publication branches call the shared helper once. For an active slug change, `previousUrl` is invalidated alongside the new path while only the new URL is recorded. The legacy helper is called only on branches that do not emit.
- **Product materiality:** table tests cover every retained material field, status transitions, Decimal comparisons, ordered images, and ignored bookkeeping-only changes.
- **Sitemap fetch failure:** reader rejection occurs before `$transaction`; it cannot be mistaken for an empty snapshot and cannot mark jobs missing.
- **Sitemap absence scope:** only pre-existing `source_type='sitemap_sync'` jobs missing from a successfully parsed snapshot are skipped. Post/product-owned jobs, Post rows, and Product rows are untouched; no jobs are deleted.
- **Sitemap concurrency/idempotency:** URL uniqueness plus `skipDuplicates` prevents duplicate creates. Reset operations require `content_updated_at < incoming lastmod`, preserving monotonic versions under a stale concurrent writer. Repeated equal/null snapshots issue no reset and preserve inspection evidence.
- **URL secrecy:** reconciliation does not log sitemap URLs. URL identity and query rejection remain delegated to the fixed-origin Task 3 reader.

## Remaining concerns

1. A sitemap-owned job previously marked `REMOVED_FROM_SITEMAP` stays skipped if the URL reappears with null, equal, or older `lastmod`; it is revived only by a strictly newer `lastmod`. This is the conservative consequence of the explicit rule that absent/equal/older/null versions preserve evidence and only an advancing `lastmod` performs a full reset.
2. The build proves compilation and static-generation fallback behavior, but it does not validate database-backed page contents because using a real database was outside Task 5 authorization.
3. No production routes, PM2 process, or browser session were exercised because deployment/production/network access was explicitly out of scope.

## Git

The report was generated immediately before staging. It is included in the single Task 5 commit with subject `feat(seo): cover scheduled and product discovery`; no push was performed.
