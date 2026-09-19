# Gift Finder Implementation Plan

> Execute inline using executing-plans; check each deliverable against the approved gift-finder design.

**Goal:** Ship `/chon-qua` so customers can find available handmade gifts within a chosen budget.

**Architecture:** Normalize URL filters in a pure module; query a bounded public product projection through Prisma; render a Server Component form and results with the existing product cards. Query parameters are the source of truth.

**Tech Stack:** Next.js 16.2.11, React 19, Prisma 5, existing Tailwind theme, Vitest/Testing Library.

## Global constraints

No new dependencies, schema changes, application/production database writes, production deploy, or edits to pre-existing dirty files. Keep product images 3:4. Maximum 12 results per page. Never silently relax budget/category/customization filters. Budget excludes shipping, gift wrap and vouchers.

## Task 1: Filter and data contracts

- [x] Add `src/lib/__tests__/gift-finder.test.ts`: normalization, allowlisted budgets, duplicated query values, bounded page, URL retention, and displayed-price budget boundaries. Observe failure before implementation.
- [x] Add `src/lib/gift-finder.ts`: export `parseGiftFilters`, `buildGiftFinderUrl`, budget options, `GIFT_PAGE_SIZE`, `buildGiftProductWhere` (typed Prisma query).
- [x] Add `src/lib/gift-finder-server.ts`: `getGiftFinderData(filters)` uses count/categories then a bounded product query; returns ready/unavailable states, clamps page, converts Decimal values, logs error type only.
- [x] Add server tests for bounded query, projection, pagination and unavailable state. Run `npx vitest run src/lib/__tests__/gift-finder.test.ts src/lib/__tests__/gift-finder-server.test.ts`.

## Task 2: Usable public route

- [x] Add `src/components/product/GiftFinder.tsx` with accessible GET form, result summary, ProductCard grid, previous/next navigation, empty and unavailable states. Add DOM tests in `src/components/product/__tests__/GiftFinder.test.tsx`.
- [x] Add `src/app/(user)/chon-qua/page.tsx`: async searchParams, canonical metadata, noindex for queries, fresh server data. Add loading state.
- [x] Add small links in `src/app/(user)/san-pham/page.tsx` and `src/components/home/landing/HomeFeaturedProducts.tsx`; add base route to `src/app/sitemap.ts`.
- [x] Run focused tests plus existing ProductCard tests and targeted ESLint.

## Task 3: Verify and deliver

- [x] Run `npm ci`, `npx prisma generate`, `npm run typecheck --if-present`, `npm run build` and relevant tests. Supply only an isolated local DB for fixture checks; never seed production.
- [x] Check page and form submission in Chrome for Testing at 1440, 1366, 390 and 360px; inspect horizontal overflow, images, console, failed network and CSS/JS MIME.
- [x] Review diff against pre-existing workspace edits, record exact evidence/limitations, then commit only this feature's paths. Do not push/deploy unless requested.
