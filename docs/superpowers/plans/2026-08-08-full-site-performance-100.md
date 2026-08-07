# Mushroomie Full-Site Performance 100 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the nine-route Mushroomie production matrix to a three-run median Lighthouse Performance score of 100 on mobile and desktop while preserving all commerce, authentication, admin, analytics, image, SEO, and accessibility behavior.

**Architecture:** Keep pages and static presentation as React Server Components, and narrow hydration to small action, account, cart, and live-data islands. Fix route-specific LCP discovery first, then code-split interaction that is not needed for first paint, remove legacy per-section client wrappers, and isolate the mini-game text LCP from the live client hub. Retain only changes that improve measured build or Lighthouse output and pass the complete regression gates.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.4, TypeScript 5, Vitest 4, Node test through `tsx --test`, Tailwind CSS 4, `next/image`, NextAuth 5 beta, Zustand 5, Lighthouse 13.4.1, PM2 standalone, Nginx.

## Global Constraints

- Work only in the clean branch `codex/performance-100-all-routes`, based on production commit `987b28f9610622a1e8d4ace6f671afb66f00feea` plus the approved design commit.
- Do not modify Prisma schema, run migrations, or mutate production data.
- Do not change prices, discounts, vouchers, cart totals, shipping, orders, QR generation, payment polling, providers, webhooks, or paid-only analytics semantics.
- Do not delete or rewrite `public/uploads`, backups, `.env`, migrations, ecosystem configuration, database data, or `package-lock.json`.
- Preserve product image ratio `3:4`, normalized `/uploads/<file>` paths, fallback images, brand fonts, SEO-visible content, reduced motion, and WCAG interactions.
- Do not disable Cloudflare security, Google analytics/conversion scripts, CSP, authorization, or errors to inflate Lighthouse.
- Do not add a heavy runtime dependency; use Next.js 16.2.11 and existing packages.
- Never connect to retired VPS `103.173.226.86`; production deployment may target only `103.77.242.153`.
- Do not use `deploy.sh`; preserve the approved standalone, static, public/uploads symlink, `.env`, and rollback layout.
- Run production Lighthouse sequentially with a fixed Lighthouse 13.4.1 and Chrome binary.

---

## File Structure

### New files

- `scripts/performance/lighthouse-report.mjs`: validate and summarize Lighthouse JSON artifacts without changing audit behavior.
- `scripts/performance/routes.mjs`: canonical route/redirect matrix shared by audit commands.
- `tests/lighthouse-report.test.ts`: pure parser and route-matrix tests.
- `src/components/blog/__tests__/PostCard.test.tsx`: behavioral LCP-priority contract for blog cards.
- `src/components/product/ProductCardActions.tsx`: cart, voucher, and add-to-cart analytics client island.
- `src/components/product/ProductCardLink.tsx`: select-item analytics client link island.
- `src/components/minigame/MiniGameHero.tsx`: server-rendered, layout-stable mini-game hero containing the text LCP.
- `src/components/minigame/MiniGameLoginNotice.tsx`: small session-aware notice island inside reserved space.
- `src/components/minigame/__tests__/MiniGameHero.test.tsx`: hero stability and server-visible content test.

### Modified files

- `package.json`: add non-mutating performance report scripts only; lockfile remains unchanged.
- `src/components/blog/PostCard.tsx`: accept explicit LCP priority and accurate responsive sizes.
- `src/app/(user)/tin-tuc/page.tsx`: mark only the first visible post on page one as priority and replace a legacy motion wrapper.
- `src/components/layout/Header.tsx`: dynamically load `CompactHeader` only after its sentinel leaves the viewport.
- `tests/header-layout.test.ts`: assert the dynamic boundary instead of a static compact-header import.
- `tests/performance-regressions.test.ts`: enforce server presentation boundaries and prevent legacy route wrappers from returning.
- `src/components/product/ProductCard.tsx`: keep immutable product presentation on the server and delegate only interactions.
- `src/app/(user)/gioi-thieu/page.tsx`: replace repeated `AnimateOnScroll` client wrappers with the single existing layout reveal runtime.
- `src/components/minigame/MiniGameHub.tsx`: retain only live summary/leaderboard UI; remove the LCP hero from its client graph.
- `src/app/(user)/mini-game/page.tsx`: compose the server hero and live client hub.

## Task 1: Deterministic Lighthouse Evidence Parser

**Files:**

- Create: `scripts/performance/routes.mjs`
- Create: `scripts/performance/lighthouse-report.mjs`
- Create: `tests/lighthouse-report.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `PERFORMANCE_ROUTES`, an immutable array of `{ key, path, expectedStatus, expectedDestination? }`.
- Produces: `summarizeLighthouse(report)`, returning `{ score, finalUrl, fcpMs, lcpMs, tbtMs, cls, totalKiB, mainThreadMs, lcpNode }`.
- Produces: `readLighthouseReport(path)`, which throws when JSON or required performance fields are invalid.

- [ ] **Step 1: Write the failing parser and route-matrix tests**

Create `tests/lighthouse-report.test.ts` with a minimal valid report fixture. Assert that the parser rounds the score and byte metrics, preserves CLS precision, reads the LCP node from `lcp-breakdown-insight`, rejects a missing performance score, and that `/cau-chuyen` and `/admin` retain their approved redirect contracts.

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { PERFORMANCE_ROUTES } from '../scripts/performance/routes.mjs'
import { summarizeLighthouse } from '../scripts/performance/lighthouse-report.mjs'

const report = {
  finalDisplayedUrl: 'https://mushroomie.io.vn/tin-tuc',
  categories: { performance: { score: 0.996 } },
  audits: {
    'first-contentful-paint': { numericValue: 1010 },
    'largest-contentful-paint': { numericValue: 1420 },
    'total-blocking-time': { numericValue: 7.6 },
    'cumulative-layout-shift': { numericValue: 0.0021 },
    'total-byte-weight': { numericValue: 450_560 },
    'mainthread-work-breakdown': { numericValue: 880 },
    'lcp-breakdown-insight': {
      details: { items: [{ type: 'node', nodeLabel: 'First article' }] },
    },
  },
}

test('summarizes required Lighthouse evidence', () => {
  assert.deepEqual(summarizeLighthouse(report), {
    score: 100,
    finalUrl: 'https://mushroomie.io.vn/tin-tuc',
    fcpMs: 1010,
    lcpMs: 1420,
    tbtMs: 8,
    cls: 0.0021,
    totalKiB: 440,
    mainThreadMs: 880,
    lcpNode: 'First article',
  })
})

test('rejects an invalid Lighthouse performance report', () => {
  assert.throws(() => summarizeLighthouse({ categories: {}, audits: {} }), /performance score/)
})

test('keeps redirect contracts separate from rendered destinations', () => {
  assert.deepEqual(
    PERFORMANCE_ROUTES.filter((route) => route.expectedDestination),
    [
      { key: 'cau-chuyen', path: '/cau-chuyen', expectedStatus: 308, expectedDestination: '/gioi-thieu' },
      { key: 'admin-anonymous', path: '/admin', expectedStatus: 307, expectedDestination: '/tai-khoan/dang-nhap' },
    ],
  )
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/lighthouse-report.test.ts`

Expected: FAIL because `scripts/performance/routes.mjs` and `lighthouse-report.mjs` do not exist.

- [ ] **Step 3: Implement the route matrix and strict report parser**

Create the two `.mjs` modules. The parser must validate every required numeric value with `Number.isFinite`, round millisecond/KiB fields, and use an empty string when Lighthouse has no node label. Add `perf:report` to `package.json` as `node scripts/performance/lighthouse-report.mjs`; do not install a package or touch the lockfile.

- [ ] **Step 4: Run the focused test and complete legacy tests**

Run: `npx tsx --test tests/lighthouse-report.test.ts`

Expected: 3 tests pass.

Run: `npm run test:legacy`

Expected: all legacy tests pass.

- [ ] **Step 5: Commit the evidence tooling**

```powershell
git add -- package.json scripts/performance/routes.mjs scripts/performance/lighthouse-report.mjs tests/lighthouse-report.test.ts
git commit -m "test: add deterministic performance evidence parser"
```

## Task 2: Fix News Listing LCP Discovery and Responsive Delivery

**Files:**

- Create: `src/components/blog/__tests__/PostCard.test.tsx`
- Modify: `src/components/blog/PostCard.tsx`
- Modify: `src/app/(user)/tin-tuc/page.tsx`

**Interfaces:**

- `PostCardProps` gains `priority?: boolean`, defaulting to `false`.
- A priority card emits `loading="eager"` and `fetchPriority="high"` without the deprecated Next 16 `priority` prop or a competing preload.
- A normal card emits `loading="lazy"` and `fetchPriority="auto"`.
- The listing gives priority only to index zero on page one.

- [ ] **Step 1: Write failing behavioral image tests**

Mock `resolveImageUrlForRender` and `next/image`, invoke the async server component, render its result, and assert exact priority/loading/fetch-priority/sizes behavior for priority and normal cards. The required sizes value is:

```tsx
(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 36px), 33vw
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:vitest -- src/components/blog/__tests__/PostCard.test.tsx`

Expected: FAIL because `PostCard` does not accept or emit the priority contract.

- [ ] **Step 3: Implement the minimal PostCard priority contract**

Add `priority?: boolean` to the props, default it to false, and pass these props to `SafeImage`:

```tsx
loading={priority ? 'eager' : 'lazy'}
fetchPriority={priority ? 'high' : 'auto'}
quality={70}
sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 36px), 33vw"
```

Update the listing map:

```tsx
{posts.map((post, index) => (
  <PostCard key={post.id} post={post} priority={page === 1 && index === 0} />
))}
```

Do not mark homepage or related-post cards as priority.

- [ ] **Step 4: Verify GREEN and related page tests**

Run: `npm run test:vitest -- src/components/blog/__tests__/PostCard.test.tsx`

Expected: both priority tests pass.

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 5: Commit the LCP fix**

```powershell
git add -- 'src/components/blog/PostCard.tsx' 'src/components/blog/__tests__/PostCard.test.tsx' 'src/app/(user)/tin-tuc/page.tsx'
git commit -m "perf: prioritize the news listing LCP image"
```

## Task 3: Load the Compact Header Only After Scroll Intent

**Files:**

- Modify: `tests/header-layout.test.ts`
- Modify: `src/components/layout/Header.tsx`

**Interfaces:**

- The `CompactHeader` public prop interface remains unchanged.
- `Header` uses `next/dynamic` at module scope and still renders the compact header only when `compactMounted` is true.

- [ ] **Step 1: Change the regression test to require a dynamic boundary**

Replace the static-import assertion with:

```ts
assert.match(HEADER, /import dynamic from 'next\/dynamic'/)
assert.match(
  HEADER,
  /const CompactHeader = dynamic\(\(\) => import\('@\/components\/layout\/CompactHeader'\)/,
)
assert.doesNotMatch(HEADER, /import CompactHeader from '@\/components\/layout\/CompactHeader'/)
```

Keep every existing sentinel, mount, primary-action, and reduced-motion assertion.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/header-layout.test.ts`

Expected: FAIL because `Header` still statically imports `CompactHeader`.

- [ ] **Step 3: Implement the dynamic import in the client component**

Replace the static import with:

```tsx
import dynamic from 'next/dynamic'

const CompactHeader = dynamic(() => import('@/components/layout/CompactHeader'), {
  loading: () => null,
})
```

Do not change the sentinel observer, `compactMounted`, drawer state, session state, cart state, search handlers, or compact-header props.

- [ ] **Step 4: Verify GREEN and navigation behavior**

Run: `npx tsx --test tests/header-layout.test.ts`

Expected: all header-layout tests pass.

Run: `npm run test:vitest -- src/components/layout/__tests__/navigation.test.tsx`

Expected: all navigation tests pass.

- [ ] **Step 5: Commit the header split**

```powershell
git add -- src/components/layout/Header.tsx tests/header-layout.test.ts
git commit -m "perf: defer compact header code until scroll"
```

## Task 4: Keep Product Presentation on the Server

**Files:**

- Create: `src/components/product/ProductCardActions.tsx`
- Create: `src/components/product/ProductCardLink.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/product/__tests__/ProductCard.test.tsx`
- Modify: `tests/performance-regressions.test.ts`

**Interfaces:**

- `ProductCardActions` consumes `{ productId, productName, categoryName, displayPrice, imageUrl, isOutOfStock }` and owns voucher/session/cart/add analytics state.
- `ProductCardLink` consumes `{ href, itemId, itemName, categoryName, price, className, children }` and emits `select_item` before navigation.
- `ProductCard` remains the public API accepting the existing `product` object.

- [ ] **Step 1: Add failing server-boundary regression assertions**

Read `ProductCard.tsx`, `ProductCardActions.tsx`, and `ProductCardLink.tsx` in `tests/performance-regressions.test.ts`. Assert:

```ts
assert.doesNotMatch(productCardSource, /^['"]use client['"]/)
assert.doesNotMatch(productCardSource, /next-auth\/react|@\/store\/cart|@\/store\/voucher/)
assert.match(productCardActionsSource, /^['"]use client['"]/)
assert.match(productCardLinkSource, /^['"]use client['"]/)
```

Extend the Vitest card test to confirm both links still emit `select_item` and the add button still emits `add_to_cart`, while retaining the 3:4, price, stock, voucher, delayed cart, and prefetch assertions.

- [ ] **Step 2: Run both suites and verify RED**

Run: `npx tsx --test tests/performance-regressions.test.ts`

Expected: FAIL because ProductCard is still a Client Component and the action/link files do not exist.

Run: `npm run test:vitest -- src/components/product/__tests__/ProductCard.test.tsx`

Expected: the new analytics assertions fail before the island implementation.

- [ ] **Step 3: Extract the analytics link island**

Create `ProductCardLink.tsx` as a Client Component wrapping `next/link`. Its click handler must call the existing `trackAnalyticsEvent('select_item', ...)`, use `prefetch={false}`, and preserve passed children/className without introducing state or effects.

- [ ] **Step 4: Extract the cart/voucher action island**

Move the existing `useSession`, voucher-store subscription, best eligible voucher calculation, cart-store calls, feedback timeout, and `add_to_cart` event into `ProductCardActions.tsx`. Preserve the exact 600 ms cart-open delay, out-of-stock behavior, authoritative displayed price, analytics item parameters, and button copy/classes.

- [ ] **Step 5: Convert ProductCard to a server presentation component**

Remove `'use client'`, React hooks, session/store imports, and analytics imports from `ProductCard.tsx`. Keep `getPublicImageUrl`, `resolveDisplayPrice`, product badges, `SafeImage`, image ratio, category, title, and price markup in the server component. Replace the two links with `ProductCardLink` and the voucher/button block with `ProductCardActions`.

- [ ] **Step 6: Verify GREEN and type safety**

Run: `npm run test:vitest -- src/components/product/__tests__/ProductCard.test.tsx`

Expected: all ProductCard behavior tests pass.

Run: `npx tsx --test tests/performance-regressions.test.ts`

Expected: all performance regression tests pass.

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 7: Commit the product-card boundary**

```powershell
git add -- src/components/product/ProductCard.tsx src/components/product/ProductCardActions.tsx src/components/product/ProductCardLink.tsx src/components/product/__tests__/ProductCard.test.tsx tests/performance-regressions.test.ts
git commit -m "perf: server render product card presentation"
```

## Task 5: Remove Legacy Per-Section Client Motion from Story and News

**Files:**

- Modify: `tests/performance-regressions.test.ts`
- Modify: `src/app/(user)/gioi-thieu/page.tsx`
- Modify: `src/app/(user)/tin-tuc/page.tsx`

**Interfaces:**

- The existing public layout remains the single owner of `ScrollReveal` and `ScrollMotion`.
- Route pages use `data-reveal` on server-rendered elements; no route-specific observer is added.

- [ ] **Step 1: Add failing legacy-wrapper regression assertions**

Read both page sources and assert neither imports or renders `AnimateOnScroll` or `StaggerChildren`. Assert each still contains `data-reveal`, proving motion has not silently disappeared.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test tests/performance-regressions.test.ts`

Expected: FAIL because both pages still import `AnimateOnScroll`, and the story page uses `StaggerChildren`.

- [ ] **Step 3: Replace news category motion with server markup**

Remove the import and wrapper, leaving the category chip `<div>` with `data-reveal` and its existing classes/links.

- [ ] **Step 4: Replace story wrappers without changing content**

Remove the `AnimateOnScroll` and `StaggerChildren` imports. Put `data-reveal` directly on timeline entries, vision/mission cards, the core-value heading, each value card, the category heading, each category link, and the final CTA card. Preserve every heading level, link, class, inline theme color, database query, JSON-LD block, text, and order.

- [ ] **Step 5: Verify GREEN, motion safety, and SEO**

Run: `npx tsx --test tests/performance-regressions.test.ts tests/motion-system.test.ts tests/seo-indexability.test.ts`

Expected: all selected legacy tests pass.

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 6: Commit the route hydration reduction**

```powershell
git add -- 'src/app/(user)/gioi-thieu/page.tsx' 'src/app/(user)/tin-tuc/page.tsx' tests/performance-regressions.test.ts
git commit -m "perf: remove legacy route motion hydration"
```

## Task 6: Move the Mini-Game Text LCP Outside the Live Client Hub

**Files:**

- Create: `src/components/minigame/MiniGameHero.tsx`
- Create: `src/components/minigame/MiniGameLoginNotice.tsx`
- Create: `src/components/minigame/__tests__/MiniGameHero.test.tsx`
- Modify: `src/components/minigame/MiniGameHub.tsx`
- Modify: `src/app/(user)/mini-game/page.tsx`
- Modify: `tests/performance-regressions.test.ts`

**Interfaces:**

- `MiniGameHero` is a Server Component containing the current badge, H1, description, and reserved login-notice slot.
- `MiniGameLoginNotice` is a Client Component using the existing session provider and rendering the anonymous message only for unauthenticated users.
- The hero inner container has `min-h-[480px] md:min-h-[360px]` and centers its content to keep the following game grid stable during font/session hydration.
- `MiniGameHub` retains summary and leaderboard fetches, cards, vouchers, abort handling, and game links.

- [ ] **Step 1: Write the failing hero behavior and boundary tests**

Render `MiniGameHero` with `MiniGameLoginNotice` mocked. Assert one H1 with the current copy, the badge, description, reserved-slot test id, and the exact mobile/desktop minimum-height classes. Add source assertions that `MiniGameHero.tsx` has no `'use client'`, that `MiniGameHub.tsx` no longer contains the H1, and that the route page renders hero before hub.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm run test:vitest -- src/components/minigame/__tests__/MiniGameHero.test.tsx`

Expected: FAIL because `MiniGameHero` does not exist.

Run: `npx tsx --test tests/performance-regressions.test.ts`

Expected: FAIL on the new mini-game boundary assertions.

- [ ] **Step 3: Implement the server hero and small login island**

Move the current hero markup verbatim into `MiniGameHero`. Use a reserved wrapper:

```tsx
<div data-testid="mini-game-login-slot" className="min-h-[66px]">
  <MiniGameLoginNotice />
</div>
```

`MiniGameLoginNotice` calls `useSession` and returns the existing notice only when `status === 'unauthenticated'`; it returns `null` while loading or authenticated.

- [ ] **Step 4: Keep only live data in MiniGameHub and compose the page**

Remove hero/session usage from `MiniGameHub` but preserve its abortable parallel fetches and all game/voucher UI. Render:

```tsx
<div className="min-h-[100dvh] bg-theme-page text-theme-primary">
  <MiniGameHero />
  <MiniGameHub />
</div>
```

Do not import Tetris or Block Blast engines into either component.

- [ ] **Step 5: Verify GREEN and mini-game security regressions**

Run: `npm run test:vitest -- src/components/minigame/__tests__/MiniGameHero.test.tsx`

Expected: all hero tests pass.

Run: `npx tsx --test tests/performance-regressions.test.ts tests/game-voucher.test.ts tests/minigame-start-flow.test.ts`

Expected: all selected tests pass.

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 6: Commit the mini-game LCP boundary**

```powershell
git add -- 'src/app/(user)/mini-game/page.tsx' src/components/minigame/MiniGameHub.tsx src/components/minigame/MiniGameHero.tsx src/components/minigame/MiniGameLoginNotice.tsx src/components/minigame/__tests__/MiniGameHero.test.tsx tests/performance-regressions.test.ts
git commit -m "perf: server render the mini-game LCP hero"
```

## Task 7: Build, Bundle, and Local Performance Gate

**Files:**

- Modify only if verification exposes a demonstrated defect in Tasks 1-6; any defect gets a new failing regression test before its fix.

**Interfaces:**

- Production build output uses `NEXT_DIST_DIR=.next-deploy`.
- No bundle/CSS experiment is retained unless it beats the baseline without functional regression.

- [ ] **Step 1: Install exact dependencies and generate Prisma client**

Run: `npm ci`

Expected: exit 0 with `package-lock.json` unchanged.

Run: `npx prisma generate`

Expected: Prisma Client generation succeeds without schema mutation.

- [ ] **Step 2: Run all automated gates**

Run: `npm test`

Expected: Vitest and legacy suites pass with zero failures.

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm run lint`

Expected: exit 0; if an unrelated baseline lint defect exists, record its exact file and do not suppress it.

- [ ] **Step 3: Run the production build**

```powershell
$env:NEXT_DIST_DIR='.next-deploy'
npm run build
```

Expected: exit 0, all scoped routes appear in the build summary, and the standalone server is produced.

- [ ] **Step 4: Compare build artifacts**

Record generated CSS transfer sizes, route client-reference manifests, and chunks containing `CompactHeader`, `ProductCardActions`, `ProductCardLink`, `MiniGameHub`, NextAuth, and GSAP. Confirm the compact header has its own on-demand chunk, game engines are not in `/mini-game`, and presentation-only ProductCard code is absent from the client module graph.

- [ ] **Step 5: Run the built app and browser checks**

Start the standalone build locally on a non-production port with a copied non-secret local environment. Verify 1440, 1366, 390, and 360 px for every scoped route, console/network health, no horizontal scroll, all images, header/menu/search/theme/cart, login, empty and populated cart, checkout shell, mini-game navigation, redirects, and reduced motion.

- [ ] **Step 6: Run sequential local Lighthouse comparison**

Run one mobile and desktop audit per rendered destination against the local production build. Reject or fix any route whose score, FCP, LCP, TBT, CLS, or bytes materially regress against the production baseline. Specifically require the `/tin-tuc` LCP element to be the eager first card image, `/mini-game` CLS to be below the baseline `0.0615`, and `/thanh-toan` to remain 100/100.

- [ ] **Step 7: Commit any test-first verification fixes, then record clean status**

Run: `git status --short`

Expected: empty output after the final verified commit.

## Task 8: Safe Production Release and Three-Run Acceptance

**Files:**

- No database, schema, migration, upload, Nginx configuration, or secret files are modified.

**Interfaces:**

- Target: `codex@103.77.242.153:22` with the approved deployment key.
- Active: `/var/www/mushroomie/.next/standalone`.
- Node static: `<release>/.next-deploy/static`.
- Nginx static: `/var/www/mushroomie/.next/static`.
- Upload link: `<release>/public/uploads -> /var/www/mushroomie/public/uploads`.

- [ ] **Step 1: Run the pre-deploy read-only audit**

Verify git commit, free disk/memory, PM2 status, current release/rollback paths, Nginx/MySQL health, `.env` presence, uploads directory/link type, and the exact same-filesystem rename boundary. Stop before mutation if any invariant is false.

- [ ] **Step 2: Stage a reversible release**

Copy standalone output to a timestamped stage, copy all public files except uploads, create the absolute uploads symlink, place `.next-deploy/static` inside the release, copy the production `.env`, and verify file types/counts. Copy static assets to Nginx's `.next/static` without deleting old hashed assets.

- [ ] **Step 3: Activate while retaining rollback**

Rename current standalone to `standalone.previous.<timestamp>`, rename the verified stage to active, restart root-owned `mushroomie_pm2`, save PM2 state, and retain the previous directory through every gate.

- [ ] **Step 4: Run health, route, redirect, MIME, media, QR, and log checks**

Require healthy PM2, no new runtime errors, correct 200/307/308 status contracts, CSS `text/css`, JavaScript `application/javascript` or `text/javascript`, working upload WebP, no broken page images, and intact checkout/QR rendering. Roll back immediately if a required gate fails.

- [ ] **Step 5: Run the production browser matrix**

Check desktop 1440/1366 and mobile 390/360 with console and failed-network inspection. Test public shell, header/search/theme/cart, login, story, news, mini-game, checkout, anonymous admin redirect, and an authenticated admin smoke test only in an explicitly authorized test session.

- [ ] **Step 6: Run three cold Lighthouse audits per destination and form factor**

Run sequentially, save JSON, summarize with `lighthouse-report.mjs`, and require median 100 with no unexplained run below 98. Test `/gioi-thieu` and `/tai-khoan/dang-nhap` as rendered destinations while checking `/cau-chuyen` and `/admin` redirect contracts separately.

- [ ] **Step 7: Finalize or roll back**

If every gate passes, retain one documented rollback release and report exact scores/metrics. If any business, runtime, MIME, media, redirect, or performance gate fails, restore `standalone.previous.<timestamp>`, restart PM2, and verify the restored site before reporting the actual failure.
