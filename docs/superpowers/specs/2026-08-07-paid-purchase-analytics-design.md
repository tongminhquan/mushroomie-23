# Mushroomie Paid Purchase Analytics Design

## Objective

Correct the Mushroomie checkout funnel so Google Ads and GA4 count a purchase
and its revenue only after the authoritative payment state is `PAID`. Preserve
pre-purchase intent measurement without changing checkout, QR generation, COD,
voucher reservation, payment-provider verification, or webhook settlement.

This design refines the purchase objective defined in the existing Performance
Max design: `purchase` remains the primary outcome, while checkout and order
creation remain secondary intent signals.

## Current Behavior And Root Cause

The current funnel has two premature purchase paths:

1. After `POST /api/orders` returns `201`, the checkout page immediately sends a
   Google Ads `conversion` event to the configured Purchase destination. Every
   newly created order still has `Order.payment_status = PENDING`, so unpaid
   bank-transfer and COD orders are incorrectly counted as purchases.
2. The confirmation page sends GA4 `purchase` when either the payment status is
   `PAID` or the order uses COD. COD therefore records purchase revenue before
   money is collected.

The authoritative paid transition already exists. A verified payment webhook
atomically changes both `Payment.status` and `Order.payment_status` from
`PENDING` to `PAID`. The confirmation page polls the protected payment-status
endpoint, which returns those persisted states. This status response is the
browser-side boundary at which purchase analytics may safely fire.

## Chosen Architecture

Use the existing client-side Google Tag Manager integration, gated by the
authoritative status returned from the server:

1. Keep `begin_checkout` at checkout entry for a non-empty cart.
2. After order creation succeeds, emit a custom `order_created` event. This
   event measures order intent and must not include the Google Ads Purchase
   `send_to` destination.
3. Remove the Google Ads Purchase conversion from the order-creation path.
4. On the confirmation page, wait until the payment-status endpoint reports
   both `status === "PAID"` and `paymentStatus === "PAID"`.
5. Only then emit GA4 `purchase` and Google Ads `conversion` for the Purchase
   destination.

The webhook remains responsible only for secure payment verification and the
database transition. It will not call browser analytics or add a server-side
Measurement Protocol integration. Consequently, a customer who closes the
confirmation page before payment is confirmed will not produce a browser event
until they revisit the confirmation or order flow. Server-side/offline
conversion delivery is explicitly outside this change.

## Event Contracts

### `begin_checkout`

- Point: existing checkout-page effect when the cart is non-empty and subtotal
  is positive.
- Purpose: beginning of purchase intent.
- Parameters: existing `currency`, `value`, and item snapshots.
- Change: none.

### `order_created`

- Point: immediately after `POST /api/orders` returns a successful response and
  provides `orderCode`.
- Purpose: successfully created order / high-intent checkout milestone.
- Parameters:
  - `transaction_id`: authoritative `orderCode` returned by the server.
  - `currency`: `VND`.
  - `value`: checkout total for funnel analysis, not GA4 purchase revenue.
  - `payment_method`: `bank_transfer` or `cod`.
  - `items`: the cart item snapshots used for the successful request.
- Delivery: normal analytics event without the Google Ads Purchase `send_to`.
- Idempotency key: `order_created_${orderCode}` through
  `trackAnalyticsEventOnce`.

### GA4 `purchase`

- Point: confirmation-page effect after the protected status endpoint reports
  a consistent `PAID`/`PAID` state.
- Parameters:
  - `transaction_id`: authoritative `orderCode`.
  - `currency`: `VND`.
  - `value`: authoritative order total returned by the order-detail endpoint,
    including the server-calculated voucher, shipping, and gift-wrap result.
  - `items`: authoritative order-item snapshots returned by the order-detail
    endpoint.
- Idempotency key: `purchase_${orderCode}` through
  `trackAnalyticsEventOnce`.

### Google Ads Purchase `conversion`

- Point: the same consistent `PAID`/`PAID` confirmation as GA4 `purchase`.
- Parameters:
  - `send_to`: existing `GOOGLE_ADS_PURCHASE_SEND_TO`.
  - `transaction_id`: the same authoritative `orderCode` used by GA4.
  - `currency`: `VND`.
  - `value`: the same authoritative order total used by GA4.
- Idempotency key: `ads_purchase_${orderCode}` through
  `trackAnalyticsEventOnce`.

The two purchase-related events intentionally have different session-storage
keys because they target different Google products, but both use the same
stable order code as `transaction_id`. Session storage suppresses duplicate
effect execution during one checkout session; Google can use `transaction_id`
to deduplicate repeated delivery after reloads or later visits.

## Payment Method Behavior

### Bank transfer / VietQR

- Order creation records `order_created` only.
- QR generation, fallback URLs, expiry countdown, and five-second polling stay
  unchanged.
- A verified provider webhook performs the database transition to `PAID`.
- The next successful polling response unlocks GA4 and Google Ads Purchase.

### COD

- Order creation records `order_created` only.
- The success page remains unchanged and continues to communicate that payment
  happens on delivery.
- COD does not emit GA4 `purchase`, Google Ads Purchase, or purchase revenue
  while `Order.payment_status` is `PENDING`.
- No new COD settlement workflow is introduced. If COD is later given a real
  authoritative transition to `PAID`, the same paid-only policy can be reused.

## Isolation From Commerce Logic

The change must not modify:

- order totals, inventory reservation, or order creation transactions;
- voucher validation, reservation, release, or redemption;
- payment-provider selection, QR creation, payment expiry, or webhook security;
- the webhook's idempotency and compare-and-set logic;
- COD order status or user-facing success behavior;
- access-token authorization for guest orders.

Analytics helpers must remain client-safe and must never throw into checkout.
Existing analytics queuing and tag-readiness behavior remains the delivery
mechanism.

## Error And Race Handling

- `PENDING`, `FAILED`, `EXPIRED`, `CANCELLED`, missing, or inconsistent payment
  states produce no Purchase event.
- A transient mismatch such as `Payment.status = PAID` while
  `Order.payment_status = PENDING` produces no Purchase event. Later polling may
  emit only after both values are `PAID`.
- Missing order details or an empty order code produce no Purchase event.
- Analytics storage or tag-loading failures must not block navigation, QR
  display, polling, or checkout completion.
- Repeated polling, React effect re-execution, reloads, and duplicate webhook
  delivery must not create distinct transaction identifiers.

## Implementation Boundaries

Create a small, pure commerce-analytics policy helper that builds event
descriptors from order and payment status. Both pages consume this helper, so
the paid-only rule and event parameters can be tested without mocking payment
providers or rendering the full checkout page.

Expected code changes are limited to:

- the checkout analytics policy/helper and its unit tests;
- the checkout page's post-order intent event;
- the confirmation page's paid-only purchase effect;
- imports for the existing Google Ads Purchase destination.

No Prisma schema change, migration, dependency addition, webhook edit, payment
provider edit, or production deployment is part of this change.

## Test Strategy

Add focused regression tests before implementation and observe them fail for
the missing policy. The tests must prove:

1. A bank-transfer order with `PENDING` payment produces no GA4 or Google Ads
   Purchase descriptor.
2. A COD order with `PENDING` payment produces no Purchase descriptor.
3. A partially updated or inconsistent payment/order state produces no
   Purchase descriptor.
4. A consistent `PAID`/`PAID` state produces exactly one GA4 `purchase`
   descriptor and one Google Ads `conversion` descriptor.
5. Both paid descriptors use the identical authoritative `orderCode` as
   `transaction_id` and the authoritative server total.
6. `order_created` remains separate from the Google Ads Purchase destination.
7. Existing payment-webhook, checkout, order/payment, voucher, QR/provider, and
   payment-security tests continue to pass.

After focused tests pass, run the full relevant test suites, TypeScript
typecheck, and the production Next.js build. The final review must also inspect
the diff to confirm no commerce or webhook behavior changed.

## Acceptance Criteria

- No Google Ads Purchase conversion is sent immediately after order creation.
- No GA4 Purchase or purchase revenue is sent for unpaid COD or bank-transfer
  orders.
- GA4 Purchase and Google Ads Purchase fire only after the server reports a
  consistent `PAID` payment state.
- Both paid events use `transaction_id = orderCode` and the authoritative order
  value.
- `begin_checkout` and `order_created` continue to measure intent.
- QR, COD, voucher, checkout, and payment webhook behavior remains unchanged.
- Focused tests, typecheck, and production build complete successfully before
  the work is reported as finished.
