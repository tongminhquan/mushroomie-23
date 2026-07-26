# Complete Gift Wrap Experience Design

## Goal

Complete the approved global gift-wrap feature so customers can select and review it throughout the shopping flow, while preserving the existing authoritative server-side pricing.

## Architecture

Gift wrap remains an order-level option stored in the persisted cart state and charged once per order. The existing `GiftWrapOption`, `useGiftWrap`, order API, and Prisma fields remain the source of truth. Cart surfaces read the same store and public live-price endpoint; customer order details and payment-success email render the values persisted on the order.

## User Experience

- Product detail, full cart, cart drawer, and checkout expose the same gift-wrap selection.
- The full cart and cart drawer include the selected fee in their estimated totals.
- The full cart shows a polite live notice when the administrator changes the fee.
- Checkout remains the only place where the customer writes the optional handwritten message.
- Customer order detail and payment-success email show the selected service, fee, and handwritten message.
- Reusable form IDs are generated per component instance to remain accessible when a cart drawer and page are mounted together.

## Deployment Safety

`prisma generate` must run immediately after dependency installation and before TypeScript validation. Database synchronization remains after tests and before the production build.

## Error Handling

If the public gift-wrap endpoint cannot be loaded, existing defaults remain available and checkout still performs authoritative conflict validation. If the administrator disables gift wrap, the shared cart selection is cleared.

## Verification

- Source-level regression tests cover all required UI surfaces, customer confirmation, email content, unique IDs, and deployment ordering.
- Run Prisma generation, typecheck, the complete test suite, and the production build.
- Verify PM2, public routes, the gift-wrap endpoint, and production logs after deployment.
