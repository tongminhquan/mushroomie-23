# Global Shipping Fee Realtime Design

## Context

Mushroomie currently hardcodes a 30,000 VND shipping fee in checkout, order creation, and voucher estimation. The store needs one admin-controlled shipping fee that applies consistently to every new order and becomes visible to customers who already have the cart or checkout page open.

This change must not alter existing orders, pending QR codes, payment records, or paid amounts.

## Decisions

- The shipping fee is global per order, not per product or per quantity.
- A new fee applies only to orders created after the setting changes.
- Existing orders retain their stored `shipping_fee`, `total`, payment amount, and QR data.
- The server-side setting is authoritative. Client-provided shipping values are never trusted.
- Customer pages refresh the public shipping setting every five seconds and when the browser tab becomes active.
- If the fee changes while checkout is open, the customer sees an inline notification and the displayed total updates.
- If the fee changes between the final client refresh and order submission, order creation stops with a conflict response. The customer must review the new total and submit again.
- No customer email is sent for the global setting change because existing orders are unaffected.
- No Prisma migration is required. The existing `settings` table stores the value and update version.

## Data Model

The existing `Setting` records are used:

- `default_shipping_fee`: non-negative integer VND amount serialized as a string.
- `shipping_fee_updated_at`: ISO 8601 timestamp serialized as a string.

The application fallback is 30,000 VND when the setting is absent, malformed, negative, non-integer, or outside the accepted range.

Each created `Order` continues to snapshot the authoritative fee in `shipping_fee`. That snapshot remains immutable as part of this feature.

## Shared Shipping Domain

A server-side shipping module owns:

- The 30,000 VND fallback.
- Validation and normalization.
- Reading the current setting.
- Returning the amount and version together.
- Calculating a free-shipping voucher discount against the current fee.

A client-safe schema/type defines the public response but does not expose database access.

Accepted admin values:

- Integer VND.
- Minimum: 0 VND.
- Maximum: 1,000,000 VND.
- Recommended input step: 1,000 VND.

## APIs

### Public shipping fee

`GET /api/shipping-fee`

Response:

```json
{
  "shippingFee": 30000,
  "updatedAt": "2026-07-25T10:00:00.000Z"
}
```

Properties:

- Public and read-only.
- `Cache-Control: no-store`.
- Returns normalized fallback data instead of failing checkout when the setting is malformed.

### Admin shipping fee

`PATCH /api/admin/shipping-fee`

Request:

```json
{
  "shippingFee": 25000
}
```

Behavior:

- Requires `admin` or `super_admin`.
- Uses strict Zod validation.
- Upserts amount and version atomically.
- Writes an admin audit record with previous value, new value, and timestamp.
- Returns the persisted normalized value and version.
- A no-op update returns success without creating misleading change history.

### Order creation conflict protection

Checkout submits `expected_shipping_fee`, representing the fee the customer reviewed.

The order API:

1. Reads the current authoritative setting.
2. Compares it with `expected_shipping_fee`.
3. Returns HTTP 409 before reserving inventory or consuming a voucher when they differ.
4. Includes:

```json
{
  "code": "SHIPPING_FEE_CHANGED",
  "shippingFee": 25000,
  "message": "Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền."
}
```

5. Uses the authoritative fee for subtotal, voucher, total, and order snapshot when they match.

This prevents a stale checkout from silently creating an order at a total the customer did not review.

## Voucher Behavior

- `PERCENT` and `FIXED` vouchers continue to discount merchandise only.
- `FREE_SHIPPING` discounts the current global shipping fee.
- Voucher availability and “best voucher” calculations read the same shared shipping source.
- When the shipping fee changes in an open checkout, available vouchers are refreshed so a selected free-shipping voucher receives the correct amount.
- The order API remains the final authority and recalculates the voucher inside the order transaction.

## Admin UX

Design read: an operational settings surface for store administrators, using Mushroomie brand accents with restrained, minimalist hierarchy.

The `/admin/cai-dat` page receives a “Vận chuyển” tab containing:

- Current fee and last update time.
- A numeric VND input with visible currency formatting.
- A concise explanation that the fee applies once per new order.
- A before/after preview.
- A primary “Lưu phí vận chuyển” action.
- Loading, success, validation, authorization, and server-error states.
- A warning that existing orders and payment QR codes are not modified.

The control uses the current admin design system, 8px maximum card radius where practical, clear 44px controls, Lucide icons, WCAG AA contrast, and no decorative animation.

## Customer UX

A shared client hook loads and monitors the public shipping fee.

### Cart

- Shows an estimated shipping line and estimated order total.
- Updates within five seconds after an admin change.
- Shows an inline status notice only when an already-loaded value changes.

### Checkout

- Replaces the hardcoded fee.
- Recalculates total and free-shipping voucher discount.
- Shows the same inline notice with old and new formatted values.
- Announces the message using `role="status"` and `aria-live="polite"`.
- On an order-creation conflict, updates the fee, keeps all form and cart data, clears the submitting state, and asks the customer to review and submit again.

Example:

> Phí vận chuyển vừa được cập nhật từ 30.000đ thành 25.000đ. Tổng đơn hàng đã được tính lại.

The notice is compact, dismissible, and does not block checkout.

## Realtime Semantics

“Realtime” for this feature means eventual UI consistency within five seconds:

- Poll every five seconds while the cart or checkout is visible.
- Refresh immediately on `visibilitychange` when the tab becomes visible.
- Abort requests on unmount.
- Do not poll when the document is hidden.
- A failed refresh preserves the last valid fee and does not interrupt checkout.

This avoids WebSocket/SSE infrastructure and Nginx timeout changes while meeting the store’s operational need.

## Security And Integrity

- Only admin and super admin can mutate the setting.
- Viewer can read admin settings but cannot write.
- Public clients cannot provide the final shipping fee.
- Inputs reject decimals, negatives, non-finite values, and excessive amounts.
- Setting updates are auditable.
- Order conflict detection runs before inventory reservation and voucher consumption.
- Existing order, payment, QR, webhook, authentication, and checkout-provider logic remain unchanged.

## Failure Handling

- Missing or invalid setting: use 30,000 VND fallback and log a server warning without exposing internals.
- Public refresh failure: preserve the last valid fee.
- Admin save failure: keep the entered value and show a retryable inline error.
- Order conflict: do not create an order; refresh price and require confirmation.
- Voucher refresh failure: preserve the current selection visually, while the server still validates it during order creation.

## Testing

Automated coverage will verify:

- Shipping setting parsing, bounds, fallback, and version response.
- Admin authorization and strict request validation.
- Atomic setting update and audit payload.
- New orders snapshot the current fee.
- Stale checkout requests receive 409 before inventory or voucher changes.
- Existing orders are not updated.
- Free-shipping vouchers use the current global fee.
- Cart and checkout detect a changed version and produce the customer notice.
- Checkout preserves customer/cart data after a shipping conflict.

Verification:

```bash
npm ci
npx prisma generate
npm run typecheck
npm test
npm run build
```

Browser checks cover desktop 1440px and mobile 390px/360px for cart, checkout, and admin settings, including no horizontal overflow and accessible status announcements.

## Deployment And Rollback

No database migration is needed.

Deployment uses the existing standalone PM2 process. The setting can be rolled back immediately by saving the previous fee in admin. Code rollback does not alter existing orders because every order already stores a shipping snapshot.
