# Testing strategy

## Commands

- `npm test`: run the complete Node test suite.
- `npm run test:coverage`: run the suite with the CI coverage gate.
- `npm run typecheck`: validate application and test TypeScript.
- `npm run lint`: run repository lint checks.

The coverage gate currently requires at least 60% line coverage, 80% branch coverage,
and 65% function coverage across modules loaded by the test suite. GitHub Actions runs
this gate before the production build.

## Risk coverage

| Priority | Area | Current automated coverage |
| --- | --- | --- |
| Critical | Order input, server-authoritative prices, stock/options, voucher math | Unit tests |
| Critical | Guest order access tokens and application secrets | Unit tests |
| Critical | Payment signatures, webhook redaction and order-code parsing | Unit tests |
| Critical | VietQR proxy host/content-type enforcement | Route integration tests |
| High | Game score tokens, duration checks and voucher issuance | Unit tests |
| High | Article sanitization and image URL normalization | Unit tests |
| Medium | Post status, excerpt, trash and restore behavior | Unit tests |
| Medium | Bulk CSV/image mapping and WordPress safety helpers | Unit tests |

## Remaining gaps

The percentage printed by Node covers modules exercised by the suite; it is not a claim
that every App Router page or API route has been executed. The next highest-value work is:

1. Database-backed integration tests for order creation, inventory rollback and voucher races.
2. Authenticated route tests for admin role matrices and object-level authorization.
3. Webhook idempotency tests against MySQL transactions.
4. Upload processing tests with real JPEG, PNG, WebP and invalid payload fixtures.
5. Browser tests for registration/OTP, checkout, payment confirmation and admin post editing.

These tests should use an isolated test database and must never point to production.
