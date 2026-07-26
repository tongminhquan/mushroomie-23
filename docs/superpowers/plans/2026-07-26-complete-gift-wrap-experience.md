# Complete Gift Wrap Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved order-level gift-wrap experience across cart, customer confirmation, email, and deployment.

**Architecture:** Reuse the existing persisted cart state and live gift-wrap endpoint. Keep server-side order pricing unchanged and render only the authoritative values saved on each order.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS v4, Prisma, Node test runner, PM2.

## Global Constraints

- Gift wrap is charged once per order and is never discounted by vouchers.
- Handwritten messages remain optional and limited to 500 characters.
- Do not change payment, voucher, authentication, or webhook behavior.
- Do not add dependencies.

---

### Task 1: Add regression coverage

**Files:**
- Modify: `tests/gift-wrap.test.ts`

**Interfaces:**
- Consumes: existing `GiftWrapOption`, cart surfaces, order detail, email template, and `deploy.sh`.
- Produces: source-level regression checks for required integration points.

- [ ] Add tests that require gift wrap on the full cart and cart drawer, require the fee in cart totals, require customer order and email confirmation, require unique React IDs, and require Prisma generation before typecheck.
- [ ] Run `npm test -- tests/gift-wrap.test.ts` and confirm the new tests fail for the missing behavior.

### Task 2: Complete cart integration

**Files:**
- Modify: `src/components/product/GiftWrapOption.tsx`
- Create: `src/components/checkout/GiftWrapFeeNotice.tsx`
- Modify: `src/app/(user)/gio-hang/page.tsx`
- Modify: `src/components/cart/CartDrawer.tsx`

**Interfaces:**
- Consumes: `useCartStore`, `useGiftWrap`, and `formatPrice`.
- Produces: synchronized selection and estimated totals on both cart surfaces.

- [ ] Generate unique description and message IDs with `useId`.
- [ ] Add the shared option, live fee, and update notice to the full cart.
- [ ] Add the shared option and selected fee to the cart drawer without introducing nested decorative cards.
- [ ] Run the focused regression tests and confirm they pass.

### Task 3: Complete customer confirmation

**Files:**
- Modify: `src/app/(user)/tai-khoan/don-hang/[code]/page.tsx`
- Modify: `src/lib/payment/email/templates.ts`

**Interfaces:**
- Consumes: persisted `order.gift_wrap`, `order.gift_wrap_fee`, and `order.gift_message`.
- Produces: customer-visible confirmation in account detail and payment-success email.

- [ ] Render the selected service, fee, and optional message in customer order detail.
- [ ] Render the selected service, fee, and optional message in the payment-success email.
- [ ] Escape customer-controlled email content before interpolating it into HTML.
- [ ] Run the focused regression tests and confirm they pass.

### Task 4: Make deployment Prisma-safe

**Files:**
- Modify: `deploy.sh`

**Interfaces:**
- Consumes: Prisma schema and generated client.
- Produces: generated Prisma types before TypeScript validation.

- [ ] Move `npm exec prisma generate` immediately after `npm ci`.
- [ ] Keep `npm exec prisma db push` after tests and before build.
- [ ] Run the focused regression test and confirm deployment ordering passes.

### Task 5: Verify and release

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: a tested GitHub commit and deployed PM2 release.

- [ ] Run `npm exec prisma generate`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build` with the configured build environment.
- [ ] Review `git diff` and commit only task files.
- [ ] Push `main`, run `bash deploy.sh`, then verify PM2, routes, API response, and recent logs.
