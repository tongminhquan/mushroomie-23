# Task 9 report — rollout, backfill, performance and documentation

Date: 2026-08-11

## Scope

- Added a dry-run-by-default SEO discovery backfill for public posts/products.
- Added static import-graph gates keeping admin, Search Console authentication,
  the GSC adapter and worker out of storefront bundles.
- Expanded the Lighthouse reporter with network/TTFB/JS/CSS evidence, exact
  three-run grouping, median comparison and rollout thresholds.
- Added operator commands and the complete Search Console/discovery runbook.
- Captured production `before` Lighthouse evidence; generated JSON remains
  ignored and must not be committed.

## TDD evidence

Backfill:

- RED: dry-run module absent; then `--apply` did not record publication events.
- GREEN: 5/5 tests pass for fixed origin, public-row selection, 100-row cursor
  pagination, dry-run no-write, exact apply flag and shared repository use.
- Review RED/GREEN: a per-row repository failure previously left the CLI exit
  code at zero. The CLI now prints its bounded summary and then fails with
  `SEO_DISCOVERY_BACKFILL_PARTIAL_FAILURE` whenever `errors` is nonzero.

Performance boundaries:

- GREEN: public entrypoints cannot reach dashboard/GSC/google-auth/worker;
  dashboard has one protected admin importer; worker batch remains 10 and outside
  public rendering.
- Post-build scan of `.next/static/chunks` found zero client-chunk occurrences of
  `google-auth-library`, `GoogleAuth`, `SeoDiscoveryDashboard`,
  `SEO_DISCOVERY_WORKER` or `seo_discovery_jobs`.

Lighthouse reporter hardening:

- RED: incomplete/incorrect run sets were accepted and no before/after comparator
  existed (2 expected failures).
- GREEN: 8/8 reporter tests pass; each group now requires runs 1, 2 and 3; the
  comparator reports/fails score drops over 2, FCP/LCP/TBT/CLS/total KiB/main
  thread regressions over 5%, and homepage after-deploy median below 100.
- Review RED/GREEN: the reporter now persists and compares the exact form
  factor, throttling method, network/CPU throttling values and screen emulation;
  it also verifies filename device, canonical final URL and the complete
  three-route/two-device matrix for every present phase.
- Review RED/GREEN: literal PowerShell globs are expanded by the reporter;
  five-percent comparisons use unrounded audit values; the LCP node comes only
  from the median run; Chrome is consistent across the full matrix and runtime
  profiles are consistent across every route for each device.
- Review RED/GREEN: the public import graph now discovers all 63 root/user Next
  rendering entrypoints, parses runtime imports with the TypeScript AST, resolves
  modules through TypeScript (including `.js` to `.ts`) and fails closed on
  unresolved/non-literal local runtime edges.

Admin rollout probe:

- RED: with discovery enabled and GSC disabled, the normal factory returned
  `GSC_DISABLED`, so the documented pre-enable connection test was impossible.
- GREEN: the authenticated admin action uses a dedicated probe factory that may
  ignore only the GSC switch. It verifies both sitemap access and URL Inspection
  permission against fixed production targets while the normal worker client
  remains disabled. The discovery master switch and all credential boundaries
  remain mandatory.
- The runbook now states the real 14,400/day theoretical full-backlog ceiling,
  records that there is no durable daily counter, and limits this rollout to a
  measured inventory below 1,000 with a 1,500-call operational stop threshold.

Focused verification after changes:

```text
npx tsx --test tests/seo-discovery-backfill.test.ts \
  tests/seo-discovery-performance-boundaries.test.ts \
  tests/lighthouse-report.test.ts \
  tests/performance-regressions.test.ts \
  tests/site-build-boundaries.test.ts

37 tests, 37 passed, 0 failed
```

Probe/admin verification after the review fix: 56/56 focused Vitest cases
passed across `gsc-client.test.ts` and `admin-api.test.ts`.

## Production BEFORE Lighthouse baseline

Pinned runner:

- Lighthouse: 13.4.1
- Browser: Chrome for Testing 149.0.7827.22
- Runner/location: same Windows workstation, same session window
- Artifacts: three JSON runs per route/device under ignored
  `artifacts/performance/`
- Routes: `/`, `/tin-tuc`, `/san-pham`
- Devices: Lighthouse mobile and desktop presets

Median results:

| Route | Device | Score | FCP ms | LCP ms | TBT ms | CLS | KiB | Main ms | TTFB ms | Req | Failed | JS KiB | CSS KiB |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | Desktop | 99 | 553 | 963 | 0 | 0.001228 | 791 | 677 | 60 | 98 | 0 | 269 | 33 |
| `/` | Mobile | 92 | 1868 | 3174 | 22 | 0 | 628 | 2097 | 64 | 55 | 0 | 230 | 33 |
| `/san-pham` | Desktop | 98 | 565 | 1043 | 0 | 0.001512 | 777 | 653 | 424 | 106 | 0 | 319 | 33 |
| `/san-pham` | Mobile | 92 | 1615 | 3134 | 20 | 0.000479 | 643 | 2037 | 458 | 65 | 0 | 281 | 33 |
| `/tin-tuc` | Desktop | 99 | 575 | 912 | 0 | 0.002264 | 1074 | 588 | 467 | 123 | 0 | 266 | 33 |
| `/tin-tuc` | Mobile | 91 | 1655 | 3418 | 15 | 0.002467 | 594 | 1549 | 308 | 55 | 0 | 228 | 33 |

Median-run LCP elements:

| Route | Desktop | Mobile |
|---|---|---|
| `/` | `Phụ kiện handmade Mushroomie` | `Phụ kiện handmade Mushroomie` |
| `/san-pham` | `Vòng tay Midnight Wish` | `Phụ kiện handmade cá nhân hóa` |
| `/tin-tuc` | `Vì sao nên chọn phụ kiện handmade cá nhân hóa?` | `Vì sao nên chọn phụ kiện handmade cá nhân hóa?` |

### Diagnosis

- Hero uses the 750px WebP variant on mobile, transfers about 31 KiB, is in the
  initial HTML, eager, `fetchpriority=high`, and Lighthouse passes all LCP image
  discovery checks. No controlled image delivery defect was found.
- Largest unused-JS opportunities are shared React/Next runtime chunks, not the
  new Search Console/auth/admin/worker feature.
- The public layout import gate proves zero feature-attributable public bundle
  inclusion.
- The main render-blocking asset is the existing global CSS (~33 KiB).
- Self-review found one original homepage mobile artifact had accidentally used
  Chrome 151. The reporter correctly rejected the mixed runtime; that artifact
  was rerun with Chrome for Testing 149 and validated before accepting the
  baseline. The valid homepage mobile scores are 92, 91 and 95, which is why
  medians and runtime metadata are mandatory.
- Direct Chrome production checks found no horizontal overflow, broken image or
  console warning/error. The hero used the 750x375 source and high priority.

The `before` homepage target is not 100 (median desktop 99/mobile 92). This is
recorded honestly; no after-deploy/no-regression/100 claim is made. Exact `after`
runs must use the same toolchain and be compared by `npm run perf:report` after
production deployment.

## Operations and safety

- Backfill dry-run: `npm run seo:discovery:backfill`.
- Apply: `npm run seo:discovery:backfill:apply` only after backup/schema review.
- Generated performance artifacts are ignored.
- No production DB, Google API, secret, push or deploy operation occurred in
  Task 9 local implementation.

## Remaining rollout gates

- Full diff/secret/scope review and independent code review.
- Verify exact new VPS and project path; backup and inspect migration; obtain
  explicit migration confirmation.
- Deploy with flags false, verify PM2/routes/MIME/uploads/images/QR.
- Enable discovery first, dry-run/apply backfill, then enable GSC only after
  service-account property access and admin connection test.
- Controlled publication acceptance and 18 after-deploy Lighthouse audits.

## Ordered full local verification

Completed in the required order:

1. `npm ci` — PASS, 681 packages installed, audit 0 vulnerabilities. npm emitted
   existing optional WASM peer/deprecation warnings; install exited 0.
2. `npx prisma generate` — PASS, Prisma Client 5.22.0.
3. `npx prisma validate` with process-only unreachable dummy MySQL URL — PASS.
4. `npm run test` — first run had one known resource-contention timeout in the
   pre-existing auth-contract `post create` case while 771 passed. The exact case
   then passed in 1.09s; after all review fixes, a fresh sequential full run
   passed 774/774 Vitest and 341/341 legacy. No source or timeout was changed.
5. `npm run lint --if-present` — PASS, 0 errors and 205 pre-existing warnings.
   Scoped Task 9 lint with `--no-ignore` passed with 0 errors/0 warnings.
6. `npm run typecheck --if-present` — PASS.
7. `npm run build` — PASS: Next 16.2.11 compiled, typechecked and generated all
   113 routes. Build used a process-only dummy DB at `127.0.0.1:9` with both SEO
   flags false; expected caught Prisma fallback logs occurred and no real DB was
   contacted or mutated.
8. `npm audit --omit=dev` — PASS, 0 vulnerabilities.
