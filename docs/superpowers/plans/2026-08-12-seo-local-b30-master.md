# SEO Local B30 Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Điều phối toàn bộ công việc từ on-site/indexation đến đo lường và authority cho đến khi có bằng chứng 30/30 truy vấn local đứng organic top 1 đúng owner URL trong ba tuần liên tiếp.

**Architecture:** B30 được tách thành ba release stream có thể review độc lập: on-site trước, measurement sau, authority rollout cuối. Code có thể hoàn tất trong các commit hữu hạn; thứ hạng là vòng tối ưu dài hạn và chỉ kết thúc theo success evaluator, không theo cảm nhận hoặc một ảnh SERP.

**Tech Stack:** Next.js 16.2.11, TypeScript, Node/Vitest, Google Search Console API, Google Business Profile, Chrome DevTools/Lighthouse, PM2/Nginx production hiện hữu.

## Global Constraints

- Thiết kế nguồn sự thật: `docs/superpowers/specs/2026-08-12-seo-local-b30-design.md`.
- Thứ tự bắt buộc: on-site → measurement → deploy/read-only baseline → authority mutations được duyệt → weekly iteration.
- Không chạy external mutation, DB apply, push hoặc deploy nếu chưa được người dùng ủy quyền cho đúng bước.
- Không tuyên bố top 1 từ GSC average position, URL Inspection, indexation, Local Pack hoặc một lần đo.
- Goal chỉ complete khi measurement contract chứng minh 30/30 organic position 1, đúng owner, ba tuần liên tiếp.

---

### Task 1: Execute the on-site plan

**Files:**
- Read and execute: `docs/superpowers/plans/2026-08-12-seo-local-b30-onsite.md`

**Interfaces:**
- Consumes: approved B30 design.
- Produces: registry/content/link/metadata/indexation release candidate.

- [ ] **Step 1: Complete Tasks 1–5 with their RED/GREEN/commit gates**

Expected commits:

```text
feat(seo): define canonical local B30 registry
feat(seo): cover seven B30 secondary intents
feat(seo): balance B30 local discovery links
feat(seo): refresh B30 metadata and lastmod
test(seo): guard B30 public bundle boundaries
```

- [ ] **Step 2: Complete on-site full verification before moving on**

Expected: full test/type/build pass, 23-route SSR audit, no public-bundle leak and no Lighthouse regression.

### Task 2: Execute the measurement plan

**Files:**
- Read and execute: `docs/superpowers/plans/2026-08-12-seo-local-b30-measurement.md`

**Interfaces:**
- Consumes: canonical registry from Master Task 1.
- Produces: GSC metrics, rank-evidence input and honest three-week success gate.

- [ ] **Step 1: Complete Tasks 1–4 with their RED/GREEN/commit gates**

Expected commits:

```text
feat(seo): query Search Console B30 metrics
feat(seo): evaluate B30 rank evidence honestly
feat(seo): generate bounded B30 scorecards
docs(seo): define B30 measurement contract
```

- [ ] **Step 2: Complete measurement full verification and one authorized read-only baseline**

Expected: exactly 30 scorecard rows; any missing evidence remains explicit; no rank success inferred from GSC alone.

### Task 3: Review, merge, push and deploy the code release

**Files:**
- All files changed by Master Tasks 1–2.

**Interfaces:**
- Consumes: clean, reviewed release candidate.
- Produces: production code release plus rollback evidence.

- [ ] **Step 1: Run independent code review against the pre-B30 base**

Review correctness, security, performance, SEO truth, tests and repository rules. Fix Critical/Important findings with separate RED/GREEN commits and re-review until no actionable finding remains.

- [ ] **Step 2: Push only after explicit authorization**

Push `codex/seo-local-b30`, merge using the user's chosen workflow, and verify `origin/main` contains every approved commit. Never delete unrelated branches as part of this plan.

- [ ] **Step 3: Deploy using the production skill and rollback-safe release layout**

Use `source-command-deploy-production` and `source-command-verify-production`. Preserve `.env`, uploads, backups and prior standalone release. Apply no Prisma schema change because B30 adds none.

- [ ] **Step 4: Verify production**

Require PM2 stable, 23/23 local URLs and sitemap healthy, canonical/JSON-LD/meta/link contracts, CSS/JS MIME, no broken assets, no checkout/admin regression and no performance regression at 1440/1366/390/360.

- [ ] **Step 5: Verify discovery reconciliation without forcing Google calls**

After the deployed sitemap exposes `lastModified=2026-08-12` for all 23 owner URLs, let the protected maintenance flow run under its existing quota/batch controls. Read the admin discovery dashboard or database through an authorized read-only query and verify every owner URL exists, keeps the correct canonical/content version, and is either indexed or in a bounded eligible/scheduled/retry state. Do not loop URL Inspection, manually reset leases or mark `URL is unknown to Google` as indexed.

### Task 4: Execute the authority rollout

**Files:**
- Read and execute: `docs/superpowers/plans/2026-08-12-seo-local-b30-authority.md`

**Interfaces:**
- Consumes: production truth and user-authorized external accounts.
- Produces: verified GBP, ethical reviews, NAP citations and local authority evidence.

- [ ] **Step 1: Complete read-only baseline before any mutation**

Expected: duplicate/claim/category/NAP gaps documented and redacted.

- [ ] **Step 2: Request approval immediately before each external mutation batch**

Expected: no fake TP.HCM location, no keyword-stuffed name, no review gating, no bulk backlinks.

- [ ] **Step 3: Verify public propagation and record rollback values**

Expected: GBP/profile data visible publicly and consistent with canonical `BRAND`.

### Task 5: Iterate weekly until the actual objective is proven

**Files:**
- Weekly scorecard outputs outside `public`; commit only redacted aggregate evidence when appropriate.

**Interfaces:**
- Consumes: production site, GSC metrics, rank observations, authority tracker.
- Produces: query-level next actions and eventual success proof.

- [ ] **Step 1: Generate one 30-row scorecard every week**

Never omit zero-impression/unmeasured targets. Keep organic and Local Pack columns separate.

- [ ] **Step 2: Select work by evidence**

```text
unknown/not indexed → crawl path, uniqueness, sitemap/inspection
indexed/no impression → intent/content support and prominence
position 11+ → owner/intent/authority gap
position 4–10 → snippet, internal support, proof and competitor delta
position 2–3 → CTR/relevance/prominence refinements without URL churn
position 1 → preserve owner and continue weekly proof
```

- [ ] **Step 3: Re-run technical/performance gates after every material release**

Do not trade Core Web Vitals, accessibility, conversion, checkout stability or truthful local claims for keyword density.

- [ ] **Step 4: Close only on authoritative evidence**

Call the parent goal complete only when `evaluateB30Success()` returns true on 30 distinct targets and the underlying rank observations pass manual audit for owner/profile/date/source authenticity. Otherwise leave the goal active and continue the weekly loop.
