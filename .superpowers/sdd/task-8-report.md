# Task 8 report — protected Google discovery admin monitor

## Outcome

Implemented a protected Mushroomie admin surface for monitoring Google discovery and
indexing evidence at `/admin/seo/lap-chi-muc`. The page is a Server Component with an
explicit admin/super-admin check and renders one focused client dashboard. No database
migration, production deployment, or real Google Search Console request was performed.

## Scope delivered

- Added the paginated `GET /api/admin/seo-discovery` endpoint with:
  - server-side `requireAdmin()` authorization;
  - strict Zod filters, duplicate/unknown-key rejection, bounded page/search values,
    and a page-size cap of 100;
  - global status summaries, fixed-sitemap state, and a redacted allowlisted job DTO;
  - URL/source-only search and partial Google status failure handling;
  - no credential path, lease token, raw Google response, stack trace, or secret output.
- Added the audited `POST /api/admin/seo-discovery/actions` endpoint with exactly:
  - `retry`;
  - `sync_sitemap`;
  - `test_connection`;
  - `submit_sitemap`.
- Mutating requests require an exact same-origin `Origin`, exact
  `application/json` media type, a bounded 16 KiB body, strict action schemas, and
  the existing distributed rate limiter. A limiter outage fails closed with a stable
  redacted 503 response.
- Retry and configuration recovery use bounded, lease-aware compare-and-swap updates
  containing the exact ID, status, content version, row version, lease token, and lease
  expiry snapshot. Active leases are preserved. Expired leases may be cleared only when
  the whole snapshot still matches.
- A successful connection test recovers at most ten
  `CONFIGURATION_REQUIRED` jobs to `PENDING_ELIGIBILITY`, allowing Task 7's normal
  worker claim path to resume without requiring content republishing.
- Sitemap sync and submission always use the compiled fixed canonical sitemap. The API
  accepts no URL, property, or credential target from the client.
- Audit records contain stable action outcomes, IDs/counts, and fixed public values only.
  A configuration-blocked submission is recorded as `blocked`, not `success`.
- Added a Vietnamese, responsive dashboard with connection banners, disclosure copy,
  summary cards, status/source/URL filters, evidence/timestamp views, retry selection,
  fixed sitemap actions, loading/empty/error states, and pagination.
- Desktop uses a horizontally scrollable evidence table; mobile uses compact cards.
  Controls have accessible names and 44 px targets. Status updates and failures use
  live status/alert semantics. A failed refresh keeps existing evidence visible while
  explicitly warning that it may be stale.
- Added the SearchCheck “Lập chỉ mục” entry under “Nội dung & hệ thống”.

## Review hardening follow-up

- Centralized dashboard reads behind one abort controller and monotonically increasing
  request generation. Reversed or aborted responses cannot overwrite newer filter state,
  and action completion refreshes the current query rather than a captured stale query.
- Moved database summaries, filtered totals, effective-page clamping, and paginated rows
  into one short interactive `RepeatableRead` transaction with bounded wait/timeout.
  Google status is fetched only after that database transaction completes.
- Restricted numeric job IDs to the signed database integer maximum
  (`2_147_483_647`).
- Hardened action CSRF checks for the production reverse-proxy topology: the exact
  canonical `https://mushroomie.io.vn` origin is accepted independently of the internal
  request URL, explicit localhost origins are development-only, and missing,
  cross-origin, lookalike, or forwarded-host claims are rejected.
- Bound action rate-limit identity to the authenticated administrator ID. Rotating
  spoofable client-IP headers cannot reset the quota, while different administrators
  retain independent quotas.
- Added an explicit admin/super-admin role predicate to both API handlers. Anonymous,
  user, and viewer roles are rejected server-side; the sidebar also hides the discovery
  entry from viewer accounts.
- Enlarged checkbox label hit areas to a true 44 × 44 px on desktop and mobile and
  exposed Google `lastCrawlAt` evidence in both responsive presentations.

## TDD and self-review evidence

- Initial API RED: route module missing; final API suite: 29/29 passing.
- Initial UI RED: dashboard module missing; final UI suite: 15/15 passing.
- Sidebar role suite: 3/3 passing.
- Initial source-security RED: 2/4 failing because the page/component were absent;
  final source-security suite: 5/5 passing.
- Additional RED → GREEN cases covered:
  - rate limiter backend failure must fail closed without mutation or secret leakage;
  - blocked sitemap submission must not be audited as success;
  - `application/jsonp` must not pass JSON media-type validation;
  - unbounded page offsets must be rejected;
  - a refresh failure with existing data must remain visible to the administrator;
  - reversed deferred responses cannot win over the latest dashboard query;
  - API reads use one repeatable database snapshot and return an effective clamped page;
  - production reverse-proxy origins, role matrices, user-bound quotas, database ID
    bounds, crawl timestamps, sidebar visibility, and 44 px checkbox labels.
- Runtime tests cover authorization, strict filters/actions, rate limiting, body bounds,
  fixed sitemap submission, provider-error redaction, audit details, active/stale leases,
  bounded configuration recovery, loading/empty/configured/unconfigured/partial-error
  UI, filtering, pagination, confirmation, pending controls, Vietnamese labels, and
  accessible target sizes.
- Performance review: no chart/animation/editor dependency was added; the public site
  and shared layouts do not import this dashboard; page size is fixed at 25 in the UI
  and capped at 100 on the API; only transform-free lightweight state feedback and
  existing Lucide/Admin UI primitives are used.

## Verification

- `npx prisma generate`: PASS.
- Focused Vitest API + UI/sidebar: PASS — 3 files, 47 tests.
- `npx tsx --test tests/seo-discovery-admin-security.test.ts`: PASS — 5 tests.
- `npm run typecheck --if-present`: PASS.
- Scoped ESLint for all Task 8 files: PASS — 0 errors, 0 warnings.
- Full `npm run lint --if-present`: PASS — 0 errors; 205 existing warnings outside
  Task 8 remain unchanged.
- Full `npm run test:vitest`: PASS — 62 files, 772 tests.
- Full `npm run test:legacy`: PASS — 324 tests.
- `npm audit --omit=dev`: PASS — 0 vulnerabilities.
- Offline production `npm run build`: PASS — Next.js 16.2.11 compiled, typechecked,
  and generated 113 routes. It used a deliberately unreachable dummy database URL and
  disabled discovery/GSC flags; existing static data loaders emitted expected caught
  Prisma connection diagnostics, while the build exited 0. The new page and both APIs
  are dynamic routes.
- Diff whitespace and staged secret scans: PASS before commit.

## Browser and environment limitation

No `chrome-devtools` MCP tool was callable in this session. Therefore the requested
authenticated checks at 1440, 1366, 390, and 360 px were not claimed. Responsive,
overflow, loading, network-state, and accessibility behavior is covered by component
tests and source review only. No personal Chrome profile was attached.

No push, deployment, PM2 restart, production database operation, schema operation,
credential read, or live Google Search Console call was made.
