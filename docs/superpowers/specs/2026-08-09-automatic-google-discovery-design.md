# Automatic Google Discovery and Indexing Monitoring

**Date:** 2026-08-09

**Status:** Approved architecture (Option A), pending written-spec review

**Site:** `https://mushroomie.io.vn`

**Google property:** `sc-domain:mushroomie.io.vn`

## 1. Purpose

Build a production-safe system that reacts when an indexable Mushroomie article, product, or page becomes public, makes the URL immediately discoverable through the site's sitemap and feed, and tracks Google's observed indexing state through the Search Console API.

The feature must improve discovery without blocking publishing, misusing Google's APIs, leaking credentials, or promising that Google will index a URL immediately.

## 2. Google policy constraints

The implementation must follow these non-negotiable constraints:

- Do not call the Google Indexing API for Mushroomie blog posts, product pages, category pages, or ordinary landing pages. Google limits that API to pages containing `JobPosting` or `BroadcastEvent` embedded in `VideoObject`.
- Search Console's Sitemap API may register and inspect a sitemap. Registering a sitemap is a discovery signal, not a guarantee of crawling or indexing.
- Search Console's URL Inspection API reports Google's known state. It cannot automate the “Request indexing” button from the Search Console UI.
- Do not resubmit the same unchanged sitemap for every publication. The sitemap should be registered once and resubmitted only when it is missing, rejected, or intentionally replaced.
- Sitemap `<lastmod>` must represent a significant content update. It must not be rewritten merely because the sitemap was requested.
- Only canonical, HTTPS, publicly accessible, indexable URLs may enter the discovery queue.

The admin UI and operational documentation must use the terms **discovery**, **inspection**, and **indexing status**, not “guaranteed instant indexing.”

## 3. Current state

Mushroomie already has useful foundations:

- `src/app/sitemap.ts` includes active products, published posts, product categories, static pages, and local SEO landing pages.
- Published posts are filtered by `robots_index` and canonical eligibility.
- Dynamic records use `updated_at` as `lastModified`.
- `src/app/robots.ts` declares `https://mushroomie.io.vn/sitemap.xml`.
- `src/app/feed.xml/route.ts` publishes the 30 newest articles.
- Scheduled posts are published by an in-process 60-second job and a protected cron backstop.

The gaps are:

- Sitemap regeneration may be delayed by its 3,600-second ISR window.
- Publishing is implemented in several independent paths, with no central post-publication event.
- Post creation, post update, bulk publish, bulk import, scheduled publishing, and cron publishing do not share a common SEO discovery operation.
- A newly deployed static route has no database publication event.
- There is no durable queue, retry state, inspection history summary, or admin visibility.
- Google credentials are not configured on the current machine.

## 4. Scope

### 4.1 Included

- Articles created directly as `published`.
- Articles transitioning from draft/private/hidden/scheduled to `published`.
- Bulk-published articles.
- Bulk-imported published articles.
- Articles released by either scheduled-publishing mechanism.
- Active products created or activated through admin product flows.
- Public static/local landing pages discovered after deployment through sitemap synchronization.
- Immediate cache revalidation for affected public routes, article listing, sitemap, and feed.
- Durable eligibility checks and retry scheduling.
- Search Console sitemap connection and status checks.
- Delayed URL Inspection checks after publication.
- Admin status page and manual safe retry actions.
- Production configuration and runbook updates.

### 4.2 Excluded

- Google Indexing API submissions for ordinary Mushroomie content.
- Automating Search Console's UI-only “Request indexing” action.
- Promising a maximum time in which Google must index a page.
- Submitting admin, API, checkout, account, cart, search-result, filtered, paginated, redirected, noindex, or non-canonical URLs.
- Adding Redis, Kafka, RabbitMQ, or another queue service.
- Automatically deleting Google credentials or Search Console properties.
- Reworking unrelated SEO content or redesigning the admin application.

## 5. Architecture

The system is split into small units so publishing, discovery, Google integration, and admin presentation remain independently testable.

### 5.1 Publication event

Use one internal event shape:

```ts
interface PublicContentPublication {
  source: 'post' | 'product' | 'sitemap_sync'
  sourceId?: number
  url: string
  contentUpdatedAt: Date
  reason: 'created' | 'published' | 'updated' | 'activated' | 'scheduled' | 'deploy_sync'
}
```

The event is derived only for a mutation that makes or keeps eligible content public. Its durable queue row is written atomically with the content mutation where practical; external effects such as cache revalidation and Google calls run only after that transaction commits. Re-saving an unchanged draft must not create a job.

For a published URL whose significant content changes, the existing job is reset with the new `contentUpdatedAt`. This allows Google status to be rechecked without creating unbounded duplicate rows.

### 5.2 Central publication helpers

Create bounded helpers rather than duplicating side effects in every route:

- `recordPublicContentPublication(event)` validates and upserts a discovery job.
- `revalidatePublishedContent(event)` revalidates the precise public URL plus shared discovery surfaces.
- `publishDuePosts()` returns the posts actually transitioned, including IDs, slugs, and timestamps, instead of only a count.
- Bulk workflows collect the successfully transitioned rows and enqueue only those rows.

Publishing and queue persistence should use the same database transaction where practical. Network requests to Google must never run inside that transaction or inside the user's publish request. Cache revalidation also runs after commit so a failed transaction can never expose a URL that was not actually published.

After a successful commit, revalidation failures are logged and retried by maintenance; they do not revert an already valid publication.

### 5.3 Durable database queue

Add a Prisma model named `SeoDiscoveryJob`. Use strings for externally evolving status values, consistent with the current project style.

Required fields:

| Field | Purpose |
|---|---|
| `id` | Primary key |
| `url` | Unique canonical URL, maximum 512 characters |
| `source_type` | `post`, `product`, or `sitemap_sync` |
| `source_id` | Optional database entity ID |
| `content_updated_at` | Significant content version represented by the job |
| `status` | Current workflow state |
| `eligibility_status` | Eligibility result independent of Google state |
| `http_status` | Last public HTTP response status |
| `declared_canonical` | Canonical found on the page |
| `robots_indexable` | Last verified indexability state |
| `gsc_verdict` | URL Inspection verdict |
| `coverage_state` | Human-readable Google coverage state |
| `page_fetch_state` | Google's reported fetch state |
| `google_canonical` | Canonical selected by Google |
| `last_crawl_at` | Last Google crawl time, when known |
| `last_inspected_at` | Last successful URL Inspection call |
| `next_attempt_at` | Durable schedule for the next action |
| `attempt_count` | Number of consecutive failed attempts |
| `last_error_code` | Sanitized operational error category |
| `last_error_message` | Sanitized message without tokens or response dumps |
| `created_at`, `updated_at` | Audit timestamps |

Indexes:

- Unique index on `url`.
- Composite index on `status, next_attempt_at` for the worker hot path.
- Composite index on `source_type, source_id` for admin navigation.

Initial statuses:

- `PENDING_ELIGIBILITY`
- `ELIGIBLE`
- `INSPECTION_SCHEDULED`
- `INDEXED`
- `NOT_INDEXED`
- `RETRY`
- `SKIPPED`
- `CONFIGURATION_REQUIRED`
- `ERROR`

The table stores no Google credentials, access tokens, raw service-account JSON, article body, customer data, or arbitrary external response payloads.

### 5.4 Eligibility gate

Before any URL is marked eligible, the worker must verify:

1. URL origin is exactly `https://mushroomie.io.vn`.
2. URL uses HTTPS and contains no credentials, fragment, or unexpected port.
3. Path is not under `/admin`, `/api`, `/tai-khoan`, `/thanh-toan`, `/gio-hang`, or another configured utility prefix.
4. Query-string URLs are rejected unless they are an explicitly approved canonical catalog URL.
5. Public request returns HTTP 200 after a bounded redirect policy. Cross-origin redirects are rejected.
6. `X-Robots-Tag` and HTML robots metadata allow indexing.
7. The declared canonical is the URL itself or an explicitly accepted canonical target.
8. The URL appears in the generated sitemap.
9. For database content, its current status is still public and its slug still matches.

This gate prevents an admin-supplied or compromised URL from turning the worker into an SSRF client. URL values come from trusted server-side route builders, not directly from request payloads.

### 5.5 Sitemap and feed behavior

On a valid publication transition:

- Revalidate the published URL.
- Revalidate `/tin-tuc` for articles or `/san-pham` for products.
- Revalidate `/sitemap.xml` immediately.
- Revalidate `/feed.xml` for articles.
- Revalidate `/` only when the public homepage actually consumes the affected content.

The existing hourly revalidation remains as a safety net. It is not the primary publication mechanism.

The implementation must preserve accurate `lastModified` dates and current sitemap eligibility filters. Deprecated `priority` and `changeFrequency` fields are not part of this feature and do not need a risky unrelated rewrite.

### 5.6 Static and code-defined pages

Static routes do not emit database publication events. The protected SEO maintenance job therefore performs a sitemap synchronization:

1. Fetch the production sitemap.
2. Parse only same-origin canonical URLs.
3. Upsert URLs not yet known to `SeoDiscoveryJob` with reason `deploy_sync`.
4. Reset a known job only when its sitemap `lastmod` advances.
5. Mark URLs removed from the sitemap for review; do not automatically request removal from Google.

This covers newly deployed landing pages without coupling the deploy script to Google credentials.

### 5.7 Background worker

Extend the existing maintenance mechanism rather than add infrastructure:

- The in-process maintenance tick processes a small bounded batch.
- The protected cron endpoint is the backstop after restarts or missed ticks.
- Use a database claim/update pattern so two PM2 workers cannot process the same job concurrently.
- Each run has a strict item count and time budget.
- Exponential backoff applies to transient network errors and 429/5xx responses.
- 401/403 configuration failures transition jobs to `CONFIGURATION_REQUIRED` and stop repeated calls until configuration changes.
- A Google `NOT_INDEXED` result is not a transport error. It schedules later inspection rather than rapidly retrying.

Recommended inspection schedule for a newly eligible URL:

- First inspection: approximately 24 hours after publication.
- Second inspection: approximately 72 hours after publication if not indexed.
- Third inspection: approximately 7 days after publication.
- After that: manual retry or a low-frequency monitoring schedule.

These intervals are configurable and must honor Search Console URL Inspection quotas.

### 5.8 Google adapter

Create a narrow `GoogleSearchConsoleClient` interface with production and disabled implementations:

```ts
interface GoogleSearchConsoleClient {
  getConnectionStatus(): Promise<ConnectionStatus>
  listSitemaps(): Promise<SitemapStatus[]>
  submitSitemap(sitemapUrl: string): Promise<void>
  inspectUrl(url: string): Promise<UrlInspectionResult>
}
```

Behavior:

- At setup or maintenance time, list registered sitemaps.
- Submit `https://mushroomie.io.vn/sitemap.xml` only when missing, failed, or explicitly retried by an authorized admin.
- Do not submit the sitemap after every article publication.
- Use URL Inspection only for eligible queued URLs and according to the delayed schedule.
- Map external response fields into the small internal result type; do not leak Google response objects throughout the codebase.

No new heavy Google SDK is required if OAuth service-account signing and REST calls can be implemented safely with an existing, maintained dependency. During implementation, dependency choice must be checked for size, maintenance, and security before installation.

### 5.9 Credentials and feature flags

Production configuration:

```env
SEO_DISCOVERY_ENABLED=true
GSC_INTEGRATION_ENABLED=false
GSC_PROPERTY=sc-domain:mushroomie.io.vn
GOOGLE_APPLICATION_CREDENTIALS=/etc/mushroomie/gsc-service-account.json
```

Rules:

- The JSON credential file lives outside the repository and outside public directories.
- File permissions allow only the application/deployment account to read it.
- `.env` contains a path, not private-key content.
- Never commit the JSON, base64 credential, token, client secret, or debug dump.
- Add the service-account `client_email` to the Search Console property with the least privilege that successfully supports sitemap submission and URL Inspection.
- `GSC_INTEGRATION_ENABLED=false` uses a disabled adapter. Publication, sitemap, feed, and queue behavior continue normally.

## 6. Admin experience

Add `/admin/seo/lap-chi-muc` under the admin navigation.

### 6.1 Summary

- Connection state: connected, disabled, missing credential, permission error.
- Sitemap state: registered, pending, warning count, error count, last submitted.
- Job totals: pending, indexed, not indexed, retrying, skipped, configuration required.
- Median publication-to-first-inspection time.

### 6.2 Job table

Columns:

- URL and content source.
- Eligibility.
- Published/content-updated time.
- Sitemap presence.
- Google verdict and coverage state.
- Google/user canonical comparison.
- Last crawl and inspection times.
- Next retry and sanitized error.

Filters:

- Source type.
- Workflow status.
- Eligibility.
- Google verdict.
- Date range and URL search.

Actions:

- Recheck eligibility.
- Schedule another URL Inspection.
- Register/retry the sitemap when appropriate.
- Open the public URL.
- Open Search Console for manual investigation.

All actions require admin authorization on the server. Manual retry endpoints are rate-limited and audited. UI hiding alone is not authorization.

## 7. Error handling

| Condition | Result |
|---|---|
| Credential not configured | Queue remains operational; job shows `CONFIGURATION_REQUIRED` only when a Google action is due |
| Sitemap not registered | Authorized worker submits it once, then refreshes status |
| Public URL returns non-200 | Retry transient 5xx; skip permanent 404 after confirmation |
| URL is noindex/non-canonical | `SKIPPED` with explicit eligibility reason |
| Google returns 429 or 5xx | Exponential backoff with jitter |
| Google returns 401/403 | Stop repeated API calls and surface configuration error |
| Google reports not indexed | Schedule a later inspection; do not classify as system failure |
| Publication succeeds but enqueue fails | Structured error log and maintenance sitemap sync recover the URL |
| Slug changes after publication | Queue new canonical URL; mark old URL for review and rely on the site's redirect/canonical policy |
| Job worker crashes | Database state remains; cron or next tick resumes work |

## 8. Security and privacy

- Service-account credentials never enter Git, browser bundles, API responses, logs, admin tables, or database rows.
- Google API operations execute server-side only.
- Admin endpoints use existing admin/super-admin authentication and server authorization.
- Manual actions use rate limiting and admin audit logs.
- Same-origin URL construction and the eligibility gate prevent SSRF.
- Search Console calls use one bounded 15-second total deadline per request,
  bounded response sizes, and no redirects. Public-page eligibility and sitemap
  reads retain their separate stricter fetch deadlines.
- Error messages are normalized before persistence; raw provider responses are not stored.
- No customer, order, payment, voucher, or user data is involved.

## 9. Testing strategy

### 9.1 Unit tests

- Detect only genuine status transitions to public.
- Build canonical post/product URLs from trusted fields.
- Reject utility, cross-origin, noindex, redirected, and malformed URLs.
- Reset an existing job when `content_updated_at` advances.
- Preserve indexed state for an unchanged publication event.
- Map Search Console responses without exposing unknown fields.
- Calculate backoff and inspection schedules.

### 9.2 Integration tests

- Creating a published post creates one job.
- Creating a draft creates no public job.
- Updating draft to published creates one job.
- Updating an already published article's significant content resets the job version.
- Bulk publication queues only successfully transitioned posts.
- Bulk import queues published rows and not drafts/scheduled rows.
- Scheduled publisher and cron backstop cannot create duplicates.
- Product activation creates an eligible product job.
- Missing credential does not fail publication.
- A mocked 429 schedules retry.
- A mocked PASS URL Inspection result persists canonical and crawl data.
- All admin APIs reject unauthenticated and ordinary-user requests.

### 9.3 Build and production verification

- `npm ci`
- `npx prisma generate`
- `npm run typecheck --if-present`
- Relevant Vitest and legacy tests.
- `npm run build`
- Apply migration only after backup and explicit production confirmation.
- Verify `/sitemap.xml`, `/feed.xml`, a newly published article, and admin SEO route.
- Check PM2 logs and all main routes.
- Check CSS/JS MIME.
- Verify sitemap registration and one URL Inspection call after credentials are configured.

No automated test may call the real Google API. Production verification uses one controlled read/submit operation after configuration.

## 10. Deployment and rollback

### Phase 1: code and schema, Google disabled

1. Back up production database and operational configuration.
2. Apply additive `SeoDiscoveryJob` migration.
3. Deploy code with `SEO_DISCOVERY_ENABLED=true` and `GSC_INTEGRATION_ENABLED=false`.
4. Verify publishing, queue creation, sitemap/feed revalidation, cron, PM2, and routes.
5. Run sitemap synchronization to backfill existing eligible URLs at a bounded rate.

### Phase 2: connect Search Console

1. Create a dedicated Google Cloud project/service account.
2. Enable Search Console API; do not enable or use Indexing API for ordinary content.
3. Add the service-account email to `sc-domain:mushroomie.io.vn`.
4. Store credential JSON at the protected server path.
5. Set `GSC_PROPERTY` and enable the integration.
6. Verify site access, sitemap listing/submission, and one URL Inspection request.
7. Monitor quota, permission, and retry metrics.

### Rollback

- Set `GSC_INTEGRATION_ENABLED=false` to stop Google calls immediately.
- Set `SEO_DISCOVERY_ENABLED=false` to stop enqueue/worker behavior while preserving published content.
- Roll back the application release using the existing standalone/PM2 rollback procedure.
- Retain the additive queue table during rollback; it contains no secrets and avoids destructive migration rollback.
- Never roll back by deleting posts, products, uploads, orders, users, or payment data.

## 11. Observability and success criteria

Structured events:

- `seo_discovery_enqueued`
- `seo_discovery_eligible`
- `seo_discovery_skipped`
- `seo_discovery_retry_scheduled`
- `gsc_connection_failed`
- `gsc_sitemap_registered`
- `gsc_url_inspected`
- `gsc_url_indexed`

Acceptance criteria:

1. Every supported publication path creates at most one current job per canonical URL.
2. A newly published article appears in production sitemap and RSS feed within two minutes under healthy runtime conditions.
3. Publishing still succeeds when Google is unavailable or credentials are missing.
4. No ordinary Mushroomie URL is sent to the Google Indexing API.
5. Only eligible same-origin canonical URLs reach URL Inspection.
6. Retry survives PM2 restart and does not exceed configured quotas.
7. Admin can distinguish discovery state, eligibility, Google inspection state, and configuration errors.
8. No secret appears in Git, logs, database, browser responses, or build artifacts.
9. Typecheck, tests, build, production route checks, PM2 checks, and MIME checks pass before completion is reported.

## 12. Implementation sequence

The implementation plan should break work into these independently verifiable slices:

1. Prisma queue model and migration.
2. URL builder, eligibility rules, and queue repository.
3. Central publication events across all post paths.
4. Product activation and static sitemap synchronization.
5. Cache revalidation behavior.
6. Background claim/retry worker.
7. Disabled and production Search Console adapters.
8. Admin APIs and indexing-status page.
9. Tests, documentation, production configuration, staged rollout, and verification.

Implementation must occur on a clean branch based on current `origin/main`. Unrelated dirty worktree changes must not be staged, modified, deleted, or included in commits.
