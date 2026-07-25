# Mushroomie Security Hardening Report

Date: 2026-07-25

## Scope

This review covered the Next.js application, API authorization boundaries,
password-reset flow, QR proxy, mail transports, security headers, production
HTTP behavior, TLS negotiation, and production dependencies. Tests against
production were non-destructive and did not create users, orders, payments,
vouchers, uploads, or game rewards.

The review used the following defensive skill profiles:

- Web application penetration testing
- API security testing
- Security headers audit
- SSL/TLS security assessment
- Software composition analysis
- Vulnerability triage

## Fixed findings

### SEC-01: Password-reset tokens were stored in clear text

Severity: High

New tokens are now stored as SHA-256 digests. Reset requests validate the
token format, accept a legacy raw-token candidate only during the existing
one-hour transition window, and consume the token with a conditional
`updateMany`. Parallel requests can no longer reuse the same token after one
request succeeds.

### SEC-02: QR proxy followed redirects and buffered unbounded responses

Severity: High

The proxy now accepts only the exact `https://img.vietqr.io` origin, rejects
credentials and custom ports, disables automatic redirects, and enforces a
2 MB response limit using both `Content-Length` and streamed byte counting.

### SEC-03: Media APIs returned incorrect authorization status codes

Severity: Medium

Unauthenticated media-list and processing requests previously returned
`200 []` or `500`. Media routes now consistently return `401` or `403`.
Known image-validation failures remain actionable `400` responses, while
unknown internal errors are no longer exposed to clients.

### SEC-04: Admin settings API exposed internal error messages

Severity: Medium

Unexpected failures now return a generic server error while full details
remain in server logs.

### SEC-05: Production CSP and Server Actions retained development exceptions

Severity: Medium

`unsafe-eval` and the `localhost:3000` Server Actions origin are now enabled
only in development. Production retains the existing Google Ads, Analytics,
Clarity, reCAPTCHA, and payment allowlists.

### SEC-06: Mail transports allowed file and URL resolution

Severity: Medium

All SMTP and Resend transports now share frozen
`disableFileAccess`/`disableUrlAccess` settings. Application mail calls use
structured `html` fields and do not expose Nodemailer's `raw` option.

### SEC-07: Vulnerable direct dependencies

Severity: Critical/High

The following direct dependencies were upgraded:

- Next.js 16.2.10 to 16.2.11
- Auth.js beta.31 to beta.32
- Sharp 0.34.5 to 0.35.3
- PostCSS 8.5.16 to 8.5.23
- isomorphic-dompurify 3.16.x to 3.19.0

Production audit results changed from 2 critical, 12 high, and 1 low finding
to 0 critical, 12 high, and 0 low findings.

## Residual dependency findings

`npm audit --omit=dev` still reports 12 high entries in two transitive trees:

1. Auth.js requires Nodemailer `^7.0.7 || ^8.0.5`. The current upstream beta
   does not accept Nodemailer 9. The published advisory requires an
   attacker-controlled message-level `raw` option; Mushroomie does not use
   that option and now disables transport file and URL access globally.
2. ExcelJS depends on the vulnerable Archiver/Glob tree. Mushroomie uses
   ExcelJS only to read uploaded workbooks. No application path invokes the
   archive-writing API implicated by this dependency tree.

These findings are accepted temporarily because forcing incompatible or
downgraded versions creates a larger operational risk. Recheck them when
Auth.js or ExcelJS publishes a compatible update.

## Validation

- Clean dependency install: passed
- Prisma client generation: passed
- TypeScript typecheck: passed
- Automated tests: 158 passed
- ESLint for all changed source and test files: passed
- Next.js standalone production compilation: passed
- TLS 1.2 negotiation and certificate verification: passed

The local build used a non-secret placeholder database URL because this
worktree intentionally contains no production `.env`. The final deployment
must run `deploy.sh` on the server with the real protected environment and
must pass PM2, route, header, static asset MIME, and authorization checks
before completion.

The repository-wide lint command currently scans generated `.next-analyze`
output and fails on bundled JavaScript. This pre-existing lint-scope issue is
outside the application source; the changed files pass ESLint with no warning
or error.

## Remaining hardening opportunities

- Replace CSP `unsafe-inline` with nonce-based script and style policies after
  validating all Next.js, Google Ads, Analytics, Clarity, and reCAPTCHA flows.
- Confirm the Cloudflare minimum TLS version is 1.2 or later in the Cloudflare
  dashboard. The server OpenSSL client disables TLS 1.0/1.1 locally, so the
  current command-line test cannot prove the edge minimum.
- Repeat dependency triage after every Auth.js and ExcelJS update.
