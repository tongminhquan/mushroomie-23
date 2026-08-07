# Mushroomie Full-Site Performance 100 Design

## Objective

Implement option C: optimize the complete set of business-critical Mushroomie
routes and target a Lighthouse Performance score of 100 on both mobile and
desktop without weakening commerce correctness, authentication, analytics,
security controls, SEO, accessibility, or the handmade brand experience.

The work is an evidence-led performance program rather than a visual redesign.
Every change must address a measured bottleneck, preserve server-authoritative
commerce behavior, and remain independently reversible.

## Scope

The release covers these public entry points:

| Requested route | Cold anonymous behavior | Performance surface |
| --- | --- | --- |
| `/` | `200` | Homepage and public shell |
| `/san-pham` | `200` | Product catalogue and cards |
| `/cau-chuyen` | `308` to `/gioi-thieu` | Redirect contract and story page |
| `/tin-tuc` | `200` | News listing and article images |
| `/mini-game` | `200` | Game landing page, not game engines until selected |
| `/tai-khoan/dang-nhap` | `200` | Authentication form |
| `/gio-hang` | `200` | Cart state and empty/populated views |
| `/thanh-toan` | `200` | Checkout shell and all existing commerce safeguards |
| `/admin` | `307` to login when anonymous | Redirect contract plus authenticated admin checks |

Product detail, news detail, game engines, checkout confirmation, and
authenticated admin pages are regression surfaces when a shared component is
changed. They are not separate score rows unless profiling shows that a shared
optimization creates a regression there.

## Measurement Contract

### Lab tooling

Use Lighthouse 13.4.1 with a fixed Chrome binary and its standard mobile and
desktop profiles. Run audits sequentially so concurrent Chrome profiles do not
compete for CPU, disk, or Windows temporary directories. Preserve the JSON
artifacts for before/after comparison.

The installed Google performance skill is currently Tier 0: no PageSpeed/CrUX
API key or service account is configured, and the installed package does not
contain the documented `scripts/google_auth.py` helper. Therefore, CrUX field
data is supplementary only when credentials become available; it is not a
release blocker. Lighthouse lab data, browser traces, route/MIME checks, and
production health checks remain the reproducible acceptance evidence.

### Score acceptance

For every non-redirect destination and both form factors:

1. Run three cold production Lighthouse audits after deployment.
2. The median rounded Performance score must be `100`.
3. No individual run may be below `98`; investigate and repeat only when the
   run has a documented environmental anomaly.
4. LCP, FCP, TBT, CLS, transferred bytes, main-thread time, and the LCP element
   must be recorded alongside the score so a rounded score cannot hide a
   regression.
5. A score improvement is invalid if route behavior, console health, network
   success, SEO content, analytics, accessibility, or business behavior
   regresses.

Lighthouse follows redirects. `/cau-chuyen` and anonymous `/admin` therefore
have two independent gates: the expected 308/307 redirect must remain correct,
and the final rendered destination must satisfy the score contract.

Authenticated admin performance cannot be represented by the anonymous
`/admin` Lighthouse score. It must be checked in a dedicated test browser
session using navigation traces, console/network inspection, and functional
smoke tests. Personal browser cookies must not be silently reused to fabricate
an authenticated Lighthouse result.

### Browser acceptance

Use browser-controlled checks at 1440 px, 1366 px, 390 px, and 360 px. Confirm:

- no horizontal overflow or severe layout shift;
- no broken product, banner, news, QR, or upload images;
- no serious console errors or failed first-party network requests;
- all interactive controls remain keyboard and touch usable;
- reduced-motion behavior remains available;
- cart, authentication, voucher, checkout, payment polling, game selection,
  and admin authorization still behave as designed.

## Production Baseline

The following is a single cold-run diagnostic baseline collected on 2026-08-08
from production commit `987b28f9610622a1e8d4ace6f671afb66f00feea`.
Milliseconds are rounded and transferred bytes are rounded to KiB. Final
acceptance uses three runs, not this single-run snapshot.

| Route / destination | Mobile score | Mobile FCP | Mobile LCP | Mobile TBT | Desktop score | Desktop LCP | Approx. mobile KiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 97 | 1,286 | 2,336 | 107 | 99 | 765 | 508 |
| `/san-pham` | 97 | 1,371 | 2,421 | 8 | 98 | 930 | 632 |
| `/cau-chuyen` -> `/gioi-thieu` | 90 | 2,067 | 3,273 | 8 | 99 | 785 | 365 |
| `/tin-tuc` | 91 | 1,306 | 3,438 | 12 | 98 | 992 | 570 |
| `/mini-game` | 91 | 1,729 | 3,139 | 8 | 100 | 670 | 331 |
| `/tai-khoan/dang-nhap` | 94 | 1,118 | 3,105 | 23 | 100 | 697 | 451 |
| `/gio-hang` | 96 | 1,709 | 2,616 | 8 | 100 | 700 | 431 |
| `/thanh-toan` | 100 | 1,121 | 1,421 | 8 | 100 | 664 | 435 |
| `/admin` anonymous -> login | 96 | 1,109 | 2,759 | 14 | 100 | 711 | 455 |

The production server is not the primary homepage bottleneck: observed root
TTFB was about 58 ms, the Next.js response was a cache hit, Nginx served CSS
with `text/css`, JavaScript with the expected JavaScript MIME type, and hashed
static assets had a one-year immutable cache policy. Nginx, MySQL, and the PM2
process were healthy during the baseline.

## Diagnosed Bottlenecks

### Shared public shell

All public pages currently enter a client `PublicProviders` boundary containing
`SessionProvider` and `ProfileCompletionGuard`. Header, mobile navigation,
deferred cart widgets, profile completion, global reveal behavior, scroll
motion, and analytics bootstrapping also participate in the shared route
experience. Even a mostly static page therefore pays for authentication and
interaction code before the visitor needs all of it.

The public shell is not to be deleted or made unauthenticated. Its server/client
boundaries need to be narrowed so static content can paint independently while
account, cart, and profile behavior remains in small tested client islands.

### Global CSS and fonts

The main generated stylesheet is about 35 KiB and appears as a render-blocking
request. Depending on the route, Lighthouse estimates 150-300 ms of FCP or LCP
savings. The small generated font stylesheet is in the same critical chain.

The project previously rejected a blind `experimental.inlineCss` switch because
it duplicated CSS in HTML/RSC payloads and increased parsing/hydration cost.
This release must first reduce the shared CSS surface and compare build output.
Inlining is acceptable only if a controlled A/B build proves a net improvement
without payload duplication.

### Shared JavaScript and hydration

Anonymous mobile routes report roughly 49-60 KiB of unused JavaScript, while
the homepage reports about 56 KiB and 107 ms TBT. The homepage also renders
about 1,041 DOM nodes and many repeated inline SVGs. Eight hydrated
`ProductCard` instances each connect to session, cart, voucher, analytics, and
component state even though the visible catalogue content is initially static.

The goal is not to remove product actions. Static product/card markup should be
server-rendered, while only the interactive actions hydrate. Session/voucher
work must be shared or deferred instead of repeated independently per card.

### Route-specific LCP

- `/tin-tuc`: the first visible article image is the LCP element but is emitted
  with `loading="lazy"`. Its baseline included about 141 ms discovery delay and
  1,800 ms resource-load duration. Lighthouse also estimates about 97 KiB image
  savings. The first above-fold article image needs explicit LCP treatment and
  accurate responsive sizing; later article images remain lazy.
- `/san-pham`: the text heading is LCP, shared CSS can cost about 300 ms, and
  image delivery reports about 31 KiB potential savings. Product/card
  hydration and responsive variants are the likely improvement surfaces.
- `/gioi-thieu`: the text LCP has about 1,151 ms element-render delay. This
  points to critical CSS/font/client rendering rather than an oversized LCP
  image.
- `/mini-game`: the text LCP has about 1,146 ms element-render delay and mobile
  CLS was 0.0615. The landing shell must reserve stable space and must not load
  Tetris or Block Blast engines before a game is selected.
- Login and anonymous admin: the text LCP is delayed by shared CSS and auth
  hydration. The auth form must remain fully functional while nonessential
  public widgets stay outside its critical path.
- `/gio-hang`: its empty view is primarily text, with moderate server/render
  delay. A populated cart must be profiled separately before changing cart
  state hydration.
- `/thanh-toan`: both form factors already score 100. It is a protected
  regression route, not a target for speculative commerce refactoring.

### Third parties and caching

Google Tag Manager is already deferred and Cloudflare adds its own challenge
and RUM resources. The release must not remove conversion measurement, disable
Cloudflare protection, or spoof Lighthouse by blocking production scripts.
First-party analytics scheduling may be tightened only when event delivery and
paid-only purchase semantics continue to pass their existing tests.

Static caching is already strong. Cache changes are limited to measured gaps;
they must not cache personalized/authenticated responses or mutate checkout and
payment semantics.

## Chosen Architecture

### 1. Reproducible audit harness

Create a deterministic route matrix for Lighthouse and a compact report that
captures score, FCP, LCP, TBT, CLS, bytes, main-thread time, final URL, and LCP
element. The harness must run sequentially, use a fixed Lighthouse version,
fail when an output artifact is missing or invalid, and distinguish a Chrome
temporary-directory cleanup warning from an invalid report.

The harness is for measurement and release verification. It must not inject CSS,
block requests, reuse warm browser storage, or alter production behavior to
raise scores.

### 2. Narrow public-shell client boundaries

Preserve the server-rendered public layout and split account/cart/profile
features into explicit client islands. Avoid wrapping static route content in a
client provider when the route content does not consume the provider. Load
profile-completion UI only when an authenticated session actually requires it.

Header markup required for first paint should remain stable and server-visible.
Account menus, cart controls, drawers, and mobile navigation may hydrate around
that markup. Session fetching must not multiply across repeated islands; use a
single shared session boundary or a server-provided initial session where the
existing authentication architecture supports it without adding a database
round trip to anonymous cached pages.

This refactor must preserve:

- correct anonymous and authenticated header states;
- profile completion rules;
- logout, account navigation, admin link visibility, and authorization;
- cart count, cart drawer, mobile bottom navigation, and theme behavior;
- the ability to cache public pages safely without leaking session data.

### 3. Server-render product cards with interactive action islands

Separate immutable product presentation from cart/favorite/voucher actions.
The product image, title, price, promotion, link, badges, and 3:4 media ratio
remain server-rendered and SEO-visible. A compact client action island owns only
stateful controls.

Voucher/session lookup must be performed once at the appropriate page or
provider boundary and shared with visible action islands. It must not issue an
independent voucher request for every card. Below-fold action islands may be
hydrated on visibility or intent only when their no-JavaScript markup and
accessible controls remain semantically correct.

### 4. Reduce critical CSS without brand regression

Inventory global selectors and route-specific styles. Keep resets, theme
tokens, typography primitives, layout primitives, and above-fold public-shell
styles global. Move admin, editor, game-engine, and route-only CSS out of the
shared bundle when build analysis proves it is currently included.

Remove dead or duplicate selectors only with visual and component-test proof.
Do not change the Paytone One/Montserrat brand system merely to win a lab score.
Test font preload and critical CSS options as measured experiments, retaining
only the variant that improves both mobile metrics and total HTML/RSC payload.

### 5. Route-aware LCP and image delivery

Create an explicit above-fold image policy:

- exactly the likely LCP image receives eager loading and high fetch priority;
- below-fold images remain lazy;
- `sizes`, intrinsic dimensions, and aspect-ratio match real responsive layout;
- existing safe WebP uploads and generated responsive variants are reused;
- no original upload is deleted, rewritten in place, or bulk-converted;
- product cards retain their 3:4 aspect ratio;
- QR paths and image CSP/remote patterns remain unchanged unless a measured QR
  failure requires a separate fix.

For `/tin-tuc`, the first visible article card gets LCP priority and an accurate
mobile/desktop size contract. Other cards remain lazy. Image changes must be
verified against the news listing, article detail, product listing, product
detail, homepage, admin media, and upload URLs.

### 6. Route-specific interaction isolation

- Homepage: remove repeated session/voucher work, reduce unnecessary hydrated
  card/action code, simplify reveal observation, and preserve all SEO-visible
  sections. Do not client-defer meaningful content merely to shrink the initial
  DOM.
- Product catalogue: keep filters and pagination responsive while preventing
  product actions from hydrating the entire card grid.
- Story page: eliminate avoidable client gates before the text hero paints and
  keep the brand heading/font stable.
- News listing: prioritize and right-size the LCP card image; keep subsequent
  cards lazy and preserve article metadata/links.
- Mini-game: ship only landing-page interaction initially. Dynamically load a
  game engine after selection/navigation, reserve layout height, and prevent
  audio/browser APIs from running before user interaction.
- Login: exclude unrelated floating widgets and scroll animation from the auth
  critical path when route behavior allows it; preserve all OAuth/password and
  redirect behavior.
- Cart: optimize the empty shell and populated card list without changing store
  persistence, quantities, voucher state, or totals.
- Checkout: preserve the current 100 score and all commerce logic. Shared-shell
  changes must pass checkout, QR, paid-only analytics, polling, and order tests.
- Admin: keep the anonymous redirect fast; lazily isolate heavy editors, charts,
  media tools, and route-only admin modules after login. Backend authorization
  remains mandatory regardless of UI splitting.

### 7. Safe third-party and cache scheduling

Retain Cloudflare security resources and Google conversion measurement. Keep
GTM outside the critical rendering path and verify that delayed initialization
still flushes queued events. Do not load public marketing scripts in admin when
they serve no admin purpose.

Any Nginx or Cloudflare cache change needs before/after header evidence and a
proof that personalized, cart, account, checkout, confirmation, and admin
responses cannot be shared across users. Existing immutable hashed-asset
caching remains the baseline.

## Data Flow And Error Handling

Performance boundaries must fail open for core business behavior:

- If a deferred widget or analytics bootstrap fails, navigation, cart, login,
  checkout, QR display, payment polling, and order confirmation still work.
- If session loading fails, the UI shows the existing safe anonymous/error
  state and never exposes admin functionality.
- If an image variant fails, the existing normalized upload URL or fallback
  image is used without changing the database path.
- If an intersection or idle callback API is unavailable, the feature uses a
  deterministic fallback and does not leave content or controls permanently
  hidden.
- Reduced-motion users receive stable content without scroll-triggered motion.
- Performance logging must not contain session tokens, order access tokens,
  payment data, API keys, or customer information.

Server calculations remain authoritative. No client performance optimization
may cache or infer prices, discounts, voucher ownership, shipping, payment
state, admin permission, or order status in place of the existing server APIs.

## Test-Driven Implementation Strategy

Add or strengthen focused regression tests before each behavioral refactor:

1. public-shell tests for anonymous/authenticated header state, profile guard,
   cart controls, mobile navigation, and admin-link visibility;
2. product-card tests proving server-visible content, 3:4 media, one shared
   voucher/session request policy, and intact cart/analytics actions;
3. image tests proving only the first above-fold news image is eager/high
   priority and later images are lazy with correct `sizes`;
4. mini-game tests proving engines are absent from the landing critical bundle,
   layout space is reserved, and audio begins only after interaction;
5. route tests for `/cau-chuyen` and `/admin` redirects;
6. existing checkout, order, voucher, QR/provider, webhook, paid-only analytics,
   authentication, admin authorization, upload, and media tests as mandatory
   regression gates.

After focused tests pass, run:

1. `npm ci`;
2. `npx prisma generate`;
3. focused and relevant full test suites;
4. `npm run typecheck --if-present`;
5. `npm run lint --if-present`, reporting only genuinely pre-existing unrelated
   failures separately;
6. the production Next.js build with `NEXT_DIST_DIR=.next-deploy`;
7. bundle/CSS/route manifest comparison against the baseline;
8. local browser checks at all required viewports;
9. local Lighthouse comparison before any production deployment.

## Production Deployment And Rollback

Deploy only to the current VPS `103.77.242.153`; never connect to the retired
VPS `103.173.226.86`. Use a manually staged, reversible standalone release and
do not use the legacy `deploy.sh`, which can run database synchronization and
remove rollback material.

The release must preserve the production layout:

- active standalone directory: `/var/www/mushroomie/.next/standalone`;
- Node static fallback inside the release:
  `<release>/.next-deploy/static`;
- Nginx static copy: `/var/www/mushroomie/.next/static`;
- all `public` assets except uploads copied into the release;
- `<release>/public/uploads` as an absolute symlink to
  `/var/www/mushroomie/public/uploads`;
- production `.env` copied into the release before PM2 restart;
- `standalone.previous.<timestamp>` retained until health, functional, MIME,
  browser, and Lighthouse checks all pass.

Before restart, verify the exact stage and active paths are on the same
filesystem. Rollback is a directory rename plus root-owned PM2 restart; it must
not touch the database, uploads, backups, `.env`, or Nginx configuration.

After deployment, verify PM2 status/logs, all scoped routes, redirect contracts,
CSS/JavaScript MIME types, upload images, the checkout QR path, console/network
health, and three-run Lighthouse acceptance. If any business, health, MIME, or
score gate fails, restore the retained previous standalone release.

## Explicit Non-Goals And Safety Boundaries

This release does not:

- change Prisma schema, run a migration, clean production data, or alter order,
  payment, user, voucher, or admin records;
- change price, discount, voucher, shipping, order creation, payment-provider,
  webhook, payment polling, QR, or paid-only purchase semantics;
- delete or bulk-rewrite `public/uploads`, backups, `.env`, database files,
  migrations, ecosystem configuration, or `package-lock.json`;
- disable Cloudflare protections, block third-party scripts only during audits,
  remove Google conversion tracking, or suppress errors to inflate a score;
- make the entire public page a Client Component, hide meaningful content from
  crawlers, remove brand fonts, or break the product-card 3:4 image ratio;
- claim an authenticated admin score from an anonymous redirect measurement.

No new heavy runtime dependency is justified by this design. Existing platform
APIs, Next.js capabilities, and small local helpers are preferred.

## Acceptance Criteria

- The complete nine-route matrix is measured on mobile and desktop before and
  after the release.
- Every rendered destination reaches a three-run median Lighthouse Performance
  score of 100 on mobile and desktop, with no unexplained run below 98.
- `/cau-chuyen` retains its intended 308 destination and anonymous `/admin`
  retains its intended 307 login redirect.
- `/thanh-toan` retains its current 100/100 performance and passes all commerce,
  QR, payment, voucher, order, webhook, and paid-only analytics regressions.
- Homepage TBT, shared unused JavaScript, critical CSS delay, and DOM/hydration
  work improve without removing SEO-visible content.
- The first `/tin-tuc` article image is treated as LCP; subsequent article
  images remain lazy, responsive, and visually stable.
- Mini-game mobile CLS improves and no game engine executes before selection or
  user interaction.
- Authenticated and anonymous shell states, cart behavior, admin authorization,
  uploads, images, analytics, accessibility, reduced motion, and SEO remain
  correct.
- Typecheck, lint within scope, tests, production build, PM2 health, route
  checks, MIME checks, browser checks, and production Lighthouse checks pass.
- The old release remains recoverable until every post-deploy gate passes, and
  the final report distinguishes measured facts, lab variability, and any
  unavailable field-data evidence.
