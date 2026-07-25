# Global Shipping Fee Realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mushroomie administrators change one global per-order shipping fee and make cart/checkout reflect that fee within five seconds without changing existing orders or payment QR data.

**Architecture:** Store the fee and its update version in the existing `settings` table, expose a no-store public reader and an authenticated admin writer, and keep order creation authoritative by rejecting stale checkout submissions before any inventory or voucher writes. A shared client hook polls the public reader and drives an accessible inline notice in cart and checkout.

**Tech Stack:** Next.js 16 App Router route handlers, React 19 client components, TypeScript 5, Zod 4, Prisma 5/MySQL, Tailwind CSS v4, Node test runner through `tsx --test`.

## Global Constraints

- The shipping fee is charged once per new order, not once per product or quantity.
- Existing orders, `orders.shipping_fee`, `orders.total`, `payments.amount`, pending QR codes, and paid amounts must never be updated by this feature.
- The server-side setting is authoritative; client values are only an expected-value concurrency check.
- Poll every 5,000 ms only while cart/checkout is visible, and refresh immediately when the tab becomes visible.
- Use 30,000 VND when settings are missing or invalid.
- Accept integer values from 0 through 1,000,000 VND.
- Only `admin` and `super_admin` may update the fee.
- No Prisma schema change or migration.
- Preserve unrelated working-tree files: `deployment_guide.md`, `google-ads-setup-mushroomie.docx`, `google-ads-setup-mushroomie.txt`, and `~$ogle-ads-setup-mushroomie.docx`.
- Do not alter existing payment provider, webhook, QR, auth, or historical order behavior.
- Follow TDD: every behavior change starts with a test that fails for the expected reason.

---

## File Structure

**Create**

- `src/lib/shipping-fee.ts`: client-safe constants, schemas, normalization, conflict payload, and notice derivation.
- `src/lib/shipping-fee-server.ts`: Prisma-backed setting reader.
- `src/app/api/shipping-fee/route.ts`: public no-store current-fee endpoint.
- `src/app/api/admin/shipping-fee/route.ts`: authenticated atomic writer and audit log.
- `src/hooks/useShippingFee.ts`: polling, visibility refresh, and local notice state.
- `src/components/checkout/ShippingFeeNotice.tsx`: accessible compact customer notice.
- `src/components/admin/ShippingFeeSettings.tsx`: isolated admin shipping control.
- `tests/shipping-fee.test.ts`: domain and source-wiring regression coverage.

**Modify**

- `src/lib/order-schema.ts`: accept `expected_shipping_fee`.
- `src/app/api/orders/route.ts`: stale-fee conflict and authoritative snapshot.
- `src/app/api/vouchers/my-available/route.ts`: use current global fee for free-shipping voucher estimates.
- `src/app/api/checkout/apply-voucher/route.ts`: return the current free-shipping discount.
- `src/app/(user)/gio-hang/page.tsx`: show live estimated shipping and total.
- `src/app/(user)/thanh-toan/page.tsx`: use live fee, refresh vouchers, handle 409 without losing state.
- `src/app/admin/cai-dat/page.tsx`: add the shipping tab and render `ShippingFeeSettings`.

---

### Task 1: Shipping Fee Domain And Server Reader

**Files:**
- Create: `tests/shipping-fee.test.ts`
- Create: `src/lib/shipping-fee.ts`
- Create: `src/lib/shipping-fee-server.ts`

**Interfaces:**
- Produces: `DEFAULT_SHIPPING_FEE`, `MAX_SHIPPING_FEE`, `shippingFeeValueSchema`, `normalizeShippingFee`, `createShippingFeeConflict`, `createShippingFeeUpdateNotice`, `ShippingFeeSnapshot`, and `getShippingFeeSnapshot`.
- Consumes: existing `prisma.setting.findMany`.

- [ ] **Step 1: Write the failing domain tests**

Create `tests/shipping-fee.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_SHIPPING_FEE,
  createShippingFeeConflict,
  createShippingFeeUpdateNotice,
  normalizeShippingFee,
  shippingFeeValueSchema,
} from '@/lib/shipping-fee'

test('normalizes a persisted integer shipping fee', () => {
  assert.equal(normalizeShippingFee('25000'), 25_000)
})

test('falls back for empty, malformed, decimal, negative, and excessive values', () => {
  for (const value of ['', 'abc', '1000.5', '-1', '1000001', null, undefined]) {
    assert.equal(normalizeShippingFee(value), DEFAULT_SHIPPING_FEE)
  }
})

test('admin schema accepts only bounded integer VND values', () => {
  assert.equal(shippingFeeValueSchema.safeParse(0).success, true)
  assert.equal(shippingFeeValueSchema.safeParse(1_000_000).success, true)
  assert.equal(shippingFeeValueSchema.safeParse(-1).success, false)
  assert.equal(shippingFeeValueSchema.safeParse(10.5).success, false)
  assert.equal(shippingFeeValueSchema.safeParse(1_000_001).success, false)
})

test('returns a checkout conflict only when the reviewed fee is stale', () => {
  assert.equal(createShippingFeeConflict(25_000, 25_000), null)
  assert.deepEqual(createShippingFeeConflict(30_000, 25_000), {
    code: 'SHIPPING_FEE_CHANGED',
    shippingFee: 25_000,
    message: 'Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.',
  })
})

test('creates a notice only after an already loaded fee changes', () => {
  assert.equal(createShippingFeeUpdateNotice(null, 25_000), null)
  assert.equal(createShippingFeeUpdateNotice(25_000, 25_000), null)
  assert.deepEqual(createShippingFeeUpdateNotice(30_000, 25_000), {
    previousFee: 30_000,
    currentFee: 25_000,
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
```

Expected: FAIL because `@/lib/shipping-fee` does not exist.

- [ ] **Step 3: Implement the client-safe domain**

Create `src/lib/shipping-fee.ts`:

```ts
import { z } from 'zod'

export const DEFAULT_SHIPPING_FEE = 30_000
export const MAX_SHIPPING_FEE = 1_000_000
export const DEFAULT_SHIPPING_FEE_UPDATED_AT = '1970-01-01T00:00:00.000Z'

export const shippingFeeValueSchema = z.number().int().min(0).max(MAX_SHIPPING_FEE)

export interface ShippingFeeSnapshot {
  shippingFee: number
  updatedAt: string
}

export interface ShippingFeeUpdateNotice {
  previousFee: number
  currentFee: number
}

export interface ShippingFeeConflict {
  code: 'SHIPPING_FEE_CHANGED'
  shippingFee: number
  message: string
}

export function normalizeShippingFee(value: unknown): number {
  if (typeof value === 'string' && value.trim() === '') return DEFAULT_SHIPPING_FEE
  const parsed = shippingFeeValueSchema.safeParse(Number(value))
  return parsed.success ? parsed.data : DEFAULT_SHIPPING_FEE
}

export function createShippingFeeConflict(
  expectedFee: number,
  currentFee: number,
): ShippingFeeConflict | null {
  if (expectedFee === currentFee) return null
  return {
    code: 'SHIPPING_FEE_CHANGED',
    shippingFee: currentFee,
    message: 'Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.',
  }
}

export function createShippingFeeUpdateNotice(
  previousFee: number | null,
  currentFee: number,
): ShippingFeeUpdateNotice | null {
  if (previousFee === null || previousFee === currentFee) return null
  return { previousFee, currentFee }
}
```

- [ ] **Step 4: Implement the Prisma reader**

Create `src/lib/shipping-fee-server.ts`:

```ts
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_SHIPPING_FEE_UPDATED_AT,
  normalizeShippingFee,
  type ShippingFeeSnapshot,
} from '@/lib/shipping-fee'

interface ShippingFeeSettingReader {
  setting: {
    findMany(args: Prisma.SettingFindManyArgs): Promise<Array<{ key: string; value: string }>>
  }
}

export async function getShippingFeeSnapshot(
  client: ShippingFeeSettingReader = prisma,
): Promise<ShippingFeeSnapshot> {
  const settings = await client.setting.findMany({
    where: {
      key: { in: ['default_shipping_fee', 'shipping_fee_updated_at'] },
    },
  })
  const values = new Map(settings.map((setting) => [setting.key, setting.value]))
  const updatedAtValue = values.get('shipping_fee_updated_at')
  const updatedAt = updatedAtValue && !Number.isNaN(Date.parse(updatedAtValue))
    ? new Date(updatedAtValue).toISOString()
    : DEFAULT_SHIPPING_FEE_UPDATED_AT

  return {
    shippingFee: normalizeShippingFee(values.get('default_shipping_fee')),
    updatedAt,
  }
}
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
npm run typecheck
```

Expected: all five tests PASS and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add tests/shipping-fee.test.ts src/lib/shipping-fee.ts src/lib/shipping-fee-server.ts
git commit -m "feat: add global shipping fee domain"
```

---

### Task 2: Public Reader And Audited Admin Writer

**Files:**
- Modify: `tests/shipping-fee.test.ts`
- Create: `src/app/api/shipping-fee/route.ts`
- Create: `src/app/api/admin/shipping-fee/route.ts`

**Interfaces:**
- Consumes: `getShippingFeeSnapshot()` and `shippingFeeValueSchema`.
- Produces: public `GET /api/shipping-fee` and authenticated `PATCH /api/admin/shipping-fee`.

- [ ] **Step 1: Add failing source-wiring tests**

Append:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('public shipping route is no-store and uses the shared server reader', () => {
  const source = readFileSync(resolve('src/app/api/shipping-fee/route.ts'), 'utf8')
  assert.match(source, /getShippingFeeSnapshot/)
  assert.match(source, /['"]Cache-Control['"]:\s*['"]no-store['"]/)
})

test('admin shipping route enforces role, strict validation, atomic writes, and audit', () => {
  const source = readFileSync(resolve('src/app/api/admin/shipping-fee/route.ts'), 'utf8')
  assert.match(source, /super_admin/)
  assert.match(source, /admin/)
  assert.match(source, /\.strict\(\)/)
  assert.match(source, /prisma\.\$transaction/)
  assert.match(source, /adminLog\.create/)
  assert.match(source, /default_shipping_fee/)
  assert.match(source, /shipping_fee_updated_at/)
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
```

Expected: FAIL with missing route file errors.

- [ ] **Step 3: Add the public endpoint**

Create `src/app/api/shipping-fee/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const snapshot = await getShippingFeeSnapshot()
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[SHIPPING FEE GET]', error)
    return NextResponse.json(
      { error: 'Không thể tải phí vận chuyển' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
```

- [ ] **Step 4: Add the admin endpoint**

Create `src/app/api/admin/shipping-fee/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeShippingFee, shippingFeeValueSchema } from '@/lib/shipping-fee'

const updateSchema = z.object({
  shippingFee: shippingFeeValueSchema,
}).strict()

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !['super_admin', 'admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = updateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const now = new Date().toISOString()
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.setting.findUnique({ where: { key: 'default_shipping_fee' } })
      const previousFee = normalizeShippingFee(current?.value)
      if (previousFee === parsed.data.shippingFee) {
        const version = await tx.setting.findUnique({ where: { key: 'shipping_fee_updated_at' } })
        return { shippingFee: previousFee, updatedAt: version?.value || now, changed: false }
      }

      await tx.setting.upsert({
        where: { key: 'default_shipping_fee' },
        update: { value: String(parsed.data.shippingFee) },
        create: { key: 'default_shipping_fee', value: String(parsed.data.shippingFee) },
      })
      await tx.setting.upsert({
        where: { key: 'shipping_fee_updated_at' },
        update: { value: now },
        create: { key: 'shipping_fee_updated_at', value: now },
      })
      await tx.adminLog.create({
        data: {
          user_id: Number(session.user.id),
          action: 'UPDATE',
          entity: 'SETTINGS',
          details: JSON.stringify({
            key: 'default_shipping_fee',
            previousFee,
            shippingFee: parsed.data.shippingFee,
            updatedAt: now,
          }),
          ip_address: request.headers.get('x-forwarded-for') || undefined,
        },
      })
      return { shippingFee: parsed.data.shippingFee, updatedAt: now, changed: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ADMIN SHIPPING FEE PATCH]', error)
    return NextResponse.json({ error: 'Không thể lưu phí vận chuyển' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
npm run typecheck
```

Expected: tests PASS and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add tests/shipping-fee.test.ts src/app/api/shipping-fee/route.ts src/app/api/admin/shipping-fee/route.ts
git commit -m "feat: expose audited shipping fee settings"
```

---

### Task 3: Authoritative Order And Voucher Integration

**Files:**
- Modify: `tests/shipping-fee.test.ts`
- Modify: `src/lib/order-schema.ts`
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/api/vouchers/my-available/route.ts`
- Modify: `src/app/api/checkout/apply-voucher/route.ts`

**Interfaces:**
- Consumes: `getShippingFeeSnapshot()` and `createShippingFeeConflict()`.
- Produces: stale checkout HTTP 409 before side effects and current-fee free-shipping discounts.

- [ ] **Step 1: Add failing integration-wiring tests**

Append:

```ts
test('order creation checks expected shipping before inventory reservation', () => {
  const source = readFileSync(resolve('src/app/api/orders/route.ts'), 'utf8')
  const orderTransaction = source.indexOf('const order = await prisma.$transaction')
  const readSetting = source.indexOf('getShippingFeeSnapshot(tx)', orderTransaction)
  const conflict = source.indexOf('const shippingConflict', readSetting)
  const reserveInventory = source.indexOf('tx.product.updateMany')
  assert.ok(orderTransaction >= 0)
  assert.ok(readSetting >= 0)
  assert.ok(conflict > readSetting)
  assert.ok(reserveInventory > conflict)
  assert.doesNotMatch(source, /const shippingFee = 30_000/)
})

test('voucher endpoints use the shared shipping setting', () => {
  for (const file of [
    'src/app/api/vouchers/my-available/route.ts',
    'src/app/api/checkout/apply-voucher/route.ts',
  ]) {
    const source = readFileSync(resolve(file), 'utf8')
    assert.match(source, /getShippingFeeSnapshot/)
    assert.doesNotMatch(source, /estimatedShippingFee = .*30000/)
  }
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
```

Expected: FAIL because routes still hardcode 30,000 VND.

- [ ] **Step 3: Extend the order input**

Add to `orderSchema`:

```ts
expected_shipping_fee: shippingFeeValueSchema,
```

Import `shippingFeeValueSchema` from `@/lib/shipping-fee`.

- [ ] **Step 4: Add stale-fee protection before writes**

In `src/app/api/orders/route.ts`:

```ts
import { Prisma } from '@prisma/client'
import { createShippingFeeConflict, type ShippingFeeConflict } from '@/lib/shipping-fee'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'
```

Add a typed error near the imports:

```ts
class ShippingFeeChangedError extends Error {
  constructor(readonly conflict: ShippingFeeConflict) {
    super(conflict.code)
  }
}
```

Destructure the reviewed value after parsing:

```ts
const {
  items,
  payment_method,
  user_voucher_id,
  expected_shipping_fee,
  ...orderData
} = parsed.data
```

Delete `const shippingFee = 30_000`. At the very beginning of the existing order transaction, before `tx.product.updateMany`, add:

```ts
const { shippingFee } = await getShippingFeeSnapshot(tx)
const shippingConflict = createShippingFeeConflict(expected_shipping_fee, shippingFee)
if (shippingConflict) throw new ShippingFeeChangedError(shippingConflict)
```

Pass a serializable isolation level to the existing interactive transaction:

```ts
const order = await prisma.$transaction(async (tx) => {
  // existing order transaction body
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
})
```

At the top of the route’s existing `catch` block, return the conflict:

```ts
if (error instanceof ShippingFeeChangedError) {
  return NextResponse.json(error.conflict, { status: 409 })
}
```

Keep the existing voucher calculation, `shipping_fee` snapshot, total calculation, inventory reservation, and payment flow unchanged.

- [ ] **Step 5: Make voucher endpoints use the same snapshot**

In both voucher routes:

```ts
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'
```

Read:

```ts
const { shippingFee } = await getShippingFeeSnapshot()
```

Use `shippingFee` for `FREE_SHIPPING`.

For `apply-voucher`, add:

```ts
} else if (template.discountType === 'FREE_SHIPPING') {
  discountAmount = shippingFee
}

discountAmount = template.discountType === 'FREE_SHIPPING'
  ? Math.min(shippingFee, discountAmount)
  : Math.min(parsed.data.subtotal, discountAmount)
```

Return `discountType` and `discountValue` so its response matches checkout’s voucher shape.

- [ ] **Step 6: Verify GREEN and order pricing regressions**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts tests/order-pricing.test.ts tests/payment-security.test.ts
npm run typecheck
```

Expected: all selected tests PASS and typecheck exits 0.

- [ ] **Step 7: Commit**

```bash
git add tests/shipping-fee.test.ts src/lib/order-schema.ts src/app/api/orders/route.ts src/app/api/vouchers/my-available/route.ts src/app/api/checkout/apply-voucher/route.ts
git commit -m "fix: enforce authoritative shipping on new orders"
```

---

### Task 4: Realtime Client Hook And Customer Notice

**Files:**
- Modify: `tests/shipping-fee.test.ts`
- Create: `src/hooks/useShippingFee.ts`
- Create: `src/components/checkout/ShippingFeeNotice.tsx`

**Interfaces:**
- Consumes: `ShippingFeeSnapshot`, `ShippingFeeUpdateNotice`, and `createShippingFeeUpdateNotice`.
- Produces: `useShippingFee()` returning `{ shippingFee, updatedAt, isReady, notice, refresh, dismissNotice, acceptServerFee }`.

- [ ] **Step 1: Add failing source tests for polling and accessibility**

Append:

```ts
test('shipping hook polls only for the public endpoint and handles visibility', () => {
  const source = readFileSync(resolve('src/hooks/useShippingFee.ts'), 'utf8')
  assert.match(source, /5_000/)
  assert.match(source, /visibilitychange/)
  assert.match(source, /document\.visibilityState/)
  assert.match(source, /AbortController/)
  assert.match(source, /cache: 'no-store'/)
})

test('shipping notice uses polite live status semantics', () => {
  const source = readFileSync(resolve('src/components/checkout/ShippingFeeNotice.tsx'), 'utf8')
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /previousFee/)
  assert.match(source, /currentFee/)
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
```

Expected: FAIL with missing hook and component files.

- [ ] **Step 3: Implement the polling hook**

Create `src/hooks/useShippingFee.ts` as a client module. It must:

```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SHIPPING_FEE,
  createShippingFeeUpdateNotice,
  type ShippingFeeSnapshot,
  type ShippingFeeUpdateNotice,
} from '@/lib/shipping-fee'

const POLL_INTERVAL_MS = 5_000

export function useShippingFee() {
  const [snapshot, setSnapshot] = useState<ShippingFeeSnapshot>({
    shippingFee: DEFAULT_SHIPPING_FEE,
    updatedAt: '',
  })
  const [isReady, setIsReady] = useState(false)
  const [notice, setNotice] = useState<ShippingFeeUpdateNotice | null>(null)
  const feeRef = useRef<number | null>(null)

  const applySnapshot = useCallback((next: ShippingFeeSnapshot) => {
    const nextNotice = createShippingFeeUpdateNotice(feeRef.current, next.shippingFee)
    if (nextNotice) setNotice(nextNotice)
    feeRef.current = next.shippingFee
    setSnapshot(next)
    setIsReady(true)
  }, [])

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/shipping-fee', {
      cache: 'no-store',
      signal,
    })
    if (!response.ok) throw new Error('SHIPPING_FEE_LOAD_FAILED')
    applySnapshot(await response.json())
  }, [applySnapshot])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal).catch(() => setIsReady(true))

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh(controller.signal).catch(() => undefined)
      }
    }, POLL_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh(controller.signal).catch(() => undefined)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refresh])

  const acceptServerFee = useCallback((shippingFee: number) => {
    applySnapshot({ shippingFee, updatedAt: new Date().toISOString() })
  }, [applySnapshot])

  return {
    ...snapshot,
    isReady,
    notice,
    refresh,
    acceptServerFee,
    dismissNotice: () => setNotice(null),
  }
}
```

- [ ] **Step 4: Implement the notice**

Create `ShippingFeeNotice.tsx` with a compact bordered surface, `Truck` and `X` Lucide icons, a 44px dismiss button, `role="status"`, and `aria-live="polite"`. Its copy must be:

```tsx
Phí vận chuyển vừa được cập nhật từ {formatPrice(previousFee)} thành {formatPrice(currentFee)}.
Tổng đơn hàng đã được tính lại.
```

Do not render when `notice` is null.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
npm run typecheck
```

Expected: tests PASS and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add tests/shipping-fee.test.ts src/hooks/useShippingFee.ts src/components/checkout/ShippingFeeNotice.tsx
git commit -m "feat: add live shipping fee updates"
```

---

### Task 5: Cart, Checkout, And Admin UI

**Files:**
- Modify: `tests/shipping-fee.test.ts`
- Create: `src/components/admin/ShippingFeeSettings.tsx`
- Modify: `src/app/admin/cai-dat/page.tsx`
- Modify: `src/app/(user)/gio-hang/page.tsx`
- Modify: `src/app/(user)/thanh-toan/page.tsx`

**Interfaces:**
- Consumes: `useShippingFee()` and `ShippingFeeNotice`.
- Produces: admin shipping tab, cart estimate, checkout live total, and 409 recovery.

- [ ] **Step 1: Add failing UI wiring tests**

Append:

```ts
test('cart and checkout use the shared live shipping hook', () => {
  for (const file of [
    'src/app/(user)/gio-hang/page.tsx',
    'src/app/(user)/thanh-toan/page.tsx',
  ]) {
    const source = readFileSync(resolve(file), 'utf8')
    assert.match(source, /useShippingFee/)
    assert.match(source, /ShippingFeeNotice/)
    assert.doesNotMatch(source, /const shippingFee = 30000/)
  }
})

test('checkout submits reviewed shipping and handles a stale-fee conflict', () => {
  const source = readFileSync(resolve('src/app/(user)/thanh-toan/page.tsx'), 'utf8')
  assert.match(source, /expected_shipping_fee: shippingFee/)
  assert.match(source, /SHIPPING_FEE_CHANGED/)
  assert.match(source, /acceptServerFee/)
})

test('admin settings renders the dedicated shipping control', () => {
  const page = readFileSync(resolve('src/app/admin/cai-dat/page.tsx'), 'utf8')
  const control = readFileSync(resolve('src/components/admin/ShippingFeeSettings.tsx'), 'utf8')
  assert.match(page, /ShippingFeeSettings/)
  assert.match(page, /Vận chuyển/)
  assert.match(control, /\\/api\\/admin\\/shipping-fee/)
  assert.match(control, /Lưu phí vận chuyển/)
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts
```

Expected: FAIL because customer/admin pages are not wired.

- [ ] **Step 3: Implement the admin shipping control**

`ShippingFeeSettings.tsx` must:

- Load `/api/shipping-fee` with `cache: 'no-store'`.
- Keep `savedFee`, `draftFee`, `updatedAt`, `loading`, `saving`, `error`, and `success`.
- Parse the input with `shippingFeeValueSchema`.
- PATCH `{ shippingFee }` to `/api/admin/shipping-fee`.
- Preserve the draft on failure.
- Show current fee, formatted new fee, last update, and the warning that existing orders/QR remain unchanged.
- Use `Truck`, `Save`, `Loader2`, `Info`, and `CheckCircle2`.
- Use a numeric input with `min={0}`, `max={1_000_000}`, `step={1_000}`, and `inputMode="numeric"`.

In `src/app/admin/cai-dat/page.tsx`, add a `Truck` icon tab with key `shipping` and render:

```tsx
{activeTab === 'shipping' && <ShippingFeeSettings />}
```

- [ ] **Step 4: Wire the cart**

In `CartPage`:

```ts
const {
  shippingFee,
  notice,
  dismissNotice,
} = useShippingFee()
const subtotal = getTotalPrice()
const estimatedTotal = subtotal + shippingFee
```

Render `ShippingFeeNotice` above the summary rows. Add rows for “Phí vận chuyển dự kiến” and “Tổng dự kiến”. Preserve the existing checkout CTA and cart actions.

- [ ] **Step 5: Wire checkout totals and vouchers**

In `CheckoutPage`:

```ts
const {
  shippingFee,
  updatedAt: shippingFeeUpdatedAt,
  isReady: shippingFeeReady,
  notice: shippingFeeNotice,
  dismissNotice: dismissShippingFeeNotice,
  acceptServerFee,
} = useShippingFee()
```

Remove the hardcoded fee. Add `shippingFeeUpdatedAt` to voucher refresh dependencies so free-shipping vouchers are recalculated. When refreshing voucher items, preserve the selected voucher by ID and replace it with the refreshed object.

Submit:

```ts
expected_shipping_fee: shippingFee,
```

Do not submit `shipping_fee`.

Handle non-OK order responses before throwing:

```ts
const data = await orderRes.json().catch(() => null)
if (
  orderRes.status === 409 &&
  data?.code === 'SHIPPING_FEE_CHANGED' &&
  typeof data.shippingFee === 'number'
) {
  acceptServerFee(data.shippingFee)
  setError(data.message)
  return
}
if (!orderRes.ok) {
  throw new Error(typeof data?.error === 'string' ? data.error : 'Tạo đơn hàng thất bại')
}
```

Render `ShippingFeeNotice` before the summary. Disable the submit button until the first public fee load completes:

```tsx
<Button
  type="submit"
  isLoading={isLoading}
  disabled={!shippingFeeReady || isLoading}
  className="mt-4 w-full"
  size="lg"
>
  {shippingFeeReady ? 'Đặt hàng và thanh toán' : 'Đang cập nhật phí vận chuyển...'}
</Button>
```

Preserve cart items, customer form, selected payment method, and voucher on 409.

- [ ] **Step 6: Verify GREEN and UI lint**

Run:

```bash
npx tsx --test tests/shipping-fee.test.ts tests/order-pricing.test.ts tests/payment-security.test.ts
npm run typecheck
npx eslint src/lib/shipping-fee.ts src/lib/shipping-fee-server.ts src/hooks/useShippingFee.ts src/components/checkout/ShippingFeeNotice.tsx src/components/admin/ShippingFeeSettings.tsx src/app/api/shipping-fee/route.ts src/app/api/admin/shipping-fee/route.ts src/app/api/orders/route.ts src/app/api/vouchers/my-available/route.ts src/app/api/checkout/apply-voucher/route.ts "src/app/(user)/gio-hang/page.tsx" "src/app/(user)/thanh-toan/page.tsx" src/app/admin/cai-dat/page.tsx
```

Expected: selected tests PASS, typecheck exits 0, and scoped ESLint has no errors.

- [ ] **Step 7: Commit**

```bash
git add tests/shipping-fee.test.ts src/components/admin/ShippingFeeSettings.tsx src/app/admin/cai-dat/page.tsx "src/app/(user)/gio-hang/page.tsx" "src/app/(user)/thanh-toan/page.tsx"
git commit -m "feat: manage live shipping fee across checkout"
```

---

### Task 6: Full Verification, Browser QA, And Production Delivery

**Files:**
- Verify all changed files.
- Do not stage unrelated pre-existing files.

**Interfaces:**
- Consumes: the complete implementation.
- Produces: verified commit pushed to `main` and deployed through the existing PM2 standalone process.

- [ ] **Step 1: Run full local verification**

```bash
npm ci
npx prisma generate
npm run typecheck
npm test
npm run build
```

Expected:

- `npm ci`: exit 0.
- Prisma client generation: exit 0.
- Typecheck: zero errors.
- Test suite: zero failures.
- Next.js webpack build: exit 0.

- [ ] **Step 2: Verify repository scope**

```bash
git status --short
git diff HEAD~5 -- src tests
git diff --check
```

Confirm no `.env`, build output, database dump, upload, backup, or unrelated user file is staged.

- [ ] **Step 3: Browser QA**

At 1440px, 390px, and 360px:

1. Open `/admin/cai-dat`, select “Vận chuyển”, and save a non-production test value.
2. Keep `/gio-hang` and `/thanh-toan` open in another browser context.
3. Confirm both update within five seconds and show the inline old-to-new notice.
4. Confirm cart estimated total and checkout total remain aligned.
5. Confirm a free-shipping voucher discounts the full current shipping fee.
6. Trigger a stale checkout by changing the fee immediately before order submission; verify no order is created, form/cart stay intact, and the customer must submit again.
7. Restore the original fee through admin.
8. Confirm existing order detail and payment QR values did not change.
9. Confirm no horizontal overflow, broken icon, or serious console error.

- [ ] **Step 4: Push the implementation**

Rebase/fetch safely if needed, then push the completed branch to `origin/main` according to the repository’s established main-branch workflow. Do not force-push.

- [ ] **Step 5: Deploy using the established server procedure**

On `/var/www/mushroomie`:

```bash
git pull origin main
npm ci
npx prisma generate
npm run typecheck
npm test
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart mushroomie_pm2
pm2 save
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

No `prisma migrate deploy` is needed because this feature has no migration.

- [ ] **Step 6: Production verification**

Check:

```bash
curl -I https://mushroomie.io.vn/
curl -I https://mushroomie.io.vn/gio-hang
curl -I https://mushroomie.io.vn/thanh-toan
curl -I https://mushroomie.io.vn/admin/cai-dat
curl -i https://mushroomie.io.vn/api/shipping-fee
curl -I https://mushroomie.io.vn/api/health
```

Requirements:

- Public pages and `/api/shipping-fee` return 200.
- Admin unauthenticated redirect is expected.
- `/api/health` reports database connectivity.
- Public shipping response includes `shippingFee`, `updatedAt`, and `Cache-Control: no-store`.
- CSS returns `text/css`.
- JavaScript returns `application/javascript` or `text/javascript`.
- PM2 has no new runtime errors.
