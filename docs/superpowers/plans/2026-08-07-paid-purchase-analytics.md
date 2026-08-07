# Paid Purchase Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve checkout/order intent events while sending GA4 Purchase revenue and the Google Ads Purchase conversion only after Mushroomie's authoritative payment and order states are both `PAID`.

**Architecture:** Add one pure analytics-policy module that builds typed event descriptors without touching `window`, payment providers, or the database. The existing client checkout page uses it for `order_created`; the existing client confirmation page uses it to gate GA4 and Google Ads Purchase on the protected payment-status response. Existing `trackAnalyticsEventOnce` remains the browser-delivery and session guard, while every paid event uses the server-issued order code as `transaction_id` for Google-side deduplication.

**Tech Stack:** Next.js 16.2.11 App Router, React 19 Client Components, TypeScript 5, Vitest 4, existing GTM/gtag analytics helpers.

## Global Constraints

- Do not modify Prisma schema, migrations, order totals, voucher logic, inventory, payment providers, webhook settlement, QR generation, COD status, access tokens, or checkout navigation.
- Preserve the existing `begin_checkout` event unchanged.
- `order_created` is an intent event and must not contain the Google Ads Purchase `send_to` destination.
- GA4 `purchase` and Google Ads `conversion` require both provider payment status and order payment status to equal exactly `PAID`.
- Paid event `value` and `items` come from the server-returned order snapshot on the confirmation page.
- Both paid events use `transaction_id = orderCode`; no random or session-derived transaction ID is allowed.
- Analytics failures must not throw into checkout, QR display, polling, or navigation.
- Preserve unrelated dirty-worktree changes, especially the existing edits in payment webhook, payment status, providers, Prisma schema, and payment tests.
- Add no dependency and do not broaden a Server Component into a Client Component; both affected pages are already intentional Client Components.

---

### Task 1: Encode the funnel policy as a pure, tested module

**Files:**
- Create: `src/lib/checkout-analytics.ts`
- Create: `src/lib/__tests__/checkout-analytics.test.ts`

**Interfaces:**
- Consumes: existing `AnalyticsItem` from `src/lib/analytics.ts` and `GOOGLE_ADS_PURCHASE_SEND_TO` from `src/lib/google-tags.ts`.
- Produces: `AnalyticsEventDescriptor`, `createOrderCreatedAnalyticsEvent(input)`, and `createPaidPurchaseAnalyticsEvents(input)`.

- [ ] **Step 1: Write the failing policy tests**

Create `src/lib/__tests__/checkout-analytics.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { GOOGLE_ADS_PURCHASE_SEND_TO } from '@/lib/google-tags'
import {
  createOrderCreatedAnalyticsEvent,
  createPaidPurchaseAnalyticsEvents,
} from '@/lib/checkout-analytics'

const items = [
  {
    item_id: '12',
    item_name: 'Vòng tay nấm đỏ',
    price: 120_000,
    quantity: 2,
  },
]

describe('checkout analytics policy', () => {
  it('keeps order creation as intent without targeting the Ads Purchase conversion', () => {
    const descriptor = createOrderCreatedAnalyticsEvent({
      orderCode: 'MSH-99',
      value: 230_000,
      paymentMethod: 'bank_transfer',
      items,
    })

    expect(descriptor).toEqual({
      key: 'order_created_MSH-99',
      event: 'order_created',
      params: {
        transaction_id: 'MSH-99',
        currency: 'VND',
        value: 230_000,
        payment_method: 'bank_transfer',
        items,
      },
    })
    expect(descriptor?.params).not.toHaveProperty('send_to')
  })

  it('does not build Purchase events for a pending bank transfer', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PENDING',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('does not treat an unpaid COD order as a Purchase', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-COD-1',
      providerPaymentStatus: 'PENDING',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('does not build Purchase events for an inconsistent paid transition', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PENDING',
      value: 230_000,
      items,
    })).toEqual([])
  })

  it('builds one GA4 Purchase and one Ads Purchase with the same transaction id', () => {
    const descriptors = createPaidPurchaseAnalyticsEvents({
      orderCode: ' MSH-99 ',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: 230_000,
      items,
    })

    expect(descriptors).toEqual([
      {
        key: 'purchase_MSH-99',
        event: 'purchase',
        params: {
          transaction_id: 'MSH-99',
          currency: 'VND',
          value: 230_000,
          items,
        },
      },
      {
        key: 'ads_purchase_MSH-99',
        event: 'conversion',
        params: {
          send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
          transaction_id: 'MSH-99',
          currency: 'VND',
          value: 230_000,
        },
      },
    ])
    expect(descriptors.map(({ params }) => params.transaction_id)).toEqual(['MSH-99', 'MSH-99'])
  })

  it('refuses to build paid events without an authoritative order code or value', () => {
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: '',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: 230_000,
      items,
    })).toEqual([])
    expect(createPaidPurchaseAnalyticsEvents({
      orderCode: 'MSH-99',
      providerPaymentStatus: 'PAID',
      orderPaymentStatus: 'PAID',
      value: Number.NaN,
      items,
    })).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/checkout-analytics.test.ts
```

Expected: FAIL because `@/lib/checkout-analytics` does not exist. The failure must be caused by the missing policy module, not a test syntax error.

- [ ] **Step 3: Implement the minimum pure policy**

Create `src/lib/checkout-analytics.ts`:

```typescript
import type { AnalyticsItem } from '@/lib/analytics'
import { GOOGLE_ADS_PURCHASE_SEND_TO } from '@/lib/google-tags'

export interface AnalyticsEventDescriptor {
  key: string
  event: 'order_created' | 'purchase' | 'conversion'
  params: Record<string, unknown>
}

interface OrderCreatedAnalyticsInput {
  orderCode: string
  value: number
  paymentMethod: 'bank_transfer' | 'cod'
  items: readonly AnalyticsItem[]
}

interface PaidPurchaseAnalyticsInput {
  orderCode: string
  providerPaymentStatus: string | null | undefined
  orderPaymentStatus: string | null | undefined
  value: number
  items: readonly AnalyticsItem[]
}

function validTransaction(orderCode: string, value: number) {
  const transactionId = orderCode.trim()
  if (!transactionId || !Number.isFinite(value) || value < 0) return null
  return transactionId
}

export function createOrderCreatedAnalyticsEvent(
  input: OrderCreatedAnalyticsInput,
): AnalyticsEventDescriptor | null {
  const transactionId = validTransaction(input.orderCode, input.value)
  if (!transactionId) return null

  return {
    key: `order_created_${transactionId}`,
    event: 'order_created',
    params: {
      transaction_id: transactionId,
      currency: 'VND',
      value: input.value,
      payment_method: input.paymentMethod,
      items: input.items,
    },
  }
}

export function createPaidPurchaseAnalyticsEvents(
  input: PaidPurchaseAnalyticsInput,
): AnalyticsEventDescriptor[] {
  if (input.providerPaymentStatus !== 'PAID' || input.orderPaymentStatus !== 'PAID') return []

  const transactionId = validTransaction(input.orderCode, input.value)
  if (!transactionId) return []

  return [
    {
      key: `purchase_${transactionId}`,
      event: 'purchase',
      params: {
        transaction_id: transactionId,
        currency: 'VND',
        value: input.value,
        items: input.items,
      },
    },
    {
      key: `ads_purchase_${transactionId}`,
      event: 'conversion',
      params: {
        send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
        transaction_id: transactionId,
        currency: 'VND',
        value: input.value,
      },
    },
  ]
}
```

- [ ] **Step 4: Run the policy tests and verify GREEN**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/checkout-analytics.test.ts
```

Expected: 6 tests PASS with no warnings or unhandled errors.

- [ ] **Step 5: Commit the isolated policy**

```bash
git add src/lib/checkout-analytics.ts src/lib/__tests__/checkout-analytics.test.ts
git diff --cached --check
git commit -m "test: define paid purchase analytics policy"
```

### Task 2: Replace the premature Ads Purchase with `order_created`

**Files:**
- Create: `src/lib/__tests__/purchase-funnel-integration.test.ts`
- Modify: `src/app/(user)/thanh-toan/page.tsx:15-16,268-279`

**Interfaces:**
- Consumes: `createOrderCreatedAnalyticsEvent()` from Task 1 and existing `trackAnalyticsEventOnce()`.
- Produces: a single `order_created` intent event after successful order creation; no Google Ads Purchase event at that boundary.

- [ ] **Step 1: Write the failing checkout integration regression**

Create `src/lib/__tests__/purchase-funnel-integration.test.ts`:

```typescript
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const checkoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'thanh-toan', 'page.tsx'),
  'utf8',
)

describe('purchase funnel integration', () => {
  it('records successful order creation as intent instead of an Ads Purchase', () => {
    expect(checkoutSource).toContain('createOrderCreatedAnalyticsEvent')
    expect(checkoutSource).not.toContain('GOOGLE_ADS_PURCHASE_SEND_TO')
    expect(checkoutSource).not.toContain('ads_click_')
  })
})
```

- [ ] **Step 2: Run the integration test and verify RED**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/purchase-funnel-integration.test.ts
```

Expected: FAIL because the checkout page still imports `GOOGLE_ADS_PURCHASE_SEND_TO`, contains `ads_click_`, and does not use the order-created policy.

- [ ] **Step 3: Change only the checkout analytics boundary**

In `src/app/(user)/thanh-toan/page.tsx`, replace the Google Ads import:

```typescript
import { trackAnalyticsEvent, trackAnalyticsEventOnce } from '@/lib/analytics'
import { createOrderCreatedAnalyticsEvent } from '@/lib/checkout-analytics'
```

Replace the current Google Ads `conversion` block immediately after `orderData` is parsed with:

```typescript
      const { orderId, orderCode, accessToken } = orderData
      const orderCreatedEvent = createOrderCreatedAnalyticsEvent({
        orderCode,
        value: total,
        paymentMethod,
        items: items.map((item) => ({
          item_id: String(item.productId),
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })
      if (orderCreatedEvent) {
        trackAnalyticsEventOnce(
          orderCreatedEvent.key,
          orderCreatedEvent.event,
          orderCreatedEvent.params,
        )
      }
```

Do not move the payment-creation request, `clearCart()`, navigation, fee conflict handling, voucher selection, or COD branch.

- [ ] **Step 4: Run checkout policy and integration tests**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/checkout-analytics.test.ts src/lib/__tests__/purchase-funnel-integration.test.ts
```

Expected: 7 tests PASS. Search must also show no Purchase destination in the checkout page:

```bash
rg -n "GOOGLE_ADS_PURCHASE_SEND_TO|ads_click_|event:\s*'conversion'" "src/app/(user)/thanh-toan/page.tsx"
```

Expected: no matches.

- [ ] **Step 5: Commit the order-intent integration**

```bash
git add "src/app/(user)/thanh-toan/page.tsx" src/lib/__tests__/purchase-funnel-integration.test.ts
git diff --cached --check
git commit -m "fix: separate order intent from Ads purchase"
```

### Task 3: Gate both paid events on a consistent authoritative `PAID` state

**Files:**
- Modify: `src/lib/__tests__/purchase-funnel-integration.test.ts`
- Modify: `src/app/(user)/thanh-toan/xac-nhan/page.tsx:9,174-190`

**Interfaces:**
- Consumes: `createPaidPurchaseAnalyticsEvents()` from Task 1, `PaymentStatusData.status`, `PaymentStatusData.paymentStatus`, server-returned `OrderInfo.total`, and server-returned order items.
- Produces: one GA4 `purchase` and one Google Ads Purchase `conversion` only for `PAID`/`PAID`.

- [ ] **Step 1: Extend the integration regression for the confirmation page**

Replace `src/lib/__tests__/purchase-funnel-integration.test.ts` with:

```typescript
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const checkoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'thanh-toan', 'page.tsx'),
  'utf8',
)
const confirmationSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'thanh-toan', 'xac-nhan', 'page.tsx'),
  'utf8',
)

describe('purchase funnel integration', () => {
  it('records successful order creation as intent instead of an Ads Purchase', () => {
    expect(checkoutSource).toContain('createOrderCreatedAnalyticsEvent')
    expect(checkoutSource).not.toContain('GOOGLE_ADS_PURCHASE_SEND_TO')
    expect(checkoutSource).not.toContain('ads_click_')
  })

  it('delegates confirmation analytics to the paid-only policy', () => {
    expect(confirmationSource).toContain('createPaidPurchaseAnalyticsEvents')
    expect(confirmationSource).toContain('providerPaymentStatus: paymentStatus?.status')
    expect(confirmationSource).toContain('orderPaymentStatus: paymentStatus?.paymentStatus')
    expect(confirmationSource).not.toContain(
      "const isCompleted = paymentStatus?.status === 'PAID' || orderInfo?.payment_method === 'cod'",
    )
  })
})
```

- [ ] **Step 2: Run the integration test and verify RED**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/purchase-funnel-integration.test.ts
```

Expected: the new confirmation test FAILS because the page still treats COD as completed and does not call the paid-only policy.

- [ ] **Step 3: Replace the confirmation-page Purchase effect**

In `src/app/(user)/thanh-toan/xac-nhan/page.tsx`, keep the existing analytics import and add:

```typescript
import { trackAnalyticsEventOnce } from '@/lib/analytics'
import { createPaidPurchaseAnalyticsEvents } from '@/lib/checkout-analytics'
```

Replace the current effect that defines `isCompleted` with:

```typescript
  useEffect(() => {
    if (!orderInfo) return

    const paidEvents = createPaidPurchaseAnalyticsEvents({
      orderCode,
      providerPaymentStatus: paymentStatus?.status,
      orderPaymentStatus: paymentStatus?.paymentStatus,
      value: Number(orderInfo.total),
      items: orderInfo.items?.map((item) => ({
        item_id: item.product_id ? String(item.product_id) : item.product_name || 'unknown',
        item_name: item.product_name || 'Sản phẩm Mushroomie',
        price: Number(item.price_snapshot || 0),
        quantity: Number(item.quantity || 1),
      })) || [],
    })

    for (const paidEvent of paidEvents) {
      trackAnalyticsEventOnce(paidEvent.key, paidEvent.event, paidEvent.params)
    }
  }, [orderCode, orderInfo, paymentStatus?.paymentStatus, paymentStatus?.status])
```

Do not change `fetchData`, the five-second polling interval, the COD success UI, the PAID UI, QR candidate generation, QR fallback behavior, or countdown expiry behavior.

- [ ] **Step 4: Run all analytics regressions and focused commerce tests**

Run:

```bash
npm run test:vitest -- src/lib/__tests__/checkout-analytics.test.ts src/lib/__tests__/purchase-funnel-integration.test.ts src/app/api/__tests__/checkout.test.ts src/app/api/__tests__/orders-payments.test.ts src/app/api/__tests__/payment-webhook.test.ts src/lib/payment/__tests__/providers.test.ts
```

Expected: all selected Vitest files PASS. Then run the existing Google tag and payment-security legacy tests:

```bash
npx tsx --test tests/google-tags.test.ts tests/payment-security.test.ts tests/order-pricing.test.ts tests/game-voucher.test.ts
```

Expected: all selected legacy tests PASS.

- [ ] **Step 5: Commit the paid-only integration**

```bash
git add "src/app/(user)/thanh-toan/xac-nhan/page.tsx" src/lib/__tests__/purchase-funnel-integration.test.ts
git diff --cached --check
git commit -m "fix: fire purchase analytics only after payment"
```

### Task 4: Verify the complete change without touching production

**Files:**
- Inspect only: all files changed by Tasks 1-3 plus existing dirty webhook/payment files.

**Interfaces:**
- Consumes: repository test scripts, TypeScript compiler, Next.js production builder, and Git diff.
- Produces: fresh evidence for tests, type safety, build success, and scope containment.

- [ ] **Step 1: Run the complete Vitest suite**

```bash
npm run test:vitest
```

Expected: exit code 0 with zero failed tests. If an unrelated pre-existing failure occurs, record the exact file/test and verify the focused analytics/payment suites independently before deciding whether it is in scope.

- [ ] **Step 2: Run the complete legacy test suite**

```bash
npm run test:legacy
```

Expected: exit code 0 with zero failed tests.

- [ ] **Step 3: Run TypeScript typecheck**

```bash
npm run typecheck
```

Expected: exit code 0 and `typecheck pass` with no diagnostics.

- [ ] **Step 4: Run the production build**

```bash
npm run build
```

Expected: exit code 0. `DATABASE_URL` warnings are informational only when the build still exits 0 and data routes remain dynamic, as documented by the project build skill.

- [ ] **Step 5: Inspect scope, whitespace, and event placement**

```bash
git diff --check
git status --short
git diff -- src/lib/checkout-analytics.ts src/lib/__tests__/checkout-analytics.test.ts src/lib/__tests__/purchase-funnel-integration.test.ts "src/app/(user)/thanh-toan/page.tsx" "src/app/(user)/thanh-toan/xac-nhan/page.tsx"
rg -n "begin_checkout|order_created|purchase|conversion|transaction_id|GOOGLE_ADS_PURCHASE_SEND_TO" src/lib/checkout-analytics.ts "src/app/(user)/thanh-toan/page.tsx" "src/app/(user)/thanh-toan/xac-nhan/page.tsx"
```

Expected:

- checkout contains unchanged `begin_checkout` and the new `order_created` dispatch;
- checkout contains no Google Ads Purchase destination or `conversion` dispatch;
- the confirmation page dispatches descriptors only through the paid-only helper;
- the helper requires `PAID`/`PAID` and gives both paid events the same `transaction_id`;
- no webhook, provider, QR, voucher, Prisma, or COD UI line was changed by this implementation.

- [ ] **Step 6: Report without deployment or push**

Report actual commands and exit codes, changed files, event locations, idempotency behavior, unrelated dirty-worktree files left untouched, commits created, and any remaining limitation that browser-side tracking requires the customer to remain on or revisit the confirmation flow. Do not deploy, restart PM2, push, or claim production verification because the user requested a code fix and build/typecheck report, not production deployment.
