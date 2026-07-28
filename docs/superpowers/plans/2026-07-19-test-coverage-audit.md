# Mushroomie Test Coverage Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a production-grade automated test baseline for every major Mushroomie behavior area and enforce meaningful coverage for reusable business logic.

**Architecture:** Use Vitest for unit, component, route-handler integration, and coverage tests because it is the testing stack documented by the installed Next.js 16.2.6 package. Keep database, payment-network, email, and authentication boundaries mocked while exercising real validation and response behavior; use React Testing Library only for synchronous client components and stores, and use HTTP/route contract checks instead of unit-rendering async Server Components.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, TypeScript 5, Vitest, V8 coverage, jsdom, React Testing Library, Zustand, Prisma 5.22.

## Global Constraints

- Never connect tests to the production database, payment provider, email service, uploads, or real user/order/voucher data.
- Do not commit `.env`, coverage output, build output, logs, uploads, or temporary files.
- Keep product image behavior at a 3:4 ratio where product-card rendering is tested.
- Test authorization on the server boundary; hidden UI is not an authorization test.
- Test payment totals, voucher eligibility, upload validation, and game score validation with deterministic fixtures.
- Prefer behavior assertions over snapshots and mock only external boundaries.
- Run `npx prisma generate`, `npm run typecheck --if-present`, `npm run lint --if-present`, `npm run test:coverage`, and `npm run build` before completion.

---

### Task 1: Test runner, coverage gate, and shared fixtures

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.mts`
- Create: `src/test/setup.ts`
- Create: `src/test/fixtures.ts`
- Create: `src/test/test-utils.tsx`

**Interfaces:**
- Produces: `npm test`, `npm run test:coverage`, shared deterministic entities, environment cleanup, DOM cleanup, and Next.js component shims.

- [ ] **Step 1: Add a failing runner smoke test**

```ts
import { describe, expect, it } from 'vitest'

describe('test infrastructure', () => {
  it('resolves the @ alias used by the application', async () => {
    const { formatPrice } = await import('@/lib/utils')
    expect(formatPrice(125000)).toContain('125.000')
  })
})
```

- [ ] **Step 2: Run the smoke test before installing/configuring Vitest**

Run: `npm test -- --run src/test/infrastructure.test.ts`

Expected: FAIL because `test` and Vitest are not configured.

- [ ] **Step 3: Install and configure the documented Next.js test stack**

Run: `npm install --save-dev vitest @vitest/coverage-v8 @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom`

Add scripts `test: vitest run`, `test:watch: vitest`, and `test:coverage: vitest run --coverage`. Configure `vitest.config.mts` with React and TS path plugins, isolated tests, setup file, V8 text/JSON/HTML reporters, and thresholds scoped to reusable business modules rather than generated Next.js pages.

- [ ] **Step 4: Re-run the smoke test**

Run: `npm test -- --run src/test/infrastructure.test.ts`

Expected: PASS with 1 test and no unhandled errors.

### Task 2: Reusable domain, security, media, payment, and state behavior

**Files:**
- Create: `src/lib/__tests__/utils.test.ts`
- Create: `src/lib/__tests__/image-url.test.ts`
- Create: `src/lib/__tests__/sanitize.test.ts`
- Create: `src/lib/__tests__/security.test.ts`
- Create: `src/lib/__tests__/game.test.ts`
- Create: `src/lib/__tests__/order-access.test.ts`
- Create: `src/lib/__tests__/post-normalization.test.ts`
- Create: `src/lib/payment/__tests__/payment.test.ts`
- Create: `src/lib/payment/__tests__/providers.test.ts`
- Create: `src/lib/__tests__/image-processing.test.ts`
- Create: `src/store/__tests__/cart.test.ts`
- Create: `src/store/__tests__/voucher.test.ts`

**Interfaces:**
- Consumes: application exports without changing their production signatures.
- Produces: regression coverage for formatting/slugging, URL normalization, XSS stripping, callback safety, secret/token behavior, rate limiting, score/voucher thresholds, order access, article normalization, VietQR/webhook verification, safe image conversion, cart totals/merging, and voucher fetch deduplication.

- [ ] **Step 1: Write behavior tests against current exports**

Representative required assertions:

```ts
expect(normalizeStoredImagePath('public/uploads/item.png')).toBe('/uploads/item.png')
expect(sanitizeCallbackUrl('https://evil.example/steal')).toBe('/')
expect(isScoreReasonable('tetris', 50_000, 2_000)).toBe(false)
expect(verifyOrderAccessToken(token, 42, 'MSH-42')).toBe(true)
expect(redactWebhookPayload({ token: 'secret', nested: { amount: 100 } }))
  .toEqual({ token: '[redacted]', nested: { amount: 100 } })
expect(useCartStore.getState().getTotalPrice()).toBe(250_000)
```

- [ ] **Step 2: Run each new test file and confirm failures identify uncovered assumptions**

Run: `npm test -- src/lib/__tests__ src/lib/payment/__tests__ src/store/__tests__`

Expected: FAIL until environment isolation and exact existing behavior fixtures are correct; no production code is changed merely to satisfy a mistaken assertion.

- [ ] **Step 3: Complete deterministic fixtures and minimal boundary mocks**

Freeze clocks for expiring tokens, restore environment variables after each test, use temporary directories for image output, generate image buffers in memory with Sharp, and mock only network/Prisma/auth boundaries.

- [ ] **Step 4: Re-run domain tests**

Run: `npm test -- src/lib/__tests__ src/lib/payment/__tests__ src/store/__tests__`

Expected: PASS with zero unhandled rejections and no access to external services.

### Task 3: API authorization and critical route-handler behavior

**Files:**
- Create: `src/app/api/__tests__/auth-contract.test.ts`
- Create: `src/app/api/__tests__/checkout.test.ts`
- Create: `src/app/api/__tests__/game.test.ts`
- Create: `src/app/api/__tests__/orders-payments.test.ts`
- Create: `src/app/api/__tests__/uploads-and-profile.test.ts`
- Create: `src/app/api/__tests__/content-admin.test.ts`
- Create: `src/app/api/__tests__/public-routes.test.ts`

**Interfaces:**
- Consumes: exported `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` route handlers with native `Request`/`NextRequest` objects.
- Produces: response-contract assertions for anonymous/authenticated/admin/super-admin callers, validation failures, safe Prisma inputs, voucher rules, score tokens, payment status access, upload rejection, and public health/QR behavior.

- [ ] **Step 1: Write failing authorization matrix tests**

```ts
it.each(protectedHandlers)('$name rejects an anonymous caller', async ({ call }) => {
  authMock.mockResolvedValue(null)
  const response = await call()
  expect([401, 403]).toContain(response.status)
  expect(prismaWriteSpies.every((spy) => !spy.mock.calls.length)).toBe(true)
})
```

- [ ] **Step 2: Run the authorization matrix**

Run: `npm test -- src/app/api/__tests__/auth-contract.test.ts`

Expected: FAIL for any route whose fixture or intended guard is missing; distinguish public routes from protected routes explicitly.

- [ ] **Step 3: Add critical happy-path and rejection-path route tests**

Use complete Prisma/auth fixtures matching the schema. Assert response status/body and resulting Prisma arguments; never assert only that a mock was called.

- [ ] **Step 4: Run all route tests**

Run: `npm test -- src/app/api/__tests__`

Expected: PASS without database, payment-network, email, filesystem upload, or production secret access.

### Task 4: Component and user-state contracts

**Files:**
- Create: `src/components/ui/__tests__/primitives.test.tsx`
- Create: `src/components/product/__tests__/ProductCard.test.tsx`
- Create: `src/components/product/__tests__/AddToCartButton.test.tsx`
- Create: `src/components/cart/__tests__/CartDrawer.test.tsx`
- Create: `src/components/layout/__tests__/navigation.test.tsx`

**Interfaces:**
- Consumes: synchronous Client Components and UI primitives only.
- Produces: accessible name/role assertions, safe image fallback, 3:4 product image contract, correct product links/prices, add-to-cart state changes, cart totals, quantity limits, and navigation targets.

- [ ] **Step 1: Write tests using roles, labels, and user events**

```tsx
render(<ProductCard product={productFixture} />)
expect(screen.getByRole('link', { name: /vòng tay nấm/i })).toHaveAttribute('href', '/san-pham/vong-tay-nam')
expect(screen.getByTestId('product-image-frame')).toHaveClass('aspect-[3/4]')
```

- [ ] **Step 2: Run component tests and verify the initial red state**

Run: `npm test -- src/components`

Expected: FAIL only where the selector/fixture or an actual missing accessibility/behavior contract is identified.

- [ ] **Step 3: Adjust tests to public behavior and fix only confirmed regressions test-first**

Do not add test-only production props or IDs. Prefer semantic queries; inspect class behavior directly only for the mandatory 3:4 ratio.

- [ ] **Step 4: Re-run component tests**

Run: `npm test -- src/components`

Expected: PASS in jsdom with state reset between tests.

### Task 5: Coverage report, CI enforcement, and final verification

**Files:**
- Create: `docs/testing.md`
- Create: `.github/workflows/test.yml`
- Modify: `.gitignore` only if a generated test artefact is not already ignored.

**Interfaces:**
- Consumes: all tests and scripts from Tasks 1–4.
- Produces: a documented coverage matrix and a GitHub Actions quality gate using Node, npm cache, Prisma generation, typecheck, tests with coverage, lint, and build with non-production placeholder environment variables.

- [ ] **Step 1: Run coverage and record honest gaps**

Run: `npm run test:coverage`

Expected: PASS configured thresholds and generate ignored `coverage/` output. `docs/testing.md` must distinguish unit/integration/component/HTTP smoke coverage from production E2E flows that require controlled test accounts and a disposable database.

- [ ] **Step 2: Add CI workflow**

```yaml
- run: npm ci
- run: npx prisma generate
- run: npm run typecheck --if-present
- run: npm run test:coverage
- run: npm run lint --if-present
- run: npm run build
```

Use only placeholder test environment values; do not embed real credentials.

- [ ] **Step 3: Run the complete verification gate**

Run in order:

```powershell
npx prisma generate
npm run typecheck --if-present
npm run lint --if-present
npm run test:coverage
npm run build
git diff --check
git status --short
```

Expected: all commands exit 0; if a pre-existing lint/build warning remains, report its exact output and do not describe it as clean.

- [ ] **Step 4: Review the diff for secret/data safety**

Run: `git diff -- package.json package-lock.json vitest.config.mts src docs/testing.md .github/workflows/test.yml`

Expected: only test infrastructure, tests, documentation, and CI quality-gate changes; no `.env`, uploads, database files, order/user/voucher data, production config, or generated coverage output.
