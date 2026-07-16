# Mushroomie SEO Phase 6 Measurement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an evidence-based measurement baseline for Mushroomie's 30-keyword SEO plan without fabricating GSC, GA4, indexation, Core Web Vitals, ranking, or Local Pack data.

**Architecture:** Keep `mushroomie_30_tu_khoa_seo.csv` and the Phase 4 ownership model as the keyword source of truth. A pure TypeScript module builds stable baseline rows and CSV scorecards, while a read-only audit script verifies public production evidence and writes Phase 6 artifacts. Authenticated Google account metrics remain explicitly pending until the owner supplies GSC, GA4, and GBP access or exports.

**Tech Stack:** TypeScript, Node test runner, Next.js 16, GA4 gtag, Google Ads tag, Google Tag Manager, XML sitemap, DNS TXT.

## Global Constraints

- Do not invent rankings, clicks, impressions, CTR, indexed URL counts, CWV field data, conversions, or Local Pack positions.
- Do not use the Google Indexing API for ordinary product, category, or article pages.
- Do not add a second GA4 tag or duplicate page-view measurement.
- Do not alter production data, database schema, uploads, checkout, payment, or authentication.
- Preserve the unrelated local change in `docs/google-business-profile-phase-3-checklist.md`.
- Push Phase 6 files to GitHub and synchronize the production checkout after verification.

---

### Task 1: Pure Phase 6 baseline model

**Files:**
- Create: `src/lib/seo-phase-6.ts`
- Create: `tests/seo-phase-6.test.ts`

**Interfaces:**
- Consumes: 30 keyword rows and canonical owner resolution from `src/lib/seo-phase-4.ts`.
- Produces: `buildSeoPhase6KeywordBaseline()`, `serializeSeoPhase6KeywordCsv()`, and `buildSeoPhase6ScorecardCsv()`.

- [ ] **Step 1: Write failing tests**

Require exactly 30 rows, nine canonical owner URLs, absolute production URLs, a fixed `pending_authenticated_data` status, and empty authenticated metric fields.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/seo-phase-6.test.ts`

Expected: FAIL because `src/lib/seo-phase-6.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure functions**

Create typed rows that preserve keyword, cluster, intent, priority, owner URL, baseline date, and blank GSC/rank/index/Local Pack fields. Serialize CSV with correct escaping and UTF-8 content.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --import tsx --test tests/seo-phase-6.test.ts`

Expected: PASS.

---

### Task 2: Read-only production measurement audit

**Files:**
- Create: `scripts/audit-seo-phase-6.ts`
- Modify: `package.json`
- Modify: `tests/seo-phase-6.test.ts`

**Interfaces:**
- Consumes: production homepage, Next.js chunks, GTM container, sitemap, robots.txt, DNS TXT, health endpoint, CSV keyword plan.
- Produces:
  - `docs/seo-phase-6/measurement-readiness.json`
  - `docs/seo-phase-6/measurement-baseline.md`
  - `docs/seo-phase-6/keyword-baseline.csv`
  - `docs/seo-phase-6/weekly-scorecard.csv`

- [ ] **Step 1: Add failing integration assertions**

Require a read-only package script, public checks for GA4/Ads/GTM IDs, sitemap URL count, robots reference, DNS verification token, and explicit authenticated-data limitations.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/seo-phase-6.test.ts`

Expected: FAIL because the audit script and package command do not exist.

- [ ] **Step 3: Implement the audit script**

Fetch only public endpoints, resolve DNS TXT, inspect production JavaScript chunks, and write deterministic artifacts. Mark GSC Search Analytics, URL Inspection, GA4 reports, CrUX field data, and GBP performance as pending when no authenticated source exists.

- [ ] **Step 4: Generate artifacts**

Run: `npm run seo:audit:phase-6`

Expected: 30 keyword rows, nine owners, 123 public sitemap URLs at the current baseline, public tag evidence, and no fabricated metric values.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --import tsx --test tests/seo-phase-6.test.ts
npm run typecheck
npm test
```

---

### Task 3: Roadmap and operational handoff

**Files:**
- Modify: `docs/seo-roadmap-2026-07-16.md`
- Generated: `docs/seo-phase-6/*`

**Interfaces:**
- Consumes: generated readiness evidence.
- Produces: a clear owner action list for GSC sitemap submission, GA4 Realtime/DebugView validation, GSC exports, URL Inspection sampling, CWV, and GBP Local Pack tracking.

- [ ] **Step 1: Document verified and pending states**

Record that the public sitemap is available and referenced in robots, GA4/Ads/GTM IDs ship in production, and DNS contains a Google verification token. Keep authenticated account status and submitted sitemap status pending.

- [ ] **Step 2: Record the correct owner actions**

Use the Search Console Sitemaps report for `https://mushroomie.io.vn/sitemap.xml`, GA4 Realtime/DebugView for events, GSC Search Analytics for the 30-keyword baseline, URL Inspection for index status, CrUX/PageSpeed for LCP/INP/CLS, and verified GBP Performance for local metrics.

- [ ] **Step 3: Validate generated artifacts**

Assert 30 keyword rows, no numeric placeholder metrics, stable owner URLs, and a weekly scorecard header that covers GSC, GA4, index, CWV, and Local Pack.

---

### Task 4: Verification and delivery

**Files:**
- Commit only Phase 6 files and the Phase 6 roadmap update.

- [ ] **Step 1: Run verification**

```bash
npm run typecheck
npm test
npm run seo:audit:phase-6
git diff --check
```

Run `npm run build` only in an environment with a valid `DATABASE_URL`; do not copy production secrets into the local worktree.

- [ ] **Step 2: Push and synchronize**

Push the feature branch and `main`, then fast-forward `/var/www/mushroomie` on the production server. Because the deliverable changes only scripts/docs/tests, do not restart PM2 unless runtime code changes.

- [ ] **Step 3: Verify production remains healthy**

Check `/`, `/sitemap.xml`, `/robots.txt`, `/api/health`, PM2 status, one CSS asset, and one JavaScript asset.
